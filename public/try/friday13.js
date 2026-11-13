/* WO-FRIDAY13 — Part-centric agent work observability. Read-only front-end.
 * Source CAD Case A (40 Z-held vectors), synthetic provider/order simulation S,
 * and recorded PayPal Case B MUST remain distinct evidence scopes.
 * Fetches only ./evidence.json. ZERO POST, payment, external supplier API requests.
 */
(()=>{
'use strict';
const $=(q,el=document)=>el.querySelector(q);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'$'+Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const nice=s=>String(s).replace(/^\d+_/,'').replaceAll('_',' ').replace(/\b\w/g,x=>x.toUpperCase());
const providers=[
 {id:'xometry',name:'Xometry',moq:100,price:23.0,days:16},
 {id:'protolabs',name:'Protolabs',moq:150,price:25.4,days:9},
 {id:'fictiv',name:'Fictiv',moq:100,price:23.8,days:13},
 {id:'mfg',name:'MFG',moq:200,price:21.9,days:21},
 {id:'craftcloud',name:'Craftcloud',moq:120,price:24.5,days:14},
 {id:'sculpteo',name:'Sculpteo',moq:100,price:25.1,days:12}
];
const seededParts={direct:'01_BASE_PLATE',coalition:'01_RAIL_BRACKET',requote:'02_GEAR_CONNECTOR',input:'01_FINGER'};
const example={
  direct:{description:'An example supplier can meet a small order without group buying.',state:'Direct order route',label:'DIRECT',symbol:'✓',icon:'↗'},
  coalition:{description:'Six example responses have large minimum quantities. LEGION can assemble a group order.',state:'Group order suggested',label:'GROUP ORDER',symbol:'◉',icon:'◎'},
  requote:{description:'The first example price exceeds your draft cap. A counter-offer is needed.',state:'Counter-offer required',label:'RENEGOTIATE',symbol:'↔',icon:'↗'},
  input:{description:'Engineering specifications are incomplete. Ask for the missing requirement before sourcing.',state:'Your input needed',label:'NEEDS INPUT',symbol:'!',icon:'?'}
};
const stages=['Drawing & BOM','Engineering review','Supplier discovery','Quote comparison','Purchase routing','Buyer approval'];
const state={e:null,selected:seededParts.coalition,filter:'all',term:'',pane:'work',traceScope:'part',traceExpand:new Set(),playing:false,complete:false,tick:0,plan:[],events:[],timer:null,speed:1,selectedProviders:new Set(providers.map(s=>s.id)),received:new Set(),draftQty:{},draftMissing:new Set(),approvals:new Set(),paymentPreview:false,loadError:null,modal:null,demoFile:null,started:false,showOriginal:false};
function validate(e){return e?.schema==='legion.try.evidence.v1'&&
 e.source?.commit==='2cc7dbdc2b305d92b4fd64614c74bc56b16c4cfe'&&
 e.case_a?.engineering_admission==='Z'&&e.case_a?.procurement==='BLOCKED'&&e.case_a?.new_paypal_captures===0&&
 e.case_a?.vectors?.length===40&&e.case_a.vectors.every(v=>v.engineering_verdict==='Z'&&Array.isArray(v.missing)&&v.source_geometry_sha256===e.source.cad_sha256)&&
 e.case_b?.new_provider_posts===0&&e.case_b?.readback_confirmed===true&&e.case_b?.payPal_test_cents===49500&&
 e.case_b?.captures?.length===5&&new Set(e.case_b.captures).size===5&&
 e.case_b?.judge_checks_passed===63&&e.case_b?.judge_checks_total===63&&
 JSON.stringify(e.case_b.offers.map(o=>o.total_cents))===JSON.stringify([48000,54000,49500])&&
 e.coalition_fixture?.buyers===5&&e.coalition_fixture?.units_each===20&&e.coalition_fixture?.moq===100&&
 e.coalition_fixture?.all_in_cents!==e.case_b.payPal_test_cents;}
function part(){return state.e?.case_a.vectors.find(v=>v.part_id===state.selected)??null;}
function type(id){if(id===seededParts.direct)return 'direct';if(id===seededParts.coalition)return 'coalition';if(id===seededParts.requote)return 'requote';if(id===seededParts.input)return 'input';return 'pending';}
function qty(v){return state.draftQty[v.part_id]??(type(v.part_id)==='coalition'?20:type(v.part_id)==='requote'?10:type(v.part_id)==='direct'?2:v.qty);}
function countFor(id,agent){return state.events.filter(e=>e.partId===id&&(agent?e.agent===agent:true)).length;}
function routeStatus(id){const t=type(id);const e=state.events.filter(x=>x.partId===id);if(!e.length)return 'Queued';if(state.approvals.has(id))return t==='coalition'?'Example approved':'Example accepted';if(t==='input'&&e.some(x=>x.action==='clarification'))return 'Clarification needed';if(t==='coalition'&&e.some(x=>x.action==='suggest'))return 'Group order proposed';if(t==='requote'&&e.some(x=>x.action==='counter'))return 'Counter-offer ready';if(t==='direct'&&e.some(x=>x.action==='direct'))return 'Direct option found';if(e.some(x=>x.action==='quote'))return 'Reviewing quotes';return 'In progress';}
function event(tick,partId,agent,action,title,detail,tool,source,tone='ok',payload={}){return {tick,partId,agent,action,title,detail,tool,source,tone,payload,seq:0};}
function buildPlan(){
 const plan=[];
 // Real source-bound snapshots are re-read here, not CAD parsed in browser.
 state.e.case_a.vectors.forEach((v,i)=>plan.push(event(1+Math.floor(i/4),v.part_id,'Engineering Agent','source',
   'BOM position '+String(i+1).padStart(2,'0')+' identified',
   nice(v.part_id)+' · source BOM quantity '+v.qty+' · engineering admission still pending.',
   'Pinned STEP/BOM readback','CASE A · SHA256 '+state.e.source.cad_sha256.slice(0,12)+'…','ok',{count:1})));
 // Per-part local requirement checks: every source vector receives its own X-Ray record.
 state.e.case_a.vectors.forEach((v,i)=>plan.push(event(12+Math.floor(i/5),v.part_id,'Engineering Agent','check',
  'Engineering requirements checked',
  v.missing.length+' missing field(s); source bounding box '+(Array.isArray(v.geometry_bbox_mm)?'present':'not shown')+'. No independent engineering clearance issued.',
  'Local source requirements comparison','CASE A · engineering Z / procurement BLOCKED','warn')));
 const direct=seededParts.direct,coal=seededParts.coalition,requote=seededParts.requote,inp=seededParts.input;
 for(const id of [direct,coal,requote,inp])plan.push(event(12,id,'Engineering Agent','review','Requirements inspected',
  'Checking known geometry, material and missing evidence. Source engineering approval remains unavailable.',
  'Local requirements comparator','CASE A · source-bound readback','warn'));
 plan.push(event(13,inp,'Engineering Agent','clarification','Missing tolerance confirmation',
  'A manufacturing tolerance is absent. Ask the buyer for a draft specification; independent review is still required.',
  'Source requirements check','CASE A · engineering Z','warn'));
 for(const id of [direct,coal,requote])plan.push(event(14,id,'Sourcing Agent','sourcecheck',
  state.selectedProviders.size+' example suppliers selected',
  'Opening six simulated adapter slots. No external provider is connected or contacted.',
  'Demo adapter router','SYNTHETIC S · no network calls','ok'));
 providers.forEach((p,i)=>{
  if(!state.selectedProviders.has(p.id))return;
  for(const id of [direct,coal,requote])plan.push(event(15+i,id,'Supplier Agent','quote',p.name+' example response received',
   'Modelled MOQ, price and lead time recorded for a fictional procurement scenario. NOT a real '+p.name+' quotation.',
   'Deterministic quote simulator','SYNTHETIC S · not provider data','ok',{provider:p.id}));
 });
 plan.push(event(22,direct,'Quote Analyst','direct','Direct order option located','Example source accepts a small quantity. This is not a real supplier commitment.','Price/MOQ comparator','SYNTHETIC S · simulated option'));
 plan.push(event(22,coal,'Quote Analyst','compare','All example MOQ values exceed 20',
  'Best example requires 100 units; individual buyer needs 20. Remaining demand: 80.',
  'MOQ comparator','SYNTHETIC S · no live quotes','warn'));
 plan.push(event(22,requote,'Quote Analyst','compare','Example quote exceeds buyer budget',
  'Illustrative first bid $720 vs illustrative budget $650. Counter-offer required.',
  'Budget constraint check','SYNTHETIC S · modeled prices','warn'));
 plan.push(event(23,coal,'Coalition Agent','suggest','Group-order path recommended',
  'Five compatible example buyers at 20 units each would reach MOQ 100.',
  'Local group-order calculator','SYNTHETIC S · no buyers contacted'));
 [2,3,4,5].forEach((n,i)=>plan.push(event(24+i,coal,'Coalition Agent','buyer','Example buyer '+n+' matched',
  n*20+' / 100 example units assembled. No actual buyer was found or reserved.',
  'Simulated demand registry','SYNTHETIC S · fixture only','ok',{buyers:n})));
 plan.push(event(29,coal,'Coalition Agent','proposal','Group order ready for buyer review',
  'Demo fixture economics: 100 units / 5 buyers; $2,425 total, $485 each, including $125 simulated shipping.',
  'Cost-sharing calculator','SYNTHETIC S · separate MOQ fixture'));
 plan.push(event(25,requote,'Negotiation Agent','counter','Counter-offer example prepared',
  'Proposed $625 versus $650 budget; buyer approval required before any real negotiation.',
  'What-if price optimizer','SYNTHETIC S · no supplier negotiation'));
 plan.push(event(26,direct,'Purchase Agent','ready','Example direct route awaits approval',
  'An eligible example direct option exists, but original CAD engineering remains unapproved. No purchase can be sent.',
  'Approval preflight','CASE A HOLD + SYNTHETIC route','warn'));
 return plan.sort((a,b)=>a.tick-b.tick||a.partId.localeCompare(b.partId)||a.agent.localeCompare(b.agent));
}
function syncTimer(){if(state.timer)clearInterval(state.timer);state.timer=null;if(!state.playing)return;state.timer=setInterval(step,Math.max(100,360/state.speed));}
function reset(auto=false){if(state.timer)clearInterval(state.timer);state.timer=null;state.events=[];state.tick=0;state.received.clear();state.approvals.clear();state.draftMissing.clear();state.complete=false;state.playing=auto;state.started=true;state.plan=buildPlan();syncTimer();render();}
function step(){if(!state.playing)return;state.tick++;
 const items=state.plan.filter(x=>x.tick===state.tick);
 for(const e of items){e.seq=state.events.length+1;state.events.push(e);if(e.action==='quote')state.received.add(e.partId+'|'+e.payload.provider);}
 if(state.tick>=Math.max(...state.plan.map(x=>x.tick))){state.playing=false;state.complete=true;syncTimer();}
 render();}
function notify(msg){const t=$('#toast');if(!t)return;t.textContent=msg;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),2600);}
function initialMarkup(){
 $('#root').innerHTML=`<div class="frame"><header class="top"><div class="brand-wrap"><a class="brand" href="/" aria-label="LEGION home"><span class="spark">⌁</span>LEGION<span class="dot">.</span></a><span class="brand-sep"></span><span class="brand-detail">Industrial procurement · agent operations</span></div><div class="top-right"><span class="tiny-online"><span class="led"></span> Recorded + simulated</span><button class="outline-small" data-act="explain">Evidence boundaries ↗</button></div></header>
 <main class="shell"><div class="title-row"><div class="title-copy"><div class="eyebrow">FRIDAY13 / PROJECT COMMAND CENTER</div><h1>One drawing. Every part in motion.</h1><p>See the work behind each manufacturing decision — without chasing suppliers.</p></div><div class="hero-actions"><input id="uploadFile" class="upload-input" type="file" accept=".step,.stp,.dxf,.dwg,.pdf,.csv,.json" aria-label="Select your own CAD drawing"><button class="secondary" data-act="upload">+ Select a drawing</button><button id="playButton" class="primary" data-act="toggle">▶ Watch agents work</button><button class="secondary" data-act="restart">↻ Replay</button></div></div>
 <div id="uploadCallout" class="upload-callout" aria-live="polite"></div>
 <div class="meta-scope"><span class="scope-indicator">DEMO / NO NEW EXTERNAL ACTIONS</span><span>${window.__FRIDAY13_IS_PREVIEW__?"Offline preview fixture referencing reBot part names":"Real reBot STEP/BOM snapshot"} for 40 parts · example agent routes, supplier responses and coalitions are <strong>simulated</strong> · historical PayPal receipts are from a <strong>separate recorded test</strong>.</span></div>
 <div id="metrics" class="metrics"></div>
 <div class="worktop"><div><h2>Agent operations</h2><div class="worktop-desc">Choose a part to follow every check, quote comparison and decision.</div></div><div class="pacer"><span id="runState" class="timetrack">READY</span><button class="outline-small" data-act="speed">Speed 1×</button></div></div>
 <div class="workspace"><section class="panel parts-panel mobile-show" data-panel="parts"><div class="panel-head"><h3>Parts in this project</h3><span class="counter">40 SOURCE PARTS</span></div><div class="parts-search">⌕ <input id="searchParts" type="search" placeholder="Search parts or requirements…" aria-label="Search project parts"></div><div id="filters" class="filters"></div><div id="partsList" class="part-list"></div></section>
 <section class="panel work-panel" data-panel="work"><div class="panel-head"><h3>Part workbench</h3><span class="counter">ENGINEERING + SOURCING</span></div><div class="detail-area" id="partDetail"></div></section>
 <aside class="panel xray-panel" data-panel="xray"><div class="xr-head"><div class="xr-title"><h3>Agent X-Ray</h3><span class="seg">OBSERVABLE ACTIONS</span></div><div class="xr-sub">What happened · which tool · what evidence · next action</div></div><div class="live-strip"><span id="xrayPulse" class="pulse"><i></i> Replay paused</span><span id="eventCount" class="mono muted">0 events</span></div><div class="trace-callout">Agent actions below come from a deterministic scenario replay. They are not model thoughts or real-time supplier calls.</div><div class="trace-tabs"><button class="trace-tab current" data-trace="part">This part</button><button class="trace-tab" data-trace="all">All agents</button></div><div id="traceList" class="trace-list" aria-live="polite"></div></aside></div>
 <div class="footer"><span>LEGION FRIDAY13 · source CAD readback + separated demonstration scopes · no production order is authorized</span><a href="https://github.com/veraxis-protocol/LEGION-Deal-Rescue" target="_blank" rel="noopener noreferrer">Inspect source evidence ↗</a></div></main><nav class="bottom-nav" aria-label="Mobile workspace"><button data-pane="parts" class="active"><span>▦</span>Parts</button><button data-pane="work"><span>◈</span>Workbench</button><button data-pane="xray"><span>◉</span>Agent X-Ray</button></nav><div class="modal-back" id="modalBack" role="presentation"><div id="modalContent" class="modal" role="dialog" aria-modal="true" aria-label="Buyer decision"></div></div><div class="toast" id="toast" role="status"></div></div>`;
}
function metrics(){const s=state.e?.case_a;const eventCount=state.events.length,extracted=state.events.filter(x=>x.action==='source').length;
 const quotes=state.events.filter(x=>x.action==='quote').length;const decisions=Object.values(seededParts).filter(id=>state.events.some(x=>x.partId===id&&['suggest','direct','counter','clarification'].includes(x.action))).length;
 $('#metrics').innerHTML=`<div class="metric"><div><div class="n">${extracted}<span class="muted"> / ${s.vectors.length}</span></div><div class="label">Parts examined</div></div><div class="metric-icon">▤</div></div><div class="metric"><div><div class="n">${quotes}<span class="muted"> / ${state.selectedProviders.size*3}</span></div><div class="label">Illustrative quote events</div></div><div class="metric-icon">≋</div></div><div class="metric"><div><div class="n">${decisions}<span class="muted"> / 4</span></div><div class="label">Sample routes identified</div></div><div class="metric-icon">⇄</div></div><div class="metric"><div><div class="n">0</div><div class="label">Real supplier requests or payments</div></div><div class="metric-icon">♧</div></div>`;
 const status=state.playing?'REPLAYING  '+state.tick+'s':state.complete?'REPLAY COMPLETE':state.started?'PAUSED AT '+state.tick+'s':'READY TO REPLAY';$('#runState').textContent=status;
 $('#playButton').textContent=state.playing?'Ⅱ Pause playback':state.complete?'▶ Replay again':'▶ Watch agents work';
 $('#xrayPulse').innerHTML=`<i></i>${state.playing?'Events replaying':'Replay paused'}`;$('#eventCount').textContent=eventCount+' events';
}
function pill(type,status){if(status==='Queued')return '<span class="mini-pill pending">QUEUED</span>';return `<span class="mini-pill ${type}">${esc(status)}</span>`;}
function parts(){const tags=[['all','All 40'],['direct','Direct'],['coalition','Group order'],['requote','Negotiation'],['input','Needs input']];
 $('#filters').innerHTML=tags.map(([k,n])=>`<button class="chip ${state.filter===k?'active':''}" data-filter="${k}">${n}</button>`).join('');
 const q=state.term.trim().toLowerCase();const list=state.e.case_a.vectors.filter(v=>(state.filter==='all'||type(v.part_id)===state.filter)&&(!q||v.part_id.toLowerCase().includes(q)||String(v.material||'').toLowerCase().includes(q)||v.missing.some(m=>m.toLowerCase().includes(q))));
 $('#partsList').innerHTML=list.map((v,i)=>{const t=type(v.part_id);const label=routeStatus(v.part_id);return `<button class="part-item ${v.part_id===state.selected?'selected':''}" data-part="${esc(v.part_id)}" aria-pressed="${v.part_id===state.selected}"><span class="part-num">${String(state.e.case_a.vectors.indexOf(v)+1).padStart(2,'0')}</span><span class="part-body"><span class="part-title">${esc(nice(v.part_id))}</span><span class="part-desc">Source ×${v.qty} · Demo order ×${qty(v)}</span></span>${pill(t,label)}</button>`;}).join('')||'<div class="empty-state">No parts match this filter.</div>';
}
function engineeringArt(v){return `<div class="cad-grid"></div><svg class="cad-svg" viewBox="0 0 310 205" role="img" aria-label="Schematic machine part preview, not actual STEP rendering"><g fill="none" stroke="#b7d5dc" opacity=".55" stroke-width="1"><path d="M35 30H275V180H35Z"/><path d="M35 105H275M155 30V180" stroke-dasharray="4 5"/></g><g transform="translate(23 18)"><path d="M42 60 L95 30 L205 51 L244 83 L194 123 L93 113 Z" fill="#d7ecf0" stroke="#659bab" stroke-width="2"/><path d="M95 30 L105 95 L93 113 M205 51 L204 113 L194 123 M244 83 L205 94 L105 95 L42 60" fill="none" stroke="#659bab" stroke-width="1.7"/><circle cx="107" cy="75" r="19" fill="#f8fdfd" stroke="#659bab" stroke-width="2"/><circle cx="194" cy="77" r="14" fill="#f8fdfd" stroke="#659bab" stroke-width="2"/><circle cx="107" cy="75" r="4" fill="#92bec6"/><circle cx="194" cy="77" r="4" fill="#92bec6"/><g stroke="#83abb5" stroke-width="1"><path d="M42 141H244M42 137V145M244 137V145"/><path d="M24 60V123M20 60H28M20 123H28"/></g></g><g fill="#4e8795" font-size="9" font-family="monospace"><text x="137" y="185">DIMENSION CHECK</text><text x="9" y="16">BOM / SOURCE</text></g></svg><span class="schematic-flag">SCHEMATIC ONLY · SOURCE STEP NOT RENDERED HERE</span>`;}
function supplierTable(v,t){const selected=providers.filter(x=>state.selectedProviders.has(x.id));const unit=qty(v);
 const header=`<div class="supplier-head"><h4>Supplier comparison <span class="counter">${selected.length} / 6 SELECTED</span></h4><span class="badge-outcome">ILLUSTRATIVE QUOTES</span></div><div class="illustration-supplier-note">All providers start selected. Names identify example search targets; prices are modeled, not received from these companies.</div>`;
 const rows=providers.map((p,i)=>{
 const got=state.received.has(v.part_id+'|'+p.id);
 const sourceQty=t==='coalition'?p.moq:t==='direct'?(i===0?1:Math.max(2,p.moq)):t==='requote'?Math.max(10,Math.floor(p.moq/10)):p.moq;
 const cost=t==='requote'?money(720+i*17):t==='direct'?money(38+i*5):money(p.price);
 return `<div class="supplier-row"><input type="checkbox" data-provider="${p.id}" ${state.selectedProviders.has(p.id)?'checked':''} aria-label="Include ${p.name}"/><span class="supplier-name">${esc(p.name)}<span class="muted"> · demo</span></span><span class="supplier-cell ${sourceQty>unit?'warn':'best'}">${got?sourceQty+' MOQ':'—'}</span><span class="supplier-cell">${got?cost:'—'}</span><span class="supplier-cell">${got?p.days+' d':'Waiting'}</span></div>`;}).join('');
 const total=state.events.filter(x=>x.partId===v.part_id&&x.action==='quote').length;
 return `${header}<div class="supplier-table"><div class="supplier-row heading"><span>Use</span><span>Example source</span><span>Minimum</span><span>Price*</span><span>Lead</span></div>${rows}</div><div class="quote-summary"><strong>${total} / ${selected.length} simulated responses received</strong><span>* Modelled prices · not actual supplier quotes</span></div>`;
}
function route(v,t){const e=example[t],has=state.events.some(x=>x.partId===v.part_id&&['direct','suggest','counter','clarification'].includes(x.action));
 if(t==='pending')return `<div class="route-banner"><div class="route-emoji">▤</div><div><h4>Engineering information is being reviewed</h4><p>${v.missing.length} unresolved source requirement(s). This part cannot be purchased from the recorded CAD case.</p></div></div>`;
 return `<div class="route-banner ${t}"><div class="route-emoji">${e.icon}</div><div><h4>${esc(has?e.state:'Exploring an example '+e.label.toLowerCase()+' route')}</h4><p>${esc(e.description)}</p></div></div>`;
}
function decision(v,t){const has=state.events.some(x=>x.partId===v.part_id&&['direct','suggest','counter','clarification'].includes(x.action));
 if(t==='coalition'){
 const found=Math.max(1,...state.events.filter(x=>x.partId===v.part_id&&x.action==='buyer').map(e=>e.payload.buyers));const approved=state.approvals.has(v.part_id);
 return `<div class="decision-block"><div class="eyebrow muted">BUYER DECISION · EXAMPLE COALITION</div><h4>${approved?'Example coalition approved locally':'Turn 20 units into a viable 100-unit order'}</h4><p>${found}/5 model buyers represented. This is illustrative demand, not five real matched customers. No supplier or buyer was contacted.</p><div class="buyer-bar">${Array.from({length:5},(_,i)=>`<span class="buyer ${i<found?'found':''}"><b>${i<found?'✓':'○'}</b>Buyer ${i+1}<br>20 units</span>`).join('')}</div><div class="decision-grid"><div class="decision-figure"><strong>100</strong><span>Example total units</span></div><div class="decision-figure"><strong>$2,425</strong><span>Example all-in order</span></div><div class="decision-figure"><strong>$485</strong><span>Example per buyer</span></div></div><div class="eng-note">The MOQ numbers come from a separate synthetic fixture; they are not quotations for ${esc(nice(v.part_id))}. Your original engineering review remains blocked.</div><div class="decision-actions"><button class="primary" data-act="approve" ${!has||found<5||approved?'disabled':''}>${approved?'✓ Example approved':'Approve example group order →'}</button><button class="secondary" data-act="payment" ${approved?'':'disabled'}>View payment experience ↗</button></div></div>`;
 }
 if(t==='direct')return `<div class="decision-block"><div class="eyebrow muted">BUYER DECISION · EXAMPLE DIRECT ROUTE</div><h4>Buy this part without waiting for a coalition</h4><p>A modelled supplier accepts the quantity. The real engineering source is still on hold.</p><div class="decision-actions"><button class="primary" data-act="approve" ${!has||state.approvals.has(v.part_id)?'disabled':''}>${state.approvals.has(v.part_id)?'✓ Draft approved':'Approve example direct order →'}</button><button class="secondary" data-act="payment" ${state.approvals.has(v.part_id)?'':'disabled'}>Payment preview</button></div></div>`;
 if(t==='requote')return `<div class="decision-block"><div class="eyebrow muted">BUYER DECISION · EXAMPLE NEGOTIATION</div><h4>Counter at $625 against the $650 budget</h4><p>Initial simulated offer: $720. Proposed counter-offer: $625. No actual vendor negotiation took place.</p><div class="decision-actions"><button class="primary" data-act="approve" ${!has||state.approvals.has(v.part_id)?'disabled':''}>${state.approvals.has(v.part_id)?'✓ Counter accepted in demo':'Approve demo counter-offer →'}</button></div></div>`;
 if(t==='input')return `<div class="decision-block"><div class="eyebrow muted">ACTION REQUIRED · ENGINEERING</div><h4>Clarify one requirement before sourcing</h4><p>Source record is missing: ${esc(v.missing[0]??'manufacturing tolerance')}.</p><div class="decision-actions"><button class="primary" data-act="clarify" ${!has?'disabled':''}>Add draft requirement →</button></div><div class="eng-note">Buyer drafts do not change the recorded engineering verdict or authorize a real order.</div></div>`;
 return `<div class="decision-block"><h4>Engineering clarification required</h4><p>${v.missing.length} source requirements remain unresolved for ${esc(nice(v.part_id))}. Provide a draft or inspect another sample route. No real supplier request is permitted.</p><div class="decision-actions"><button class="secondary" data-act="clarify" ${!state.events.some(e=>e.partId===v.part_id&&e.action==='check')?'disabled':''}>Draft missing requirement →</button></div></div>`;
}
function stageTrack(v){const logs=state.events.filter(x=>x.partId===v.part_id);const hit=a=>logs.some(x=>a.includes(x.action));const idx=hit(['suggest','direct','counter','clarification'])?4:hit(['compare'])?3:hit(['quote'])?2:hit(['review','check'])?1:hit(['source'])?0:-1;return `<div class="stage-track">${stages.map((x,i)=>`<span class="stage-chip ${i<=idx?'done':i===idx+1&&state.playing?'running':'queued'}">${i<idx?'✓ ':''}${esc(x)}</span>`).join('')}</div>`;}
function details(){const v=part();if(!v)return;const t=type(v.part_id),e=example[t],q=qty(v),count=countFor(v.part_id);const dims=Array.isArray(v.geometry_bbox_mm)?v.geometry_bbox_mm.map(x=>Number(x).toFixed(1)).join(' × ')+' mm':'Not provided';
 $('#partDetail').innerHTML=`<div class="object-title"><div><div class="eyebrow" style="color:#197c76">PART ORDER UNIT / ${String(state.e.case_a.vectors.indexOf(v)+1).padStart(2,'0')}</div><h3>${esc(nice(v.part_id))}</h3><p>CAD geometry + requirements + needed quantity + procurement route</p></div><span class="side-id">${esc(v.part_id)}</span></div><div class="selected-line">Source BOM ×${v.qty} · <strong>Example desired order ×${q}</strong> · ${count} X-Ray events</div>${stageTrack(v)}
 <div class="asset"><div class="cad-visual">${engineeringArt(v)}</div><div class="cad-data"><div><div class="data-label">Material / source</div><div class="data-value">${esc(v.material||'Not provided')}</div></div><div><div class="data-label">Manufacturing process / source</div><div class="data-value">${esc(v.process||'Not provided')}</div></div><div><div class="data-label">Bounding box / metadata</div><div class="data-value dim">${esc(dims)}</div></div><div><div class="data-label">Engineering decision</div><div class="data-value negative">Review needed · order on hold</div></div></div></div>
 <div class="action-strip"><div><h4 class="stage-title">What is LEGION doing with this part?</h4><span class="stage-note">Part-specific observable work and the next buyer action</span></div><span class="counter">${count} EVENTS</span></div>${route(v,t)}
 ${t!=='pending'&&t!=='input'?supplierTable(v,t):''}${decision(v,t)}
 <p class="event-legend">Source-linked: material, geometry metadata and missing requirements. Synthetic: every supplier response, coalition match, quote, price and route recommendation. No actual CAD is being processed by a server on this page.</p>`;
}
function traces(){document.querySelectorAll('[data-trace]').forEach(x=>x.classList.toggle('current',x.dataset.trace===state.traceScope));const display=state.traceScope==='part'?state.events.filter(x=>x.partId===state.selected):state.events;
 const chunk=display.slice(-90).reverse();$('#traceList').innerHTML=chunk.length?chunk.map(e=>{const opened=state.traceExpand.has(e.seq);return `<div class="trace-item ${e.tone==='warn'?'warn':''} ${opened?'open':''}"><div class="trace-time">T+${String(e.tick).padStart(2,'0')}s · EVENT ${String(e.seq).padStart(3,'0')}</div><div class="trace-agent">${esc(e.agent)}</div><h4>${esc(e.title)}</h4><p>${esc(e.detail)}</p><div class="trace-source">▤ ${esc(e.source)}</div><button class="trace-open" data-expand="${e.seq}">${opened?'Hide':'Why? Show'} tool &amp; evidence</button><div class="trace-meta"><b>Tool:</b> ${esc(e.tool)}<br><b>Part:</b> ${esc(nice(e.partId))}<br><b>Scope:</b> ${esc(e.source)}<br><b>Recorded action:</b> ${esc(e.action)}</div></div>`;}).join(''):'<div class="empty-state">No events yet. Select <b>Watch agents work</b> to replay the work on your project.</div>';
}
function render(){if(!state.e)return;const memory={};for(const k of ['#partsList','#traceList']){const el=$(k);memory[k]=el?.scrollTop??0;}
 metrics();parts();details();traces();for(const k of Object.keys(memory)){const el=$(k);if(el)el.scrollTop=memory[k];}
 document.querySelectorAll('[data-panel]').forEach(p=>p.classList.toggle('mobile-show',p.dataset.panel===state.pane));document.querySelectorAll('[data-pane]').forEach(b=>b.classList.toggle('active',b.dataset.pane===state.pane));
 const search=$('#searchParts');if(search&&document.activeElement!==search)search.value=state.term;
}
function openModal(kind){const v=part(),t=type(v.part_id);state.modal=kind;const confirm=kind==='approve';let title,body;
 if(confirm){title=t==='coalition'?'Approve a sample group order?':t==='direct'?'Approve a sample direct order?':'Approve a sample counter-offer?';body=t==='coalition'?`<p>Illustrative group: five buyers × 20 units = 100 units.</p><div class="amount-box"><span>Your example share</span><b>$485.00</b></div><p>Model costs: $2,300 production + $125 shipping = $2,425, divided among five example buyers.</p>`:`<p>For ${esc(nice(v.part_id))} only. No real supplier commitment or engineering permit exists.</p>`;}
 else if(kind==='payment'){title='PayPal payment experience';body=`<p>Your example order has been acknowledged in this browser only. There is no active checkout for this real CAD case.</p><div class="amount-box"><span>Example purchase amount · NOT CHARGED</span><b>${t==='coalition'?'$485.00':t==='direct'?'$76.00':'$625.00'}</b></div><div class="warning">Historical PayPal Sandbox test captures are from a <b>different contract (Case B)</b>, not this part. No new capture or PayPal request can be made from this preview.</div><div class="receipt-preview"><div><span>Separate recorded Case B test</span><strong>$495.00</strong></div><div><span>Historical test captures</span><strong>5 / 5</strong></div><div><span>Independent Judge checks</span><strong>63 / 63</strong></div><div><span>New payments here</span><strong>0</strong></div></div>`;}
 else if(kind==='clarify'){title='Add an engineering clarification';body=`<p>Missing source requirement: <b>${esc(v.missing[0]||'manufacturing tolerance')}</b>.</p><label>Draft requirement (not independently verified)<input type="text" id="draftEngineering" placeholder="e.g. ±0.2 mm — proposal only" maxlength="90" style="flex:1;min-width:0;border:0;outline:0"></label><div class="warning">This input remains a local draft. Engineering admission stays unknown; purchasing stays blocked.</div>`;}
 else {title='Evidence boundaries';body=`<p><b>Source CAD Case A:</b> 40 reBot BOM positions were extracted earlier; all engineering admissions remain unknown and procurement blocked. The original STEP file is not parsed in this browser.</p><p><b>Scenario S:</b> six vendor names are example search targets; quote values, routes, buyers and negotiations are modelled locally. No live supplier connection exists.</p><p><b>Recorded Case B:</b> 5 PayPal Sandbox capture IDs for another synthetic contract, $495 total, historical independent 63/63 checks. No new checkout here.</p><p>Agent X-Ray shows tool-event records only, never private model reasoning.</p>`;}
 $('#modalContent').innerHTML=`<div class="eyebrow" style="color:#178277;margin-bottom:7px">LEGION / ${kind==='explain'?'EVIDENCE':kind==='payment'?'PAYMENT':'BUYER CONTROL'}</div><h2>${title}</h2>${body}<div class="decision-actions"><button class="secondary" data-act="close">Close</button>${confirm?'<button class="primary" data-act="confirm">Approve example only</button>':kind==='clarify'?'<button class="primary" data-act="saveDraft">Save draft</button>':''}</div>`;$('#modalBack').classList.add('open');}
function closeModal(){$('#modalBack')?.classList.remove('open');state.modal=null;}
function applyAction(a){const v=part();switch(a){case'upload':$('#uploadFile').click();break;case'toggle':if(state.complete)reset(true);else {state.playing=!state.playing;state.started=true;syncTimer();render();}break;
 case'restart':reset(true);notify('Replay restarted. No external services contacted.');break;
 case'speed':state.speed=state.speed===1?2:state.speed===2?4:1;document.querySelector('[data-act="speed"]').textContent='Speed '+state.speed+'×';syncTimer();break;
 case'approve':if(v&&state.events.some(e=>e.partId===v.part_id&&['suggest','direct','counter'].includes(e.action)))openModal('approve');break;
 case'clarify':openModal('clarify');break;
 case'payment':if(state.approvals.has(v.part_id))openModal('payment');break;
 case'explain':openModal('explain');break;
 case'close':closeModal();break;
 case'confirm':if(state.modal==='approve'){state.approvals.add(v.part_id);state.events.push(event(state.tick,v.part_id,'Buyer','local_approval','Buyer approved example route','Approval is local UI only. No engineering admission, payment or supplier authority was created.','Browser decision state','SYNTHETIC S · not executable','warn'));state.events[state.events.length-1].seq=state.events.length;closeModal();render();notify('Example approved locally. Not an actual order.');}break;
 case'saveDraft':if(state.modal==='clarify'){const txt=$('#draftEngineering')?.value.trim();if(!txt){notify('Enter a draft specification.');break;}state.draftMissing.add(v.part_id);state.events.push(event(state.tick,v.part_id,'Buyer','draft','Draft engineering requirement added',txt+' · requires external engineering review before any real purchase.','Local draft record','CASE A unchanged · engineering Z','warn'));state.events[state.events.length-1].seq=state.events.length;closeModal();render();notify('Draft saved locally. Engineering approval is still required.');}break;
 }}
function bind(){document.addEventListener('click',e=>{const b=e.target.closest('[data-act],[data-part],[data-filter],[data-trace],[data-expand],[data-pane]');if(!b)return;if(b.dataset.act)applyAction(b.dataset.act);else if(b.dataset.part){state.selected=b.dataset.part;state.pane='work';render();}else if(b.dataset.filter){state.filter=b.dataset.filter;render();}else if(b.dataset.trace){state.traceScope=b.dataset.trace;render();}else if(b.dataset.pane){state.pane=b.dataset.pane;render();}else if(b.dataset.expand){const k=Number(b.dataset.expand);state.traceExpand.has(k)?state.traceExpand.delete(k):state.traceExpand.add(k);traces();}});
 document.addEventListener('input',e=>{if(e.target.id==='searchParts'){state.term=e.target.value;const caret=e.target.selectionStart;parts();$('#searchParts').focus();try{$('#searchParts').setSelectionRange(caret,caret);}catch{}}});
 document.addEventListener('change',e=>{if(e.target.dataset.provider){e.target.checked?state.selectedProviders.add(e.target.dataset.provider):state.selectedProviders.delete(e.target.dataset.provider);reset(true);notify('Demo suppliers updated. Replay restarted. No real quotes requested.');}if(e.target.id==='uploadFile'){const f=e.target.files?.[0];if(!f)return;state.demoFile=f.name;const el=$('#uploadCallout');el.textContent=`Selected ${f.name} locally. This static demo cannot parse your drawing; the pinned reBot example remains loaded. No file was uploaded.`;el.classList.add('show');}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
 }
async function init(){initialMarkup();bind();try{
  // The standalone preview embeds a structural evidence fixture; production loads only the pinned local file.
  const d=window.__FRIDAY13_PREVIEW_EVIDENCE__??await fetch('./evidence.json',{method:'GET',cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Pinned evidence not available');return r.json();});
  if(!validate(d))throw Error('Evidence contract rejected: fail closed');state.e=d;
  state.plan=buildPlan();render();setTimeout(()=>{if(!state.started)reset(true);},750);
 }catch(err){const root=$('#root');root.innerHTML=`<main style="max-width:640px;margin:90px auto;background:white;padding:32px;border:1px solid #e6e8e9;border-radius:13px;font-family:Arial"><h1>Project data could not be verified</h1><p>${esc(err.message)}</p><p>LEGION has not started a simulation or authorized a purchase.</p></main>`;}}
init();
})();
