// QA harness for IraMaedia portfolio.
// Usage: node qa.js <round> [rootBase] [subBase]
//   rootBase default http://localhost:8080/            (served from repo root)
//   subBase  default http://localhost:8081/IraMaedia/  (served from parent dir, mimics GH Pages)
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const ROUND = process.argv[2] || '1';
const ROOT = process.argv[3] || 'http://localhost:8080/';
const SUB = process.argv[4] || 'http://localhost:8081/IraMaedia/';
const SHOTS = '/home/user/IraMaedia/.team/shots';
const OUT = `/home/user/IraMaedia/.team/qa/round${ROUND}-results.json`;
fs.mkdirSync(SHOTS, { recursive: true });

const results = { round: ROUND, root: ROOT, sub: SUB, checks: {} };
const R = (k, v) => { results.checks[k] = v; };
// ONLY=legacy,shots,read,pre,scroll,cdn,form,perf  (comma list; default all)
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
const want = k => !ONLY || ONLY.includes(k);
if (ONLY && fs.existsSync(OUT)) { try { Object.assign(results.checks, JSON.parse(fs.readFileSync(OUT)).checks); } catch (_) {} }

function launch() {
  const opts = { headless: true };
  const cand = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'];
  try { return chromium.launch(opts); } catch (e) { return chromium.launch({ ...opts, executablePath: cand[0] }); }
}

function attachNet(page, bag, base) {
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') bag.console.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', e => bag.pageErrors.push(String(e)));
  page.on('requestfailed', r => bag.failed.push(`${r.url()} :: ${r.failure() && r.failure().errorText}`));
  page.on('response', async r => {
    if (r.status() >= 400) bag.http.push(`${r.status()} ${r.url()}`);
    if (r.url().startsWith(base) || r.url().includes('localhost')) {
      try { const b = await r.body(); bag.bytesLocal += b.length; } catch (_) {}
    } else {
      try { const b = await r.body(); bag.bytesExternal += b.length; } catch (_) {}
    }
    bag.requests.push(r.url());
  });
}

async function scrollThrough(page) {
  await page.evaluate(async () => {
    const h = () => document.documentElement.scrollHeight;
    for (let y = 0; y < h(); y += Math.round(innerHeight * 0.5)) {
      window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 120));
    }
    window.scrollTo({ top: h(), behavior: 'instant' }); await new Promise(r => setTimeout(r, 2500));
  });
}

// Elements with direct text / images whose effective opacity or visibility leaves them invisible
const invisibleProbe = () => {
  const out = [];
  const els = document.querySelectorAll('main *, header *, footer *');
  for (const el of els) {
    const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);
    const isMedia = /^(IMG|SVG|VIDEO|PICTURE)$/i.test(el.tagName);
    if (!hasText && !isMedia) continue;
    if (el.closest('[aria-hidden="true"], [hidden], dialog:not([open]), .sr-only, .visually-hidden')) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    let op = 1, node = el, vis = true;
    while (node && node.nodeType === 1) {
      const cs = getComputedStyle(node);
      if (cs.display === 'none') { vis = null; break; }
      op *= parseFloat(cs.opacity);
      if (cs.visibility === 'hidden') vis = false;
      node = node.parentElement;
    }
    if (vis === null) continue;
    // skip things inside closed mobile nav / collapsed accordion
    if (el.closest('nav') && innerWidth < 900) continue;
    if (op < 0.9 || vis === false) {
      out.push({ tag: el.tagName, cls: (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className) || '', text: (el.textContent || '').trim().slice(0, 50), opacity: +op.toFixed(2), visible: vis });
    }
  }
  return out;
};

const overflowProbe = () => {
  const de = document.documentElement;
  const offenders = [];
  if (de.scrollWidth > de.clientWidth) {
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.right > de.clientWidth + 1 || r.left < -1) {
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed') continue;
        offenders.push(`${el.tagName}.${String(el.className).slice(0, 40)} right=${Math.round(r.right)} left=${Math.round(r.left)}`);
        if (offenders.length > 12) break;
      }
    }
  }
  return { scrollWidth: de.scrollWidth, clientWidth: de.clientWidth, bodyScrollWidth: document.body.scrollWidth, overflow: de.scrollWidth > de.clientWidth, offenders };
};

const staticAudit = () => {
  const res = {};
  // headings
  res.headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => `${h.tagName}: ${h.textContent.trim().replace(/\s+/g, ' ').slice(0, 60)}`);
  const levels = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => +h.tagName[1]);
  res.headingSkips = [];
  for (let i = 1; i < levels.length; i++) if (levels[i] - levels[i - 1] > 1) res.headingSkips.push(`${res.headings[i - 1]} -> ${res.headings[i]}`);
  res.h1Count = levels.filter(l => l === 1).length;
  // landmarks
  res.landmarks = {
    header: document.querySelectorAll('header, [role=banner]').length,
    nav: document.querySelectorAll('nav, [role=navigation]').length,
    main: document.querySelectorAll('main, [role=main]').length,
    footer: document.querySelectorAll('footer, [role=contentinfo]').length,
  };
  const firstLink = document.querySelector('a');
  res.skipLink = firstLink ? `${firstLink.getAttribute('href')} "${firstLink.textContent.trim()}"` : null;
  res.lang = document.documentElement.lang;
  res.title = document.title;
  res.metaDesc = (document.querySelector('meta[name=description]') || {}).content || null;
  res.viewportMeta = (document.querySelector('meta[name=viewport]') || {}).content || null;
  res.favicon = (document.querySelector('link[rel~=icon]') || {}).href || null;
  res.ogImage = (document.querySelector('meta[property="og:image"]') || {}).content || null;
  // images
  res.imgNoAlt = [...document.querySelectorAll('img')].filter(i => !i.hasAttribute('alt')).map(i => i.getAttribute('src'));
  res.imgCount = document.querySelectorAll('img').length;
  res.svgNoLabel = [...document.querySelectorAll('svg')].filter(s => !s.closest('[aria-hidden=true]') && s.getAttribute('aria-hidden') !== 'true' && !s.getAttribute('aria-label') && !s.querySelector('title') && s.getAttribute('role') !== 'presentation').length;
  // absolute URL references (break on GH Pages subpath)
  const attrs = [];
  for (const el of document.querySelectorAll('[href],[src],[srcset],[action],[poster]')) {
    for (const a of ['href', 'src', 'action', 'poster']) {
      const v = el.getAttribute(a);
      if (v && /^\/(?!\/)/.test(v)) attrs.push(`${el.tagName} ${a}=${v}`);
    }
  }
  res.rootAbsoluteUrls = attrs;
  // links
  res.links = [...document.querySelectorAll('a')].map(a => ({ href: a.getAttribute('href'), text: (a.textContent.trim() || a.getAttribute('aria-label') || '').slice(0, 40), target: a.target, rel: a.rel }));
  res.emptyLinks = res.links.filter(l => !l.text).map(l => l.href);
  res.badHref = res.links.filter(l => !l.href || l.href === '#' || l.href.startsWith('javascript')).map(l => `${l.href} "${l.text}"`);
  res.blankNoRel = res.links.filter(l => l.target === '_blank' && !/noopener|noreferrer/.test(l.rel)).map(l => l.href);
  res.brokenAnchors = res.links.filter(l => l.href && l.href.startsWith('#') && l.href.length > 1 && !document.getElementById(decodeURIComponent(l.href.slice(1)))).map(l => l.href);
  // buttons without names
  res.unnamedButtons = [...document.querySelectorAll('button, [role=button]')].filter(b => !(b.textContent.trim() || b.getAttribute('aria-label') || b.getAttribute('aria-labelledby') || b.title)).map(b => b.outerHTML.slice(0, 100));
  // form labels
  res.unlabeledInputs = [...document.querySelectorAll('input:not([type=hidden]):not([type=submit]), textarea, select')].filter(i => {
    if (i.getAttribute('aria-label') || i.getAttribute('aria-labelledby')) return false;
    if (i.id && document.querySelector(`label[for="${i.id}"]`)) return false;
    if (i.closest('label')) return false;
    return true;
  }).map(i => i.outerHTML.slice(0, 100));
  // duplicate ids
  const ids = {}; for (const e of document.querySelectorAll('[id]')) ids[e.id] = (ids[e.id] || 0) + 1;
  res.duplicateIds = Object.entries(ids).filter(([, c]) => c > 1).map(([k]) => k);
  // copy junk
  const txt = document.body.innerText;
  const junk = [/lorem/i, /ipsum/i, /\bTODO\b/, /\bFIXME\b/, /\bundefined\b/, /\bNaN\b/, /\[object/, /\{\{/, /\bxxx\b/i, /placeholder text/i, /\bTBD\b/];
  res.junk = junk.filter(r => r.test(txt)).map(r => { const m = txt.match(r); const i = m.index; return `${r} ... ${txt.slice(Math.max(0, i - 40), i + 40).replace(/\s+/g, ' ')}`; });
  res.doubleWords = [...txt.matchAll(/\b(\w+)\s+\1\b/gi)].map(m => m[0]).filter(w => !/^(that that|had had)$/i.test(w)).slice(0, 10);
  res.bodyText = txt;
  return res;
};

// contrast
const contrastProbe = () => {
  const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const blend = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
  const bgOf = el => {
    const stack = [];
    let n = el;
    while (n && n.nodeType === 1) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none' && !/url\(/.test(cs.backgroundImage) && n !== el) {
        // gradient: approximate with first color stop
        const m = cs.backgroundImage.match(/rgba?\([^)]+\)/); if (m) { stack.push({ ...parse(m[0]), grad: true }); if (parse(m[0]).a >= 1) break; }
      }
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break; }
      n = n.parentElement;
    }
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = stack.length - 1; i >= 0; i--) bg = blend(stack[i], bg);
    return { bg, grad: stack.some(s => s.grad) };
  };
  const out = [];
  const seen = new Set();
  for (const el of document.querySelectorAll('body *')) {
    const direct = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim().length > 1).map(n => n.textContent.trim()).join(' ');
    if (!direct) continue;
    if (el.closest('[aria-hidden="true"], .sr-only, .visually-hidden')) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    const fg0 = parse(cs.color); if (!fg0) continue;
    let op = 1; let n = el; while (n && n.nodeType === 1) { op *= parseFloat(getComputedStyle(n).opacity); n = n.parentElement; }
    const { bg, grad } = bgOf(el);
    const fg = blend({ ...fg0, a: fg0.a * op }, bg);
    const L1 = lum(fg), L2 = lum(bg);
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const size = parseFloat(cs.fontSize); const bold = parseInt(cs.fontWeight) >= 700;
    const large = size >= 24 || (bold && size >= 18.66);
    const need = large ? 3 : 4.5;
    if (ratio < need) {
      const key = `${cs.color}|${direct.slice(0, 20)}`; if (seen.has(key)) continue; seen.add(key);
      out.push({ text: direct.slice(0, 50), tag: el.tagName, cls: String(el.className).slice(0, 40), ratio: +ratio.toFixed(2), need, color: cs.color, bg: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})`, fontSize: size, opacity: +op.toFixed(2), gradientBg: grad });
    }
  }
  return out;
};

async function focusAudit(page) {
  await page.goto(page.url().split('#')[0]);
  await page.waitForLoadState('networkidle'); await waitReady(page, 8000);
  await page.evaluate(() => window.scrollTo(0, 0));
  const res = [];
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement; if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const outline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
      const shadow = cs.boxShadow && cs.boxShadow !== 'none';
      return { tag: el.tagName, text: (el.textContent.trim() || el.getAttribute('aria-label') || '').slice(0, 30), href: el.getAttribute('href'), outline, outlineStr: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`, shadow, inView: r.bottom > 0 && r.top < innerHeight && r.width > 0, focusVisible: el.matches(':focus-visible') };
    });
    if (!info) continue;
    res.push(info);
  }
  return res;
}

async function mobileNavTest(page) {
  const r = { steps: [] };
  await page.evaluate(() => window.scrollTo(0, 0));
  const toggle = page.locator('header button[aria-expanded], button[aria-controls], .nav-toggle, .menu-toggle, button.burger, button.hamburger').first();
  if (!(await toggle.count())) { r.error = 'No mobile nav toggle button found (expected header button with aria-expanded/aria-controls)'; return r; }
  r.toggleVisible = await toggle.isVisible();
  if (!r.toggleVisible) { r.error = 'Toggle not visible at 375px'; return r; }
  r.labelBefore = await toggle.evaluate(b => b.getAttribute('aria-label') || b.textContent.trim());
  await toggle.click(); await page.waitForTimeout(800);
  r.expandedAfterOpen = await toggle.getAttribute('aria-expanded');
  const ctrl = await toggle.getAttribute('aria-controls');
  const menuSel = ctrl ? `#${ctrl}` : 'header nav';
  const menu = page.locator(menuSel).first();
  r.menuVisibleOpen = (await menu.count()) ? await menu.isVisible() : 'no-menu';
  r.menuLinksVisible = await page.locator(`${menuSel} a`).evaluateAll(as => as.filter(a => { const b = a.getBoundingClientRect(); return b.width > 0 && b.top >= 0 && b.top < innerHeight; }).length).catch(() => 0);
  r.bodyScrollLocked = await page.evaluate(() => getComputedStyle(document.body).overflow + '/' + getComputedStyle(document.documentElement).overflow);
  await page.screenshot({ path: `${SHOTS}/round${ROUND}-mobile-nav-open.png` });
  // toggle still clickable above overlay?
  r.toggleOnTop = await toggle.evaluate(b => { const rc = b.getBoundingClientRect(); const e = document.elementFromPoint(rc.left + rc.width / 2, rc.top + rc.height / 2); return b === e || b.contains(e); });
  await page.keyboard.press('Escape'); await page.waitForTimeout(700);
  r.expandedAfterEscape = await toggle.getAttribute('aria-expanded');
  // reopen and click a link
  if (r.expandedAfterEscape !== 'true') { await toggle.click(); await page.waitForTimeout(700); }
  const link = page.locator(`${menuSel} a[href^="#"]`).first();
  if (await link.count()) {
    const href = await link.getAttribute('href');
    await link.click(); await page.waitForTimeout(1200);
    r.expandedAfterLinkClick = await toggle.getAttribute('aria-expanded');
    r.menuVisibleAfterLink = await menu.isVisible();
    r.linkTarget = href; r.hashAfter = await page.evaluate(() => location.hash);
    r.scrollYAfter = await page.evaluate(() => scrollY);
  }
  // close via toggle
  if ((await toggle.getAttribute('aria-expanded')) === 'true') { await toggle.click(); await page.waitForTimeout(600); }
  r.finalExpanded = await toggle.getAttribute('aria-expanded');
  return r;
}

async function faqTest(page) {
  const r = {};
  const details = page.locator('details');
  const btns = page.locator('#faq button[aria-expanded], .faq button[aria-expanded], [class*=faq] button[aria-expanded], [class*=accordion] button[aria-expanded]');
  if (await btns.count()) {
    r.kind = 'aria-buttons'; r.count = await btns.count();
    const b = btns.first(); await b.scrollIntoViewIfNeeded();
    const before = await b.getAttribute('aria-expanded');
    const panelId = await b.getAttribute('aria-controls');
    await b.click(); await page.waitForTimeout(700);
    r.toggled = `${before} -> ${await b.getAttribute('aria-expanded')}`;
    if (panelId) {
      const p = page.locator(`#${panelId}`);
      r.panelVisible = await p.isVisible(); r.panelHeight = await p.evaluate(e => e.getBoundingClientRect().height);
    }
    await b.click(); await page.waitForTimeout(700);
    r.toggledBack = await b.getAttribute('aria-expanded');
    // keyboard
    await b.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(500);
    r.keyboardEnter = await b.getAttribute('aria-expanded');
    await page.keyboard.press('Enter'); await page.waitForTimeout(500);
  } else if (await details.count()) {
    r.kind = 'details'; r.count = await details.count();
    const d = details.first(); await d.scrollIntoViewIfNeeded();
    const s = d.locator('summary');
    await s.click(); await page.waitForTimeout(700);
    r.openAfterClick = await d.evaluate(e => e.open);
    r.contentHeight = await d.evaluate(e => { const c = [...e.children].find(x => x.tagName !== 'SUMMARY'); return c ? c.getBoundingClientRect().height : -1; });
    await s.click(); await page.waitForTimeout(700);
    r.openAfterSecondClick = await d.evaluate(e => e.open);
  } else r.error = 'No FAQ accordion found';
  return r;
}

async function formTest(page) {
  const r = {};
  const form = page.locator('form').first();
  if (!(await form.count())) { r.error = 'no form'; return r; }
  r.action = await form.getAttribute('action'); r.method = await form.getAttribute('method');
  r.fields = await form.locator('input, textarea, select').evaluateAll(es => es.map(e => `${e.tagName.toLowerCase()}[${e.type || ''}] name=${e.name} req=${e.required} auto=${e.autocomplete}`));
  await form.scrollIntoViewIfNeeded();
  const startUrl = page.url();
  const submit = form.locator('button[type=submit], input[type=submit], button:not([type])').first();
  r.hasSubmit = !!(await submit.count());
  if (!r.hasSubmit) return r;
  await submit.click(); await page.waitForTimeout(800);
  r.urlAfterEmpty = page.url() === startUrl ? 'unchanged' : page.url();
  r.invalidAfterEmpty = await form.evaluate(f => [...f.elements].filter(e => e.matches && e.matches(':invalid')).map(e => e.name));
  r.statusTextAfterEmpty = await form.evaluate(f => (f.querySelector('[role=status],[aria-live],.form-status,.form__status') || {}).textContent || '');
  // fill valid
  const fills = await form.locator('input, textarea, select').all();
  for (const f of fills) {
    const t = await f.evaluate(e => ({ tag: e.tagName, type: e.type, name: e.name }));
    try {
      if (t.tag === 'SELECT') { await f.selectOption({ index: 1 }); continue; }
      if (['checkbox', 'radio'].includes(t.type)) { await f.check({ force: true }); continue; }
      if (['hidden', 'submit'].includes(t.type)) continue;
      if (t.type === 'email') await f.fill('qa@example.com');
      else if (t.type === 'tel') await f.fill('+1 555 0100');
      else if (t.type === 'url') await f.fill('https://example.com');
      else if (t.type === 'number') await f.fill('1000');
      else if (t.type === 'date') await f.fill('2026-12-01');
      else await f.fill('QA test message for the IraMaedia site');
    } catch (e) { r.fillErr = (r.fillErr || '') + t.name + ':' + e.message.slice(0, 60) + ' '; }
  }
  const popupP = page.context().waitForEvent('page', { timeout: 2000 }).catch(() => null);
  await submit.click(); await page.waitForTimeout(1500);
  const popup = await popupP;
  r.popupUrl = popup ? popup.url() : null; if (popup) await popup.close();
  r.urlAfterValid = page.url() === startUrl ? 'unchanged' : page.url();
  r.statusTextAfterValid = await page.evaluate(() => { const f = document.querySelector('form'); const s = f && (f.querySelector('[role=status],[aria-live]') || document.querySelector('[role=status],[aria-live]')); return s ? s.textContent.trim() : ''; }).catch(() => 'n/a');
  return r;
}

// =====================================================================
// Round 3 additions: readiness/preloader poller, readability, smooth
// scroll + pinning, vendor-failure, performance. Shared helpers below.
// =====================================================================

// Injected into every context. Polls every 40ms from navigation start and
// records when the page is "blocked" (full-screen fixed overlay at sample
// points, main hidden, or html/body scroll-locked), plus long tasks, CLS
// with timestamps, and an on-demand rAF frame logger.
const READY_INIT = () => {
  if (window.__qa) return;
  const q = window.__qa = { samples: [], firstBlockedAt: null, unblockedAt: null, lastBlockedAt: null, ready: false, heroAt: null, overlayDesc: null, longtasks: [], shifts: [], frames: null };
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) q.longtasks.push({ t: Math.round(e.startTime), d: Math.round(e.duration) }); }).observe({ type: 'longtask', buffered: true }); } catch (_) {}
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) q.shifts.push({ t: Math.round(e.startTime), v: e.value, src: (e.sources || []).map(s => s.node ? (s.node.nodeName + '.' + String(s.node.className || '').slice(0, 30)) : '?').slice(0, 3) }); }).observe({ type: 'layout-shift', buffered: true }); } catch (_) {}
  const effOp = el => { let o = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity); return o; };
  const describe = el => el ? `${el.tagName}${el.id ? '#' + el.id : ''}.${String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className).trim().split(/\s+/).slice(0, 3).join('.')}` : 'null';
  q.blockState = () => {
    if (!document.body) return 'no-body';
    const reasons = [];
    const de = getComputedStyle(document.documentElement), bd = getComputedStyle(document.body);
    if (de.visibility === 'hidden' || bd.visibility === 'hidden') reasons.push('body-hidden');
    if (de.overflowY === 'hidden' || bd.overflowY === 'hidden' || de.overflow === 'hidden' || bd.overflow === 'hidden') reasons.push('scroll-locked');
    const main = document.querySelector('main');
    if (main && effOp(main) < 0.5) reasons.push('main-transparent');
    for (const [x, y] of [[.5, .5], [.2, .3], [.8, .3], [.2, .8], [.8, .8]]) {
      const hit = document.elementFromPoint(innerWidth * x, innerHeight * y);
      for (let n = hit; n && n.nodeType === 1 && n !== document.body; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (cs.position === 'fixed') {
          const r = n.getBoundingClientRect();
          if (r.width * r.height >= innerWidth * innerHeight * 0.5 && !n.closest('header')) { reasons.push('overlay:' + describe(n)); }
          break;
        }
      }
      if (reasons.some(r => r.startsWith('overlay'))) break;
    }
    return reasons.join(',');
  };
  q.heroVisible = () => {
    const h = document.querySelector('h1'); if (!h) return false;
    const r = h.getBoundingClientRect(); if (r.width === 0 || r.bottom < 0 || r.top > innerHeight) return false;
    const w = document.createTreeWalker(h, NodeFilter.SHOW_TEXT); let n, ok = true, any = false;
    while ((n = w.nextNode())) { if (!n.textContent.trim()) continue; any = true; if (effOp(n.parentElement) < 0.9 || getComputedStyle(n.parentElement).visibility === 'hidden') { ok = false; break; } }
    return any && ok;
  };
  let okSince = null;
  const tick = () => {
    const t = Math.round(performance.now());
    let s = 'err'; try { s = q.blockState(); } catch (e) { s = 'err:' + e.message; }
    if (q.samples.length < 400) q.samples.push([t, s]);
    if (s && s !== 'no-body') { if (q.firstBlockedAt === null) q.firstBlockedAt = t; q.lastBlockedAt = t; q.unblockedAt = null; okSince = null; q.ready = false; if (!q.overlayDesc || s.includes('overlay')) q.overlayDesc = s; }
    else { if (okSince === null) { okSince = t; q.unblockedAt = t; } if (t - okSince >= 300) q.ready = true; }
    try { if (q.heroAt === null && q.heroVisible()) q.heroAt = t; } catch (_) {}
    if (t < 12000) setTimeout(tick, 40); else q.pollDone = true;
  };
  setTimeout(tick, 0);
  q.startFrames = () => { q.frames = []; let last = performance.now(); q.framesOn = true; const f = now => { if (!q.framesOn) return; q.frames.push(now - last); last = now; requestAnimationFrame(f); }; requestAnimationFrame(f); };
  q.stopFrames = () => { q.framesOn = false; return q.frames; };
};

async function newCtx(browser, opts = {}) {
  const ctx = await browser.newContext({ deviceScaleFactor: 1, ...opts });
  await ctx.addInitScript(READY_INIT);
  return ctx;
}

// Wait until the page has been unblocked for 300ms (preloader done) or max ms.
async function waitReady(page, max = 7000) {
  const t0 = Date.now();
  while (Date.now() - t0 < max) {
    const r = await page.evaluate(() => window.__qa ? window.__qa.ready : true).catch(() => false);
    if (r) break;
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(400);
  return Date.now() - t0;
}

async function preloaderTimeline(page) {
  return page.evaluate(() => {
    const q = window.__qa || {};
    const nav = performance.getEntriesByType('navigation')[0] || {};
    const isPre = e => { const c = String(e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className); return /^(preload|preloader|loader|curtain|splash|intro)$/i.test(e.id || '') || c.split(/\s+/).some(t => /^(preload|preloader|loader|curtain|splash|intro)(-|$)/i.test(t)); };
    const cands = [...document.querySelectorAll('body *')].filter(isPre).filter(e => !e.parentElement || !isPre(e.parentElement)).slice(0, 4)
      .map(e => { const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return { el: `${e.tagName}#${e.id}.${String(e.className).slice(0, 40)}`, display: cs.display, visibility: cs.visibility, opacity: cs.opacity, pointerEvents: cs.pointerEvents, position: cs.position, w: Math.round(r.width), h: Math.round(r.height), inDom: document.body.contains(e) }; });
    const transitions = []; let prev = null;
    for (const [t, s] of q.samples || []) { if (s !== prev) { transitions.push(`${t}ms:${s || 'OK'}`); prev = s; } }
    return { domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0), load: Math.round(nav.loadEventEnd || 0), firstBlockedAt: q.firstBlockedAt, lastBlockedAt: q.lastBlockedAt, unblockedAt: q.unblockedAt, ready: q.ready, heroVisibleAt: q.heroAt, blockedBy: q.overlayDesc, nowBlocked: q.blockState ? q.blockState() : 'n/a', transitions: transitions.slice(0, 30), candidates: cands, sessionFlags: Object.keys(sessionStorage), htmlClass: document.documentElement.className };
  });
}

// ---------- 1. Readability scan ----------
const readabilityProbe = () => {
  const parse = c => { const m = c && c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const blend = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
  const bgOf = el => {
    const stack = []; let complex = false;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      const bgr = n.getBoundingClientRect();
      const underline = /(^|\s)[0-4](\.\d+)?px/.test(cs.backgroundSize) || /^0%/.test(cs.backgroundSize) || (/^(A|SPAN|EM|STRONG|U)$/.test(n.tagName) && bgr.height < 70);
      if (cs.backgroundImage && cs.backgroundImage !== 'none' && !underline) {
        complex = true;
        const m = cs.backgroundImage.match(/rgba?\([^)]+\)/);
        if (m && !/url\(/.test(cs.backgroundImage)) { const c = parse(m[0]); stack.push(c); if (c.a >= 1) break; }
      }
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break; }
    }
    let bg = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = stack.length - 1; i >= 0; i--) bg = blend(stack[i], bg);
    return { bg, complex };
  };
  const fam = s => s.split(',')[0].replace(/["']/g, '').trim();
  const bodyFam = fam(getComputedStyle(document.body).fontFamily);
  const h1 = document.querySelector('h1'); const h1Fam = h1 ? fam(getComputedStyle(h1).fontFamily) : '';
  const serifRe = /serif|fraunces|gloock|bodoni|playfair|cormorant|garamond|caslon|didot|lora|libre|young|instrument|georgia|times/i;
  const isDisplay = f => (f === h1Fam && f !== bodyFam) || (serifRe.test(f) && !/sans/i.test(f));
  const LABEL_TAGS = /^(LABEL|BUTTON|SUMMARY|SMALL|LEGEND|TH|DT|FIGCAPTION|TIME|CITE|OPTION)$/;
  const items = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let tn, idx = 0;
  while ((tn = w.nextNode())) {
    const txt = tn.textContent.replace(/\s+/g, ' ').trim();
    if (!txt || !/[\p{L}\p{N}]/u.test(txt)) continue;
    const el = tn.parentElement; if (!el || /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|TITLE)$/.test(el.tagName)) continue;
    const range = document.createRange(); range.selectNodeContents(tn);
    const rr = range.getBoundingClientRect(); if (rr.width < 1 || rr.height < 1) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden') continue;
    // sr-only style clip
    const clipped = (() => { for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const c = getComputedStyle(n); if ((c.clip && c.clip !== 'auto' && /rect\(0|1px/.test(c.clip)) || c.clipPath === 'inset(50%)') return true; const b = n.getBoundingClientRect(); if (b.width <= 1 && b.height <= 1 && c.overflow === 'hidden') return true; } return false; })();
    if (clipped) continue;
    let op = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) op *= parseFloat(getComputedStyle(n).opacity);
    if (op < 0.05) continue;
    const block = el.closest('h1,h2,h3,h4,h5,h6,p,li,blockquote,figcaption,dd,dt,td,th,label,button,a,summary,legend,small,cite,q,time,address,option') || el;
    const blockText = block.textContent.replace(/\s+/g, ' ').trim();
    const size = parseFloat(cs.fontSize), weight = parseInt(cs.fontWeight, 10), family = fam(cs.fontFamily);
    const ls = cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing) / size;
    let role;
    if (isDisplay(family)) role = 'display';
    else if (cs.textTransform === 'uppercase' || ls >= 0.06 || LABEL_TAGS.test(block.tagName) || (block.tagName === 'A' && blockText.length < 40) || (blockText.length < 30 && !/^(P|LI|BLOCKQUOTE|DD)$/.test(block.tagName))) role = 'label';
    else role = 'body';
    const fg0 = parse(cs.color) || { r: 0, g: 0, b: 0, a: 1 };
    const { bg, complex } = bgOf(el);
    const fg = blend(fg0, bg);
    const L1 = lum(fg), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const large = size >= 24 || (weight >= 700 && size >= 18.66);
    const aa = large ? 3 : 4.5, aaa = large ? 4.5 : 7;
    const ariaHidden = !!el.closest('[aria-hidden="true"], .phone__screen, [role=img], .preloader');
    const sec = el.closest('main > *, header, footer, body > *');
    const secName = sec ? (sec.id || sec.tagName.toLowerCase() + '.' + String(sec.className).split(' ')[0]) : '?';
    if (!el.dataset.qaR) el.dataset.qaR = String(idx++);
    items.push({ qa: el.dataset.qaR, text: txt.slice(0, 40), block: blockText.slice(0, 60), tag: el.tagName, cls: String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className).slice(0, 40), section: secName, role, size: +size.toFixed(1), weight, family, style: cs.fontStyle, lsEm: +ls.toFixed(3), lh: cs.lineHeight, color: cs.color, bg: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})`, complexBg: complex, ratio: +ratio.toFixed(2), aa, aaa, opacity: +op.toFixed(2), ariaHidden, heading: (() => { const h = el.closest('h1,h2'); if (!h) return null; if (!h.dataset.qaH) h.dataset.qaH = 'h' + idx; return h.dataset.qaH; })(), textTransform: cs.textTransform, transform: cs.transform !== 'none', rect: [Math.round(rr.left), Math.round(rr.top + scrollY), Math.round(rr.width), Math.round(rr.height)] });
  }
  const fontsLoaded = [...document.fonts].filter(f => f.status === 'loaded').map(f => `${f.family} ${f.weight} ${f.style}`);
  const fontLinks = [...document.querySelectorAll('link[href*="fonts.googleapis"]')].map(l => l.href);
  return { bodyFam, h1Fam, fontsLoaded: [...new Set(fontsLoaded)], fontLinks, oldFontLinked: fontLinks.some(h => /Bodoni|Hanken/i.test(h)), items };
};

function classifyReadability(scan, vpName) {
  const flags = []; const oldFont = [];
  for (const it of scan.items) {
    if (/bodoni|hanken/i.test(it.family)) { oldFont.push(it); continue; }
    if (it.ariaHidden) continue; // exempt: aria-hidden decorative text (phone screens, wordmarks, logo)
    const where = `${vpName} ${it.section} ${it.tag}.${it.cls} "${it.text}"`;
    if (it.role === 'body' && it.size < 15) flags.push({ sev: 'Medium', rule: 'body<15px', where, it });
    if (it.role === 'label' && it.size >= 13 && it.size < 15 && it.cls && !/label|eyebrow|tag|kicker/i.test(it.cls) && it.textTransform !== 'uppercase') flags.push({ sev: 'Low', rule: 'non-caps text 13-15px', where, it });
    else if (it.role === 'body' && it.size < 16) flags.push({ sev: 'Info', rule: 'body<16px', where, it });
    if (it.role === 'label' && it.size < 13) flags.push({ sev: 'Medium', rule: 'label<13px', where, it });
    if (it.role === 'label' && it.lsEm > 0.145) flags.push({ sev: 'Low', rule: 'label tracking>.14em', where, it });
    if (it.role === 'display' && it.size < 28) flags.push({ sev: 'Medium', rule: 'display font<28px', where, it });
    if (it.role === 'body' && it.weight < 400) flags.push({ sev: 'Low', rule: 'body weight<400', where, it });
    if (it.ratio < it.aa && it.opacity >= 0.9) flags.push({ sev: it.complexBg ? 'Check' : 'Medium', rule: `AA fail ${it.ratio}<${it.aa}`, where, it });
    if (it.ratio < it.aa && it.opacity < 0.9) flags.push({ sev: 'Info', rule: `AA fail at opacity ${it.opacity} (mid-animation?) ${it.ratio}`, where, it });
    if (it.role === 'body' && it.ratio >= it.aa && it.ratio < it.aaa) flags.push({ sev: 'Info', rule: `body not AAA ${it.ratio}<${it.aaa}`, where, it });
  }
  // italics: only inside H1/H2 display headlines, max one italic word per headline
  const itPerHead = {};
  for (const it of scan.items) {
    if (it.ariaHidden || it.style !== 'italic') continue;
    if (!it.heading || it.role !== 'display') flags.push({ sev: 'Medium', rule: 'italic outside display headline', where: `${vpName} ${it.section} ${it.tag}.${it.cls} "${it.text}"`, it });
    else { const k = it.heading; (itPerHead[k] = itPerHead[k] || []).push(it); }
  }
  for (const arr of Object.values(itPerHead)) { const words = arr.map(i => i.text).join(' ').trim().split(/\s+/).filter(w => /[\p{L}]/u.test(w)); if (words.length > 1) flags.push({ sev: 'Low', rule: 'more than one italic word in headline', where: `${vpName} ${arr[0].section} "${words.join(' ')}"`, it: arr[0] }); }
  if (oldFont.length) flags.push({ sev: 'Medium', rule: 'old font still used', where: `${vpName} ${oldFont.length} text nodes in ${[...new Set(oldFont.map(i => i.family))].join('/')} e.g. ${oldFont.slice(0, 3).map(i => i.tag + '.' + i.cls).join(', ')}`, it: oldFont[0] });
  if (scan.oldFontLinked || scan.fontsLoaded.some(f => /bodoni|hanken/i.test(f))) flags.push({ sev: 'Low', rule: 'old font still linked/loaded', where: `${vpName} ${scan.fontLinks.join(' ').slice(0, 160)}`, it: oldFont[0] || scan.items[0] });
  // dedupe by rule+tag+cls+size+color
  const seen = new Map();
  for (const f of flags) { const k = `${f.rule.split(' ').slice(0, 2).join(' ')}|${f.it.tag}.${f.it.cls}|${f.it.size}|${f.it.color}|${f.it.section}`; if (!seen.has(k)) seen.set(k, { ...f, count: 1 }); else seen.get(k).count++; }
  return [...seen.values()].map(f => ({ sev: f.sev, rule: f.rule, where: f.where, count: f.count, size: f.it.size, weight: f.it.weight, family: f.it.family, style: f.it.style, color: f.it.color, bg: f.it.bg, ratio: f.it.ratio, complexBg: f.it.complexBg, qa: f.it.qa, rect: f.it.rect }));
}

// For contrast failures over gradients/images: hide the text, screenshot the
// box, and let summarize.py measure the real backdrop pixels.
async function captureContrastClips(page, flags, tag) {
  const dir = `/home/user/IraMaedia/.team/qa/clips`; fs.mkdirSync(dir, { recursive: true });
  const out = [];
  for (const f of flags.filter(f => /AA fail/.test(f.rule) && f.complexBg).slice(0, 25)) {
    const sel = `[data-qa-r="${f.qa}"]`;
    try {
      const loc = page.locator(sel).first(); await loc.scrollIntoViewIfNeeded({ timeout: 2000 }); await page.waitForTimeout(250);
      const box = await loc.boundingBox(); if (!box || box.width < 2) continue;
      await page.evaluate(s => { const e = document.querySelector(s); e.__qc = e.style.cssText; e.style.setProperty('color', 'transparent', 'important'); e.style.setProperty('-webkit-text-fill-color', 'transparent', 'important'); e.style.setProperty('text-shadow', 'none', 'important'); }, sel);
      const file = `${dir}/r${ROUND}-${tag}-${f.qa}.png`;
      await page.screenshot({ path: file, clip: { x: Math.max(0, box.x), y: Math.max(0, box.y), width: Math.min(box.width, 1200), height: Math.min(box.height, 400) } });
      await page.evaluate(s => { const e = document.querySelector(s); e.style.cssText = e.__qc; }, sel);
      out.push({ file, color: f.color, size: f.size, weight: f.weight, where: f.where });
    } catch (e) { out.push({ err: e.message.slice(0, 80), where: f.where }); }
  }
  return out;
}

// ---------- 3. Smooth scroll, anchors, focus, pinning ----------
async function settleScroll(page, max = 5000) {
  const t0 = Date.now(); let last = -1, stableSince = Date.now();
  while (Date.now() - t0 < max) {
    const y = await page.evaluate(() => scrollY);
    if (Math.abs(y - last) > 0.5) { last = y; stableSince = Date.now(); }
    else if (Date.now() - stableSince > 350) break;
    await page.waitForTimeout(60);
  }
  return Date.now() - t0;
}

async function scrollTop(page) {
  await page.evaluate(() => { if (window.lenis && window.lenis.scrollTo) try { window.lenis.scrollTo(0, { immediate: true }); } catch (_) {} window.scrollTo({ top: 0, behavior: 'instant' }); });
  await settleScroll(page, 2000);
}

async function anchorClickTest(page) {
  const hrefs = await page.evaluate(() => [...new Set([...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href')).filter(h => h.length > 1))]);
  const out = [];
  for (const href of hrefs) {
    await scrollTop(page);
    const how = await page.evaluate(h => {
      const links = [...document.querySelectorAll(`a[href="${h}"]`)];
      const vis = links.find(a => { const r = a.getBoundingClientRect(); return r.width > 0 && r.top >= 0 && r.bottom <= innerHeight && getComputedStyle(a).visibility !== 'hidden'; });
      const a = vis || links[0]; a.setAttribute('data-qa-anchor', '1'); return vis ? 'mouse' : 'js';
    }, href);
    const t0 = Date.now();
    if (how === 'mouse') await page.locator('[data-qa-anchor="1"]').first().click({ timeout: 3000 }).catch(async () => { await page.evaluate(() => document.querySelector('[data-qa-anchor="1"]').click()); });
    else await page.evaluate(() => document.querySelector('[data-qa-anchor="1"]').click());
    await page.waitForTimeout(150);
    const settle = await settleScroll(page, 5000);
    await page.waitForTimeout(600);
    const r = await page.evaluate(h => {
      document.querySelectorAll('[data-qa-anchor]').forEach(a => a.removeAttribute('data-qa-anchor'));
      const tgt = document.getElementById(decodeURIComponent(h.slice(1)));
      if (!tgt) return { missing: true };
      const hdr = document.querySelector('header'); const hb = hdr && getComputedStyle(hdr).position.match(/fixed|sticky/) ? Math.round(hdr.getBoundingClientRect().bottom) : 0;
      const tr = tgt.getBoundingClientRect();
      const head = tgt.matches('h1,h2,h3') ? tgt : tgt.querySelector('h1,h2,h3,.eyebrow,label');
      const hr = head ? head.getBoundingClientRect() : tr;
      const menuOpen = !!document.querySelector('[aria-expanded="true"]');
      const inv = [];
      for (const el of tgt.querySelectorAll('*')) { const b = el.getBoundingClientRect(); if (b.bottom < hb || b.top > innerHeight || b.right < 0 || b.left > innerWidth || b.width === 0) continue; if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1)) continue; if (el.closest('[aria-hidden=true]')) continue; let o = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity); if (o < 0.5) inv.push(`${el.tagName}.${String(el.className).slice(0, 20)} "${el.textContent.trim().slice(0, 20)}" ${o.toFixed(2)}`); }
      const okTop = tr.top >= -8 && tr.top <= hb + 120;
      const okHead = hr.top >= hb - 4 && hr.top <= innerHeight * 0.6;
      return { scrollY: Math.round(scrollY), hash: location.hash, headerBottom: hb, targetTop: Math.round(tr.top), headingTop: Math.round(hr.top), headingUnderHeader: hr.top < hb - 4 && hr.bottom > 0, landed: okTop || okHead, menuOpenAfter: menuOpen, focusedTag: document.activeElement && document.activeElement.tagName, invisibleInView: inv.slice(0, 5), invisibleCount: inv.length };
    }, href);
    const ex = await page.evaluate(anchorExtras, href).catch(() => ({}));
    out.push({ href, how, settleMs: settle, totalMs: Date.now() - t0, ...r, ...ex });
    // close mobile menu if left open
    await page.keyboard.press('Escape').catch(() => {});
  }
  return out;
}

async function focusScrollTest(page, maxTabs = 80) {
  await scrollTop(page);
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  const out = []; let first = null;
  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(120); await settleScroll(page, 2000);
    const info = await page.evaluate(() => {
      let el = document.activeElement; if (!el || el === document.body) return null;
      const desc = `${el.tagName}${el.id ? '#' + el.id : ''} "${(el.textContent.trim() || el.getAttribute('aria-label') || el.value || '').replace(/\s+/g, ' ').slice(0, 28)}" ${el.getAttribute('href') || el.name || ''}`;
      let box = el;
      const r0 = el.getBoundingClientRect(); const cs0 = getComputedStyle(el);
      if ((r0.width < 4 || r0.height < 4 || parseFloat(cs0.opacity) === 0) && el.labels && el.labels[0]) box = el.labels[0];
      const r = box.getBoundingClientRect();
      const hdr = document.querySelector('header'); const inHdr = hdr && hdr.contains(el);
      const hb = hdr && !inHdr && /fixed|sticky/.test(getComputedStyle(hdr).position) ? hdr.getBoundingClientRect().bottom : 0;
      // bottom fixed bars (sticky CTA)
      let bottomBar = innerHeight;
      for (const f of document.querySelectorAll('body *')) { const c = getComputedStyle(f); if (c.position !== 'fixed' || c.display === 'none' || c.visibility === 'hidden' || parseFloat(c.opacity) < 0.1 || f.contains(el)) continue; const b = f.getBoundingClientRect(); if (b.bottom >= innerHeight - 2 && b.top > innerHeight * 0.6 && b.width > innerWidth * 0.5) bottomBar = Math.min(bottomBar, b.top); }
      const visibleZero = r.width === 0 || r.height === 0;
      let op = 1, hidden = false; for (let n = box; n && n.nodeType === 1; n = n.parentElement) { const c = getComputedStyle(n); op *= parseFloat(c.opacity); if (c.visibility === 'hidden') hidden = true; }
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const vertOk = r.top >= hb - 2 && r.bottom <= bottomBar + 2 || (r.height > innerHeight * 0.6 && cy > hb && cy < bottomBar);
      const horizOk = r.left >= -2 && r.right <= innerWidth + 2;
      const hit = (cx >= 0 && cy >= 0 && cx <= innerWidth && cy <= innerHeight) ? document.elementFromPoint(cx, cy) : null;
      const covered = hit ? !(box === hit || box.contains(hit) || hit.contains(box) || (el.labels && [...el.labels].some(l => l.contains(hit)))) : true;
      const fv = el.matches(':focus-visible'); const ocs = getComputedStyle(el);
      const ring = (ocs.outlineStyle !== 'none' && parseFloat(ocs.outlineWidth) > 0) || (ocs.boxShadow && ocs.boxShadow !== 'none') || (box !== el && (() => { const lc = getComputedStyle(box); return (lc.outlineStyle !== 'none' && parseFloat(lc.outlineWidth) > 0) || lc.boxShadow !== 'none'; })());
      return { desc, rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], scrollY: Math.round(scrollY), inView: !visibleZero && vertOk && horizOk, covered, coveredBy: covered && hit ? `${hit.tagName}.${String(hit.className && hit.className.baseVal !== undefined ? hit.className.baseVal : hit.className).slice(0, 30)} in ${(hit.closest('[class]') || hit).parentElement ? String((hit.closest('[class]') || hit).parentElement.className).slice(0, 30) : ''}` : null, opacity: +op.toFixed(2), hidden, focusVisible: fv, ring, headerBottom: Math.round(hb), bottomBar: Math.round(bottomBar) };
    });
    if (!info) continue;
    if (first && info.desc === first) break;
    if (!first) first = info.desc;
    out.push(info);
  }
  return { stops: out.length, problems: out.filter(o => !o.inView || o.covered || o.opacity < 0.5 || o.hidden || !o.ring), all: out.map(o => `${o.desc} @${o.rect.join(',')} y=${o.scrollY}`) };
}

// Wheel through the page; at each step look for pinned/horizontal behaviour,
// cross-section text overlap, blank gaps and page overflow. Also logs frames.
async function pinScan(page, vpName) {
  await scrollTop(page);
  const meta = await page.evaluate(() => {
    const tracks = [];
    for (const el of document.querySelectorAll('main *')) {
      const r = el.getBoundingClientRect();
      if (r.width > innerWidth * 1.15 && el.children.length >= 3 && !el.closest('[aria-hidden=true], [class*=marquee]') && !/^(P|SPAN|H\d)$/.test(el.tagName)) {
        const p = el.parentElement; const pcs = getComputedStyle(p);
        if (tracks.some(t => t.el.contains(el))) continue;
        tracks.push({ el, native: /auto|scroll/.test(getComputedStyle(el).overflowX) || /auto|scroll/.test(pcs.overflowX) });
      }
    }
    // also native horizontal scrollers narrower than viewport
    for (const el of document.querySelectorAll('main *')) { const cs = getComputedStyle(el); if (/auto|scroll/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 40 && el.children.length >= 3 && !tracks.some(t => t.el === el || t.el.contains(el) || el.contains(t.el))) tracks.push({ el, native: true }); }
    window.__qaTracks = tracks.map(t => t.el);
    const pins = [...document.querySelectorAll('.pin-spacer')].map(p => { const c = p.firstElementChild; return `${c ? c.tagName + '#' + c.id + '.' + String(c.className).split(' ')[0] : '?'} h=${Math.round(p.getBoundingClientRect().height)}`; });
    const sticky = [...document.querySelectorAll('main *')].filter(e => getComputedStyle(e).position === 'sticky').slice(0, 10).map(e => `${e.tagName}.${String(e.className).split(' ')[0]}`);
    return { pins, sticky, tracks: tracks.map(t => ({ el: `${t.el.tagName}.${String(t.el.className).slice(0, 40)}`, items: t.el.children.length, width: Math.round(t.el.getBoundingClientRect().width), scrollWidth: t.el.scrollWidth, native: t.native, section: (t.el.closest('main > *') || {}).id })), lenis: !!(window.lenis || document.documentElement.classList.contains('lenis')), gsap: !!window.gsap, scrollTrigger: !!window.ScrollTrigger, docH: document.documentElement.scrollHeight };
  });
  await page.mouse.move(Math.round(page.viewportSize().width / 2), Math.round(page.viewportSize().height / 2));
  await page.evaluate(() => window.__qa && window.__qa.startFrames());
  const steps = []; const overlaps = new Map(); const gaps = []; const overflowAt = [];
  const seen = meta.tracks.map(t => new Set());
  const trackX = meta.tracks.map(() => []);
  let stall = 0, lastY = -1;
  const delta = Math.round(page.viewportSize().height * 0.4);
  for (let i = 0; i < 400; i++) {
    await page.mouse.wheel(0, delta); await page.waitForTimeout(140);
    const s = await page.evaluate(() => {
      const res = { y: Math.round(scrollY), max: document.documentElement.scrollHeight - innerHeight, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth, overlaps: [], gap: null, tracks: [] };
      // tracks
      (window.__qaTracks || []).forEach((t, ti) => {
        const m = new DOMMatrixReadOnly(getComputedStyle(t).transform === 'none' ? undefined : getComputedStyle(t).transform);
        const vis = []; [...t.children].forEach((c, ci) => { const b = c.getBoundingClientRect(); const visW = Math.min(b.right, innerWidth) - Math.max(b.left, 0); const visH = Math.min(b.bottom, innerHeight) - Math.max(b.top, 0); if (b.width > 0 && visW >= b.width * 0.6 && visH >= Math.min(b.height, innerHeight) * 0.5) vis.push(ci); });
        res.tracks.push({ tx: Math.round(m.m41), sl: Math.round(t.scrollLeft), vis });
      });
      // overlap sampling with occlusion
      const textAt = (el, x, y) => { for (const n of el.childNodes) { if (n.nodeType !== 3 || !n.textContent.trim()) continue; const rg = document.createRange(); rg.selectNodeContents(n); for (const rc of rg.getClientRects()) if (x >= rc.left && x <= rc.right && y >= rc.top && y <= rc.bottom) return true; } return false; };
      const effOp = el => { let o = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity); return o; };
      const opaque = el => { const c = getComputedStyle(el); const m = c.backgroundColor.match(/rgba?\(([^)]+)\)/); const a = m ? (m[1].split(/[ ,\/]+/).filter(Boolean)[3] ?? 1) : 0; return (+a >= 0.85 || (c.backgroundImage !== 'none' && !/radial/.test(c.backgroundImage))) && effOp(el) > 0.85; };
      const secOf = el => { const s = el.closest('main > *, header, footer'); if (!s) return 'other'; const sp = s.classList.contains('pin-spacer') ? s.firstElementChild : s; return sp.id || sp.tagName.toLowerCase() + '.' + String(sp.className).split(' ')[0]; };
      for (let xi = 0; xi < 5; xi++) for (let yi = 0; yi < 7; yi++) {
        const x = innerWidth * (0.1 + xi * 0.2), y = innerHeight * (0.07 + yi * 0.143);
        const stack = document.elementsFromPoint(x, y); const texts = [];
        for (const el of stack) {
          if (el === document.body || el === document.documentElement) break;
          const inFixed = (() => { for (let n = el; n && n.nodeType === 1; n = n.parentElement) { if (n.tagName === 'HEADER' || getComputedStyle(n).position === 'fixed') return true; } return false; })();
          if (inFixed) { if (opaque(el)) break; continue; }
          if (textAt(el, x, y) && effOp(el) > 0.15 && getComputedStyle(el).visibility !== 'hidden') texts.push(el);
          if (opaque(el)) break;
        }
        if (texts.length >= 2) {
          const secs = [...new Set(texts.map(secOf))];
          const blk = e => e.closest('h1,h2,h3,h4,h5,h6,p,li,blockquote,a,button,label') || e;
          const nonNested = texts.filter((a, i) => !texts.some((b, j) => i !== j && (a.contains(b) || b.contains(a) || blk(a) === blk(b))));
          if (secs.length >= 2) res.overlaps.push({ kind: 'cross-section', secs: secs.join(' / '), texts: texts.map(t => `"${t.textContent.trim().slice(0, 25)}"${t.closest('[aria-hidden=true]') ? '(aria-hidden)' : ''}`).join(' over ') });
          else if (nonNested.length >= 2) res.overlaps.push({ kind: 'intra-section', secs: secs[0], texts: nonNested.map(t => `"${t.textContent.trim().slice(0, 25)}"${t.closest('[aria-hidden=true]') ? '(aria-hidden)' : ''}`).join(' over ') });
        }
      }
      const c = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
      if (!c || c === document.body || c === document.documentElement) res.gap = c ? c.tagName : 'null';
      return res;
    });
    s.tracks.forEach((t, ti) => { t.vis.forEach(v => seen[ti].add(v)); trackX[ti].push(t.tx); });
    for (const o of s.overlaps) { const k = o.kind + o.texts; if (!overlaps.has(k)) overlaps.set(k, { ...o, atY: s.y }); }
    if (s.gap) gaps.push(s.y);
    if (s.overflow) overflowAt.push(s.y);
    steps.push(s.y);
    if (Math.abs(s.y - lastY) < 2) stall++; else stall = 0;
    lastY = s.y;
    if (s.y >= s.max - 2 || stall >= 8) break;
  }
  const frames = await page.evaluate(() => window.__qa ? window.__qa.stopFrames() : []);
  // native tracks: scroll them sideways and record reachability
  for (let ti = 0; ti < meta.tracks.length; ti++) {
    if (!meta.tracks[ti].native) continue;
    const vis = await page.evaluate(async ti => {
      const t = window.__qaTracks[ti]; t.scrollIntoView({ block: 'center', behavior: 'instant' }); const out = new Set();
      for (let x = 0; x <= t.scrollWidth; x += Math.max(100, t.clientWidth * 0.5)) { t.scrollLeft = x; await new Promise(r => setTimeout(r, 120)); [...t.children].forEach((c, ci) => { const b = c.getBoundingClientRect(); const visW = Math.min(b.right, innerWidth) - Math.max(b.left, 0); if (visW >= b.width * 0.6) out.add(ci); }); }
      t.scrollLeft = 0; return [...out];
    }, ti);
    vis.forEach(v => seen[ti].add(v));
  }
  const fr = frames.slice(2).filter(f => f > 0);
  const sorted = [...fr].sort((a, b) => a - b);
  const p = q => sorted.length ? +sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))].toFixed(1) : null;
  const ov = [...overlaps.values()];
  return {
    ...meta,
    steps: steps.length, finalY: lastY, reachedBottom: steps.length && lastY >= (await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)) - 4,
    trackSummary: meta.tracks.map((t, ti) => ({ ...t, txMin: Math.min(...trackX[ti]), txMax: Math.max(...trackX[ti]), itemsSeen: seen[ti].size, itemsTotal: t.items, unseen: [...Array(t.items).keys()].filter(k => !seen[ti].has(k)) })),
    crossSectionOverlaps: ov.filter(o => o.kind === 'cross-section').slice(0, 15),
    intraSectionOverlaps: ov.filter(o => o.kind === 'intra-section').slice(0, 15),
    gapsAtY: gaps.slice(0, 10), overflowAtY: overflowAt.slice(0, 10),
    frames: { n: fr.length, avgMs: fr.length ? +(fr.reduce((a, b) => a + b, 0) / fr.length).toFixed(1) : null, p50: p(0.5), p95: p(0.95), max: p(0.999), over50ms: fr.filter(f => f > 50).length, pctOver34ms: fr.length ? +(100 * fr.filter(f => f > 34).length / fr.length).toFixed(1) : null },
  };
}

// ---------- 5. Performance ----------
async function perfRun(browser, url, vp, cpuRate) {
  const ctx = await newCtx(browser, { viewport: { width: vp.w, height: vp.h }, isMobile: !!vp.mobile, hasTouch: !!vp.mobile });
  const page = await ctx.newPage();
  if (cpuRate > 1) { const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpuRate }); }
  await page.goto(url, { waitUntil: 'load', timeout: 45000 });
  const readyMs = await waitReady(page, 9000);
  await page.waitForTimeout(800);
  const load = await page.evaluate(() => { const q = window.__qa; const nav = performance.getEntriesByType('navigation')[0]; const lcp = performance.getEntriesByType('largest-contentful-paint'); return { longtasks: q.longtasks.slice(), cls: +q.shifts.reduce((a, s) => a + s.v, 0).toFixed(4), shiftSources: q.shifts.filter(s => s.v > 0.005).slice(0, 6), dcl: Math.round(nav.domContentLoadedEventEnd), loadEnd: Math.round(nav.loadEventEnd), unblockedAt: q.unblockedAt }; });
  const nLT = load.longtasks.length; const nShift = await page.evaluate(() => window.__qa.shifts.length);
  // smooth wheel scroll ~6s
  await page.mouse.move(vp.w / 2, vp.h / 2);
  await page.evaluate(() => window.__qa.startFrames());
  const tS = await page.evaluate(() => performance.now());
  for (let i = 0; i < 45; i++) { await page.mouse.wheel(0, Math.round(vp.h * 0.35)); await page.waitForTimeout(110); }
  await page.waitForTimeout(800);
  const scroll = await page.evaluate(([nLT, nShift, tS]) => { const q = window.__qa; const fr = q.stopFrames().slice(2); const s = [...fr].sort((a, b) => a - b); const p = x => s.length ? +s[Math.min(s.length - 1, Math.floor(s.length * x))].toFixed(1) : null; const lts = q.longtasks.slice(nLT).filter(l => l.t >= tS - 50); const sh = q.shifts.slice(nShift); return { frames: fr.length, avgFps: fr.length ? +(1000 / (fr.reduce((a, b) => a + b, 0) / fr.length)).toFixed(1) : null, p50: p(.5), p95: p(.95), maxFrame: p(.999), framesOver50: fr.filter(f => f > 50).length, longtasks: lts.length, longestTask: Math.max(0, ...lts.map(l => l.d)), tbt: lts.reduce((a, l) => a + Math.max(0, l.d - 50), 0), cls: +sh.reduce((a, s) => a + s.v, 0).toFixed(4), shiftSources: sh.filter(s => s.v > 0.005).slice(0, 6), scrolledTo: Math.round(scrollY) }; }, [nLT, nShift, tS]);
  await ctx.close();
  const lt = load.longtasks;
  return { vp: `${vp.w}x${vp.h}`, cpuThrottle: cpuRate, readyMs, load: { dcl: load.dcl, loadEnd: load.loadEnd, unblockedAt: load.unblockedAt, longtasks: lt.length, longestTask: Math.max(0, ...lt.map(l => l.d)), tbt: lt.reduce((a, l) => a + Math.max(0, l.d - 50), 0), cls: load.cls, shiftSources: load.shiftSources }, scroll };
}

// ---------- designer v2 extras ----------
// Anchor result enrichment: focus moved into target, hash updated.
const anchorExtras = h => {
  const tgt = document.getElementById(decodeURIComponent(h.slice(1)));
  const ae = document.activeElement;
  return { focusInTarget: !!(tgt && ae && (ae === tgt || tgt.contains(ae))), hashOk: location.hash === h, activeEl: ae ? `${ae.tagName}#${ae.id}` : null };
};

async function keyboardScrollTest(page) {
  await scrollTop(page);
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  await page.mouse.click(5, Math.round(page.viewportSize().height / 2)).catch(() => {}); // focus document, not a control
  const y = () => page.evaluate(() => Math.round(scrollY));
  const r = {};
  const y0 = await y();
  await page.keyboard.press('PageDown'); await page.waitForTimeout(200); await settleScroll(page, 3000); r.pageDown = (await y()) - y0;
  const y1 = await y();
  await page.keyboard.press('Space'); await page.waitForTimeout(200); await settleScroll(page, 3000); r.space = (await y()) - y1;
  const y2 = await y();
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(200); await settleScroll(page, 3000); r.arrowDown = (await y()) - y2;
  await page.keyboard.press('End'); await page.waitForTimeout(300); await settleScroll(page, 5000);
  r.endAtBottom = await page.evaluate(() => scrollY >= document.documentElement.scrollHeight - innerHeight - 4);
  await page.keyboard.press('Home'); await page.waitForTimeout(300); await settleScroll(page, 5000);
  r.homeAtTop = await page.evaluate(() => scrollY <= 2);
  r.ok = r.pageDown > 100 && r.space > 100 && r.arrowDown > 10 && r.endAtBottom && r.homeAtTop;
  return r;
}

async function menuScrollLockTest(page) {
  await scrollTop(page);
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' })); await settleScroll(page, 2000);
  const toggle = page.locator('header button[aria-expanded], button[aria-controls]').first();
  if (!(await toggle.count()) || !(await toggle.isVisible())) return { error: 'no visible toggle' };
  await toggle.click(); await page.waitForTimeout(700);
  const yA = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 600); await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollBy(0, 0));
  const yB = await page.evaluate(() => scrollY);
  const bar = await page.evaluate(bottomBarState);
  await page.keyboard.press('Escape'); await page.waitForTimeout(700);
  if ((await toggle.getAttribute('aria-expanded')) === 'true') { await toggle.click(); await page.waitForTimeout(600); }
  const yC = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 600); await page.waitForTimeout(900); await settleScroll(page, 2000);
  const yD = await page.evaluate(() => scrollY);
  // touch-ish: programmatic scroll after close
  return { scrolledWhileOpen: Math.round(yB - yA), scrolledAfterClose: Math.round(yD - yC), bottomBarWhileMenuOpen: bar, lockedOk: Math.abs(yB - yA) < 5, restoredOk: yD - yC > 50 };
}

const bottomBarState = () => {
  const cands = [...document.querySelectorAll('body *')].filter(e => { const cs = getComputedStyle(e); if (cs.position !== 'fixed') return false; const r = e.getBoundingClientRect(); return r.height > 30 && r.height < 130 && /book a free call/i.test(e.textContent) && !e.closest('[role=dialog]') && !e.querySelector('nav'); });
  const bar = cands.sort((a, b) => a.getBoundingClientRect().height - b.getBoundingClientRect().height).pop();
  if (!bar) return { found: false };
  const r = bar.getBoundingClientRect(); const cs = getComputedStyle(bar);
  let op = 1; for (let n = bar; n && n.nodeType === 1; n = n.parentElement) op *= parseFloat(getComputedStyle(n).opacity);
  const visible = r.top < innerHeight - 4 && r.bottom > 0 && op > 0.1 && cs.visibility !== 'hidden' && cs.display !== 'none';
  return { found: true, sel: `${bar.tagName}.${String(bar.className).slice(0, 40)}`, visible, top: Math.round(r.top), bottom: Math.round(r.bottom), opacity: +op.toFixed(2), display: cs.display };
};

async function bottomBarTest(page) {
  const r = {};
  await scrollTop(page); await page.waitForTimeout(600);
  r.atLoad = await page.evaluate(bottomBarState);
  if (!r.atLoad.found) return { error: 'bottom bar not found (fixed el with "Book a free call", 30-130px tall)', ...r };
  // past hero CTAs
  const heroBottom = await page.evaluate(() => { const c = [...document.querySelectorAll('main a, main button')].find(a => /discovery call|see the work/i.test(a.textContent)); return c ? Math.round(c.getBoundingClientRect().bottom + scrollY) : innerHeight; });
  await page.evaluate(y => window.scrollTo({ top: y + 200, behavior: 'instant' }), heroBottom); await settleScroll(page, 2000); await page.waitForTimeout(900);
  r.afterHeroCtas = await page.evaluate(bottomBarState);
  await page.screenshot({ path: `${SHOTS}/round${ROUND}-375-bottom-bar.png` });
  // mid-page
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight * 0.45, behavior: 'instant' })); await settleScroll(page, 2000); await page.waitForTimeout(900);
  r.midPage = await page.evaluate(bottomBarState);
  // input focused (keyboard up)
  const inp = page.locator('form input[type=text], form input[type=email], form input:not([type])').first();
  if (await inp.count()) {
    await page.evaluate(() => { const i = document.querySelector('form input[type=text], form input[type=email], form input:not([type])'); i.scrollIntoView({ block: 'center' }); }); await page.waitForTimeout(500);
    // first check contact in view hides it
    r.contactInView = await page.evaluate(bottomBarState);
    // focus an input while scrolled away from contact? Focus scrolls it into view anyway; check state
    await inp.focus(); await page.waitForTimeout(700); r.inputFocused = await page.evaluate(bottomBarState);
    await page.evaluate(() => document.activeElement.blur());
  }
  // contact top in view
  await page.evaluate(() => { const c = document.getElementById('contact'); if (c) window.scrollTo({ top: c.getBoundingClientRect().top + scrollY - innerHeight * 0.5, behavior: 'instant' }); }); await settleScroll(page, 2000); await page.waitForTimeout(900);
  r.contact50 = await page.evaluate(() => { const c = document.getElementById('contact'); const b = c.getBoundingClientRect(); return { contactVisiblePx: Math.round(Math.min(innerHeight, b.bottom) - Math.max(0, b.top)) }; });
  r.contact50.bar = await page.evaluate(bottomBarState);
  // bottom of page: footer text not covered
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })); await settleScroll(page, 2000); await page.waitForTimeout(900);
  r.atBottom = await page.evaluate(bottomBarState);
  r.footerCovered = await page.evaluate(() => {
    const st = (window.__bb = null);
    const bars = [...document.querySelectorAll('body *')].filter(e => getComputedStyle(e).position === 'fixed' && /book a free call/i.test(e.textContent)).map(e => e.getBoundingClientRect()).filter(b => b.top < innerHeight - 4 && b.height < 130);
    if (!bars.length) return [];
    const out = [];
    for (const el of document.querySelectorAll('footer *')) { if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue; if (el.closest('[aria-hidden=true]')) continue; const b = el.getBoundingClientRect(); for (const bb of bars) if (b.bottom > bb.top && b.top < bb.bottom && b.right > bb.left && b.left < bb.right) out.push(`"${el.textContent.trim().slice(0, 30)}"`); }
    return out;
  });
  r.ok = r.atLoad.visible === false && r.afterHeroCtas.visible === true && (!r.inputFocused || r.inputFocused.visible === false) && r.contact50.bar.visible === false && r.footerCovered.length === 0;
  return r;
}

async function stackCardsTest(page) {
  // services stacking cards: when the last card is in view, its centre must hit itself; check sticky state
  return page.evaluate(async () => {
    const sec = document.getElementById('services'); if (!sec) return { error: 'no #services' };
    const cards = [...sec.querySelectorAll('ol > li')]; if (!cards.length) return { error: 'no #services ol > li' };
    const sticky = cards.map(c => getComputedStyle(c).position);
    const top = sec.getBoundingClientRect().top + scrollY, h = sec.getBoundingClientRect().height;
    const res = { cards: cards.length, positions: [...new Set(sticky)], coveredLast: [], coveredAny: [] };
    for (let y = top - innerHeight * 0.2; y < top + h; y += innerHeight * 0.15) {
      window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 160));
      cards.forEach((c, i) => {
        const b = c.getBoundingClientRect(); if (b.top > innerHeight * 0.7 || b.bottom < innerHeight * 0.3) return;
        // check a point in the card's first heading
        const hd = c.querySelector('h3,h2,p') || c; const hb = hd.getBoundingClientRect();
        const px = hb.left + Math.min(hb.width / 2, 40), py = hb.top + hb.height / 2;
        if (py < 0 || py > innerHeight) return;
        const hit = document.elementFromPoint(px, py);
        if (hit && !c.contains(hit) && !hit.closest('header')) { const msg = `card${i + 1} heading covered by ${hit.tagName}.${String(hit.className).slice(0, 25)} @y=${Math.round(scrollY)}`; (i === cards.length - 1 ? res.coveredLast : res.coveredAny).push(msg); }
      });
    }
    res.coveredAny = [...new Set(res.coveredAny)].slice(0, 8); res.coveredLast = [...new Set(res.coveredLast)].slice(0, 8);
    return res;
  });
}

const sectionBgProbe = () => {
  const out = [];
  for (const s of document.querySelectorAll('main > section, main > div > section, footer')) {
    const cs = getComputedStyle(s);
    const m = cs.backgroundColor.match(/rgba?\(([^)]+)\)/); const a = m ? +(m[1].split(/[ ,\/]+/).filter(Boolean)[3] ?? 1) : 0;
    out.push({ id: s.id || s.tagName, bg: cs.backgroundColor, bgImage: cs.backgroundImage !== 'none', solid: a >= 0.99 || cs.backgroundImage !== 'none' });
  }
  return { htmlClass: document.documentElement.className, pins: document.querySelectorAll('.pin-spacer').length, sections: out, nonSolid: out.filter(o => !o.solid).map(o => o.id) };
};

async function formTestV2(page, shotTag) {
  const r = {};
  const form = page.locator('#contact form, form').first();
  if (!(await form.count())) return { error: 'no form' };
  await form.scrollIntoViewIfNeeded(); await settleScroll(page, 2000);
  const submit = form.locator('button[type=submit], button:not([type])').first();
  await submit.click(); await page.waitForTimeout(900);
  r.afterEmpty = await page.evaluate(() => {
    const f = document.querySelector('#contact form') || document.querySelector('form');
    const sum = document.querySelector('[role=alert]');
    const ae = document.activeElement;
    return { invalid: [...f.querySelectorAll('[aria-invalid=true]')].map(e => e.name || e.id), summary: sum ? sum.textContent.trim().replace(/\s+/g, ' ').slice(0, 140) : null, summaryLinks: sum ? sum.querySelectorAll('a').length : 0, focus: ae ? `${ae.tagName}#${ae.id}.${String(ae.className).slice(0, 20)} role=${ae.getAttribute('role')}` : null, focusInSummary: !!(sum && ae && (sum === ae || sum.contains(ae))), errorsVisible: [...f.querySelectorAll('[id*=err], .error, .field__error, [class*=error]')].filter(e => e.textContent.trim() && e.getBoundingClientRect().height > 0).map(e => e.textContent.trim().slice(0, 40)).slice(0, 6) };
  });
  if (shotTag) await page.screenshot({ path: `${SHOTS}/round${ROUND}-${shotTag}-form-errors.png` });
  // chips & radios by keyboard
  const kb = await (async () => {
    const out = {};
    const chk = form.locator('input[type=checkbox]').first(); const rad = form.locator('input[type=radio]').nth(1);
    if (await chk.count()) {
      await chk.focus(); await page.keyboard.press('Space'); await page.waitForTimeout(300);
      out.checkboxChecked = await chk.isChecked();
      out.checkboxFocusRing = await chk.evaluate(e => { const l = e.labels && e.labels[0]; const t = [e, l, l && l.querySelector('span')].filter(Boolean); return t.some(x => { const c = getComputedStyle(x); return (c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0) || c.boxShadow !== 'none'; }); });
      out.checkboxNonColour = await chk.evaluate(e => { const l = e.labels && e.labels[0]; if (!l) return 'no label'; const els = [l, ...l.querySelectorAll('*')]; const c = els.map(x => [getComputedStyle(x, '::before').content, getComputedStyle(x, '::after').content]).flat().filter(v => v && v !== 'none' && v !== 'normal' && v !== '""'); const vis = [...l.querySelectorAll('*')].filter(x => /✓|check/i.test(x.textContent + x.className) && x.getBoundingClientRect().width > 0 && getComputedStyle(x).opacity > 0.5); return c.join(' ') + (vis.length ? ' [visible check el]' : ''); });
      await page.keyboard.press('Space'); await page.waitForTimeout(200); out.checkboxToggledBack = !(await chk.isChecked());
    } else out.checkbox = 'none';
    if (await rad.count()) {
      const first = form.locator('input[type=radio]').first();
      await first.focus(); await page.keyboard.press('Space'); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(300);
      out.radioArrowMoved = await rad.isChecked();
      out.radioNonColour = await rad.evaluate(e => { const l = e.labels && e.labels[0]; if (!l) return 'no label'; const els = [l, ...l.querySelectorAll('*')]; return els.map(x => [getComputedStyle(x, '::before').content, getComputedStyle(x, '::after').content]).flat().filter(v => v && v !== 'none' && v !== 'normal' && v !== '""').join(' '); });
    } else out.radio = 'none';
    return out;
  })();
  r.keyboard = kb;
  // fill valid
  for (const f of await form.locator('input, textarea').all()) {
    const t = await f.evaluate(e => ({ type: e.type, name: e.name, req: e.required }));
    try {
      if (['checkbox', 'radio', 'hidden', 'submit'].includes(t.type)) continue;
      if (t.type === 'email') await f.fill('qa@example.com'); else await f.fill('QA test message for the IraMaedia site');
    } catch (_) {}
  }
  const popupP = page.context().waitForEvent('page', { timeout: 3000 }).catch(() => null);
  let mailto = null; page.on('request', rq => { if (rq.url().startsWith('mailto:')) mailto = rq.url(); });
  await page.evaluate(() => { window.__qaNav = null; const o = window.open; window.open = function (u) { window.__qaNav = u; return null; }; });
  await submit.click();
  await page.waitForTimeout(150);
  r.loading = await page.evaluate(() => { const b = (document.querySelector('#contact form') || document.querySelector('form') || document).querySelector('button[type=submit], button:not([type])'); return b ? { text: b.textContent.trim().replace(/\s+/g, ' '), ariaBusy: b.getAttribute('aria-busy'), disabled: b.disabled } : null; }).catch(() => null);
  await page.waitForTimeout(1600);
  const popup = await popupP; if (popup) { r.popup = popup.url(); await popup.close(); }
  r.mailto = mailto || await page.evaluate(() => window.__qaNav).catch(() => null);
  r.success = await page.evaluate(() => {
    const ae = document.activeElement;
    const h = [...document.querySelectorAll('#contact h3, #contact h2, #contact [role=status] *')].find(x => /almost there/i.test(x.textContent) && x.getBoundingClientRect().height > 0);
    const copy = [...document.querySelectorAll('#contact button')].find(b => /copy/i.test(b.textContent) && b.getBoundingClientRect().height > 0);
    return { headingVisible: !!h, focusOnHeading: !!(h && ae && (ae === h || h.contains(ae))), focus: ae ? `${ae.tagName}.${String(ae.className).slice(0, 20)} "${ae.textContent.trim().slice(0, 20)}"` : null, copyButton: copy ? copy.textContent.trim() : null };
  });
  if (shotTag) { const h = page.locator('#contact').first(); await page.screenshot({ path: `${SHOTS}/round${ROUND}-${shotTag}-form-success.png` }); }
  // copy button
  const copyBtn = page.locator('#contact button', { hasText: /copy/i }).first();
  if (await copyBtn.count()) {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await copyBtn.click().catch(() => {}); await page.waitForTimeout(400);
    r.copyAfter = await copyBtn.textContent().catch(() => null);
    r.copyLive = await copyBtn.evaluate(b => !!(b.closest('[aria-live]') || b.getAttribute('aria-live') || document.querySelector('#contact [aria-live]'))).catch(() => null);
  }
  return r;
}

(async () => {
  const browser = await launch();
  if (want('legacy')) {

  // ---------- main desktop/tablet/mobile passes on ROOT and SUB ----------
  const vps = [
    { name: 'desktop', w: 1440, h: 900 },
    { name: 'tablet', w: 768, h: 1024 },
    { name: 'mobile', w: 375, h: 812, mobile: true },
  ];
  for (const base of [{ k: 'root', url: ROOT }, { k: 'sub', url: SUB }]) {
    for (const vp of vps) {
      if (base.k === 'sub' && vp.name === 'tablet') continue;
      const ctx = await newCtx(browser, { viewport: { width: vp.w, height: vp.h }, isMobile: !!vp.mobile, hasTouch: !!vp.mobile, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      // block external form posts to not spam services
      await page.route(/formspree|formsubmit|getform|web3forms|netlify/i, r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
      const bag = { console: [], pageErrors: [], failed: [], http: [], requests: [], bytesLocal: 0, bytesExternal: 0 };
      attachNet(page, bag, base.url);
      await page.addInitScript(() => {
        window.__cls = 0; window.__lcp = 0;
        try {
          new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
          new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (_) {}
      });
      const t0 = Date.now();
      const resp = await page.goto(base.url, { waitUntil: 'networkidle', timeout: 45000 }).catch(e => ({ status: () => 'ERR ' + e.message }));
      const loadMs = Date.now() - t0;
      await waitReady(page, 8000);
      const key = `${base.k}-${vp.name}`;
      const entry = { status: resp && resp.status(), loadMs };
      await page.waitForTimeout(1200);
      if (base.k === 'root' && vp.name !== 'tablet') await page.screenshot({ path: `${SHOTS}/round${ROUND}-${vp.name}-viewport.png` });
      entry.invisibleBeforeScroll = (await page.evaluate(invisibleProbe)).length;
      await scrollThrough(page);
      entry.clsDuringScroll = await page.evaluate(() => +window.__cls.toFixed(4));
      entry.lcpMs = await page.evaluate(() => Math.round(window.__lcp));
      entry.invisibleAfterScroll = await page.evaluate(invisibleProbe);
      entry.overflow = await page.evaluate(overflowProbe);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(1500);
      if (base.k === 'root') await page.screenshot({ path: `${SHOTS}/round${ROUND}-${vp.name}-full.png`, fullPage: true });
      if (base.k === 'root' && vp.name === 'desktop') {
        const st = await page.evaluate(staticAudit);
        fs.writeFileSync(`/home/user/IraMaedia/.team/qa/round${ROUND}-bodytext.txt`, st.bodyText); delete st.bodyText;
        R('static', st);
        R('contrast', await page.evaluate(contrastProbe));
        // local link reachability
        const hrefs = [...new Set(st.links.map(l => l.href).filter(h => h && !h.startsWith('#') && !/^(mailto|tel|https?):/i.test(h)))];
        const linkStatus = {};
        for (const h of hrefs) { const u = new URL(h, base.url).href; const rr = await ctx.request.get(u).catch(e => null); linkStatus[h] = rr ? rr.status() : 'ERR'; }
        R('localLinkStatus', linkStatus);
        R('externalLinks', [...new Set(st.links.map(l => l.href).filter(h => /^(mailto|tel|https?):/i.test(h || '')))]);
        R('focus', await focusAudit(page));
        R('faq', await faqTest(page));
        R('form', await formTest(page));
        entry.runningAnimations = await page.evaluate(() => document.getAnimations ? document.getAnimations().length : -1);
      }
      if (vp.name === 'mobile') {
        await page.goto(base.url, { waitUntil: 'networkidle' }); await waitReady(page, 8000);
        entry.mobileNav = await mobileNavTest(page);
        entry.overflowAfterNav = await page.evaluate(overflowProbe);
      }
      entry.console = bag.console; entry.pageErrors = bag.pageErrors; entry.failed = bag.failed; entry.http = [...new Set(bag.http)];
      entry.kbLocal = Math.round(bag.bytesLocal / 1024); entry.kbExternal = Math.round(bag.bytesExternal / 1024); entry.requestCount = bag.requests.length;
      entry.externalHosts = [...new Set(bag.requests.map(u => new URL(u).host).filter(h => !h.startsWith('localhost')))];
      R(key, entry);
      await ctx.close();
    }
  }

  // ---------- extra widths: overflow only ----------
  {
    const ex = {};
    for (const w of [320, 1024, 1920]) {
      const ctx = await newCtx(browser, { viewport: { width: w, height: 800 }, isMobile: w < 400, hasTouch: w < 400 });
      const page = await ctx.newPage();
      await page.goto(ROOT, { waitUntil: 'networkidle' }); await waitReady(page, 8000); await scrollThrough(page);
      ex[w] = await page.evaluate(overflowProbe);
      ex[w].invisible = (await page.evaluate(invisibleProbe)).length;
      if (w === 320) await page.screenshot({ path: `${SHOTS}/round${ROUND}-320-full.png`, fullPage: true });
      await ctx.close();
    }
    R('extraWidths', ex);
  }

  // ---------- anchor jumps: content in view must be visible ----------
  {
    const ctx = await newCtx(browser, { viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const out = {};
    const ids = await (async () => { await page.goto(ROOT, { waitUntil: 'networkidle' }); return page.evaluate(() => [...document.querySelectorAll('main section[id], footer[id]')].map(s => s.id)); })();
    for (const id of ids) {
      await page.goto('about:blank'); await page.goto(ROOT + '#' + id, { waitUntil: 'networkidle' }); await waitReady(page, 8000); await settleScroll(page, 4000); await page.waitForTimeout(1000);
      out[id] = await page.evaluate(() => {
        const inv = [];
        for (const el of document.querySelectorAll('main *')) {
          const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight || r.width === 0) continue;
          const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1); if (!hasText) continue;
          if (el.closest('[aria-hidden=true],[hidden]')) continue;
          let op = 1, n = el; while (n && n.nodeType === 1) { op *= parseFloat(getComputedStyle(n).opacity); n = n.parentElement; }
          if (op < 0.9) inv.push(`${el.tagName}.${String(el.className).slice(0, 25)} "${el.textContent.trim().slice(0, 30)}" op=${op.toFixed(2)}`);
        }
        const hdr = document.querySelector('header'); const tgt = document.getElementById(location.hash.slice(1));
        const hb = hdr ? hdr.getBoundingClientRect().bottom : 0; const tt = tgt ? tgt.getBoundingClientRect().top : null;
        const heading = tgt && tgt.querySelector('h2,h3'); const ht = heading ? heading.getBoundingClientRect().top : null;
        return { invisible: inv.slice(0, 6), invisibleCount: inv.length, headerBottom: Math.round(hb), targetTop: tt && Math.round(tt), headingTop: ht && Math.round(ht), headingUnderHeader: ht !== null && ht < hb };
      });
    }
    R('anchorJumps', out);
    await ctx.close();
  }

  // ---------- reduced motion ----------
  {
    const ctx = await newCtx(browser, { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    const bag = { console: [], pageErrors: [], failed: [], http: [], requests: [], bytesLocal: 0, bytesExternal: 0 };
    attachNet(page, bag, ROOT);
    await page.goto(ROOT, { waitUntil: 'networkidle' }); await page.waitForTimeout(800);
    const before = await page.evaluate(invisibleProbe);
    // jump to bottom without slow scroll (reveals should not depend on motion)
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await page.waitForTimeout(800);
    const after = await page.evaluate(invisibleProbe);
    const anims = await page.evaluate(() => (document.getAnimations ? document.getAnimations() : []).filter(a => a.playState === 'running').map(a => `${a.animationName || a.constructor.name} on ${a.effect && a.effect.target ? a.effect.target.tagName + '.' + String(a.effect.target.className).slice(0, 30) : '?'} dur=${a.effect && a.effect.getTiming ? a.effect.getTiming().duration : '?'}`));
    const scrollBehavior = await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
    await page.screenshot({ path: `${SHOTS}/round${ROUND}-reduced-motion-full.png`, fullPage: true });
    R('reducedMotion', { invisibleAtTopNoScroll: before.length, invisibleAfterJump: after, runningAnimations: anims.slice(0, 20), runningCount: anims.length, scrollBehavior, errors: bag.pageErrors });
    await ctx.close();
  }

  // ---------- JS disabled: content should still be visible ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(ROOT, { waitUntil: 'networkidle' });
    R('noJS', { invisible: (await page.evaluate(invisibleProbe)).length });
    await ctx.close();
  }

  } // end legacy
  // =================== Round 3+ checks ===================
  const VP = { 1440: { w: 1440, h: 900 }, 375: { w: 375, h: 812, mobile: true }, 320: { w: 320, h: 700, mobile: true }, 768: { w: 768, h: 1024 } };
  const ctxOpts = (vp, extra = {}) => ({ viewport: { width: vp.w, height: vp.h }, isMobile: !!vp.mobile, hasTouch: !!vp.mobile, ...extra });

  // ---------- screenshots: full, viewport, key sections at 1440/375/320/768 ----------
  if (want('shots')) {
    const shots = {};
    for (const wkey of [1440, 375, 320, 768]) {
      const vp = VP[wkey];
      const ctx = await newCtx(browser, ctxOpts(vp)); const page = await ctx.newPage();
      await page.goto(ROOT, { waitUntil: 'load' }); await waitReady(page, 8000); await page.waitForTimeout(1200);
      await page.screenshot({ path: `${SHOTS}/round${ROUND}-${wkey}-viewport.png` });
      const secs = await page.evaluate(() => { const out = []; for (const s of document.querySelectorAll('main > section, main section[id], main > [id], footer')) { const n = s.id || (s.tagName === 'FOOTER' ? 'footer' : String(s.className).split(/\s+/)[0]); if (!n || out.includes(n)) continue; s.dataset.qaSec = n; out.push(n); } return out; });
      const key = /hero|top|home|intro|work|portfolio|contact|footer/;
      const list = (wkey === 1440 || wkey === 375) ? secs : secs.filter(s => key.test(s));
      const done = [];
      for (const id of list) {
        const y = await page.evaluate(id => { const el = document.querySelector(`[data-qa-sec="${id}"]`); const host = el.parentElement && el.parentElement.classList.contains('pin-spacer') ? el.parentElement : el; return Math.round(host.getBoundingClientRect().top + scrollY); }, id);
        await page.evaluate(y => { if (window.lenis && window.lenis.scrollTo) try { window.lenis.scrollTo(y, { immediate: true }); } catch (_) {} window.scrollTo({ top: y, behavior: 'instant' }); }, y);
        await settleScroll(page, 2500); await page.waitForTimeout(1300);
        await page.screenshot({ path: `${SHOTS}/round${ROUND}-${wkey}-${id}.png` }); done.push(id);
        // mid-pin shot for pinned sections
        const pinH = await page.evaluate(id => { const el = document.querySelector(`[data-qa-sec="${id}"]`); const p = el && el.parentElement; return p && p.classList.contains('pin-spacer') ? Math.round(p.getBoundingClientRect().height - innerHeight) : 0; }, id);
        // hero after fan-out (50% of hero scrolled) and services stack mid-scroll
        if (/hero|top|home/.test(id) || id === 'services') {
          const hh = await page.evaluate(id => document.querySelector(`[data-qa-sec="${id}"]`).getBoundingClientRect().height, id);
          await page.evaluate(y => { if (window.lenis && window.lenis.scrollTo) try { window.lenis.scrollTo(y, { immediate: true }); } catch (_) {} window.scrollTo({ top: y, behavior: 'instant' }); }, y + Math.round(hh * 0.5));
          await settleScroll(page, 2500); await page.waitForTimeout(1000);
          await page.screenshot({ path: `${SHOTS}/round${ROUND}-${wkey}-${id}-mid.png` }); done.push(`${id}-mid`);
        }
        if (pinH > 200) {
          for (const frac of [0.05, 0.5, 0.95]) {
            await page.evaluate(y => { if (window.lenis && window.lenis.scrollTo) try { window.lenis.scrollTo(y, { immediate: true }); } catch (_) {} window.scrollTo({ top: y, behavior: 'instant' }); }, y + Math.round(pinH * frac));
            await settleScroll(page, 2500); await page.waitForTimeout(1000);
            await page.screenshot({ path: `${SHOTS}/round${ROUND}-${wkey}-${id}-pin${Math.round(frac * 100)}.png` }); done.push(`${id}-pin${Math.round(frac * 100)}`);
          }
        }
      }
      await scrollThrough(page); await scrollTop(page); await page.waitForTimeout(1200);
      await page.screenshot({ path: `${SHOTS}/round${ROUND}-${wkey}-full.png`, fullPage: true });
      shots[wkey] = done;
      await ctx.close();
    }
    R('screens', shots);
  }

  // ---------- 1. readability ----------
  if (want('read')) {
    const out = {};
    for (const wkey of [1440, 375]) {
      const ctx = await newCtx(browser, ctxOpts(VP[wkey])); const page = await ctx.newPage();
      await page.goto(ROOT, { waitUntil: 'networkidle' }).catch(() => {}); await waitReady(page, 8000);
      await scrollThrough(page);
      const scan = await page.evaluate(readabilityProbe);
      const flags = classifyReadability(scan, wkey);
      const clips = await captureContrastClips(page, flags, wkey);
      // style inventory for designer
      const inv = {}; for (const it of scan.items) { const k = `${it.role} | ${it.family} ${it.weight}${it.style === 'italic' ? 'i' : ''} ${it.size}px ls${it.lsEm} | ${it.color} on ${it.bg}`; inv[k] = (inv[k] || 0) + 1; }
      out[wkey] = { bodyFam: scan.bodyFam, h1Fam: scan.h1Fam, fontsLoaded: scan.fontsLoaded, textNodes: scan.items.length, flags, clips, inventory: inv, minBody: Math.min(...scan.items.filter(i => i.role === 'body').map(i => i.size)), minLabel: Math.min(...scan.items.filter(i => i.role === 'label').map(i => i.size)), minDisplay: Math.min(...scan.items.filter(i => i.role === 'display').map(i => i.size)) };
      await ctx.close();
    }
    R('readability', out);
  }

  // ---------- 2. preloader ----------
  if (want('pre')) {
    const out = {};
    const runPre = async (label, url, vp, extra = {}, action) => {
      const ctx = await newCtx(browser, ctxOpts(vp, extra)); const page = await ctx.newPage();
      const errs = []; page.on('pageerror', e => errs.push(String(e)));
      await page.goto(url, { waitUntil: 'commit', timeout: 45000 });
      if (action) await action(page);
      await page.waitForTimeout(5000);
      const t = await preloaderTimeline(page); t.pageErrors = errs;
      if (label.includes('normal')) {
        await page.screenshot({ path: `${SHOTS}/round${ROUND}-preloader-after-${vp.w}.png` });
        // once per session: reload in same tab
        await page.reload({ waitUntil: 'commit' }); await page.waitForTimeout(3500);
        const t2 = await preloaderTimeline(page);
        t.reload = { firstBlockedAt: t2.firstBlockedAt, unblockedAt: t2.unblockedAt, blockedBy: t2.blockedBy, nowBlocked: t2.nowBlocked };
      }
      out[label] = t; await ctx.close();
    };
    // early frames of the preloader, for the designer
    {
      const ctx = await newCtx(browser, ctxOpts(VP[1440])); const page = await ctx.newPage();
      await page.goto(ROOT, { waitUntil: 'commit' });
      for (const ms of [300, 600, 1200]) { await page.waitForTimeout(ms === 300 ? 300 : ms === 600 ? 300 : 600); await page.screenshot({ path: `${SHOTS}/round${ROUND}-preloader-${ms}ms.png` }).catch(() => {}); }
      await ctx.close();
    }
    for (const base of [{ k: 'root', url: ROOT }, { k: 'sub', url: SUB }]) {
      await runPre(`${base.k}-1440-normal`, base.url, VP[1440]);
      await runPre(`${base.k}-375-normal`, base.url, VP[375]);
    }
    await runPre('root-1440-click-skip@400ms', ROOT, VP[1440], {}, async p => { await p.waitForTimeout(400); await p.mouse.click(720, 450).catch(() => {}); });
    await runPre('root-1440-esc-skip@400ms', ROOT, VP[1440], {}, async p => { await p.waitForTimeout(400); await p.keyboard.press('Escape').catch(() => {}); });
    await runPre('root-1440-wheel-skip@400ms', ROOT, VP[1440], {}, async p => { await p.waitForTimeout(400); await p.mouse.move(700, 400); await p.mouse.wheel(0, 200).catch(() => {}); });
    // skip link reachable during the preloader
    {
      const ctx = await newCtx(browser, ctxOpts(VP[1440])); const page = await ctx.newPage();
      await page.goto(ROOT, { waitUntil: 'commit' }); await page.waitForTimeout(450);
      await page.keyboard.press('Tab'); await page.waitForTimeout(80);
      out['skiplink-during-preloader'] = await page.evaluate(() => { const ae = document.activeElement; const r = ae && ae.getBoundingClientRect(); const hit = r && document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { t: Math.round(performance.now()), blocked: window.__qa && window.__qa.blockState(), active: ae ? `${ae.tagName} ${ae.getAttribute('href')} "${ae.textContent.trim().slice(0, 25)}"` : null, onTop: !!(hit && (hit === ae || ae.contains(hit))), hit: hit ? `${hit.tagName}.${String(hit.className).slice(0, 30)}` : null, inert: !!document.querySelector('main[inert], body[inert]') }; }).catch(e => ({ err: e.message }));
      await page.keyboard.press('Enter'); await page.waitForTimeout(2600);
      out['skiplink-during-preloader'].after = await page.evaluate(() => ({ y: Math.round(scrollY), hash: location.hash, active: document.activeElement && document.activeElement.tagName + '#' + document.activeElement.id }));
      await ctx.close();
    }
    await runPre('root-1440-reduced', ROOT, VP[1440], { reducedMotion: 'reduce' });
    await runPre('root-375-reduced', ROOT, VP[375], { reducedMotion: 'reduce' });
    await runPre('sub-1440-reduced', SUB, VP[1440], { reducedMotion: 'reduce' });
    // JS off: init scripts don't run, so inject the probe after load
    for (const vp of [VP[1440], VP[375]]) {
      const ctx = await browser.newContext(ctxOpts(vp, { javaScriptEnabled: false })); const page = await ctx.newPage();
      await page.goto(ROOT, { waitUntil: 'load' });
      await page.evaluate(READY_INIT).catch(() => {});
      const r = await page.evaluate(() => ({ blocked: window.__qa.blockState(), hero: window.__qa.heroVisible(), invisibleLoaderish: [...document.querySelectorAll('body *')].filter(e => /preload|loader|curtain|splash/i.test(String(e.className) + e.id)).map(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return `${e.tagName}.${String(e.className).slice(0, 30)} ${cs.display}/${cs.visibility}/${cs.opacity} ${Math.round(r.width)}x${Math.round(r.height)}`; }).slice(0, 5) })).catch(e => ({ err: e.message }));
      r.invisible = (await page.evaluate(invisibleProbe).catch(() => [])).length;
      r.sectionBgs = await page.evaluate(sectionBgProbe).catch(e => ({ err: e.message }));
      await page.screenshot({ path: `${SHOTS}/round${ROUND}-nojs-${vp.w}-viewport.png` });
      out[`nojs-${vp.w}`] = r; await ctx.close();
    }
    R('preloader', out);
  }

  // ---------- 3. smooth scroll: anchors, focus, pinning ----------
  if (want('scroll')) {
    const out = {};
    for (const [label, url, vp, extra] of [['root-1440', ROOT, VP[1440], {}], ['root-375', ROOT, VP[375], {}], ['sub-1440', SUB, VP[1440], {}], ['reduced-1440', ROOT, VP[1440], { reducedMotion: 'reduce' }], ['reduced-375', ROOT, VP[375], { reducedMotion: 'reduce' }]]) {
      const ctx = await newCtx(browser, ctxOpts(vp, extra)); const page = await ctx.newPage();
      const errs = []; page.on('pageerror', e => errs.push(String(e)));
      await page.goto(url, { waitUntil: 'networkidle' }).catch(() => {}); await waitReady(page, 8000);
      const r = {};
      r.anchors = await anchorClickTest(page);
      if (!label.startsWith('sub')) r.focus = await focusScrollTest(page);
      if (!label.startsWith('sub')) r.pin = await pinScan(page, label);
      if (label === 'root-1440') { r.keyboard = await keyboardScrollTest(page); r.stackCards = await stackCardsTest(page); }
      if (label === 'root-375') { r.menuLock = await menuScrollLockTest(page); r.bottomBar = await bottomBarTest(page); }
      if (label.startsWith('reduced')) { await scrollTop(page); r.sectionBgs = await page.evaluate(sectionBgProbe); r.stackCards = await stackCardsTest(page); }
      r.pageErrors = errs;
      out[label] = r; await ctx.close();
    }
    // no-pin widths / short viewport: overflow + pin behaviour only
    for (const [label, vp] of [['1024x600', { w: 1024, h: 600 }], ['1024x700', { w: 1024, h: 700 }], ['1920', { w: 1920, h: 1080 }], ['768', VP[768]], ['320', VP[320]]]) {
      const ctx = await newCtx(browser, ctxOpts(vp)); const page = await ctx.newPage();
      await page.goto(ROOT, { waitUntil: 'networkidle' }).catch(() => {}); await waitReady(page, 8000);
      out[label] = { pin: await pinScan(page, label) };
      if (label === '768') out[label].stackCards = await stackCardsTest(page);
      await ctx.close();
    }
    // load with hash
    for (const [label, vp] of [['hash-1440', VP[1440]], ['hash-375', VP[375]]]) {
      const ctx = await newCtx(browser, ctxOpts(vp)); const page = await ctx.newPage();
      const res = {};
      for (const h of ['#packages', '#work', '#contact']) {
        await page.goto('about:blank'); await page.goto(ROOT + h, { waitUntil: 'networkidle' }).catch(() => {}); await waitReady(page, 8000); await settleScroll(page, 4000); await page.waitForTimeout(800);
        res[h] = await page.evaluate(h => { const t = document.getElementById(h.slice(1)); const hdr = document.querySelector('header'); const hb = hdr ? Math.round(hdr.getBoundingClientRect().bottom) : 0; const hd = t.querySelector('h2') || t; const r = hd.getBoundingClientRect(); return { y: Math.round(scrollY), headerBottom: hb, sectionTop: Math.round(t.getBoundingClientRect().top), headingTop: Math.round(r.top), ok: r.top >= hb - 4 && r.top < innerHeight * 0.6 }; }, h);
      }
      out[label] = res; await ctx.close();
    }
    R('scroll', out);
  }

  // ---------- 4. vendor/CDN failure: abort assets/vendor/* and CDN hosts ----------
  if (want('cdn')) {
    const out = {};
    const BLOCK = /\/assets\/vendor\/|cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com/;
    for (const mode of ['abort', 'hang']) for (const wkey of [1440, 375]) {
      if (mode === 'hang' && wkey === 375) continue;
      const vp = VP[wkey];
      const ctx = await newCtx(browser, ctxOpts(vp)); const page = await ctx.newPage();
      const blocked = []; const errs = []; page.on('pageerror', e => errs.push(String(e)));
      const cons = []; page.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 120)); });
      await page.route(BLOCK, async r => { blocked.push(r.request().url().replace(/^.*\/assets\//, 'assets/')); if (mode === 'hang') { await new Promise(res => setTimeout(res, 15000)); return r.abort().catch(() => {}); } return r.abort(); });
      await page.goto(ROOT, { waitUntil: 'commit', timeout: 45000 });
      await page.waitForTimeout(mode === 'hang' ? 5000 : 4500);
      const r = { mode, blocked: [...new Set(blocked)] };
      r.timeline = await preloaderTimeline(page);
      await page.screenshot({ path: `${SHOTS}/round${ROUND}-vendorfail-${mode}-${wkey}-viewport.png` });
      if (mode === 'abort') {
        await waitReady(page, 4000);
        r.invisibleBeforeScroll = (await page.evaluate(invisibleProbe)).length;
        r.anchors = (await anchorClickTest(page)).map(a => ({ href: a.href, landed: a.landed, targetTop: a.targetTop, invisibleCount: a.invisibleCount }));
        await scrollTop(page); await scrollThrough(page);
        r.invisibleAfterScroll = await page.evaluate(invisibleProbe);
        r.overflow = (await page.evaluate(overflowProbe)).overflow;
        await scrollTop(page);
        await page.screenshot({ path: `${SHOTS}/round${ROUND}-vendorfail-${wkey}-full.png`, fullPage: true });
        r.sectionBgs = await page.evaluate(sectionBgProbe);
        if (wkey === 375) { await page.goto(ROOT, { waitUntil: 'load' }); await waitReady(page, 4000); r.mobileNav = await mobileNavTest(page); }
        else r.form = await formTest(page);
      }
      r.pageErrors = errs; r.consoleErrors = cons.slice(0, 10);
      out[`${mode}-${wkey}`] = r; await ctx.close();
    }
    R('vendorFailure', out);
  }

  // ---------- form v2 ----------
  if (want('form')) {
    const out = {};
    for (const wkey of [1440, 375]) {
      const ctx = await newCtx(browser, ctxOpts(VP[wkey])); const page = await ctx.newPage();
      const errs = []; page.on('pageerror', e => errs.push(String(e)));
      await page.goto(ROOT, { waitUntil: 'networkidle' }).catch(() => {}); await waitReady(page, 8000);
      out[wkey] = await formTestV2(page, String(wkey)); out[wkey].pageErrors = errs;
      // package CTA prefill
      await page.goto(ROOT, { waitUntil: 'networkidle' }).catch(() => {}); await waitReady(page, 8000);
      out[wkey].packagePrefill = await (async () => { const a = page.locator('#packages a[href="#contact"]').nth(1); if (!(await a.count())) return 'no package CTA'; await a.scrollIntoViewIfNeeded(); await a.click(); await page.waitForTimeout(400); await settleScroll(page, 4000); return page.evaluate(() => { const t = document.querySelector('#contact textarea'); return { textarea: t ? t.value.slice(0, 80) : null, contactTop: Math.round(document.getElementById('contact').getBoundingClientRect().top), formTop: Math.round(document.querySelector('#contact form').getBoundingClientRect().top) }; }); })();
      await ctx.close();
    }
    R('formV2', out);
  }

  // ---------- 5. performance ----------
  if (want('perf')) {
    R('perf', [await perfRun(browser, ROOT, VP[1440], 1), await perfRun(browser, ROOT, VP[375], 4)]);
  }

  await browser.close();
  fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
  console.log('Wrote', OUT);
})().catch(e => { console.error('HARNESS ERROR', e); fs.writeFileSync(OUT, JSON.stringify(results, null, 2)); process.exit(1); });
