/* WO-TRY-LIVING-004 — one-object, one-action procurement workspace.
 * Presentation and simulation only: GET ./evidence.json. No POST, payment,
 * supplier contact, agent execution or engineering admission changes.
 * Real reBot CAD (A), independent MOQ fixture (F), recorded commerce (B)
 * are different evidence scopes. No evidence transfers across them.
 */
(() => {
  'use strict';
  const EVIDENCE_URL = './evidence.json';
  const $ = (q,root=document) => root.querySelector(q);
  const $$ = (q,root=document) => [...root.querySelectorAll(q)];
  const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dollar = c => '$'+(Number(c)/100).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const clamped = (input,min,max,fallback) => {const n=Number(input);return Number.isSafeInteger(n)?Math.max(min,Math.min(max,n)):fallback;};
  const badge=(text,kind='simulated')=>`<span class="inline-status ${kind}">${esc(text)}</span>`;
  const action=(name,label,kind='primary-button',disabled=false)=>`<button type="button" class="${kind}" data-action="${esc(name)}" ${disabled?'disabled':''}>${esc(label)}</button>`;
  const header=(n,eyebrow,title,subtitle)=>`<div class="stage-head"><div class="eyebrow">${esc(n)} / ${esc(eyebrow)}</div><h2>${esc(title)}</h2><p>${esc(subtitle)}</p></div>`;
  const bottomScope = scope=>`<div class="bottom-scope"><span>◌</span><strong>${esc(scope)}</strong> · This screen does not create a new purchase, supplier request or payment.</div>`;
  const field=(name,title,value,min,max)=>`<label class="field"><span>${esc(title)}</span><input data-field="${esc(name)}" type="number" inputmode="numeric" min="${min}" max="${max}" step="1" value="${esc(value)}"></label>`;
  const state={evidence:null,stage:0,reached:0,partId:null,proposedQty:20,budget:100,material:'',process:'',drafted:new Set(),workMode:'gate',buyers:1,whatIfBudget:100,selectedOffer:54000,selectedCapture:0};

  function evidenceValid(e){
    const a=e?.case_a,b=e?.case_b,f=e?.coalition_fixture;
    return e?.schema==='legion.try.evidence.v1'&&e?.source?.commit==='2cc7dbdc2b305d92b4fd64614c74bc56b16c4cfe'&&
      a?.engineering_admission==='Z'&&a?.procurement==='BLOCKED'&&a?.new_paypal_captures===0&&a?.vectors?.length===40&&a?.vectors?.every(x=>x.engineering_verdict==='Z'&&Array.isArray(x.missing))&&
      a?.matched_bom_positions===40&&a?.required_bom_positions===40&&
      b?.new_provider_posts===0&&b?.captures?.length===5&&new Set(b?.captures).size===5&&b?.readback_confirmed===true&&b?.judge_checks_passed===63&&b?.judge_checks_total===63&&
      b?.buyers===5&&b?.moq===100&&b?.buyer_cap_cents===10000&&b?.payPal_test_cents===49500&&
      JSON.stringify(b?.offers?.map(x=>x.total_cents))===JSON.stringify([48000,54000,49500])&&
      f?.buyers===5&&f?.units_each===20&&f?.moq===100&&f?.all_in_cents!==b?.payPal_test_cents;
  }
  function currentVector(){return state.evidence?.case_a.vectors.find(v=>v.part_id===state.partId)??null;}
  function title(id){return String(id).replace(/^\d+_/,'').replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase());}
  function sourceLink(text,url){if(!url||!/^https:\/\/github\.com\//.test(url))return '';return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(text)} ↗</a>`;}
  function scope(){return state.stage<=1||(state.stage===2&&state.workMode==='gate')?'CASE A · REAL CAD':state.stage===2?'FIXTURE · SYNTHETIC MOQ':'CASE B · RECORDED SANDBOX';}
  function setStage(i){
    if(i<0||i>4||i>state.reached)return;
    state.stage=i;render();
    if(typeof window.scrollTo==='function')window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
  function advance(to){state.reached=Math.max(state.reached,to);setStage(to);}
  function inspectChoice(id){
    if(!state.evidence.case_a.vectors.some(v=>v.part_id===id))return;
    state.partId=id;state.drafted.clear();state.material='';state.process='';render();
  }
  function sourceSvg(){return `<svg viewBox="0 0 300 180" role="img" aria-label="Schematic navigation illustration; not the original STEP geometry"><defs><linearGradient id="armFill" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#cce1fa"/><stop offset="1" stop-color="#eaf4ff"/></linearGradient></defs><g stroke="#cbdff5" stroke-width=".7" opacity=".65">${Array.from({length:9},(_,i)=>`<path d="M0 ${i*22}h300M${i*37} 0v180"/>`).join('')}</g><g fill="url(#armFill)" stroke="#2d689d" stroke-width="2" transform="translate(24 9)"><path d="M42 145h94v13H42z"/><path d="M77 136h28v-30H77z"/><circle cx="91" cy="102" r="17" fill="#fff"/><path d="M101 91 146 39l17 16-43 50z"/><circle cx="155" cy="46" r="14" fill="#fff"/><path d="M166 39 196 71l-11 12-31-26z"/><circle cx="192" cy="76" r="10" fill="#fff"/><path d="M194 77l17 9-4 9-17-6z"/></g><g fill="#2865a7" font-family="ui-monospace,monospace" font-size="9"><text x="18" y="18">reBot / STEP</text><text x="195" y="154">ASSEMBLY VIEW</text><text x="195" y="166">ILLUSTRATIVE</text></g></svg>`;}
  function drawing(){
    const a=state.evidence.case_a,v=currentVector(),picks=a.vectors.slice(0,4);
    const cards=picks.map((x,i)=>`<button type="button" class="part-choice ${state.partId===x.part_id?'selected':''}" data-part="${esc(x.part_id)}" aria-pressed="${state.partId===x.part_id}"><span class="part-symbol">${String(i+1).padStart(2,'0')}</span><span class="part-choice-text"><strong>${esc(title(x.part_id))}</strong><small>${esc(x.material)} · ×${x.qty}</small></span></button>`).join('');
    const allOptions=a.vectors.map(x=>`<option value="${esc(x.part_id)}" ${state.partId===x.part_id?'selected':''}>${esc(title(x.part_id))}</option>`).join('');
    return `${header('01','SOURCE','Choose a component','Pick one extracted part to see what LEGION knows and what it still needs.')}
      <div class="work-object"><div class="work-object-header"><span>reBot B601-DM · recorded STEP extraction</span>${badge('SOURCE VERIFIED','known')}</div><div class="work-object-body"><div class="source-preview"><div class="drawing-figure">${sourceSvg()}</div><div class="source-facts"><div class="source-fact"><span>BOM matched</span><strong>40 / 40</strong></div><div class="source-fact"><span>Assembly instances</span><strong>${a.part_instances}</strong></div><div class="source-fact"><span>Part definitions</span><strong>${a.part_definitions}</strong></div><div class="source-fact"><span>Engineering</span><strong>${badge('OPEN','unknown')}</strong></div></div></div><p class="tiny-info" style="margin-top:10px">Schematic navigation graphic. Real STEP geometry is source-pinned; no CAD is processed in this browser.</p></div></div>
      <div class="mini-section-title">Select a part from the assembly</div><div class="part-grid">${cards}</div>
      <div class="allparts"><label for="allParts">Or find among all 40</label><select id="allParts"><option value="">Select component…</option>${allOptions}</select></div>
      <div class="stage-action"><span class="action-note">${v?'Selected: '+esc(title(v.part_id)):'Select any component to begin.'}</span>${action('to-vector','Review purchasing vector →','primary-button',!v)}</div>`;
  }
  function vector(){
    const v=currentVector();if(!v)return '';const a=state.evidence.case_a;
    const mats=[...new Set(a.vectors.map(x=>x.material))],procs=[...new Set(a.vectors.map(x=>x.process))];
    const choices=(vals,selected,original)=>`<option value="">As specified · ${esc(original)}</option>`+vals.map(x=>`<option value="${esc(x)}" ${x===selected?'selected':''}>${esc(x)}</option>`).join('');
    const gaps=v.missing.map(x=>`<button type="button" data-gap="${esc(x)}" aria-pressed="${state.drafted.has(x)}" class="requirement ${state.drafted.has(x)?'drafted':''}"><span class="req-toggle">${state.drafted.has(x)?'✓':'+'}</span><strong>${esc(x.replaceAll('_',' '))}</strong><small>${state.drafted.has(x)?'DRAFT ONLY':'MISSING'}</small></button>`).join('');
    return `${header('02','PURCHASING VECTOR','Specify what you want to buy','Keep the original engineering evidence intact. Your edits form a local purchasing proposal.')}
      <div class="vector-header"><div><div class="vector-mini">SOURCE-BOUND PART</div><div class="vector-title">${esc(title(v.part_id))}</div></div>${badge('ENGINEERING Z','unknown')}</div>
      <div class="mini-section-title">From the real BOM</div><div class="source-attributes"><div class="attribute"><span>Source material</span><strong>${esc(v.material)}</strong></div><div class="attribute"><span>Source process</span><strong>${esc(v.process)}</strong></div><div class="attribute"><span>BOM quantity</span><strong>${v.qty} unit(s)</strong></div><div class="attribute"><span>Geometry bounding box (mm)</span><strong>${v.geometry_bbox_mm.map(x=>esc(x)).join(' × ')}</strong></div></div>
      <div class="mini-section-title">Your purchasing intent · editable proposal</div><div class="field-grid">${field('qty','Desired quantity',state.proposedQty,1,1000)}${field('budget','Budget cap per buyer ($)',state.budget,1,100000)}<label class="field"><span>Proposed material</span><select data-field="material">${choices(mats,state.material,v.material)}</select></label><label class="field"><span>Proposed process</span><select data-field="process">${choices(procs,state.process,v.process)}</select></label></div>
      <div class="mini-section-title">Missing requirements · ${state.drafted.size} of ${v.missing.length} marked draft</div><div class="requirement-list">${gaps}</div>
      <p class="local-draft">Drafted ≠ verified. Adding proposed specifications does not lift the engineering HOLD or authorize purchasing.</p>
      <div class="stage-action"><span class="action-note">${state.proposedQty} proposed unit(s) · ${dollar(state.budget*100)} buyer cap</span>${action('to-gate','Inspect engineering decision →')}</div>`;
  }
  function gate(){
    const a=state.evidence.case_a,v=currentVector();
    const rows=[['Rail tolerance',a.rail_tolerance],['Joint-2 torque',a.joint2_load_torque],['Engineering admission',a.engineering_admission]];
    return `${header('03','LEGION AT WORK','One missing fact stops the purchase','LEGION refuses consequential execution when evidence is insufficient. This is the recorded real-CAD decision.')}
      <div class="gate-panel"><div class="gate-icon" aria-hidden="true">⏸</div><div><div class="eyebrow">ACTUAL ENGINEERING VERDICT</div><h3>Procurement on HOLD</h3><p>The reBot source has unresolved requirements. No supplier was contacted and no purchase was authorized.</p></div></div>
      <div class="mini-section-title">Why this decision?</div><div class="gate-why">${rows.map(([label,x])=>`<div class="gate-row"><strong>${esc(label)}</strong>${badge(String(x),x==='OPEN'||x==='Z'?'unknown':'blocked')}</div>`).join('')}</div>
      <div class="tiny-contract">Purchasing vector <strong>${esc(v.part_id)}</strong> remains a proposal. No user-drafted field is treated as independent engineering evidence.</div>
      <div class="case-transfer"><div class="eyebrow">EXPLORE ANOTHER CASE · EXPLICIT SWITCH</div><h3>Can small orders become a viable deal?</h3><p>The real CAD case stops here. Switch to an <strong>independent synthetic MOQ experiment</strong> to see how LEGION aggregates demand. This is not the reBot order.</p><div class="stage-action"><span class="action-note">Separate synthetic fixture · 20 units per buyer · 100 MOQ</span>${action('switch-to-fixture','Explore coalition example →')}</div></div>`;
  }
  function coalition(){
    const f=state.evidence.coalition_fixture,total=state.buyers*f.units_each,met=total>=f.moq;
    const buyers=Array.from({length:5},(_,i)=>`<div class="buyer ${i<state.buyers?'in':''}"><b>${i<state.buyers?'✓':'+'}</b><small>Buyer ${i+1}<br>20 units</small></div>`).join('');
    return `${header('03','LEGION AT WORK','Turn fragmented demand into an order','One buyer cannot meet factory MOQ. Add compatible buyers and watch feasibility change.')}
      <div class="coalition-progress"><div class="caption">COMBINED DEMAND / FACTORY MINIMUM</div><div class="coalition-number">${total}<small> / ${f.moq} units</small></div><div class="meter" role="progressbar" aria-valuenow="${total}" aria-valuemin="0" aria-valuemax="100" aria-label="Factory MOQ fulfilled"><span style="width:${Math.min(100,Math.round(total/f.moq*100))}%"></span></div><div class="buyer-grid">${buyers}</div><div class="buyer-state">${badge(met?'MOQ MET · VIABLE MATCH':'MOQ NOT MET · NO DEAL',met?'known':'unknown')}<span class="tiny-info">${state.buyers} buyer(s) × 20 units</span></div></div>
      <div class="coalition-bridge"><span>① Fragmented demand</span><span class="bridge-line"></span><span>② Coalition</span><span class="bridge-line"></span><span>③ MOQ 100</span></div>
      <div class="stage-action"><span class="action-note">${met?'All five buyers joined. The next recorded contract is a different synthetic case.':'Need '+(f.moq-total)+' more units to reach MOQ.'}</span>${met?action('to-deal','Review recorded negotiation →'):action('add-buyer','Find another buyer +')}</div>
      <div class="local-draft">This MOQ calculation is a local synthetic fixture. It does not claim live supplier discovery, an RFQ, or a contract with the recorded PayPal scenario.</div>`;
  }
  function deal(){
    const b=state.evidence.case_b,cap=state.whatIfBudget,selected=state.selectedOffer;
    const historic={48000:['INVALIDATED','unknown','An injected price shock invalidated the initial version.'],54000:['REJECTED','blocked','Each buyer would pay $108, exceeding the signed $100 cap.'],49500:['SIGNED','known','Seven parties signed this version at $99 per buyer.']};
    const options=b.offers.map(o=>{
      const cents=o.total_cents,each=cents/b.buyers,[decision,kind]=historic[cents];
      return `<button type="button" data-offer="${cents}" aria-pressed="${selected===cents}" class="offer ${selected===cents?'selected':''}"><span class="caption">VERSION ${o.version} · RECORDED</span><strong>${dollar(cents)}</strong><small>${dollar(each)} / buyer</small>${badge(decision,kind)}</button>`;
    }).join('');
    const [decision,kind,why]=historic[selected],each=selected/b.buyers,within=each<=cap*100;
    return `${header('04','RECORDED COMMERCE · CASE B','Reject. Renegotiate. Sign.','Inspect three versions of a separate synthetic deal. Historical decisions stay unchanged when you experiment.')}
      <div class="offer-list">${options}</div>
      <div class="negotiation-result"><div class="eyebrow">RECORDED VERDICT</div><strong>${badge(decision,kind)} ${esc(why)}</strong><p>Contract price ${dollar(selected)} · ${dollar(each)} per buyer · five buyers, 100 units.</p></div>
      <hr class="canvas-divider"><div class="mini-section-title">What if your budget changed?</div><div class="field-grid">${field('what-if','Hypothetical cap per buyer ($)',cap,1,10000)}<div class="attribute"><span>Your draft scenario</span><strong>${badge(within?'WITHIN PROPOSED CAP':'EXCEEDS PROPOSED CAP',within?'known':'blocked')}</strong></div></div>
      <p class="local-draft">Your what-if result is not a new signature. The original $480 invalidation, $540 rejection and $495 signed decision cannot be rewritten.</p>
      <div class="stage-action"><span class="action-note">${selected===49500?'Recorded signed contract selected.':'Select the historically signed $495 version to inspect payments.'}</span>${action('to-paypal','Inspect PayPal evidence →','primary-button',selected!==49500)}</div>`;
  }
  function paypal(){
    const b=state.evidence.case_b,idx=state.selectedCapture,capture=b.captures[idx];
    const buttons=b.captures.map((x,i)=>`<button type="button" data-capture="${i}" aria-pressed="${i===idx}" class="receipt ${i===idx?'active':''}"><span>BUYER ${i+1}</span><strong>$99</strong><small>✓ READBACK</small></button>`).join('');
    return `${header('05','PAYPAL SANDBOX · CASE B','A verified payment has a receipt','Open each recorded Sandbox capture. These are historical test payments—not a new checkout.')}
      <div class="receipt-list">${buttons}</div><div class="receipt-detail"><div class="receipt-detail-head"><span class="caption">SELECTED PAYMENT RECORD</span>${badge('READBACK CONFIRMED','known')}</div><h3 class="mono">${esc(capture)}</h3><div class="receipt-facts"><div class="receipt-row"><span>Buyer</span><strong>${idx+1} of 5</strong></div><div class="receipt-row"><span>Provider-confirmed test amount</span><strong>$99.00</strong></div><div class="receipt-row"><span>Contract hash</span><strong class="mono">${esc(b.contract_hash.slice(0,18))}…</strong></div><div class="receipt-row"><span>New PayPal calls</span><strong>0</strong></div></div></div>
      <div class="completion-bar"><span style="font-size:19px">✓</span><div><strong>5 / 5 recorded Sandbox captures · ${dollar(b.payPal_test_cents)} test money</strong><p>All five were readback-confirmed independently. No manufacturing or shipping is claimed.</p></div></div>
      <div class="stage-action"><span class="action-note">You explored a real CAD hold and two separately identified synthetic commercial examples.</span>${action('restart','Explore another component →')}</div>`;
  }
  const renderer=[drawing,vector,()=>state.workMode==='gate'?gate():coalition(),deal,paypal];
  function intentRail(){
    const v=currentVector(),a=state.evidence.case_a;
    const sc=scope();
    const details=state.stage>=3?`<div class="rail-key">Recorded commercial contract</div><div class="rail-value">Five buyers · 100 units</div><div class="rail-metric"><span>Signed version</span><strong>$495.00</strong></div>`:
      state.stage===2&&state.workMode==='coalition'?`<div class="rail-key">Live local experiment</div><div class="rail-value">${state.buyers} × 20 = ${state.buyers*20} units</div><div class="rail-metric"><span>Factory MOQ</span><strong>100 units</strong></div>`:
      `<div class="rail-key">Current purchasing vector</div><div class="rail-value">${v?state.proposedQty+' proposed units':'Select a source component'}</div><div class="rail-metric"><span>Engineering status</span>${badge(a.engineering_admission,'unknown')}</div>`;
    return `<div class="rail-surface"><div class="rail-label">ACTIVE WORK OBJECT</div><div class="rail-part">${state.stage>=3?'RECORDED SENSOR-MODULE DEAL':state.stage===2&&state.workMode==='coalition'?'COALITION / MOQ':v?esc(title(v.part_id)):'No component selected'}</div>${badge(sc,'simulated')}${details}<div class="scope-block"><strong>Evidence boundary</strong><p>${state.stage>=3?'Recorded synthetic commerce. Not authorized by reBot CAD.':state.stage===2&&state.workMode==='coalition'?'Independent synthetic MOQ fixture. Not a supplier match.':'Real engineering source. Procurement remains blocked.'}</p></div></div>`;
  }
  function decisionRail(){
    const e=state.evidence,a=e.case_a,b=e.case_b,v=currentVector(),sc=scope();
    let verdict,kind,headline,description,rows,source;
    if(state.stage===0){verdict='SOURCE VERIFIED';kind='known';headline='40 matched components';description='Select a real BOM component. Its recorded vector will remain source-bound.';rows=[['Mandatory BOM','40 / 40'],['Instances matched','53 / 53']];source=e.source.cad_source;}
    else if(state.stage===1){verdict='ENGINEERING Z';kind='unknown';headline='Evidence is still missing';description='User drafts are not accepted engineering evidence. No procurement authority is granted.';rows=[['Selected component',title(v.part_id)],['Unverified source requirements',String(v.missing.length)],['Marked draft',String(state.drafted.size)]];source=e.source.bom_readme;}
    else if(state.stage===2&&state.workMode==='gate'){verdict='PROCUREMENT BLOCKED';kind='blocked';headline='Fail closed on unknown';description='The recorded ZTL engineering verdict is OPEN. No supplier or payment action may follow.';rows=[['Rail tolerance','Z'],['Joint-2 torque','OPEN'],['RFQ',a.rfq]];source=e.source.evidence_guide;}
    else if(state.stage===2){verdict=state.buyers===5?'MOQ MET':'MOQ NOT MET';kind=state.buyers===5?'known':'unknown';headline=state.buyers===5?'100 units assembled':'More demand required';description='A local arithmetic example, separate from both the reBot run and recorded PayPal contract.';rows=[['Buyers',String(state.buyers)],['Combined units',String(state.buyers*20)],['MOQ','100']];source=e.coalition_fixture.source;}
    else if(state.stage===3){const row=b.offers.find(o=>o.total_cents===state.selectedOffer);verdict=row?.version===3?'HISTORICALLY SIGNED':row?.version===2?'HISTORICALLY REJECTED':'HISTORICALLY INVALIDATED';kind=row?.version===3?'known':row?.version===2?'blocked':'unknown';headline='Consent is version-bound';description='A changing offer cannot silently override the original buyer budgets.';rows=[['Judge','63 / 63 PASS'],['Signed cap','$100 / buyer'],['Recorded signed','$495 total']];source=b.source;}
    else{verdict='5 / 5 READBACK';kind='known';headline='Payment evidence';description='Five recorded PayPal Sandbox captures, bound to a separate synthetic contract.';rows=[['Total test captures','$495'],['Live customer charges','$0'],['Real CAD payments','0']];source=b.source;}
    return `<div class="rail-surface"><div class="rail-label">DECISION INSPECTOR</div>${badge(verdict,kind)}<div class="decision-title">${esc(headline)}</div><p class="decision-desc">${esc(description)}</p>${rows.map(([k,x])=>`<div class="context-row"><span>${esc(k)}</span><strong>${esc(x)}</strong></div>`).join('')}<details class="evidence-details"><summary>Why this decision? · evidence</summary><div><p><strong>Evidence scope:</strong> ${esc(sc)}</p><p><strong>Source commit:</strong> ${esc(e.source.commit)}</p><p><strong>Original STEP SHA-256:</strong> ${esc(e.source.cad_sha256)}</p>${sourceLink('Inspect primary evidence',source)}</div></details></div>`;
  }
  function render(){
    if(!state.evidence)return;
    $$('#app [data-stage]').forEach(b=>{const n=Number(b.dataset.stage),active=n===state.stage;b.disabled=n>state.reached;b.classList.toggle('active',active);b.classList.toggle('completed',n<state.stage);b.setAttribute('aria-current',active?'step':'false');});
    $('#app').classList.toggle('in-session',state.stage>0);$('#app').dataset.activeStep=String(state.stage);
    $('#workspaceTitle').textContent=state.stage===0?'What do you need to make?':state.stage>=3?'Recorded commerce · Case B':state.stage===2&&state.workMode==='coalition'?'Independent MOQ example':title(state.partId||'Purchasing intent');
    $('#intentRail').innerHTML=intentRail();$('#decisionRail').innerHTML=decisionRail();
    $('#workCanvas').innerHTML=`<div class="stage-content">${renderer[state.stage]()}</div>${bottomScope(scope())}`;
  }
  function handleAction(type){
    switch(type){
      case 'to-vector':if(state.partId)advance(1);break;
      case 'to-gate':if(state.partId){state.workMode='gate';advance(2);}break;
      case 'switch-to-fixture':state.buyers=1;state.workMode='coalition';render();break;
      case 'add-buyer':if(state.stage===2&&state.workMode==='coalition')state.buyers=Math.min(5,state.buyers+1);render();break;
      case 'to-deal':if(state.workMode==='coalition'&&state.buyers===5){state.selectedOffer=54000;advance(3);}break;
      case 'to-paypal':if(state.stage===3&&state.selectedOffer===49500)advance(4);break;
      case 'restart':state.stage=0;state.reached=0;state.partId=null;state.proposedQty=20;state.budget=100;state.material='';state.process='';state.drafted.clear();state.workMode='gate';state.buyers=1;state.whatIfBudget=100;state.selectedOffer=54000;state.selectedCapture=0;render();break;
      default:break;
    }
  }
  document.addEventListener('click',ev=>{
    const el=ev.target.closest('[data-action],[data-part],[data-gap],[data-offer],[data-capture],[data-stage]');
    if(!el||el.disabled)return;
    if(el.dataset.stage!==undefined){setStage(Number(el.dataset.stage));return;}
    if(el.dataset.part!==undefined){inspectChoice(el.dataset.part);return;}
    if(el.dataset.gap!==undefined){const g=el.dataset.gap,v=currentVector();if(v?.missing.includes(g)){state.drafted.has(g)?state.drafted.delete(g):state.drafted.add(g);render();}return;}
    if(el.dataset.offer!==undefined){const cents=Number(el.dataset.offer);if(state.evidence.case_b.offers.some(o=>o.total_cents===cents)){state.selectedOffer=cents;render();}return;}
    if(el.dataset.capture!==undefined){state.selectedCapture=clamped(el.dataset.capture,0,4,0);render();return;}
    if(el.dataset.action!==undefined)handleAction(el.dataset.action);
  });
  document.addEventListener('change',ev=>{
    const el=ev.target;if(el.id==='allParts'){if(el.value)inspectChoice(el.value);return;}
    const key=el.dataset.field;if(!key)return;
    const val=el.value;
    if(key==='qty')state.proposedQty=clamped(val,1,1000,20);
    else if(key==='budget')state.budget=clamped(val,1,100000,100);
    else if(key==='what-if')state.whatIfBudget=clamped(val,1,10000,100);
    else if(key==='material'){const choices=new Set(state.evidence.case_a.vectors.map(v=>v.material));state.material=choices.has(val)?val:'';}
    else if(key==='process'){const choices=new Set(state.evidence.case_a.vectors.map(v=>v.process));state.process=choices.has(val)?val:'';}
    render();
  });
  document.addEventListener('DOMContentLoaded',async()=>{
    try{
      const response=await fetch(EVIDENCE_URL,{cache:'no-store'});
      if(!response.ok)throw Error('Pinned evidence cannot be retrieved (HTTP '+response.status+')');
      const evidence=await response.json();
      if(!evidenceValid(evidence))throw Error('Pinned source contract failed closed');
      state.evidence=evidence;$('#workspace').hidden=false;$('#loading').hidden=true;render();
    }catch(e){$('#loading').hidden=true;$('#loadError').hidden=false;$('#loadError').textContent='NO-GO · '+String(e.message||e);}
  });
})();
