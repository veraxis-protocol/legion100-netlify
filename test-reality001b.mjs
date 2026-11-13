/* WO-FRIDAY13-REALITY-001B — deterministic client lifecycle regression.
 * Tests unmodified browser client in VM with real Node WebCrypto SHA-256.
 * Mock transport/events only: NOT evidence of a live supplier or Netlify deploy.
 * Run with REALITY001B_BASELINE_SOURCE=/path/to/old/client.js to reproduce RED.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash, webcrypto} from 'node:crypto';
import vm from 'node:vm';
import {collectPart, PINNED} from './netlify/lib/part-observe-core.mjs';

const source=readFileSync(process.env.REALITY001B_BASELINE_SOURCE||new URL('./public/try/reality001-client.js',import.meta.url),'utf8');
const bytes=readFileSync(new URL('./public/try/evidence.json',import.meta.url));
const evidence=JSON.parse(bytes.toString('utf8'));
assert.equal(evidence.case_a.vectors.length,40);
const validated={evidence,gitBlob:PINNED.gitBlob,sha256:createHash('sha256').update(bytes).digest('hex'),byteLength:bytes.length};
const parts=evidence.case_a.vectors.map(v=>v.part_id);
const fixtures=new Map();
for(const part of parts){
 const events=await collectPart(validated,part,{runId:'synthetic-client-test',clock:()=> '2026-11-13T17:00:00.000Z'});
 fixtures.set(part,events.map(e=>JSON.stringify(e)).join('\n')+'\n');
}
function element(){return {innerHTML:'',textContent:'',dataset:{},handlers:{},addEventListener(kind,fn){this.handlers[kind]=fn;}};}
const els=Object.fromEntries(['#realityObservations','#realityRun','#realityStatus','#realityCurrentPart','#realityEventList','.xray-panel'].map(s=>[s,element()]));
let mounted=false,selectedPart=parts[0],clickHandler=null,pending=false,corrupt=false,unexpectedAbort=false;
const traffic={GET:0,POST:0,lateAbort:0,activeAbort:0,unknown:0};
els['.xray-panel'].insertAdjacentHTML=()=>{mounted=true;};
const document={
 querySelector(selector){
  if(selector==='#realityObservations')return mounted?els[selector]:null;
  if(selector==='.part-item.selected')return {dataset:{part:selectedPart}};
  return els[selector]||null;
 },
 addEventListener(kind,fn){if(kind==='click')clickHandler=fn;},
 documentElement:{}
};
const fakeFetch=async (url,opt={})=>{
 if(opt.method!=='GET'||!String(url).startsWith('/api/part-observe?part=')){traffic.unknown++;throw Error('external or consequential request forbidden');}
 traffic.GET++;
 if(unexpectedAbort)throw new DOMException('Unexpected transport disconnect','AbortError');
 const part=decodeURIComponent(String(url).split('part=')[1]);
 const signal=opt.signal;
 if(signal?.aborted)throw new DOMException('Aborted','AbortError');
 if(pending){
  await new Promise((resolve,reject)=>{
   let settled=false;
   const timer=setTimeout(()=>{settled=true;resolve();},14);
   signal.addEventListener('abort',()=>{if(!settled){clearTimeout(timer);traffic.activeAbort++;reject(new DOMException('Aborted','AbortError'));}},{once:true});
  });
 }
 if(signal?.aborted)throw new DOMException('Aborted','AbortError');
 let ndjson=fixtures.get(part);
 if(!ndjson)throw Error('No QA part '+part);
 if(corrupt){const list=ndjson.trim().split('\n');const e=JSON.parse(list[3]);e.result.missing_count=999;list[3]=JSON.stringify(e);ndjson=list.join('\n')+'\n';}
 let alreadyComplete=false;
 signal.addEventListener('abort',()=>{if(alreadyComplete)traffic.lateAbort++;else traffic.activeAbort++;},{once:true});
 // This stream is already complete before being read. Aborting it later
 // proves a lifecycle defect, not an actual transport failure.
 const response=new Response(ndjson,{status:200,headers:{'content-type':'application/x-ndjson','x-legion-mode':'SERVER_SOURCE_BOUND_OBSERVATION','x-legion-financial-effects':'0'}});
 alreadyComplete=true;
 return response;
};
const context={document,MutationObserver:class{observe(){}},fetch:fakeFetch,crypto:webcrypto,TextEncoder,TextDecoder,AbortController,Uint8Array,console,queueMicrotask,DOMException};
vm.runInNewContext(source,context,{filename:'reality001-client.js',timeout:15000});
assert.ok(clickHandler,'client click handler not registered');
function clickPart(id){selectedPart=id;clickHandler({target:{closest(s){return s==='[data-part]'?{dataset:{part:id}}:null;}}});}
const wait=async(condition,label,timeout=5000)=>{
 const start=Date.now();while(!condition()){
  if(Date.now()-start>timeout)throw Error(label+': timeout, status='+els['#realityStatus'].textContent);
  await new Promise(r=>setTimeout(r,2));
 }
};
const status=()=>els['#realityStatus'].textContent;
const shown=()=>els['#realityCurrentPart'].textContent;
const count=()=> (els['#realityEventList'].innerHTML.match(/<article class="reality-event"/g)||[]).length;
const results=[];
async function test(name,fn){try{await fn();results.push({name,result:'PASS'});console.log('PASS',name);}catch(e){results.push({name,result:'FAIL',error:String(e)});console.error('FAIL',name,e.message);}}

await test('initial stream with 8 native-SHA-verified events',async()=>{
 await wait(()=>status().includes('PASS'),'initial');
 assert.equal(count(),8);assert.ok(shown().includes(parts[0]));
});
await test('100 sequential part switches cause zero post-completion aborts',async()=>{
 for(let i=0;i<100;i++){
  const part=parts[(i*7+1)%parts.length];clickPart(part);
  await wait(()=>status().includes('PASS')&&shown().includes(part),'switch '+i);
  assert.equal(count(),8,'events for '+part);
 }
 assert.equal(traffic.lateAbort,0,'post-completion aborts after successful PASS');
 assert.equal(traffic.GET,101,'initial GET plus 100 switches');
});
await test('50 overlapping switches cancel only active runs; final part wins',async()=>{
 pending=true;
 for(let i=0;i<50;i++){
  clickPart(parts[(i*3)%parts.length]);
  await new Promise(r=>setTimeout(r,1));
 }
 const final='02_GEAR_CONNECTOR';clickPart(final);
 await wait(()=>status().includes('PASS')&&shown().includes(final),'overlap final');
 assert.equal(count(),8);assert.ok(traffic.activeAbort>0,'overlapping streams should be cancellable');
 assert.equal(traffic.lateAbort,0,'no abort after PASS');
 pending=false;
});
await test('tampered event fails closed and displays no events',async()=>{
 corrupt=true;
 els['#realityRun'].handlers.click();
 await wait(()=>status().includes('NO_GO'),'tampered');
 assert.equal(count(),0);
 assert.equal(els['#realityStatus'].dataset.kind,'error');
 corrupt=false;
});
await test('unexpected active AbortError fails closed instead of being ignored',async()=>{
 unexpectedAbort=true;
 els['#realityRun'].handlers.click();
 await wait(()=>status().includes('NO_GO: Unexpected transport disconnect'),'unexpected transport abort');
 assert.equal(count(),0);assert.equal(els['#realityStatus'].dataset.kind,'error');
 unexpectedAbort=false;
});
await test('single-origin read-only HTTP and zero financial effects',async()=>{
 assert.equal(traffic.POST,0);assert.equal(traffic.unknown,0);
 assert.ok(traffic.GET>=152);
});
console.log('REALITY001B',results.filter(x=>x.result==='PASS').length,'/',results.length,'PASS',JSON.stringify(traffic));
if(results.some(x=>x.result==='FAIL'))process.exitCode=1;
