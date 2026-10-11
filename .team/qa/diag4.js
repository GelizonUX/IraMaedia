const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch();
const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();
await p.goto('http://localhost:8080/#contact',{waitUntil:'networkidle'});await p.waitForTimeout(2500);
await p.focus('input[name=brand]');await p.keyboard.press('Tab');await p.keyboard.press('Tab');await p.waitForTimeout(400);
const fs=await p.evaluate(()=>{const e=document.activeElement;const l=e.closest('label')||e.nextElementSibling;const s=e.nextElementSibling;const cs=s?getComputedStyle(s):null;return {val:e.value,sib:s&&s.className,outline:cs&&cs.outline,shadow:cs&&cs.boxShadow}});console.log(fs);
const box=await p.locator('input[name=needs]').first().evaluate(e=>{const r=e.closest('fieldset,.chips,div').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}});
await p.screenshot({path:'/home/user/IraMaedia/.team/shots/round1-focus-chip.png',clip:{x:box.x-10,y:box.y-10,width:box.w+20,height:box.h+20}});
await b.close();})();
