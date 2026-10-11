// Round 5: stacking-card dim levels + solid scrolled nav / corner bleed
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const S = '/home/user/IraMaedia/.team/shots';
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await c.newPage();
  await p.goto('http://localhost:8080/', { waitUntil: 'networkidle' }); await p.waitForTimeout(2600);
  const svc = await p.evaluate(() => { const s = document.getElementById('services'); return { top: s.getBoundingClientRect().top + scrollY, h: s.offsetHeight }; });
  let i = 0;
  for (const f of [0.35, 0.6]) {
    const y = Math.round(svc.top + svc.h * f);
    await p.mouse.move(700, 450);
    await p.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), y); await p.waitForTimeout(1500);
    const info = await p.evaluate(() => [...document.querySelectorAll('#services .card')].map((c, k) => { const r = c.getBoundingClientRect(); const sh = c.querySelector('.card__shade'); return { k, cls: c.className.replace('card ', ''), top: Math.round(r.top), shade: sh ? getComputedStyle(sh).opacity : null, shadeBg: sh ? getComputedStyle(sh).backgroundColor : null, bg: getComputedStyle(c).backgroundColor, shadow: getComputedStyle(c).boxShadow.slice(0, 60) }; }).filter(x => x.top < innerHeight && x.top > -2000));
    const file = `${S}/round5-1440-services-mid${++i}.png`; await p.screenshot({ path: file });
    console.log('CARDS', f, JSON.stringify(info));
    console.log('FILE', file, 'tops', info.map(x => x.top).join(','));
  }
  for (const id of ['process', 'packages']) {
    await p.locator(`header a[href="#${id}"]`).first().click(); await p.waitForTimeout(2500);
    console.log('NAV', id, await p.evaluate(() => { const n = document.querySelector('.nav'); const be = getComputedStyle(n, '::before'); return { bg: be.backgroundColor, bf: be.backdropFilter, h: n.getBoundingClientRect().height }; }));
    await p.screenshot({ path: `${S}/round5-1440-${id}.png` });
    await p.screenshot({ path: `${S}/round5-1440-${id}-navcorner.png`, clip: { x: 1240, y: 0, width: 200, height: 110 } });
  }
  await b.close();
})();
