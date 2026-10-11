const { chromium } = require('/opt/node-tools/node_modules/playwright');
const SH='/home/user/IraMaedia/.team/shots';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto('http://localhost:8080/', { waitUntil: 'networkidle' }); await p.waitForTimeout(3000);
  // 1 keyboard
  const y=()=>p.evaluate(()=>Math.round(scrollY));
  await p.mouse.click(700, 300); const a=await y(); await p.keyboard.press('PageDown'); await p.waitForTimeout(1500); const b1=await y();
  await p.keyboard.press('ArrowDown'); await p.waitForTimeout(800); const c=await y();
  await p.keyboard.press('Space'); await p.waitForTimeout(1500); const d=await y();
  console.log('keyboard after click body', a,b1,c,d, await p.evaluate(()=>document.activeElement.tagName+'.'+document.activeElement.className));
  // 2 footer svg over links
  await p.evaluate(()=>window.scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(1500);
  const f = await p.evaluate(()=>{ const out=[]; for (const a of document.querySelectorAll('footer a')) { const r=a.getBoundingClientRect(); const h=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2); const cs=h&&getComputedStyle(h.closest('svg')||h); out.push(`${a.textContent.trim().slice(0,20)} hit=${h&&h.tagName}.${h&&String(h.className.baseVal??h.className).slice(0,20)} pe=${cs&&cs.pointerEvents}`);} return out; });
  console.log('footer', f);
  // try clicking footer Services link
  const before = await y();
  await p.locator('footer a[href="#services"]').first().click({ timeout: 3000 }).then(()=>console.log('click ok')).catch(e=>console.log('click fail', e.message.split('\n')[0]));
  await p.waitForTimeout(2000); console.log('after footer click y', before, '->', await y(), await p.evaluate(()=>location.hash));
  await p.screenshot({ path: SH + '/round3-diag-footer.png' });
  // 3 pin jump: scroll near pin start and end, sample work section top position frame by frame
  await p.goto('http://localhost:8080/', { waitUntil: 'networkidle' }); await p.waitForTimeout(3000);
  const st = await p.evaluate(()=>{ const s=window.ScrollTrigger&&ScrollTrigger.getAll().filter(t=>t.pin); return s.map(t=>({start:Math.round(t.start), end:Math.round(t.end), pin:t.pin.className})); });
  console.log('pins', JSON.stringify(st));
  for (const t of st) for (const at of [t.start-3, t.start+3, t.end-3, t.end+3]) {
    await p.evaluate(y=>{ window.lenis ? window.lenis.scrollTo(y,{immediate:true}) : scrollTo(0,y); }, at); await p.waitForTimeout(700);
    const r = await p.evaluate(()=>{ const w=document.getElementById('work'); const h=w.querySelector('h2'); const pin=document.querySelector('.work__pin'); return { y:Math.round(scrollY), workTop:Math.round(w.getBoundingClientRect().top), pinTop:Math.round(pin.getBoundingClientRect().top), pinPos:getComputedStyle(pin).position, pinTransform:getComputedStyle(pin).transform.slice(0,40), h2Top:Math.round(h.getBoundingClientRect().top), h2Left:Math.round(h.getBoundingClientRect().left)}; });
    console.log('at', at, JSON.stringify(r));
    await p.screenshot({ path: `${SH}/round3-diag-pin-${at}.png` });
  }
  // 4 direct hash load timings
  for (const h of ['#work','#contact','#faq']) {
    const q = await ctx.newPage(); await q.goto('http://localhost:8080/'+h, { waitUntil:'networkidle' });
    const samples=[]; for (let i=0;i<8;i++){ await q.waitForTimeout(500); samples.push(await q.evaluate(h=>{const t=document.getElementById(h.slice(1));return Math.round(scrollY)+':'+Math.round(t.getBoundingClientRect().top)},h)); }
    console.log('hashload', h, samples.join(' '), await q.evaluate(()=>document.documentElement.className));
    await q.close();
  }
  await b.close();
})();
