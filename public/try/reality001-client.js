/* FRIDAY13-REALITY-001A — real, server-emitted, source-bound X-Ray.
 * Never retries with synthetic events; never makes supplier/payment requests.
 */
(()=>{
'use strict';
let controller=null,runNumber=0,selected=null,observations=[];
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
function mount(){
 const xr=$('.xray-panel');if(!xr||$('#realityObservations'))return;
 xr.insertAdjacentHTML('afterbegin',`<section id="realityObservations" class="reality-slice" aria-label="Verified server tool X-Ray">
  <div class="reality-label">LIVE SERVER TOOLS · SOURCE-BOUND</div>
  <h4>Verified Part X-Ray</h4>
  <p class="reality-help">Actions actually executed on this server run. No model thoughts, no real supplier requests or purchases.</p>
  <div class="reality-buttons"><button class="primary" type="button" id="realityRun">Run engineering checks</button><span id="realityStatus" class="reality-status" role="status">Not run yet</span></div>
  <div id="realityCurrentPart" class="reality-part"></div><div id="realityEventList" class="reality-list" aria-live="polite"></div>
  <div class="reality-boundary">Original CAD: engineering <b>Z</b> · procurement <b>BLOCKED</b> until independent admission. Demo quotations below remain synthetic.</div>
 </section>`);
 $('#realityRun').addEventListener('click',()=>run());
 currentPart();
}
function currentPart(){return $('.part-item.selected')?.dataset.part || selected ||'01_RAIL_BRACKET';}
function status(s,kind=''){const el=$('#realityStatus');if(el){el.textContent=s;el.dataset.kind=kind;}}
function view(){
 const el=$('#realityEventList');if(!el)return;
 el.innerHTML=observations.map(e=>{
  const o=e.result||{};const info=Object.entries(o).map(([k,v])=>`${esc(k)}: ${esc(Array.isArray(v)?v.join(', '):typeof v==='object'?JSON.stringify(v):v)}`).join(' · ');
  return `<article class="reality-event"><div><span class="reality-num">#${e.seq}</span> <strong>${esc(e.agent)}</strong> <time>${esc(e.observed_at)}</time></div><div class="reality-action">${esc(e.action.replaceAll('_',' '))} · <code>${esc(e.tool)}</code></div><p>${info}</p><div class="reality-proof">Evidence: source blob ${esc(e.evidence?.git_blob?.slice(0,12))}… · SHA chain ${esc(e.event_hash.slice(0,16))}… · ${esc(e.decision)}</div></article>`;
 }).join('')||'<div class="reality-empty">No verified server observations.</div>';
}
async function sha256(text){const data=new TextEncoder().encode(text);const h=await crypto.subtle.digest('SHA-256',data);return Array.from(new Uint8Array(h),x=>x.toString(16).padStart(2,'0')).join('');}
// A run owns its own identity, hash position and verified records. Never let a
// late digest, network chunk or cancellation mutate another part's X-Ray.
const live=ctx=>ctx.id===runNumber&&!ctx.signal.aborted;
async function verifyRecord(rec,ctx){
 if(!live(ctx))return false;
 if(rec?.schema!=='legion.part-observation.v1'||rec.seq!==ctx.events.length+1||rec.part_id!==ctx.part||rec.previous_hash!==ctx.previous)return false;
 if(rec.evidence?.scope!=='CASE_A'||rec.evidence?.git_blob!=='65aaf62745ca436c06d7ec35e32586095c9f9da6')return false;
 if(!['DENY','NO_RFQ_SENT','NO_ENGINEERING_PERMIT','NEEDS_INDEPENDENT_REVIEW','READ_ONLY_OBSERVATION','SOURCE_BOUND','ASK_BUYER_NO_EFFECT','OBSERVATION_COMPLETE_NOT_PURCHASE'].includes(rec.decision))return false;
 const {event_hash,...fields}=rec;
 const digest=await sha256(JSON.stringify(fields));
 if(!live(ctx)||digest!==event_hash)return false;
 ctx.previous=event_hash;
 return true;
}
async function run(){
 mount();
 const part=currentPart(),id=++runNumber;
 // In-flight old runs are cancelled. Completed runs release their controller
 // in finally, so switching parts cannot abort an already verified response.
 if(controller)controller.abort();
 const ownController=new AbortController();controller=ownController;
 const ctx={id,part,signal:ownController.signal,events:[],previous:'0'.repeat(64)};
 selected=part;observations=ctx.events;view();
 $('#realityCurrentPart').textContent=`Checking ${part} · read-only`;
 status('Opening server tool stream…');
 try{
  const res=await fetch('/api/part-observe?part='+encodeURIComponent(part),{method:'GET',headers:{accept:'application/x-ndjson'},cache:'no-store',signal:ownController.signal});
  if(!live(ctx))return;
  if(!res.ok){let reason=res.status;try{reason=(await res.json()).code||reason;}catch{}throw Error('NO_GO: '+reason);}
  if(res.headers.get('x-legion-mode')!=='SERVER_SOURCE_BOUND_OBSERVATION'||res.headers.get('x-legion-financial-effects')!=='0')throw Error('NO_GO: runtime identity missing');
  if(!res.body)throw Error('NO_GO: missing event stream');
  const reader=res.body.getReader();const decoder=new TextDecoder();let buffer='';let done=false;
  while(!done){
   const block=await reader.read();if(!live(ctx))return;
   done=block.done;buffer+=decoder.decode(block.value||new Uint8Array(),{stream:!done});
   while(buffer.includes('\n')){
    const at=buffer.indexOf('\n');const line=buffer.slice(0,at);buffer=buffer.slice(at+1);if(!line.trim())continue;
    const event=JSON.parse(line);const verified=await verifyRecord(event,ctx);
    if(!live(ctx))return;
    if(!verified)throw Error('NO_GO: invalid observation chain');
    ctx.events.push(event);observations=ctx.events;
    status(`${ctx.events.length} server events · verified`,'running');view();
   }
  }
  if(!live(ctx))return;
  if(buffer.trim())throw Error('NO_GO: incomplete NDJSON frame');
  const last=ctx.events.at(-1);
  if(ctx.events.length!==8||last?.decision!=='OBSERVATION_COMPLETE_NOT_PURCHASE'||last?.result?.procurement!=='BLOCKED'||last?.result?.new_captures!==0)throw Error('NO_GO: incomplete engineering closure');
  status('PASS · 8/8 hash-linked events · purchasing blocked','good');
 }catch(e){
  if(!live(ctx))return; // Only superseded/user-aborted requests are expected cancellations.
  observations=[];view();const msg=String(e?.message||e);status((msg.startsWith('NO_GO:')?msg:'NO_GO: '+msg).slice(0,140),'error');
 }finally{
  // This is a conditional release: an older run may not clear a new run's
  // controller after its delayed WebCrypto/reader task completes.
  if(controller===ownController)controller=null;
 }
}
function observer(){
 mount();const chosen=currentPart();if(selected===null&&$('.part-item.selected')){selected=chosen;run();}
}
document.addEventListener('click',e=>{const part=e.target.closest('[data-part]');if(part){const id=part.dataset.part;queueMicrotask(()=>{mount();if(id!==selected)run();});}});
const changes=new MutationObserver(()=>{if(!$('#realityObservations')||selected===null)observer();});
changes.observe(document.documentElement,{childList:true,subtree:true});observer();
})();
