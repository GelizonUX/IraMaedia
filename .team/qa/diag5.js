const { chromium } = require('/opt/node-tools/node_modules/playwright');
const S='/home/user/IraMaedia/.team/shots/';
(async()=>{const b=await chromium.launch();
let c=await b.newContext({viewport:{width:1440,height:900}});let p=await c.newPage();
for(const id of ['services','contact']){await p.goto('http://localhost:8080/#'+id,{waitUntil:'networkidle'});
 for(const t of [1500,4000]){await p.waitForTimeout(t===1500?1500:2500);
 console.log(id,t,await p.evaluate(()=>{const o=[];for(const el of document.querySelectorAll('main *')){const r=el.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight||!r.width)continue;if(![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim().length>1))continue;let op=1,n=el;while(n&&n.nodeType===1){op*=+getComputedStyle(n).opacity;n=n.parentElement}if(op<0.9)o.push(el.className+' op='+op.toFixed(2)+' y='+Math.round(r.top)+'/'+innerHeight)}return o}));}}
// hero above fold
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'});await p.waitForTimeout(2500);
console.log('hero likes', await p.evaluate(()=>[...document.querySelectorAll('.hero .post-foot, .hero .likes')].map(e=>Math.round(e.getBoundingClientRect().bottom))));
await p.screenshot({path:S+'round2-desktop-viewport.png'});
// contrast spot checks
console.log(await p.evaluate(()=>[...document.querySelectorAll('.svc__num,.eyebrow,.num,.pkg__from')].slice(0,40).map(e=>e.className.split(' ')[0]+':'+getComputedStyle(e).color).filter((v,i,a)=>a.indexOf(v)===i)));
// sticky contact
await p.evaluate(()=>document.querySelector('#contact').scrollIntoView());await p.waitForTimeout(1500);await p.mouse.wheel(0,500);await p.waitForTimeout(1500);
await p.screenshot({path:S+'round2-desktop-contact.png'});
await p.evaluate(()=>{const n=document.querySelector('#about');window.scrollTo({top:n.offsetTop+200,behavior:'instant'})});await p.waitForTimeout(1500);
await p.screenshot({path:S+'round2-desktop-at-about.png',clip:{x:0,y:0,width:1440,height:200}});
await c.close();
for(const w of [320,375]){c=await b.newContext({viewport:{width:w,height:740},isMobile:true,hasTouch:true});p=await c.newPage();
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'});await p.waitForTimeout(2500);
console.log(w,'eyebrow',await p.evaluate(()=>{const e=document.querySelector('.hero .eyebrow');const r=e.getBoundingClientRect();return [e.textContent.trim(),Math.round(r.height),getComputedStyle(e).lineHeight, Math.round(r.right)]}));
console.log(w,'title lines left',await p.evaluate(()=>[...document.querySelectorAll('.hero__title .line')].map(l=>Math.round(l.getBoundingClientRect().left)+':'+l.textContent.trim())));
await p.screenshot({path:S+`round2-${w}-viewport.png`});
await p.evaluate(()=>document.querySelector('#work').scrollIntoView());await p.waitForTimeout(1200);
console.log(w,'chips',await p.evaluate(()=>{const ch=document.querySelector('.chip').parentElement;const cs=getComputedStyle(ch);return {ox:cs.overflowX,sw:ch.scrollWidth,cw:ch.clientWidth,tops:[...ch.children].map(x=>Math.round(x.getBoundingClientRect().top)),doc:document.documentElement.scrollWidth}}));
const last=p.locator('.chip').last();await last.click();await p.waitForTimeout(1000);
console.log(w,'after filter click visible items',await p.evaluate(()=>[...document.querySelectorAll('.work-item')].filter(i=>!i.hidden&&!i.classList.contains('is-filtered-out')).length, ), 'doc sw', await p.evaluate(()=>document.documentElement.scrollWidth));
await p.screenshot({path:S+`round2-${w}-work.png`});
await c.close();}
await b.close();})();
