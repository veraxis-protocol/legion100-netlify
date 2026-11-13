/* WO-TRY-LIVE-005 — event-driven LIVE LOCAL CHECK + VERIFIED REPLAY.
 * Client performs deterministic checks over immutable pinned evidence. A formal
 * engine is NOT executing here; Formal Core/ZTL verdicts are recorded readback.
 * Supplier network is NOT connected; supplier cards are synthetic route slots.
 * No POST, provider requests, supplier contact or financial effects.
 */
(()=>{
'use strict';
const EV='./evidence.json';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cash=x=>'$'+(Number(x)/100).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const label=id=>String(id??'').replace(/^\d+_/,'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const badge=(t,kind='neutral')=>`<span class="live-pill ${kind}">${esc(t)}</span>`;
const button=(name,t,opt='')=>`<button class="live-btn ${opt}" type="button" data-action="${esc(name)}" ${opt.includes('disabled-button')?'disabled':''}>${esc(t)}</button>`;
const ok=(e)=>e?.schema==='legion.try.evidence.v1'&&e.source?.commit==='2cc7dbdc2b305d92b4fd64614c74bc56b16c4cfe'&&
 e.case_a?.engineering_admission==='Z'&&e.case_a?.procurement==='BLOCKED'&&e.case_a?.new_paypal_captures===0&&e.case_a?.vectors?.length===40&&
 e.case_a.vectors.every(v=>v.engineering_verdict==='Z'&&Array.isArray(v.missing)&&v.source_geometry_sha256===e.source.cad_sha256)&&
 e.case_b?.new_provider_posts===0&&e.case_b?.readback_confirmed===true&&e.case_b?.captures?.length===5&&new Set(e.case_b.captures).size===5&&
 e.case_b?.payPal_test_cents===49500&&e.case_b?.judge_checks_passed===63&&e.case_b?.judge_checks_total===63&&
 JSON.stringify(e.case_b?.offers?.map(o=>o.total_cents))===JSON.stringify([48000,54000,49500])&&
 e.coalition_fixture?.units_each===20&&e.coalition_fixture?.moq===100&&e.coalition_fixture?.all_in_cents!==49500;
const steps=['Check drawing','Review parts','Find suppliers','Group order','Payment'];
const state={e:null,stage:0,unlocked:0,run:0,scanIndex:0,scanning:false,paused:false,scanTimer:null,checks:[],events:[],activePart:0,
 proposedQty:20,budget:100,draft:new Set(),material:'',process:'',buyers:1,routeScanIndex:0,routesCompleted:false,routeRunning:false,routeTimer:null,
 negotiationIndex:0,negotiationRunning:false,negotiationTimer:null,receiptIndex:0,receiptRunning:false,receiptTimer:null,selectedReceipt:0,inspector:false,
 handoffAccepted:false,activeSupplier:0};
function log(scope,event,detail,kind='info'){
 state.events.push({seq:state.events.length+1,at:Date.now(),scope,event,detail,kind});
 if(state.events.length>180)state.events.shift();
}
function sourceLink(text,url){return /^https:\/\/github\.com\//.test(url||'')?`<a target="_blank" rel="noopener noreferrer" href="${esc(url)}">${esc(text)} ↗</a>`:'';}
function stageMeta(){return state.stage<=1?'REAL DRAWING · PREVIOUSLY ANALYZED':state.stage===2?'SOURCING OPTIONS · NOT CONNECTED':state.stage===3?'EXAMPLE GROUP ORDER · SEPARATE SCENARIO':'RECORDED PAYPAL SANDBOX EXAMPLE';}
function stateTag(){return state.stage===0&&state.scanning?'CHECKING SAVED PART DATA':state.stage===2&&state.routeRunning?'CHECKING CONNECTION READINESS':'RECORDED EXAMPLE / SAVED RESULT';}
function passCheckpoint(v){
 const m=v.missing||[];
 return {
  part_id:v.part_id,
  checks:[
   {name:'Part found in drawing',state:'T',note:'Matched to the saved list of 40 parts.'},
   {name:'Part size & geometry',state:Array.isArray(v.geometry_bbox_mm)&&v.geometry_bbox_mm.length===3?'T':'Z',note:'Dimensions from the saved CAD analysis; no fresh 3D computation.'},
   {name:'Material & manufacturing method',state:v.material&&v.process?'T':'Z',note:'As extracted from the drawing. Manufacturer support is not yet known.'},
   {name:'Missing manufacturing details',state:m.length?'Z':'T',note:m.length?m.join(', '):'No absent fields in source vector.'},
   {name:'Engineering approval',state:'Z',note:'Engineering approval is still unknown in the recorded result; no new formal approval runs here.'},
   {name:'Contact manufacturers',state:'BLOCKED',note:'Order on hold. No manufacturer has been contacted.'}
  ], verdict:'Z',missing:m.length
 };
}
function clearTimers(){for(const key of ['scanTimer','routeTimer','negotiationTimer','receiptTimer']){if(state[key])clearTimeout(state[key]);state[key]=null;}state.scanning=false;state.routeRunning=false;state.negotiationRunning=false;state.receiptRunning=false;}
function startScan(reset=false){
 if(reset){clearTimers();state.scanIndex=0;state.checks=[];state.events=[];state.run++;state.paused=false;state.unlocked=0;state.stage=0;state.activePart=0;}
 if(state.scanning||state.scanIndex===40)return;
 state.scanning=true;state.paused=false;log('CASE A','SOURCE_LOADED','Pinned reBot STEP extraction; 40 BOM positions, 326 part instances. Browser recomputation of metadata only.');
 function next(){if(!state.scanning)return;
  if(state.scanIndex>=40){state.scanning=false;state.scanTimer=null;log('CASE A','ENGINEERING_LOCAL_CHECK_COMPLETE','40/40 vectors checked; ZTL engineering admission remains Z; procurement blocked.','warning');render();return;}
  const i=state.scanIndex;const v=state.e.case_a.vectors[i];const check=passCheckpoint(v);
  state.checks.push(check);state.activePart=i;state.scanIndex=i+1;
  log('CASE A',`CHECKPOINT_${String(i+1).padStart(2,'0')}`,`${v.part_id}: geometry ${check.checks[1].state}; missing requirements ${check.missing}; formal verdict ${check.verdict}`,'check');
  render();state.scanTimer=setTimeout(next,105);
 }
 next();
}
function pauseScan(){if(!state.scanning)return;state.scanning=false;state.paused=true;clearTimeout(state.scanTimer);log('CASE A','LOCAL_CHECK_PAUSED',`${state.scanIndex}/40 inspected.`);render();}
function navigate(i){if(i<0||i>4||i>state.unlocked)return;clearTimers();state.stage=i;render();window.scrollTo?.({top:0,behavior:'instant'});}
function progress(pct){return `<div class="live-meter" role="progressbar" aria-label="Execution progress" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div>`;}
function illustration(){return `<svg class="live-arm" viewBox="0 0 480 270" role="img" aria-label="Illustrative robotic arm assembly, not source STEP rendering"><defs><linearGradient id="paint" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#a9cffd"/><stop offset="1" stop-color="#e9f3ff"/></linearGradient></defs><g opacity=".33" stroke="#a9c9ef" stroke-width="1">${Array.from({length:11},(_,i)=>`<path d="M0 ${i*26}h480M${i*48} 0v270"/>`).join('')}</g><g stroke="#2563a5" stroke-width="3" fill="url(#paint)" transform="translate(70 12)"><path d="M20 230h168v16H20z"/><path d="M80 230v-48h47v48z"/><circle cx="104" cy="181" r="30" fill="#fff"/><path d="M114 163 214 51l30 28-98 109z"/><circle cx="228" cy="62" r="24" fill="#fff"/><path d="M245 61 309 115l-22 25-60-57z"/><circle cx="298" cy="129" r="22" fill="#fff"/><path d="M312 128l40 21-9 17-42-19z"/></g><g font-family="ui-monospace,monospace" font-size="13" fill="#285687"><text x="16" y="22">reBot B601-DM</text><text x="336" y="255">CAD PREVIEW</text></g></svg>`;}
function section(n,title,description){return `<div class="live-heading"><div class="live-overline">STEP ${n} OF 5 · ${esc(stageMeta())}</div><h2>${esc(title)}</h2><p>${esc(description)}</p></div>`;}
function engineering(){
 const a=state.e.case_a,v=a.vectors[state.activePart]||a.vectors[0],check=state.checks[state.activePart];
 const cards=a.vectors.map((x,i)=>{const done=i<state.scanIndex;return `<button type="button" data-part-index="${i}" class="scan-row ${state.activePart===i?'selected':''}"><span class="scan-index">${String(i+1).padStart(2,'0')}</span><span class="scan-name">${esc(label(x.part_id))}</span>${badge(done?'NEEDS INFO':i===state.scanIndex&&state.scanning?'CHECKING':'WAITING',done?'warn':'neutral')}</button>`;}).join('');
 return section(1,'Watch LEGION check 40 parts','Your drawing is preloaded. Watch each component move through its manufacturing checklist, then inspect what needs attention.')+
 `<div class="product-onboard"><div><span class="product-eyebrow">YOUR FIRST TASK · NO UPLOAD NEEDED</span><strong>Try an engineering review without uploading anything.</strong><p>Your reBot CAD has already been analyzed. Tap a part to see what LEGION checks before buying.</p></div><ol><li><b>1</b> Identify parts</li><li><b>2</b> Check manufacturing requirements</li><li><b>3</b> Explain what prevents an order</li></ol></div>`+
 `<div class="live-summary"><div><span class="live-eyebrow">DRAWING RECEIVED · reBot STEP</span><strong>40 parts recognized</strong><small>40 matched BOM positions · 326 assembly instances</small></div>${badge(state.scanning?'CHECKING SAVED PARTS':state.scanIndex===40?'ALL 40 CHECKED':'PAUSED / READY',state.scanning?'running':'warn')}</div>`+
 `<div class="live-double"><div class="live-hero-diagram">${illustration()}<p>Illustrative drawing preview. This screen uses saved reBot CAD data, not a new file upload or new geometry extraction.</p><div class="live-progress-caption"><strong>${state.scanIndex}<span>/40</span></strong><span>Parts checked against saved requirements</span></div>${progress(Math.round(state.scanIndex/40*100))}<div class="live-inline-actions">${button('restart-scan','Run checks again','secondary-button')}${state.scanning?button('pause-scan','Pause checks','secondary-button'):state.scanIndex<40?button('resume-scan','Resume checks','secondary-button'):''}</div></div>`+
 `<div class="live-part-pane"><div class="live-pane-title"><strong>YOUR PARTS · LIVE PROGRESS</strong><span>${state.scanning?'● Executing local checks':'Recorded evidence · Z gate'}</span></div><div class="scan-list" aria-label="40 source components">${cards}</div></div></div>`+
 `<div class="live-checkpoint"><div class="live-pane-title"><strong>MANUFACTURING CHECKLIST · ${esc(label(v.part_id))}</strong>${badge(check?'SOURCE-BOUND':'NOT YET CHECKED',check?'good':'neutral')}</div>${checkpointHTML(v,check)}</div>`+
 `<div class="live-next">${button('to-vectors','Review your parts →',state.scanIndex===40?'primary-button':'primary-button disabled-button')}<span>${state.scanIndex===40?'40 parts checked. Missing specifications need attention before buying.':'Your results will unlock the parts list.'}</span></div>`;
}
function checkpointHTML(v,check){
 const rows=check?.checks||passCheckpoint(v).checks;
 return `<div class="live-checkpoint-grid">${rows.map((c,i)=>`<div class="live-ck"><span class="live-ck-symbol ${c.state==='T'?'good':c.state==='Z'?'unknown':'blocked'}">${c.state==='T'?'✓':c.state==='Z'?'?':'×'}</span><span><strong>${esc(c.name)}</strong><small>${esc(c.note)}</small></span>${badge(check?(c.state==='T'?'CHECKED':c.state==='Z'?'NEEDS INFO':'ON HOLD'):'UP NEXT',c.state==='T'?'good':c.state==='BLOCKED'?'bad':'warn')}</div>`).join('')}</div>`;
}
function vectors(){const a=state.e.case_a,v=a.vectors[state.activePart],check=passCheckpoint(v),missing=v.missing;
 return section(2,'Review the parts you want to make','Choose a part, review its material and dimensions, then add the missing instructions that a manufacturer would need.')+
 `<div class="live-vector-card"><div class="live-object-head"><div><span>PART FROM YOUR DRAWING</span><h3>${esc(label(v.part_id))}</h3></div>${badge('DETAILS NEEDED','warn')}</div><div class="live-attributes"><div><small>Part number</small><strong>${esc(v.part_id)}</strong></div><div><small>BOM quantity</small><strong>${v.qty} unit(s)</strong></div><div><small>Material (source)</small><strong>${esc(v.material)}</strong></div><div><small>Process (source)</small><strong>${esc(v.process)}</strong></div><div><small>Bounding box (mm)</small><strong>${esc(v.geometry_bbox_mm.join(' × '))}</strong></div><div><small>Order readiness</small>${badge('NEEDS REVIEW','warn')}</div></div></div>`+
 `<div class="live-control-line"><label>Switch to another part<select id="part-select">${a.vectors.map((x,i)=>`<option value="${i}" ${i===state.activePart?'selected':''}>${esc(label(x.part_id))}</option>`).join('')}</select></label><label>Desired quantity<input data-field="qty" type="number" min="1" max="1000" value="${state.proposedQty}"></label><label>Budget / buyer ($)<input data-field="budget" type="number" min="1" max="100000" value="${state.budget}"></label></div>`+
 `<div class="live-grid-title">INFORMATION THE MANUFACTURER STILL NEEDS <small>tap to mark an item as drafted, not approved</small></div><div class="live-gap-grid">${missing.map(x=>`<button class="live-gap ${state.draft.has(x)?'draft':''}" type="button" data-gap="${esc(x)}"><span>${state.draft.has(x)?'✓':'+'}</span><strong>${esc(label(x))}</strong><small>${state.draft.has(x)?'DRAFT · NOT CONFIRMED':'NOT IN ORIGINAL DRAWING'}</small></button>`).join('')}</div>`+
 `<div class="live-notice warn"><strong>Your original drawing remains unchanged.</strong> Drafting ${state.draft.size}/${missing.length} details does not replace engineering sign-off. Manufacturer contact remains on hold.</div>`+
 `<div class="live-next">${button('to-suppliers','See manufacturing options →')}<span>Find out which manufacturers LEGION could compare once your specifications are approved.</span></div>`;
}
const routes=[
 {logo:'xometry',name:'Xometry',kind:'NOT CONNECTED',desc:'Manufacturing platform · illustrative discovery source only.'},
 {logo:'protolabs',name:'Protolabs',kind:'NOT CONNECTED',desc:'Digital manufacturing platform · illustrative discovery source only.'},
 {logo:'fictiv',name:'Fictiv',kind:'NOT CONNECTED',desc:'Manufacturing marketplace · illustrative discovery source only.'},
 {logo:'mfg',name:'MFG',kind:'NOT CONNECTED',desc:'Manufacturer discovery directory · illustrative discovery source only.'},
 {logo:'craftcloud',name:'Craftcloud',kind:'NOT CONNECTED',desc:'3D printing comparison platform · illustrative discovery source only.'},
 {logo:'sculpteo',name:'Sculpteo',kind:'NOT CONNECTED',desc:'3D printing service platform · illustrative discovery source only.'}
];
function supplierState(i){return state.routeScanIndex<=i?'NOT YET CHECKED':'NO VERIFIED CONNECTION';}
function suppliers(){const a=state.e.case_a,selected=routes[state.activeSupplier]||routes[0];
 return section(3,'Find the right manufacturer','LEGION would compare manufacturing options, check requirements and request quotes after approval. Here you can inspect the sourcing workflow safely.')+
 `<div class="supplier-guard"><div><small>YOUR DRAWING · MANUFACTURING REVIEW</small><h3>Manufacturer contact is on hold</h3><p>This reBot drawing still needs tolerances and torque details. LEGION will not send an unapproved part to a manufacturer.</p></div>${badge('ORDER ON HOLD','bad')}</div>`+
 `<div class="supplier-directory-note"><b>Explore six familiar manufacturing platforms</b><span>Illustrative discovery sources — not LEGION partners, connected accounts, suppliers that answered us, or live quotes.</span></div>`+
 `<div class="supplier-board product-supplier-board">${routes.map((r,i)=>`<button type="button" class="supplier-card supplier-choice ${state.activeSupplier===i?'is-selected':''}" data-supplier-index="${i}" aria-pressed="${state.activeSupplier===i}"><img class="supplier-wordmark" src="./brands/${r.logo}.svg" alt="${esc(r.name)}" width="182" height="58" loading="eager"><span class="supplier-kind">Manufacturing directory example</span><span class="supplier-line"><span>Connection</span>${badge('NOT CONNECTED','warn')}</span><span class="supplier-line"><span>Agent check</span>${badge(supplierState(i),state.routeScanIndex>i?'warn':'neutral')}</span><span class="supplier-line"><span>Quote</span><b>NOT REQUESTED</b></span></button>`).join('')}</div>`+
 `<div class="supplier-inspector"><div><span class="live-eyebrow">SELECTED MANUFACTURING PLATFORM</span><h3>${esc(selected.name)}</h3><p>${esc(selected.desc)} LEGION has not queried this platform. Compatibility, MOQ, lead time and price remain unknown.</p></div><div>${badge('NO PROVIDER RESPONSE','warn')}</div></div>`+
 `<div class="live-inline-actions">${button('scan-routes',state.routesCompleted?'Check connections again':'Check connection readiness',state.routesCompleted?'secondary-button':'primary-button')}${badge(state.routeRunning?'CHECKING LOCALLY':state.routesCompleted?'6/6 CHECKED · NOT CONNECTED':'NOT CHECKED','neutral')}</div>`+
 `<div class="live-handoff"><span class="live-eyebrow">TRY THE GROUP-ORDER CAPABILITY · SEPARATE EXAMPLE</span><h3>What if the factory requires 100 units, but you need only 20?</h3><p>This real CAD order cannot proceed without engineering sign-off. Next you can explore an independent example of how LEGION combines small orders to reach a factory minimum.</p>${button('to-deal','Try a 20-unit group order →','primary-button')}</div>`;
}
function runRoutes(){if(state.routeRunning)return;state.routeScanIndex=0;state.routesCompleted=false;state.routeRunning=true;log('CASE A','SUPPLIER_ROUTE_PREFLIGHT','Local connector/authority check; zero supplier calls.', 'warning');
 const tick=()=>{if(!state.routeRunning)return;if(state.routeScanIndex>=routes.length){state.routeRunning=false;state.routesCompleted=true;log('CASE A','SUPPLIER_PRECHECK_FINISHED','6/6 example platforms have no verified connector; this CAD order remains on hold.','warning');render();return;}
 const i=state.routeScanIndex++;log('CASE A','ROUTE_'+(i+1),'Engineering sign-off missing; '+routes[i].name+' was NOT contacted.','check');render();state.routeTimer=setTimeout(tick,270);};tick();}

function deal(){const f=state.e.coalition_fixture,b=state.e.case_b,unit=state.buyers*f.units_each,met=unit>=f.moq;
 const displayed=state.negotiationIndex;
 return section(4,'Make a small order possible','You need 20 units. The example factory requires 100. Add buyers to reach the minimum, then watch the separate recorded price negotiation.')+
 `<div class="live-fixture"><div><span class="live-eyebrow">EXAMPLE GROUP ORDER · NO NEW BUYERS CONTACTED</span><h3>${unit}<small> / ${f.moq} units</small></h3>${progress(Math.min(100,unit))}<div class="buyer-tiles">${Array.from({length:5},(_,i)=>`<span class="buyer-tile ${i<state.buyers?'joined':''}"><b>${i<state.buyers?'✓':'+'}</b> Buyer ${i+1}<small>20 units</small></span>`).join('')}</div></div><div><div class="live-status-big">${badge(met?'FACTORY MINIMUM MET':'NEED MORE BUYERS',met?'good':'warn')}</div><p>Buyers joined: ${state.buyers}/5. Factory MOQ: 100. These are not confirmed new buyers or live supplier matches.</p>${button('add-buyer',met?'5 buyers matched in example':'Find another buyer →',met?'secondary-button':'primary-button')}</div></div>`+
 `<div class="live-evidence-bridge"><strong>SEPARATE RECORDED DEAL · NOT THE reBot PURCHASE</strong><p>The offer history below is from another recorded demonstration contract with seven signers. It is not a quote for your reBot drawing.</p></div>`+
 `<div class="live-grid-title">REVIEW THE PRICE CHANGES ${badge(displayed?displayed+'/3 REPLAYED':'NOT STARTED',displayed?'good':'neutral')}</div>`+
 `<div class="deal-timeline">${b.offers.map((o,i)=>`<div class="deal-event ${i<displayed?'shown':''}"><span class="deal-number">${i+1}</span><div><small>RECORDED CONTRACT v${o.version}</small><strong>${cash(o.total_cents)} <span>${cash(o.total_cents/5)} / buyer</span></strong><p>${i===0?'Invalidated by recorded price shock.':i===1?'Rejected by five buyers: $108 exceeds the $100 cap.':'Seven parties signed $495: $99 per buyer.'}</p></div>${badge(i<displayed?i===2?'SIGNED':i===1?'REJECTED':'INVALIDATED':'PENDING',i===2&&i<displayed?'good':i<displayed?'bad':'neutral')}</div>`).join('')}</div>`+
 `<div class="live-next">${button('play-negotiation',state.negotiationRunning?'Replaying…':displayed===3?'Replay price path':'Watch the price negotiation → $540 → $495',met?'primary-button':'disabled-button')}<span>${!met?'Complete the MOQ fixture first.':displayed===3?'Recorded 63/63 Judge checks; test-money evidence ready.':'Recorded price path with no new negotiation calls.'}</span>${displayed===3?button('to-paypal','See how the five buyers paid →','primary-button'):''}</div>`;
}
function playNegotiation(){if(state.negotiationRunning||state.buyers<5)return;state.negotiationIndex=0;state.negotiationRunning=true;
 log('CASE B','NEGOTIATION_REPLAY_START','Historical event playback; no provider calls.');
 const tick=()=>{if(!state.negotiationRunning)return;if(state.negotiationIndex>=3){state.negotiationRunning=false;log('CASE B','RECORDED_CONTRACT_ACCEPTED','v3 signed by seven parties: $495, five buyers × $99; Judge 63/63.','recorded');render();return;}
 const o=state.e.case_b.offers[state.negotiationIndex++];log('CASE B','CONTRACT_V'+o.version,o.outcome+': '+cash(o.total_cents),'recorded');render();state.negotiationTimer=setTimeout(tick,1100);};tick();}
function paypal(){const b=state.e.case_b;
 return section(5,'See how each buyer paid','Five $99 payments were confirmed in the recorded PayPal Sandbox example. Choose a buyer to inspect the saved payment confirmation.')+
 `<div class="live-payment-head"><div><span class="live-eyebrow">PAYPAL SANDBOX · RECORDED EXAMPLE</span><h3>${cash(b.payPal_test_cents)}</h3><p>Five test payments of $99 each. These are existing Sandbox confirmations—not real charges or a new checkout.</p></div>${badge('5/5 RECORDED','good')}</div>`+
 `<div class="live-grid-title">PAYMENT CONFIRMATIONS ${badge(state.receiptIndex+'/5 REVEALED',state.receiptIndex===5?'good':'neutral')}</div>`+
 `<div class="receipt-board">${b.captures.map((id,i)=>`<button class="receipt-card ${i===state.selectedReceipt?'selected':''}" type="button" data-receipt="${i}"><small>BUYER ${i+1} · SANDBOX</small><strong>$99.00</strong><span>${i<state.receiptIndex?'✓ READBACK CONFIRMED':'○ NOT YET REPLAYED'}</span><code>${esc(id)}</code></button>`).join('')}</div>`+
 `<div class="live-receipt-detail"><span class="live-eyebrow">PAYMENT DETAILS</span><strong>Buyer ${state.selectedReceipt+1}: ${esc(b.captures[state.selectedReceipt])}</strong><p>Captured $99.00 in recorded Sandbox Case B · contract ${esc(b.contract_hash.slice(0,20))}…</p>${sourceLink('Inspect original evidence',b.source)}</div>`+
 `<div class="live-next">${button('play-receipts',state.receiptRunning?'Replaying…':'Show all five confirmations','primary-button')}${button('restart','Try LEGION again','secondary-button')}<span>New provider POSTs = 0 · Real reBot captures = 0</span></div>`;
}
function playReceipts(){if(state.receiptRunning)return;state.receiptIndex=0;state.receiptRunning=true;
 log('CASE B','PAYPAL_READBACK_REPLAY_START','Display-only historical receipts, no network calls.','recorded');
 const tick=()=>{if(!state.receiptRunning)return;if(state.receiptIndex>=5){state.receiptRunning=false;log('CASE B','READBACK_REPLAY_COMPLETE','Five previously recorded Sandbox receipts displayed. New financial effects: zero.','recorded');render();return;}
 const i=state.receiptIndex++;state.selectedReceipt=i;log('CASE B','RECEIPT_'+(i+1),`Recorded capture ${state.e.case_b.captures[i]}, $99.00 Sandbox readback.`, 'recorded');render();state.receiptTimer=setTimeout(tick,420);};tick();}
const views=[engineering,vectors,suppliers,deal,paypal];
function rail(){const real=state.stage<=2;const v=state.e.case_a.vectors[state.activePart]||state.e.case_a.vectors[0];
 return `<div class="rail-surface"><span class="rail-title">${real?'YOUR DRAWING':'YOUR EXAMPLE ORDER'}</span><h3>${real?'reBot B601-DM':state.stage===3?'Group order · 20 units each':'Five buyers · $99 each'}</h3><small>${real?'40 matched CAD parts · previously analyzed':state.stage===3?'Separate synthetic minimum-order example':'Separate recorded contract · PayPal Sandbox'}</small><div class="rail-break"></div><div class="rail-item"><span>Now trying</span><strong>${esc(steps[state.stage])}</strong></div>${real?`<div class="rail-item"><span>Selected part</span><strong>${esc(label(v.part_id))}</strong></div><div class="rail-item"><span>Engineering</span>${badge('MORE INFO NEEDED','warn')}</div><div class="rail-item"><span>Buying</span>${badge('ON HOLD','bad')}</div>`:state.stage===3?`<div class="rail-item"><span>Order size</span><strong>${state.buyers*20} / 100 units</strong></div><div class="rail-item"><span>Source</span>${badge('EXAMPLE ONLY','neutral')}</div>`:`<div class="rail-item"><span>Recorded total</span><strong>$495.00</strong></div><div class="rail-item"><span>Payment type</span>${badge('SANDBOX','good')}</div>`}<div class="rail-break"></div>${button('toggle-inspector','Why this result?','secondary-button')}</div>`;
}
function eventRail(){const rows=state.events.slice(-5).reverse().map(x=>`<div class="event-line"><span>${x.kind==='check'?'●':x.kind==='recorded'?'↻':'◆'}</span><div><small>${esc(x.scope)} · update ${x.seq}</small><strong>${esc(x.event.replaceAll('_',' ').toLowerCase())}</strong><p>${esc(x.detail)}</p></div></div>`).join('');
 return `<div class="rail-surface"><span class="rail-title">ORDER UPDATES</span><div class="rail-status">${badge(stateTag(),state.scanning||state.routeRunning?'good':'neutral')}</div><div class="event-list">${rows||'<p>Your checks will appear here.</p>'}</div><div class="rail-break"></div><details ${state.inspector?'open':''}><summary>View technical evidence</summary><p>The browser only checks saved CAD metadata. ZTL Engineer admission, Judge 63/63 and Sandbox receipts are retained from separate recorded runs. No new formal calls, supplier contacts or payment requests take place.</p>${sourceLink('Original CAD evidence',state.e.source.cad_source)}<p>${sourceLink('Independent test record',state.e.source.evidence_guide)}</p><p>Supplier connectors: none verified. Brand identifiers on sourcing cards are illustrative discovery sources, not partnerships.</p></details></div>`;
}

function render(){if(!state.e)return;
 $('#workspace').hidden=false;$('#loading').hidden=true;
 $$('#app [data-stage]').forEach(b=>{const i=Number(b.dataset.stage),active=i===state.stage;b.classList.toggle('active',active);b.classList.toggle('completed',i<state.stage);b.setAttribute('aria-current',active?'step':'false');b.disabled=i>state.unlocked;});
 $('#workspaceTitle').textContent=state.stage===0?'40 parts found. Watch the checks.':state.stage===1?'Your parts are ready for review.':state.stage===2?'Explore manufacturing options.':state.stage===3?'Turn 20 units into a group order.':'See each Sandbox payment confirmation.';
 $('#workspaceSubtitle').textContent=state.stage===0?'Your CAD is already loaded. Select a part and see whether it is ready to manufacture.':'See the result of each action. Examples are clearly separated from your real drawing.';
 $('#intentRail').innerHTML=rail();$('#workCanvas').innerHTML=`<section class="live-scene">${views[state.stage]()}</section><div class="live-scope">${esc(stageMeta())} · This page creates no supplier request, engineering admission, or payment.</div>`;
 $('#decisionRail').innerHTML=eventRail();
}
function action(name){switch(name){
 case 'restart-scan':startScan(true);break;
 case 'pause-scan':pauseScan();break;
 case 'resume-scan':startScan(false);break;
 case 'to-vectors':if(state.scanIndex===40){state.unlocked=Math.max(state.unlocked,1);navigate(1)}break;
 case 'to-suppliers':state.unlocked=Math.max(state.unlocked,2);navigate(2);break;
 case 'scan-routes':runRoutes();break;
 case 'to-deal':state.buyers=1;state.negotiationIndex=0;state.unlocked=Math.max(state.unlocked,3);navigate(3);log('BOUNDARY','CASE_A_TO_FIXTURE','Real CAD stopped at Z. New synthetic MOQ fixture opened.','warning');render();break;
 case 'add-buyer':if(state.stage===3&&state.buyers<5){state.buyers++;log('MOQ FIXTURE','BUYER_JOINED',`${state.buyers} synthetic buyers × 20 = ${state.buyers*20} units.`,'check');render()}break;
 case 'play-negotiation':playNegotiation();break;
 case 'to-paypal':if(state.negotiationIndex===3){state.unlocked=4;navigate(4);log('BOUNDARY','CASE_B_PAYPAL','Recorded Case B Sandbox readbacks only.','recorded');render()}break;
 case 'play-receipts':playReceipts();break;
 case 'toggle-inspector':state.inspector=!state.inspector;render();break;
 case 'restart':clearTimers();state.stage=0;state.unlocked=0;state.scanIndex=0;state.checks=[];state.events=[];state.activePart=0;state.draft.clear();state.buyers=1;state.negotiationIndex=0;state.receiptIndex=0;state.selectedReceipt=0;state.activeSupplier=0;state.proposedQty=20;state.budget=100;state.run++;render();startScan(false);break;
 }}
document.addEventListener('click',ev=>{
 const el=ev.target.closest('[data-action],[data-part-index],[data-receipt],[data-stage],[data-gap],[data-supplier-index]');if(!el||el.disabled)return;
 if(el.dataset.stage!==undefined){navigate(Number(el.dataset.stage));return;}
 if(el.dataset.supplierIndex!==undefined){state.activeSupplier=Math.max(0,Math.min(routes.length-1,Number(el.dataset.supplierIndex)||0));log('CASE A','SOURCE_INSPECTED',routes[state.activeSupplier].name+' — illustrative only, not connected');render();return;}
 if(el.dataset.partIndex!==undefined){state.activePart=Number(el.dataset.partIndex);state.draft.clear();render();return;}
 if(el.dataset.receipt!==undefined){state.selectedReceipt=Number(el.dataset.receipt);render();return;}
 if(el.dataset.gap!==undefined){const g=el.dataset.gap,v=state.e.case_a.vectors[state.activePart];if(v.missing.includes(g)){state.draft.has(g)?state.draft.delete(g):state.draft.add(g);render();}return;}
 if(el.dataset.action!==undefined)action(el.dataset.action);
});
document.addEventListener('change',ev=>{if(ev.target.id==='part-select'){state.activePart=Number(ev.target.value);state.draft.clear();render();return;}
 const f=ev.target.dataset.field;if(f==='qty'||f==='budget'){const n=Number(ev.target.value);if(Number.isSafeInteger(n)&&n>=1&&n<=(f==='qty'?1000:100000)){state[f==='qty'?'proposedQty':'budget']=n;log('CASE A','USER_DRAFT_CHANGED',`${f}=${n}; not formally admitted.`);render();}}});
document.addEventListener('DOMContentLoaded',async()=>{try{
 const r=await fetch(EV,{cache:'no-store'});if(!r.ok)throw Error('Evidence unavailable: HTTP '+r.status);
 const e=await r.json();if(!ok(e))throw Error('Source evidence failed closed');state.e=e;render();startScan(true);
 }catch(err){clearTimers();$('#workspace').hidden=true;$('#loading').hidden=true;$('#loadError').hidden=false;$('#loadError').textContent='NO-GO · '+String(err.message||err);}});
})();
