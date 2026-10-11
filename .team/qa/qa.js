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
  await page.waitForLoadState('networkidle');
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

(async () => {
  const browser = await launch();

  // ---------- main desktop/tablet/mobile passes on ROOT and SUB ----------
  const vps = [
    { name: 'desktop', w: 1440, h: 900 },
    { name: 'tablet', w: 768, h: 1024 },
    { name: 'mobile', w: 375, h: 812, mobile: true },
  ];
  for (const base of [{ k: 'root', url: ROOT }, { k: 'sub', url: SUB }]) {
    for (const vp of vps) {
      if (base.k === 'sub' && vp.name === 'tablet') continue;
      const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: !!vp.mobile, hasTouch: !!vp.mobile, deviceScaleFactor: 1 });
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
        await page.goto(base.url, { waitUntil: 'networkidle' });
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
      const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, isMobile: w < 400, hasTouch: w < 400 });
      const page = await ctx.newPage();
      await page.goto(ROOT, { waitUntil: 'networkidle' }); await scrollThrough(page);
      ex[w] = await page.evaluate(overflowProbe);
      ex[w].invisible = (await page.evaluate(invisibleProbe)).length;
      if (w === 320) await page.screenshot({ path: `${SHOTS}/round${ROUND}-320-full.png`, fullPage: true });
      await ctx.close();
    }
    R('extraWidths', ex);
  }

  // ---------- anchor jumps: content in view must be visible ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const out = {};
    const ids = await (async () => { await page.goto(ROOT, { waitUntil: 'networkidle' }); return page.evaluate(() => [...document.querySelectorAll('main section[id], footer[id]')].map(s => s.id)); })();
    for (const id of ids) {
      await page.goto(ROOT + '#' + id, { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
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
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
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

  await browser.close();
  fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
  console.log('Wrote', OUT);
})().catch(e => { console.error('HARNESS ERROR', e); fs.writeFileSync(OUT, JSON.stringify(results, null, 2)); process.exit(1); });
