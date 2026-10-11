const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const [label, opts] of [['1440-wheel',{ viewport:{width:1440,height:900}}], ['375',{viewport:{width:375,height:812},isMobile:true,hasTouch:true}], ['1440-instant',{ viewport:{width:1440,height:900}}], ['1440-anchor',{ viewport:{width:1440,height:900}}], ['reduced',{viewport:{width:1440,height:900},reducedMotion:'reduce'}]]) {
    const p = await (await b.newContext(opts)).newPage();
    await p.goto('http://localhost:8080/', { waitUntil: 'networkidle' }); await p.waitForTimeout(2800);
    const read = () => p.evaluate(()=>[...document.querySelectorAll('#packages [data-count], #packages .pkg__row dd, #packages dd')].slice(0,8).map(e=>e.textContent.trim()+(e.dataset.count?'('+e.dataset.count+')':'')).join(' | '));
    if (label==='1440-wheel' || label==='375') { await p.mouse.move(300,300); for (let i=0;i<120;i++){ await p.mouse.wheel(0,300); await p.waitForTimeout(60); const t=await p.evaluate(()=>document.getElementById('packages').getBoundingClientRect().top); if (t<200) break; } }
    else if (label==='1440-anchor') { await p.locator('header a[href="#packages"]').first().click(); }
    else { await p.evaluate(()=>window.scrollTo({top:document.getElementById('packages').getBoundingClientRect().top+scrollY,behavior:'instant'})); }
    await p.waitForTimeout(3000);
    console.log(label, await read());
    console.log('  html', await p.evaluate(()=>document.getElementById('packages').querySelector('[data-count]')?.outerHTML.slice(0,200)));
  }
  await b.close();
})();
