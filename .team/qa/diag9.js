// Round 4 targeted re-verification: #14 counters, #15 footer clicks, #16 deep links, #19 back-to-top, #20 see-more, #22 bar, #23 double submit
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const B = 'http://localhost:8080/';
const ctxs = { d: { viewport: { width: 1440, height: 900 } }, m: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true }, r: { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' } };
const settle = p => p.waitForTimeout(2500);
(async () => {
  const b = await chromium.launch();
  const page = async (k, url = B) => { const c = await b.newContext(ctxs[k]); const p = await c.newPage(); p.on('pageerror', e => console.log('  PAGEERR', k, String(e))); await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(2600); return p; };
  const counts = p => p.evaluate(() => [...document.querySelectorAll('#packages .count')].map(e => e.textContent.trim()).join(','));
  // #14
  for (const [k, how] of [['d', 'navclick'], ['d', 'instant'], ['d', 'deeplink'], ['m', 'wheel'], ['m', 'instant'], ['r', 'navclick'], ['d', 'wheel']]) {
    const p = await page(k, how === 'deeplink' ? B + '#packages' : B);
    if (how === 'navclick') await p.locator('header a[href="#packages"]').first().click();
    if (how === 'instant') await p.evaluate(() => scrollTo({ top: document.getElementById('packages').offsetTop, behavior: 'instant' }));
    if (how === 'wheel') { await p.mouse.move(200, 400); for (let i = 0; i < 200; i++) { await p.mouse.wheel(0, 250); await p.waitForTimeout(50); if (await p.evaluate(() => document.getElementById('packages').getBoundingClientRect().top < 150)) break; } }
    const early = await counts(p); await p.waitForTimeout(3000);
    console.log('#14', k, how, 'early', early, '| after3s', await counts(p));
    await p.context().close();
  }
  // #15 footer clicks
  for (const k of ['d', 'r']) for (const id of ['services', 'process', 'packages', 'faq']) {
    const p = await page(k); await p.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })); await settle(p);
    const a = p.locator(`footer .footer__links a[href="#${id}"]`).first();
    let ok; try { await a.click({ timeout: 3000 }); await p.waitForTimeout(2000); ok = await p.evaluate(i => ({ hash: location.hash, top: Math.round(document.getElementById(i).getBoundingClientRect().top) }), id); } catch (e) { ok = 'CLICK FAIL ' + e.message.split('\n')[0]; }
    console.log('#15', k, id, JSON.stringify(ok)); await p.context().close();
  }
  // #16 deep links
  for (const k of ['d', 'm']) for (const h of ['#faq', '#contact', '#process', '#packages', '#work']) {
    const c = await b.newContext(ctxs[k]); const p = await c.newPage(); await p.goto(B + h, { waitUntil: 'networkidle' }); await p.waitForTimeout(4000);
    console.log('#16', k, h, await p.evaluate(h => ({ y: Math.round(scrollY), top: Math.round(document.querySelector(h).getBoundingClientRect().top) }), h)); await c.close();
  }
  // #19 back to top
  for (const k of ['d', 'm']) {
    const p = await page(k); await p.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })); await settle(p);
    await p.locator('[data-top]').click(); await p.waitForTimeout(2500);
    console.log('#19', k, await p.evaluate(() => ({ y: Math.round(scrollY), hash: location.hash, active: document.activeElement && (document.activeElement.tagName + '#' + document.activeElement.id + '.' + document.activeElement.className).slice(0, 60) })));
    await p.context().close();
  }
  // #20 see more on Instagram focus
  { const p = await page('d'); const a = p.locator('#work a[href*="instagram"]').first();
    if (await a.count()) { await a.focus(); await p.waitForTimeout(2500); console.log('#20', await a.evaluate(e => { const r = e.getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width), t: Math.round(r.top), vw: innerWidth, txt: e.textContent.trim() }; })); } else console.log('#20 no link');
    await p.screenshot({ path: '/home/user/IraMaedia/.team/shots/round4-1440-work-seemore-focus.png' }); await p.context().close(); }
  // #22 bar with field centred
  { const p = await page('m'); await p.evaluate(() => { const f = document.getElementById('f-name'); scrollTo({ top: f.getBoundingClientRect().top + scrollY - innerHeight / 2, behavior: 'instant' }); }); await p.waitForTimeout(1500);
    console.log('#22', await p.evaluate(() => { const bb = document.querySelector('.bbar'); const c = document.getElementById('contact').getBoundingClientRect(); return { bar: bb.className, op: getComputedStyle(bb).opacity, contactVisPx: Math.round(Math.min(innerHeight, c.bottom) - Math.max(0, c.top)) }; }));
    await p.screenshot({ path: '/home/user/IraMaedia/.team/shots/round4-375-form-centred-bar.png' }); await p.context().close(); }
  // #23 double submit
  { const c = await b.newContext(ctxs.d); const p = await c.newPage(); await p.goto(B, { waitUntil: 'networkidle' }); await p.waitForTimeout(2600);
    await p.evaluate(() => { window.__nav = 0; const o = window.open; window.open = (...a) => { window.__nav++; return null; }; const d = Object.getOwnPropertyDescriptor(Location.prototype, 'href'); });
    let mailtos = 0; p.on('request', r => { if (r.url().startsWith('mailto')) mailtos++; }); p.on('framenavigated', f => {}); 
    await p.evaluate(() => document.getElementById('contact').scrollIntoView());
    await p.fill('#f-name', 'QA'); await p.fill('input[name=email]', 'qa@example.com'); await p.fill('textarea[name=message]', 'double submit test');
    const sub = p.locator('#contact form [type=submit]');
    await p.evaluate(() => { window.__submits = 0; document.querySelector('#contact form').addEventListener('submit', () => window.__submits++, true); });
    const counter = await p.evaluate(() => { window.__mt = 0; const orig = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (this.href.startsWith('mailto')) window.__mt++; else orig.call(this); }; return true; });
    await sub.click(); await sub.click({ force: true }).catch(() => {}); await p.waitForTimeout(100);
    console.log('#23', await p.evaluate(() => { const s = document.querySelector('#contact form [type=submit]'); return { submits: window.__submits, anchorMailto: window.__mt, opens: window.__nav, busy: s && s.getAttribute('aria-busy'), formBusy: document.querySelector('#contact form').getAttribute('aria-busy'), disabled: s && s.disabled, ariaDisabled: s && s.getAttribute('aria-disabled') }; }), 'mailto requests', mailtos);
    await c.close(); }
  await b.close();
})();
