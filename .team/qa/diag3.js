const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch();
const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();
await p.goto('http://localhost:8080/',{waitUntil:'networkidle'});
await p.focus('#f-name');
for(let i=0;i<12;i++){const f=await p.evaluate(()=>{const e=document.activeElement;const t=e.type==='checkbox'?e.closest('label')||e.parentElement:e;const cs=getComputedStyle(e);const ls=getComputedStyle(t);return `${e.tagName}[${e.type}] ${e.name}=${e.value} self:${cs.outlineStyle} ${cs.outlineWidth} ${cs.opacity} vis:${e.getBoundingClientRect().width}x${e.getBoundingClientRect().height} label:${ls.outlineStyle} ${ls.boxShadow.slice(0,40)}`});console.log(f);
 if(i===4){await p.screenshot({path:'/home/user/IraMaedia/.team/shots/round1-focus-chip.png',clip:{x:600,y:300,width:840,height:500}}).catch(()=>{});}
 await p.keyboard.press('Tab');}
// valid submit
await p.fill('#f-name','QA');await p.fill('input[name=email]','qa@example.com');await p.fill('textarea','hello there testing');
await p.keyboard.press('Space').catch(()=>{});
await p.click('#contact-form button[type=submit], #contact-form button:not([type])');await p.waitForTimeout(1500);
console.log('after valid', await p.evaluate(()=>{const f=document.querySelector('#contact-form');return [...f.querySelectorAll('[role=status],[aria-live],.form__note,.form-note,.form__success')].map(e=>e.className+': '+e.textContent.trim()).join(' | ')+' || '+(document.querySelector('[aria-live]')||{}).textContent}));
await p.locator('#contact-form').screenshot({path:'/home/user/IraMaedia/.team/shots/round1-form-after-submit.png'});
// empty-submit error screenshot
await p.reload({waitUntil:'networkidle'});await p.locator('#contact-form').scrollIntoViewIfNeeded();await p.waitForTimeout(1200);
await p.click('#contact-form button[type=submit], #contact-form button:not([type])');await p.waitForTimeout(800);
console.log('focused after empty', await p.evaluate(()=>document.activeElement.id), await p.evaluate(()=>[...document.querySelectorAll('[id$=-err]')].map(e=>e.id+':'+e.textContent+':'+getComputedStyle(e).color)));
await p.locator('#contact-form').screenshot({path:'/home/user/IraMaedia/.team/shots/round1-form-errors.png'});
// mobile menu focus trap
const m=await b.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true});const q=await m.newPage();
await q.goto('http://localhost:8080/',{waitUntil:'networkidle'});
const t=q.locator('header button[aria-expanded]').first();await t.focus();await q.keyboard.press('Enter');await q.waitForTimeout(800);
const seq=[];for(let i=0;i<14;i++){await q.keyboard.press('Tab');seq.push(await q.evaluate(()=>{const e=document.activeElement;return (e.textContent.trim()||e.getAttribute('aria-label')).slice(0,18)}));}
console.log('menu trap',seq.join(' > '));
await q.keyboard.press('Escape');await q.waitForTimeout(500);console.log('focus after esc',await q.evaluate(()=>document.activeElement.getAttribute('aria-label')));
await b.close();})();
