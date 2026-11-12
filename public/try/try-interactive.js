/* LEGION TRY-INTERACTIVE-003: evidence-bound, read-only customer decision laboratory.
 * This is a progressive enhancement of the existing pinned /try/ UI.
 * Invariants: no POSTs, no new payments, no supplier messages, no engineering admission upgrades.
 * CASE A CAD, distinct MOQ fixture, and CASE B recorded commerce remain separate.
 */
(() => {
  'use strict';
  const URL_EVIDENCE = './evidence.json';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = c => '$' + (Number(c) / 100).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const cleanInt = (v, lo, hi, fallback) => { const n = Number(v); return Number.isSafeInteger(n) ? Math.max(lo,Math.min(hi,n)) : fallback; };
  const state = {
    evidence:null, partId:null, proposedQty:20, proposedBudget:100,
    proposedMaterial:'', proposedProcess:'', supplied:new Set(),
    budgetCap:100, inspectedCapture:null, coalitionStarted:false,
    revealedNode:'ENGINEERING', discoveries:new Set(), stage:0,
    lastPart:null
  };
  const $ = (s,root=document) => root.querySelector(s);
  const all = (s,root=document) => [...root.querySelectorAll(s)];
  const sourceBadge = (text,kind='neutral') => `<span class="lab-pill lab-${kind}">${esc(text)}</span>`;
  const panelTitle = (number,title,subtitle) => `<div class="lab-heading"><span class="lab-step-number">INTERACTIVE LAB / ${number}</span><h3>${esc(title)}</h3><p>${esc(subtitle)}</p></div>`;
  const localNotice = label => `<div class="lab-provenance"><strong>READ-ONLY ${esc(label)}</strong> <span>Changes here are local explorations, not new verified executions or payments.</span></div>`;
  const button = (action,label,extra='') => `<button type="button" class="lab-button ${extra}" data-lab-action="${esc(action)}">${esc(label)}</button>`;
  const input = (name,label,value,min,max,step=1) => `<label class="lab-field"><span>${esc(label)}</span><input data-lab-field="${esc(name)}" type="number" value="${esc(value)}" min="${min}" max="${max}" step="${step}" /></label>`;

  function currentStage(){
    const x = Number((/step=(\d)/.exec(location.hash)||[])[1]);
    if(x >= 1 && x <= 5) return x-1;
    const selected = $('[data-stage][aria-current="step"]');
    return selected ? Number(selected.dataset.stage) : 0;
  }
  function part(){
    const list = state.evidence?.case_a?.vectors ?? [];
    const selected = $('#vectorSelect')?.value || state.partId;
    return list.find(v => v.part_id === selected) || list[0];
  }
  function navigate(index){
    const btn = $(`.step[data-stage="${index}"]`);
    if(btn) btn.click();
  }
  function selectPart(id){
    if(!state.evidence.case_a.vectors.some(v=>v.part_id===id)) return;
    state.partId=id;state.supplied.clear();
    navigate(1);
    const select=$('#vectorSelect');
    if(select){select.value=id;select.dispatchEvent(new Event('change',{bubbles:true}));}
    state.discoveries.add('drawing');
    schedule();
  }
  function actualBuyerCount(){return cleanInt($('#buyerOutput')?.textContent,1,5,1);}
  function resetBuyers(){
    let n=0;
    while(actualBuyerCount()>1 && n++<5){const b=$('#minusBuyer');if(!b) break;b.click();}
  }
  function addBuyer(){
    $('#plusBuyer')?.click();
    if(actualBuyerCount()>=5) state.discoveries.add('coalition');
  }
  function versionCents(){
    const pressed=$('[data-offer][aria-pressed="true"]');
    return pressed ? Number(pressed.dataset.offer) : 54000;
  }
  function renderDrawing(){
    const e=state.evidence;
    const candidates=[...e.case_a.vectors.slice(0,2), ...e.case_a.vectors.slice(2,4)];
    const tiles=candidates.map((v,i)=>`<button type="button" class="lab-component" data-lab-part="${esc(v.part_id)}"><span class="lab-component-index">${String(i+1).padStart(2,'0')}</span><strong>${esc(v.part_id.replaceAll('_',' '))}</strong><small>${esc(v.material)} · ${esc(v.process)}</small><span class="lab-tile-action">INSPECT PURCHASING VECTOR ↗</span></button>`).join('');
    return panelTitle('01','Choose a real engineering component','Select a component from the pinned reBot STEP extraction. Each choice opens its source-bound purchasing vector.')+
      `<div class="lab-component-grid">${tiles}</div>`+
      `<div class="lab-tail"><span>${sourceBadge('40 SOURCE-BOUND VECTORS','good')} ${sourceBadge('ENGINEERING ADMISSION: Z','warn')}</span>${button('explore-parts','Explore all 40 parts →','lab-primary')}</div>`+
      localNotice('CASE A · REAL CAD');
  }
  function options(values, selected){return values.map(v=>`<option value="${esc(v)}" ${v===selected?'selected':''}>${esc(v)}</option>`).join('');}
  function renderParts(){
    const a=state.evidence.case_a,v=part();if(!v)return '';
    if(v.part_id!==state.lastPart){state.lastPart=v.part_id;state.supplied.clear();state.proposedMaterial='';state.proposedProcess='';}
    const mats=[...new Set(a.vectors.map(x=>x.material))];
    const procs=[...new Set(a.vectors.map(x=>x.process))];
    const missing=v.missing||[];
    const supplied=missing.filter(x=>state.supplied.has(x)).length;
    const fields=missing.map(req=>`<button type="button" class="lab-requirement ${state.supplied.has(req)?'lab-drafted':''}" data-lab-req="${esc(req)}"><span>${state.supplied.has(req)?'✓':'+'}</span><strong>${esc(req.replaceAll('_',' '))}</strong><small>${state.supplied.has(req)?'DRAFT INPUT · NOT VERIFIED':'MISSING SOURCE EVIDENCE'}</small></button>`).join('');
    return panelTitle('02','Build a purchasing vector','Experiment with quantity, budget and proposed specifications. The original CAD facts remain unchanged.')+
      `<div class="lab-columns"><div class="lab-panel"><span class="lab-caption">YOUR PURCHASING INTENT</span><div class="lab-inline-fields">${input('qty','Desired quantity',state.proposedQty,1,1000)}${input('budget','Maximum budget per buyer ($)',state.proposedBudget,1,100000)}</div>`+
      `<label class="lab-field"><span>Proposed material</span><select data-lab-field="material"><option value="">Source: ${esc(v.material)}</option>${options(mats,state.proposedMaterial)}</select></label>`+
      `<label class="lab-field"><span>Proposed process</span><select data-lab-field="process"><option value="">Source: ${esc(v.process)}</option>${options(procs,state.proposedProcess)}</select></label>`+
      `<div class="lab-vector-preview"><span>VECTOR / ${esc(v.part_id)}</span><strong>${esc(state.proposedQty)} units</strong><small>Budget ceiling ${money(Math.round(state.proposedBudget*100))}. Material: ${esc(state.proposedMaterial||v.material)}. Process: ${esc(state.proposedProcess||v.process)}.</small></div></div>`+
      `<div class="lab-panel"><span class="lab-caption">REQUIREMENTS TO RESOLVE</span><div class="lab-progress"><div class="lab-meter"><span style="width:${Math.round(100*supplied/Math.max(missing.length,1))}%"></span></div><strong>${supplied}/${missing.length} drafted</strong></div>`+
      `<div class="lab-requirements">${fields}</div><div class="lab-caution">Drafted ≠ independently verified. ${sourceBadge('Z / OPEN','warn')} Procurement remains blocked for this real CAD case.</div></div></div>`+
      `<div class="lab-tail">${button('reset-vector','Reset proposals')}${button('view-work','See why LEGION holds this purchase →','lab-primary')}</div>`+
      localNotice('CASE A · EDITABLE PROPOSAL · NO RFQ SENT');
  }
  const nodes=[
    {id:'ENGINEERING',name:'ZTL Engineer',status:'Z',kind:'warn',case:'CASE A',description:'Real CAD and BOM were extracted; rail tolerance and joint-2 torque evidence remain OPEN. Engineering admission is Z.'},
    {id:'FORMAL',name:'Formal Core',status:'BLOCKED',kind:'bad',case:'CASE A',description:'An unknown engineering requirement cannot authorize a real supplier request or payment.'},
    {id:'FEDERATION',name:'Federation',status:'SIMULATION',kind:'neutral',case:'MOQ FIXTURE',description:'A separate local demonstration groups five buyers of 20 units to meet a factory MOQ of 100.'},
    {id:'MARKETPLACE',name:'Marketplace',status:'REPLAY',kind:'neutral',case:'CASE B',description:'A separate recorded synthetic scenario reaches a coalition. No new supplier search is executed by this page.'},
    {id:'COMMERCE',name:'Deal Rescue',status:'63/63 PASS',kind:'good',case:'CASE B',description:'The recorded price of $540 is rejected over budget. The $495 version was signed by seven parties and independently judged.'},
    {id:'PAYPAL',name:'PayPal Sandbox',status:'5/5 READBACK',kind:'good',case:'CASE B',description:'Five historical test-money captures are independently readback-confirmed, bound to CASE B only. No fresh captures occur here.'}
  ];
  function renderWork(){
    const e=state.evidence,m=e.coalition_fixture,n=actualBuyerCount(),units=n*m.units_each;
    const active=nodes.find(x=>x.id===state.revealedNode)||nodes[0];
    const cards=nodes.map(x=>`<button class="lab-node ${x.id===active.id?'lab-node-active':''}" type="button" data-lab-node="${x.id}"><span>${esc(x.case)}</span><strong>${esc(x.name)}</strong>${sourceBadge(x.status,x.kind)}</button>`).join('');
    const spots=Array.from({length:5},(_,i)=>`<span class="lab-buyer ${i<n?'lab-buyer-in':''}"><b>${i<n?'●':'+'}</b> Buyer ${i+1} <small>20 units</small></span>`).join('');
    return panelTitle('03','Run the coalition experiment','Start with one buyer whose order is too small. Add compatible demand until the minimum order becomes feasible.')+
      `<div class="lab-columns"><div class="lab-panel"><span class="lab-caption">SEPARATE SYNTHETIC MOQ FIXTURE</span><div class="lab-big-number">${units} <small>/ ${m.moq} units</small></div><div class="lab-meter lab-wide"><span style="width:${Math.round(100*units/m.moq)}%"></span></div>`+
      `<div class="lab-buyer-row">${spots}</div><div class="lab-status-row">${sourceBadge(units>=m.moq?'MOQ MET · MATCH POSSIBLE':'MOQ NOT MET · NO DEAL',units>=m.moq?'good':'warn')}</div>`+
      `<div class="lab-tail">${button('reset-buyers','Reset to one buyer')}${button('add-buyer',units>=m.moq?'All 5 buyers found':'Find another buyer +','lab-primary'+(units>=m.moq?' lab-done':''))}</div></div>`+
      `<div class="lab-panel"><span class="lab-caption">OPEN THE INFRASTRUCTURE</span><div class="lab-node-grid">${cards}</div><div class="lab-node-detail"><span>${esc(active.case)}</span><h4>${esc(active.name)} ${sourceBadge(active.status,active.kind)}</h4><p>${esc(active.description)}</p></div></div></div>`+
      `<div class="lab-tail">${button('view-review','Inspect the separately recorded deal →','lab-primary')}</div>`+
      localNotice('CASE A / MOQ FIXTURE / CASE B KEPT DISTINCT');
  }
  function renderReview(){
    const b=state.evidence.case_b,c=state.budgetCap,selected=versionCents();
    const blocks=b.offers.map(o=>{
      const unit=o.total_cents/b.buyers, inBudget=unit<=c*100;
      return `<button type="button" class="lab-offer ${selected===o.total_cents?'lab-offer-selected':''}" data-lab-offer="${o.total_cents}"><span>VERSION ${o.version} · HISTORICAL</span><strong>${money(o.total_cents)}</strong><small>${money(unit)} / buyer</small><span>${sourceBadge(o.version===3?'RECORDED SIGNED':o.version===2?'RECORDED REJECT':'RECORDED INVALIDATED',o.version===3?'good':o.version===2?'bad':'warn')}</span><em>${inBudget?'Within your hypothetical budget':'Exceeds your hypothetical budget'}</em></button>`;
    }).join('');
    const selectedUnit=selected/b.buyers, hypothetical=selectedUnit<=c*100;
    return panelTitle('04','Negotiate without losing the evidence','Change your budget to test a new scenario. The historical contract decisions never change.')+
      `<div class="lab-inline-fields">${input('cap','Your hypothetical budget per buyer ($)',c,1,10000)}</div>`+
      `<div class="lab-offer-grid">${blocks}</div><div class="lab-scenario-result"><strong>YOUR WHAT-IF:</strong> Selected ${money(selected)} = ${money(selectedUnit)} per buyer. ${sourceBadge(hypothetical?'WITHIN DRAFT CAP':'OVER DRAFT CAP',hypothetical?'good':'bad')}<p>Budget changes are local; they do not rewrite historical signatures or the independent Judge. The recorded seven-party signed contract is version 3 ($495).</p></div>`+
      `<div class="lab-tail">${button('reset-budget','Reset budget')}${button('view-paypal','Inspect confirmed Sandbox receipts →','lab-primary')}</div>`+
      localNotice('CASE B · HISTORICAL CONTRACTS + LOCAL WHAT-IF');
  }
  function renderPayPal(){
    const b=state.evidence.case_b,ids=b.captures||[];
    const id=ids.includes(state.inspectedCapture)?state.inspectedCapture:ids[0];
    const items=ids.map((x,i)=>`<button type="button" data-lab-capture="${esc(x)}" class="lab-capture ${x===id?'lab-capture-active':''}"><span>BUYER ${i+1} · SANDBOX</span><strong>${money(9900)}</strong><small>${esc(x)}</small>${sourceBadge('READBACK CONFIRMED','good')}</button>`).join('');
    return panelTitle('05','Open the payment evidence','Inspect what was actually confirmed by PayPal Sandbox in the separate recorded commerce case.')+
      `<div class="lab-capture-grid">${items}</div><div class="lab-payment-detail"><span class="lab-caption">PROVIDER READBACK · RECORDED TEST MONEY ONLY</span><h4>${esc(id)}</h4><div class="lab-payment-facts"><span>Amount <strong>$99.00</strong></span><span>Contract <strong class="lab-mono">${esc(b.contract_hash.slice(0,16))}…</strong></span><span>Provider receipt ${sourceBadge('T · READBACK','good')}</span></div><p>Five captures total ${money(b.payPal_test_cents)}. No new PayPal API request, supplier order or real-CAD purchase is created by this page.</p><a class="lab-evidence-link" target="_blank" rel="noopener noreferrer" href="${esc(b.source)}">Inspect original PayPal evidence ↗</a></div>`+
      `<div class="lab-tail">${button('replay-deal','Replay the coalition')}${button('try-another','Explore another real CAD part →','lab-primary')}</div>`+
      localNotice('CASE B · HISTORICAL PAYPAL SANDBOX · ZERO LIVE CHARGES');
  }
  const views=[renderDrawing,renderParts,renderWork,renderReview,renderPayPal];
  let scheduled=false;
  function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;mount();});}
  function mount(){
    if(!state.evidence)return;
    const main=$('#stageContent');if(!main||$('#loadError:not([hidden])'))return;
    const body=$('.stage-body',main);if(!body)return;
    const newStage=currentStage();
    if(newStage===2 && !state.coalitionStarted){
      state.coalitionStarted=true;
      resetBuyers();
      // Core rerenders synchronously; use the latest stage-body.
    }
    const dest=$('.stage-body',main);if(!dest)return;
    const old=$('#legionInteractiveLab',dest);
    if(old && old.dataset.labStage===String(newStage))return;
    if(old)old.remove();
    state.stage=newStage;
    const container=document.createElement('section');
    container.id='legionInteractiveLab';container.className='legion-lab';
    container.dataset.labStage=String(newStage);
    container.setAttribute('aria-label','LEGION interactive decision lab');
    container.innerHTML=views[newStage]();
    dest.prepend(container);
  }
  function repaint(){
    const container=$('#legionInteractiveLab');if(!container)return;
    container.innerHTML=views[state.stage]();
  }
  function handleAction(action){
    switch(action){
      case 'explore-parts':navigate(1);break;
      case 'view-work':state.discoveries.add('vector');navigate(2);break;
      case 'view-review':navigate(3);break;
      case 'view-paypal':navigate(4);break;
      case 'reset-vector':state.proposedQty=20;state.proposedBudget=100;state.proposedMaterial='';state.proposedProcess='';state.supplied.clear();repaint();break;
      case 'add-buyer':addBuyer();break;
      case 'reset-buyers':resetBuyers();break;
      case 'reset-budget':state.budgetCap=100;repaint();break;
      case 'replay-deal':navigate(2);resetBuyers();break;
      case 'try-another':state.partId=null;state.supplied.clear();navigate(0);break;
      default:break;
    }
  }
  document.addEventListener('click',ev=>{
    const button=ev.target.closest('[data-lab-action],[data-lab-part],[data-lab-req],[data-lab-node],[data-lab-offer],[data-lab-capture]');
    if(!button||!$('#legionInteractiveLab')?.contains(button))return;
    if(button.dataset.labPart){selectPart(button.dataset.labPart);return;}
    if(button.dataset.labReq){const val=button.dataset.labReq;state.supplied.has(val)?state.supplied.delete(val):state.supplied.add(val);repaint();return;}
    if(button.dataset.labNode){state.revealedNode=button.dataset.labNode;repaint();return;}
    if(button.dataset.labOffer){const price=Number(button.dataset.labOffer);const original=$(`[data-offer="${price}"]`);original?.click();state.discoveries.add('review');schedule();return;}
    if(button.dataset.labCapture){state.inspectedCapture=button.dataset.labCapture;state.discoveries.add('paypal');repaint();return;}
    if(button.dataset.labAction)handleAction(button.dataset.labAction);
  });
  document.addEventListener('change',ev=>{
    if(ev.target.id==='vectorSelect'){
      state.partId=ev.target.value;state.supplied.clear();state.lastPart=null;schedule();return;
    }
    const field=ev.target.dataset?.labField;
    if(!field)return;
    const v=ev.target.value;
    if(field==='qty')state.proposedQty=cleanInt(v,1,1000,20);
    else if(field==='budget')state.proposedBudget=cleanInt(v,1,100000,100);
    else if(field==='cap')state.budgetCap=cleanInt(v,1,10000,100);
    else if(field==='material'){const list=new Set(state.evidence.case_a.vectors.map(x=>x.material));state.proposedMaterial=list.has(v)?v:'';}
    else if(field==='process'){const list=new Set(state.evidence.case_a.vectors.map(x=>x.process));state.proposedProcess=list.has(v)?v:'';}
    repaint();
  });
  // The original page owns navigation and renders verified facts. Observe stage transitions only.
  const observer=new MutationObserver(schedule);
  document.addEventListener('DOMContentLoaded',()=>{
    // Fetch only the already-published local evidence. Never POST or call an external API.
    fetch(URL_EVIDENCE,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Evidence unavailable');return r.json()}).then(e=>{
      if(e.schema!=='legion.try.evidence.v1'||e.case_a?.engineering_admission!=='Z'||e.case_a?.procurement!=='BLOCKED'||e.case_a?.new_paypal_captures!==0||e.case_a?.vectors?.length!==40||e.case_b?.captures?.length!==5||e.case_b?.new_provider_posts!==0)throw Error('Evidence fail-closed gate');
      state.evidence=e;
      observer.observe($('#stageContent'),{childList:true,subtree:true});
      schedule();
    }).catch(err=>{console.error('LEGION interactive lab disabled; evidence failed closed',err);});
  });
})();
