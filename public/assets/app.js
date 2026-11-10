/* LEGION Netlify Drop. Client-only intake is a deterministic preflight, never a ZTL proof. */
(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const html={file:$('fileInput'),box:$('dropArea'),workspace:$('workspace')};
  let current=null, runtime={nim_ready:false,engineering_backend_ready:false,paypal_backend_ready:false,agent_runtime_ready:false};
  const maxBytes=8*1024*1024;
  const sample={
    id:'SAMPLE-2026-11',name:'sensor_assembly_rev_B.dxf',digest:'sample-drawing-not-cryptographically-signed',
    sample:true,format:'fixture',parts:[{name:'M12 proximity sensor · PNP/NO · nonflush',part_number:'BES00UY',qty:20,revision:'B',material:'manufacturer spec required',process:'purchased assembly',tolerance:'unknown',origin:'sample fixture'}],
    routes:[
      {id:'direct',name:'Buy direct',detail:'Retail route · no other buyers needed',total:42500,shipping:2500,valid:'fixture'},
      {id:'batch',name:'Join an existing batch',detail:'80 of 100 units already requested',total:45500,shipping:2500,valid:'fixture'},
      {id:'coalition',name:'Create a group of five',detail:'5 consenting buyers × 20 · each pays own shipping',total:48500,shipping:2500,valid:'fixture'}
    ],selected:'direct',parseStatus:'Sample requirements only',parseNote:'Fixture part list. No independent verification, actual quotes or supplier commitments.'
  };
  function escapeName(x){return String(x||'Unknown part').slice(0,180)}
  function normalizePart(p,index){
    const qty=Number(p.qty??p.quantity??p.count??1);
    return {
      name:escapeName(p.name??p.description??p.part??p.component??p.part_number??p.sku??('Part '+(index+1))),
      part_number:escapeName(p.part_number??p.partNumber??p.sku??p.block??''),
      qty:Number.isSafeInteger(qty)&&qty>0&&qty<=1000000?qty:0,
      revision:escapeName(p.revision??p.rev??''),
      material:escapeName(p.material??''),process:escapeName(p.process??''),
      tolerance:escapeName(p.tolerance??''),origin:escapeName(p.origin??'file')
    }
  }
  function csvRows(text){
    const rows=[]; let cells=[],cell='',q=false;
    for(let i=0;i<text.length;i++){
      const c=text[i];
      if(c==='"'){if(q&&text[i+1]==='"'){cell+='"';i++}else q=!q}
      else if(c===','&&!q){cells.push(cell);cell=''}
      else if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&text[i+1]==='\n')i++;cells.push(cell);if(cells.some(v=>v.trim()))rows.push(cells);cells=[];cell=''}
      else cell+=c;
    }
    if(q)throw new Error('CSV has an unclosed quotation mark.');
    cells.push(cell);if(cells.some(v=>v.trim()))rows.push(cells);
    if(rows.length<2)throw new Error('CSV requires a header and at least one component row.');
    let heads=rows[0].map(x=>x.trim().toLowerCase().replace(/[\s-]+/g,'_'));
    if(!heads.some(x=>['part_number','name','description','component','part','sku'].includes(x)))throw new Error('CSV needs a part_number, name or description column.');
    return rows.slice(1).map((r,i)=>{let p={};heads.forEach((h,j)=>p[h]=r[j]);return normalizePart(p,i)})
  }
  function dxfRows(text){
    // Conservative text DXF parser: only explicit INSERT block names and exact counts.
    if(!/\bSECTION\b/.test(text)||!/(?:^|\r?\n)\s*INSERT\s*(?:\r?\n|$)/m.test(text))throw new Error('No explicit INSERT components in text DXF. Geometry alone is not a BOM.');
    const lines=text.replace(/\r/g,'').split('\n');const count=new Map();
    for(let i=0;i<lines.length-1;i++){
      if(lines[i].trim()!=='0'||lines[i+1].trim()!=='INSERT')continue;
      let block='';
      for(let j=i+2;j<lines.length-1;j+=2){
        const k=lines[j].trim(),v=lines[j+1].trim();
        if(k==='0')break;
        if(k==='2'&&!block)block=v;
      }
      if(block&&!/^\*/.test(block))count.set(block,(count.get(block)||0)+1)
    }
    if(!count.size)throw new Error('DXF has no named INSERT blocks to use as explicit parts.');
    return [...count].map(([name,qty],i)=>normalizePart({name,part_number:name,qty},i))
  }
  function svgRows(text){
    const doc=new DOMParser().parseFromString(text,'image/svg+xml');
    if(doc.querySelector('parsererror'))throw new Error('SVG syntax error.');
    const elements=Array.from(doc.querySelectorAll('[data-part-number],[data-part],[data-component]'));
    if(!elements.length)throw new Error('SVG has no explicit data-part-number/data-part component annotations.');
    const count=new Map();elements.forEach(el=>{
      const key=el.getAttribute('data-part-number')||el.getAttribute('data-part')||el.getAttribute('data-component');
      const qty=Number(el.getAttribute('data-qty')||1);
      if(!key||!Number.isSafeInteger(qty)||qty<1)throw new Error('Invalid annotated SVG part quantity.');
      count.set(key,(count.get(key)||0)+qty);
    });return [...count].map(([key,qty],i)=>normalizePart({name:key,part_number:key,qty},i))
  }
  async function sha256(buffer){
    if(!crypto.subtle)throw new Error('A secure HTTPS context is required for drawing fingerprints.');
    return [...new Uint8Array(await crypto.subtle.digest('SHA-256',buffer))].map(x=>x.toString(16).padStart(2,'0')).join('');
  }
  async function intakeFile(file){
    if(!file||file.size>maxBytes)throw new Error('Please use a drawing no larger than 8 MB.');
    const ext=file.name.split('.').pop().toLowerCase();
    const buffer=await file.arrayBuffer();const digest=await sha256(buffer);
    const text=new TextDecoder().decode(buffer);
    let parts=[],parseNote='';
    if(ext==='csv')parts=csvRows(text);
    else if(ext==='json'){
      const data=JSON.parse(text);const items=Array.isArray(data)?data:(data.parts||data.components||data.bom||data.lines);
      if(!Array.isArray(items)||!items.length)throw new Error('JSON needs a nonempty parts/components/bom/lines array.');
      parts=items.map(normalizePart)
    }else if(ext==='dxf')parts=dxfRows(text);
    else if(ext==='svg')parts=svgRows(text);
    else if(['pdf','step','stp','stl'].includes(ext)){
      parseNote='A connected engineering backend is required to extract an authoritative BOM from this file. No parts were guessed.';
    }else throw new Error('Supported: DXF INSERTs, CSV/JSON part lists, annotated SVG. PDF/STEP/STL require backend.');
    if(parts.length>2000)throw new Error('Too many components for browser preflight; use the engineering backend.');
    if(parts.some(p=>p.qty===0))throw new Error('Each component requires a positive integer quantity.');
    return {id:'LOCAL-'+digest.slice(0,12).toUpperCase(),name:file.name,digest,sample:false,
       format:ext,parts,routes:[],selected:'direct',parseStatus:parts.length?'Parts extracted locally':'Server review required',parseNote}
  }
  function number(n){return Intl.NumberFormat('en-US').format(n)}
  function money(cents){return '$'+(cents/100).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
  function node(tag,cls,txt){let el=document.createElement(tag);if(cls)el.className=cls;if(txt!==undefined)el.textContent=String(txt);return el}
  function set(id,s){$(id).textContent=s}
  function openCurrent(value){current=value;render();html.workspace.hidden=false;html.workspace.scrollIntoView({behavior:'smooth',block:'start'})}
  function render(){
    const c=current;if(!c)return;
    set('workTitle',c.sample?'See how a small order can work':'Your drawing, your procurement workspace');
    set('workSubtitle',c.sample?'Explore a sample one-part purchase. All prices and buyers here are simulated.':'Local BOM extraction has started. Supplier and engineering approvals require secure connected services.');
    set('modeBadge',c.sample?'SAMPLE · NO LIVE TRANSACTIONS':'YOUR FILE · LOCAL PREFLIGHT');
    set('drawingName',c.name);set('drawingDigest',c.sample?'Sample fixture · no file fingerprint':'SHA-256 '+c.digest.slice(0,16)+'…');
    set('parseStatus',c.parseStatus);set('reviewDrawing',c.sample?'Sample metadata only':c.parts.length?c.parts.length+' component line(s) extracted · not independently verified':'Upload recorded · BOM extraction awaiting engineering backend');
    set('engineeringStatus','Evidence needed');
    $('bomRows').replaceChildren();
    for (const p of c.parts){
      const row=node('div','partline'); const a=node('div');a.append(node('span','partname',p.name),node('span','partmeta',[p.part_number&&('SKU: '+p.part_number),p.revision&&('Rev '+p.revision),p.material&&('Material: '+p.material)].filter(Boolean).join(' · ')||'Specifications incomplete'));
      row.append(a,node('div','partqty','×'+number(p.qty)),node('div','partstate','Needs proof'));$('bomRows').append(row);
    }
    if(!c.parts.length)$('bomRows').append(node('p','inline-note',c.parseNote||'No components found. Manual review is required.'));
    $('bomSummary').replaceChildren();const total=c.parts.reduce((s,p)=>s+p.qty,0);
    for(const msg of [c.parts.length+' BOM line(s)',number(total)+' units',c.sample?'Sample values':(c.parts.length?'Real file, local extraction only':'No guessed items')])$('bomSummary').append(node('span','fact',msg));
    set('summaryQty',c.parts.length?number(total)+' units':'Pending BOM');set('nextStep',c.sample?'Select a sample option to see how 20 units can fit a factory MOQ of 100. No real supplier is contacted.':c.parts.length?'Obtain supplier evidence and engineering sign-off for every component before payment.':'Connect engineering backend or provide an annotated BOM.');
    const routes=c.sample?c.routes:[
      {id:'direct',name:'Buy directly',detail:'Source real retail quotes · permissioned feed needed'},
      {id:'batch',name:'Join an open batch',detail:'Find a compatible MOQ allocation · no live feed connected'},
      {id:'coalition',name:'Group buyers',detail:'Opt-in demand only · each buyer pays own shipping'}
    ];
    $('routeList').replaceChildren();
    routes.forEach(r=>{
      const b=node('button','route'+(r.id===c.selected?' selected':''));b.type='button';
      const left=node('span');left.append(node('strong','',r.name),node('small','',r.detail));
      const amt=node('span','amount',c.sample?money(r.total):'Quote needed');if(c.sample)amt.append(node('small','','test fixture'));
      b.append(left,amt);b.addEventListener('click',()=>{c.selected=r.id;render()});$('routeList').append(b)
    });
    const chosen=routes.find(r=>r.id===c.selected)||routes[0];
    set('summaryRoute',chosen?.name||'—');set('summaryShipping',c.sample?money(chosen.shipping)+'*':'Pending quote');
    set('summaryTaxes',c.sample?'Excluded (fixture)':'Pending');set('summaryTotal',c.sample?money(chosen.total)+'*':'Quote needed');
    set('supplierStatus',c.sample?'Illustrative options':'No live quotes');
    set('paymentReason',c.sample?'Sample prices are not payable. Verified engineering, supplier offers, taxes and a fresh signed payment admission are required.':'Engineering approval, live seller acceptance, exact taxes/fees and buyer authorization are not present.');
    set('ackStatus','No supplier acknowledgments. A payment receipt, if later obtained, is not a supplier order confirmation.');
    set('agentsStatus',runtime.agent_runtime_ready?'Agent service configured; execution receipts still required.':'100-agent execution service not connected. No agent run is claimed.');
    set('nimResult','');$('paypalButton').disabled=true;
    set('parseStatus',c.parseStatus);
  }
  async function fileChosen(file){
    if(!file)return;set('dropTitle','Reading '+file.name+'…');
    try{
      const c=await intakeFile(file);set('filename',file.name);set('dropTitle','Drawing selected — '+file.name);
      set('dropSub',c.parts.length?'Component list extracted locally. Engineering proof remains pending.':'Manual review required. No component list was fabricated.');openCurrent(c)
    }catch(err){
      set('dropTitle','Check your drawing');set('dropSub',String(err.message||err));
      openCurrent({id:'ERROR',name:file.name,digest:'unavailable',sample:false,parts:[],format:'unknown',routes:[],selected:'direct',parseStatus:'Needs a readable BOM',parseNote:String(err.message||err)})
    }
  }
  function choose(){html.file.click()}
  for (const id of ['uploadHero','navstart'])$(id).addEventListener('click',choose);
  $('trydemo').addEventListener('click',()=>openCurrent(structuredClone(sample)));
  html.file.addEventListener('change',()=>fileChosen(html.file.files?.[0]));
  ['dragenter','dragover'].forEach(e=>html.box.addEventListener(e,ev=>{ev.preventDefault();html.box.style.background='#eaf1ff'}));
  ['dragleave','drop'].forEach(e=>html.box.addEventListener(e,ev=>{ev.preventDefault();html.box.style.background='';if(e==='drop')fileChosen(ev.dataTransfer.files?.[0])}));
  $('resetOrder').addEventListener('click',()=>{current=null;html.workspace.hidden=true;html.file.value='';window.scrollTo({top:0,behavior:'smooth'})});
  $('exportButton').addEventListener('click',()=>{
    if(!current)return;const c=current;
    const data={schema:'legion.procurement.request/1',id:c.id,created_at:new Date().toISOString(),sample:c.sample,drawing_name:c.name,drawing_sha256:c.sample?null:c.digest,lines:c.parts,selected_route:c.selected,
      status:'DRAFT_NOT_PLACED',engineering_admission:'UNKNOWN',supplier_quote:'UNKNOWN',supplier_acceptances:[],paypal_order:null,payment_effects:0,
      notice:'This is a local draft. No supplier, PayPal or agent execution has been contacted.'};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='LEGION_REQUEST_DRAFT_'+c.id+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)
  });
  $('nimReview').addEventListener('click',async()=>{
    if(!current||!current.parts.length){set('nimResult','Upload an annotated BOM first.');return}
    if(!runtime.nim_ready){set('nimResult','NIM unavailable. A server-side API key is required; never put it in this page.');return}
    set('nimResult','Requesting a non-binding preliminary review…');
    try{
      const res=await fetch('/api/nim-review',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({parts:current.parts.slice(0,25),drawing_sha256:current.digest})});
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(res.status===429?'Review request limit reached. Please try again later.':data.error||'NIM request failed');
      set('nimResult','NIM advisory only (not engineering admission): '+String(data.review||'No review returned').slice(0,600))
    }catch(err){set('nimResult','NIM not connected: '+String(err.message||err).slice(0,200))}
  });
  async function checkServices(){
    try{
      const c=new AbortController();const t=setTimeout(()=>c.abort(),1600);
      const res=await fetch('/.netlify/functions/status',{signal:c.signal,cache:'no-store'});clearTimeout(t);
      if(!res.ok)throw Error('not deployed');const dat=await res.json();
      runtime={...runtime,...dat};
      $('runtimeDot').classList.add('live');set('runtimeText',dat.nim_ready||dat.engineering_backend_ready?'Secure services available · live activity requires verified receipts':'Public website live · source verification, NIM and payments not configured');
    }catch{set('runtimeText','Site ready on Netlify Drop · interactive intake available · live agents and PayPal require backend deployment')}
    if(current)render();
  }
  checkServices();
})();
