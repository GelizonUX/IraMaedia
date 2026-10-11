const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch();
for (const [w,h,n] of [[1440,900,'desktop'],[375,812,'mobile']]){
const c=await b.newContext({viewport:{width:w,height:h},isMobile:w<400});const p=await c.newPage();
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'});await p.waitForTimeout(1500);
for (const sel of ['#about','#process','#faq']){await p.evaluate(s=>document.querySelector(s).scrollIntoView(),sel);await p.waitForTimeout(1800);
await p.screenshot({path:`/home/user/IraMaedia/.team/shots/round1-${n}-at-${sel.slice(1)}.png`});
console.log(n,sel,await p.evaluate(()=>{const s=[...document.querySelectorAll('a')].find(a=>/skip/i.test(a.textContent));const r=s.getBoundingClientRect();const hd=document.querySelector('header');const hc=getComputedStyle(hd);return {skip:[Math.round(r.top),Math.round(r.bottom)],hdrBg:hc.backgroundColor,hdrBf:hc.backdropFilter,hdrCls:hd.className}}));}
await c.close();}
await b.close();})();
