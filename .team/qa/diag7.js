const { chromium } = require('/opt/node-tools/node_modules/playwright');
const SH='/home/user/IraMaedia/.team/shots';
(async () => {
  const b = await chromium.launch();
  for (const [w,h] of [[1440,900],[1024,700]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
  await p.goto('http://localhost:8080/', { waitUntil: 'networkidle' }); await p.waitForTimeout(3000);
  const t = await p.evaluate(()=>{ const s=ScrollTrigger.getAll().find(t=>t.pin); return {start:s.start,end:s.end}; });
  for (const f of [0.02, 0.5, 0.98]) {
    const y = Math.round(t.start + (t.end - t.start) * f);
    await p.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}), y); await p.waitForTimeout(2000);
    const vis = await p.evaluate(()=>[...document.querySelectorAll('.work__item, .work__list > li')].map((e,i)=>{const r=e.getBoundingClientRect(); return r.right>0&&r.left<innerWidth?i:null}).filter(x=>x!==null));
    console.log(w, f, 'visible items', vis.join(','));
    await p.screenshot({ path: `${SH}/round3-${w}-work-pin${Math.round(f*100)}.png` });
  }
  // keyboard
  await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'})); await p.waitForTimeout(500);
  await p.evaluate(() => { document.body.setAttribute('tabindex','-1'); document.body.focus({preventScroll:true}); document.body.removeAttribute('tabindex'); });
  const y0=await p.evaluate(()=>scrollY); await p.keyboard.press('PageDown'); await p.waitForTimeout(1500); console.log('pagedown', y0, await p.evaluate(()=>scrollY));
  // tab into work items
  const res=[];
  await p.evaluate(()=>window.scrollTo({top:document.getElementById('work').getBoundingClientRect().top+scrollY-200,behavior:'instant'})); await p.waitForTimeout(800);
  for (let i=0;i<20;i++){ await p.keyboard.press('Tab'); await p.waitForTimeout(900); const r=await p.evaluate(()=>{const e=document.activeElement; const b=e.getBoundingClientRect(); return e.closest('#work')? `${e.tagName}.${String(e.className).slice(0,15)} x=${Math.round(b.left)} w=${Math.round(b.width)} y=${Math.round(b.top)}`:null}); if(r) res.push(r); }
  console.log('tab in work', res);
  }
  await b.close();
})();
