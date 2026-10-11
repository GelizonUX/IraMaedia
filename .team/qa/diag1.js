const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async()=>{
const b=await chromium.launch();
const probe=()=>{const o=[];for(const el of document.querySelectorAll('main *, footer *')){const t=[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim().length>1);if(!t)continue;if(el.closest('[aria-hidden=true],[hidden]'))continue;const r=el.getBoundingClientRect();if(!r.width)continue;let op=1,n=el;while(n&&n.nodeType===1){op*=+getComputedStyle(n).opacity;n=n.parentElement}if(op<0.9)o.push(el.className+':'+el.textContent.trim().slice(0,25)+':'+op.toFixed(2)+':x'+Math.round(r.left))}return o};
async function slow(p){await p.evaluate(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=300){scrollTo(0,y);await new Promise(r=>setTimeout(r,150))}})}
// desktop settle
let c=await b.newContext({viewport:{width:1440,height:900}});let p=await c.newPage();
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'});await slow(p);await p.waitForTimeout(3000);
console.log('DESKTOP settled',await p.evaluate(probe));
// anchor jumps
for(const id of ['services','contact','faq']){await p.goto('http://localhost:8080/#'+id,{waitUntil:'networkidle'});await p.waitForTimeout(3500);
 console.log('JUMP',id,await p.evaluate(()=>{const o=[];for(const el of document.querySelectorAll('main *')){const r=el.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight||!r.width)continue;if(![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim().length>1))continue;let op=1,n=el;while(n&&n.nodeType===1){op*=+getComputedStyle(n).opacity;n=n.parentElement}if(op<0.9)o.push(el.className+':'+el.textContent.trim().slice(0,25)+':'+op.toFixed(2)+':y'+Math.round(r.top)+'-'+Math.round(r.bottom))}return o}));
 await p.screenshot({path:`/home/user/IraMaedia/.team/shots/round1-jump-${id}.png`});}
await c.close();
// mobile work
c=await b.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true});p=await c.newPage();
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'});await slow(p);await p.waitForTimeout(2500);
console.log('MOBILE settled',await p.evaluate(probe));
const info=await p.evaluate(()=>{const g=document.querySelector('.work__grid');const cs=getComputedStyle(g);return {ox:cs.overflowX,sw:g.scrollWidth,cw:g.clientWidth,snap:cs.scrollSnapType}});console.log('grid',info);
await p.locator('#work').scrollIntoViewIfNeeded();
await p.evaluate(async()=>{const g=document.querySelector('.work__grid');for(let x=0;x<=g.scrollWidth;x+=150){g.scrollLeft=x;await new Promise(r=>setTimeout(r,150))}});await p.waitForTimeout(1500);
console.log('MOBILE after swipe',await p.evaluate(probe));
await p.evaluate(()=>document.querySelector('.work__grid').scrollLeft=0);
await p.evaluate(()=>document.querySelector('#work').scrollIntoView());await p.waitForTimeout(800);
await p.screenshot({path:'/home/user/IraMaedia/.team/shots/round1-mobile-work.png'});
await c.close();
// reduced motion: jump to bottom, then scroll up slowly
c=await b.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});p=await c.newPage();
await p.goto('http://localhost:8080/#contact',{waitUntil:'networkidle'});await p.waitForTimeout(1000);
await slow(p);await p.waitForTimeout(800);console.log('RM after slow scroll',(await p.evaluate(probe)).length);
await c.close();await b.close();})();
