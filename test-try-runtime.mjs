/* JSDOM-free executable runtime test of the actual try.js rendering and interactions.
 * Not a browser acceptance test; page layout and network are outside scope. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const d=JSON.parse(fs.readFileSync(new URL('./public/try/evidence.json',import.meta.url),'utf8'));
const src=fs.readFileSync(new URL('./public/try/try.js',import.meta.url),'utf8');
class Elt {
  constructor(dataset={}){this.dataset=dataset;this.innerHTML='';this.textContent='';this.hidden=false;this.handlers={};this.attributes={};this.value='';this.classList={toggle(){},add(){}};}
  addEventListener(name,fn){this.handlers[name]=fn;}
  setAttribute(k,v){this.attributes[k]=v;}
  scrollIntoView(){}
  click(){this.handlers.click?.();}
  change(){this.handlers.change?.();}
}
const root=new Map([['#stageContent',new Elt()],['#loadError',new Elt()],['#sourceStamp',new Elt()],['.steps',new Elt()]]);
const nav=Array.from({length:5},(_,i)=>new Elt({stage:String(i)}));
let controls={};
const doc={
 querySelector:(s)=>{
  if(root.has(s))return root.get(s);
  if(s==='#vectorSelect'||s==='#minusBuyer'||s==='#plusBuyer')return controls[s]||(controls[s]=new Elt());
  return null;
 },
 querySelectorAll:(s)=>{
  if(s==='[data-stage]')return nav;
  if(s==='[data-offer]')return [48000,54000,49500].map(x=>controls['o'+x]||(controls['o'+x]=new Elt({offer:String(x)})));
  return [];
 }
};
const location={hash:''};
const context={document:doc,location,fetch:async()=>({ok:true,json:async()=>d}),console,Number,Math,Intl,Array,String,Object,Set,Error};
vm.runInNewContext(src,context,{filename:'try.js'});
await new Promise(r=>setTimeout(r,0));
let n=0;
function check(name,fn){fn();n++;console.log('PASS '+name)}
const html=()=>root.get('#stageContent').innerHTML;
check('runtime loads evidence and renders drawing',()=>{assert.match(html(),/Drawing → source-bound/);assert.match(html(),/CASE A/)});
check('real drawing is explicitly pinned',()=>assert.match(html(),/reBot_B601_DM_v1\.1_20260625\.step/));
nav[1].click();
check('clicking stage 2 renders 40 vectors',()=>{assert.match(html(),/40 structured purchasing vectors/);assert.equal((html().match(/<option /g)||[]).length,40)});
check('default vector has real original source material',()=>assert.match(html(),/Aluminum Alloy 5052/));
controls['#vectorSelect'].value='01_BASE_PLATE';controls['#vectorSelect'].change();
check('vector choice changes content without altering admission',()=>{assert.match(html(),/01_BASE_PLATE/);assert.match(html(),/Not stated/);assert.match(html(),/engineering admission/i)});
nav[2].click();
check('real procurement has blocked gate',()=>assert.match(html(),/Procurement BLOCKED/));
check('synthetic mechanism starts 100 MOQ',()=>assert.match(html(),/100 <span/));
controls['#minusBuyer'].click();
check('removing buyer reduces synthetic units to 80',()=>{assert.match(html(),/80 <span/);assert.match(html(),/MOQ NOT MET/) });
controls['#plusBuyer'].click();
check('rejoining restores synthetic MOQ',()=>assert.match(html(),/MOQ MET/));
nav[3].click();
check('recorded $540 offer is rejected',()=>{assert.match(html(),/REJECTED/);assert.match(html(),/\$108\.00/) });
controls.o49500.click();
check('selecting signed offer shows $99 per buyer',()=>{assert.match(html(),/SIGNED/);assert.match(html(),/\$99\.00/) });
nav[4].click();
check('five capture rows from recorded sandbox',()=>{assert.equal((html().match(/READBACK CONFIRMED/g)||[]).length,5);assert.match(html(),/\$495\.00/) });
check('live PayPal cannot be triggered',()=>assert.match(html(),/Live checkout disabled/));
check('CASE A remains separate',()=>assert.match(html(),/No Case B capture can authorize Case A/));
check('snapshot stamp includes source revision',()=>assert.match(root.get('#sourceStamp').textContent,/2cc7dbdc2b/));
check('no runtime evidence error',()=>assert.equal(root.get('#loadError').textContent,''));
console.log('PASS '+n+'/'+n+' rendered runtime interaction checks (VM, not Chromium)');
