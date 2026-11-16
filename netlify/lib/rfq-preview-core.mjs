/* LEGION Product 001: stateless, fail-closed RFQ preview. No supplier, payment, ERP or persistence. */
import {createHash, randomUUID} from 'node:crypto';
export const REQUEST_SCHEMA='legion.rfq-preview.request.v1';
export const RESPONSE_SCHEMA='legion.rfq-preview.v1';
export const CONTRACT_EPOCH={repository:'veraxis-protocol/Legion--Manufacturing-',commit:'ca0f44b852d74554db1249e20ccc85f6d619356d',path:'upstream/claude-for-manufacturing/shared/contracts/intake-form.md',contract_version:7,implementation:'restricted verified subset; not execution of Claude skill'};
export const ZERO_EFFECTS=Object.freeze({supplier_requests:0,supplier_quotes:0,provider_posts:0,payment_calls:0,payment_captures:0,erp_writes:0});
const sha=o=>createHash('sha256').update(typeof o==='string'?o:JSON.stringify(o)).digest('hex');
export class InputError extends Error{constructor(code, status=422){super(code);this.code=code;this.status=status;}}
function str(x,max=180){if(x==null||x==='')return null;if(typeof x!=='string')throw new InputError('FIELD_TYPE_INVALID');const y=x.trim();if(y.length>max)throw new InputError('FIELD_TOO_LONG');return y||null;}
function id(x){const v=str(x,64);if(!v||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(v))throw new InputError('PART_ID_INVALID');return v;}
function quantity(x){if(x==null||x==='')return null;const num=typeof x==='string'&&/^\d{1,8}$/.test(x.trim())?Number(x.trim()):x;if(typeof num!=='number'||!Number.isSafeInteger(num)||num<=0||num>1_000_000)throw new InputError('QUANTITY_INVALID');return num;}
function inputRows(rows,origin){
 if(!Array.isArray(rows)||rows.length>250)throw new InputError('ITEM_COUNT_INVALID');
 const seen=new Set();
 return rows.map((row,i)=>{
  if(!row||typeof row!=='object'||Array.isArray(row))throw new InputError('ITEM_INVALID');
  const part_id=id(row.part_id||row.part||row.part_number);
  if(seen.has(part_id.toLowerCase()))throw new InputError('DUPLICATE_PART_ID');seen.add(part_id.toLowerCase());
  const q=quantity(row.quantity??row.qty);
  const unit=str(row.unit??row.uom??'ea',24);
  if(unit&&!['ea','each','pcs','pc'].includes(unit.toLowerCase()))throw new InputError('UNIT_UNSUPPORTED');
  const material=str(row.material,120),process=str(row.process,120),revision=str(row.revision,50);
  const missing=[];if(q===null)missing.push('quantity');if(!material)missing.push('material');if(!process)missing.push('process');
  const sources={part_id:`${origin}:row:${i+1}`};
  for(const [k,v] of Object.entries({quantity:q,material,process,revision}))if(v!==null)sources[k]=`${origin}:row:${i+1}:field:${k}`;
  return {line_id:`L${String(i+1).padStart(3,'0')}`,part_id,quantity:q,unit:'ea',material,process,revision,geometry_inputs:[],field_sources:sources,missing_register:missing.map(field=>({field,reason:'not provided'})),ambiguous_register:[],engineering_verdict:'Z',sourcing_verdict:'Z',supplier_status:'NOT_CONTACTED',state:missing.length?'NEEDS_INFORMATION':'AWAITING_ENGINEERING_VERIFICATION'};
 });
}
function csvRows(text){
 if(typeof text!=='string'||!text.trim())throw new InputError('CSV_EMPTY');
 if(text.length>75_000)throw new InputError('CSV_TOO_LONG');
 // RFC4180-like quote and doubled-quote parser, no network/filesystem side-effects.
 const grid=[];let row=[],cell='',quote=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];if(quote){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else quote=false;}else cell+=c;}
  else if(c==='"'){if(cell!=='')throw new InputError('CSV_QUOTE_INVALID');quote=true;}
  else if(c===','){row.push(cell);cell='';}
  else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);cell='';if(row.some(x=>x.trim()!==''))grid.push(row);row=[];}
  else cell+=c;
 }
 if(quote)throw new InputError('CSV_UNCLOSED_QUOTE');row.push(cell);if(row.some(x=>x.trim()!==''))grid.push(row);
 if(grid.length<2)throw new InputError('CSV_NO_DATA');
 const header=grid.shift().map((x,i)=>i===0?x.replace(/^\uFEFF/,'').trim().toLowerCase():x.trim().toLowerCase());
 if(new Set(header).size!==header.length)throw new InputError('CSV_DUPLICATE_HEADER');
 if(!header.includes('part_id')&&!header.includes('part_number')&&!header.includes('part'))throw new InputError('CSV_PART_ID_MISSING');
 return grid.map(cols=>{if(cols.length!==header.length)throw new InputError('CSV_COLUMN_MISMATCH');return Object.fromEntries(header.map((h,i)=>[h,cols[i]]));});
}
function jsonRows(text){let obj;try{obj=JSON.parse(text.replace(/^\uFEFF/,''));}catch{throw new InputError('JSON_INVALID');}const rows=Array.isArray(obj)?obj:obj?.items;if(!Array.isArray(rows))throw new InputError('JSON_ITEMS_MISSING');return rows;}
function date(x){if(typeof x!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(x)||!Number.isFinite(Date.parse(x)))throw new InputError('TIMESTAMP_WITH_ZONE_REQUIRED');return x;}
export function normalizeRfq(payload){
 if(!payload||typeof payload!=='object'||Array.isArray(payload)||payload.schema!==REQUEST_SCHEMA)throw new InputError('SCHEMA_MISMATCH',400);
 if(payload.authorized_preview!==true)throw new InputError('PREVIEW_CONSENT_REQUIRED',403);
 const site=str(payload.site,80),customer=str(payload.customer,100);
 if(!site||!customer)throw new InputError('SITE_CUSTOMER_REQUIRED');
 const received_at=date(payload.received_at);
 const format=payload.format;if(!['manual','csv','json','text'].includes(format))throw new InputError('FORMAT_UNSUPPORTED');
 let rows=[];let origin;let source_content=null;
 if(format==='manual'){rows=payload.items;origin='entered-form';source_content=JSON.stringify(rows);}
 else if(format==='csv'){source_content=payload.content;rows=csvRows(source_content);origin='uploaded-csv';}
 else if(format==='json'){source_content=payload.content;rows=jsonRows(source_content);origin='uploaded-json';}
 else {if(typeof payload.content!=='string'||!payload.content.trim()||payload.content.length>75_000)throw new InputError('TEXT_INPUT_INVALID');origin='uploaded-unstructured-text';source_content=payload.content;}
 const lines=inputRows(rows,origin);
 const attachments=payload.attachments??[];
 if(!Array.isArray(attachments)||attachments.length>20)throw new InputError('ATTACHMENT_COUNT_INVALID');
 const safeAttachments=attachments.map(a=>{
  if(!a||typeof a!=='object'||Array.isArray(a))throw new InputError('ATTACHMENT_INVALID');
  const name=str(a.name,180),sha256=str(a.sha256,64),size=a.size;
  if(!name||!sha256||!/^[a-f0-9]{64}$/.test(sha256)||!Number.isSafeInteger(size)||size<0||size>500_000_000)throw new InputError('ATTACHMENT_INVALID');
  return {name,sha256,size,processing:'NOT_PARSED',integrity:'CLIENT_REPORTED_UNVERIFIED',engineering_verdict:'Z'};
 });
 if(format!=='manual'&&safeAttachments.length){
  const expected=sha(source_content);
  if(safeAttachments.length!==1||safeAttachments[0].sha256!==expected||safeAttachments[0].size!==Buffer.byteLength(source_content))throw new InputError('ATTACHMENT_HASH_MISMATCH');
  safeAttachments[0].integrity='SERVER_VERIFIED_AGAINST_RECEIVED_BYTES';
  safeAttachments[0].processing=format==='csv'||format==='json'?'STRUCTURED_PARSED':'UNSTRUCTURED_RECORDED';
 }
 const issues=lines.flatMap(x=>x.missing_register.map(m=>({line_id:x.line_id,part_id:x.part_id,field:m.field,question:`Provide ${m.field} for part ${x.part_id}`})));
 if(lines.length===0)issues.push({line_id:null,part_id:null,field:'line_items',question:'Provide line items (CSV, JSON or entered details). Unstructured documents are recorded but not parsed.'});
 if(safeAttachments.some(a=>/\.(step|stp|pdf|dxf|dwg)$/i.test(a.name)))issues.push({line_id:null,part_id:null,field:'cad_verification',question:'CAD/drawing attached but not parsed; connect verified CAD/ZTL worker before engineering clearance.'});
 const record={schema:RESPONSE_SCHEMA,run_id:randomUUID(),received_at,site,customer,source:{format,sha256:sha(source_content),attachment_count:safeAttachments.length},contract:CONTRACT_EPOCH,lines,attachments:safeAttachments,missing_register:issues,engineering_verdict:'Z',procurement:'BLOCKED',bid_decision_state:'draft',quote_state:'NOT_REQUESTED',connector_state:'UNVERIFIED',external_effects:{...ZERO_EFFECTS},next_action:issues.length?'REQUEST_MISSING_INFORMATION':'SUBMIT_TO_INDEPENDENT_ENGINEERING_VERIFICATION',status:issues.length?'NEEDS_INFORMATION':'READY_FOR_ENGINEERING_REVIEW',disclaimer:'Stateless intake preview. No CAD parsing, live ERP, supplier quotes, buyer authority, purchase or persistence.'};
 return {...record,record_sha256:sha(record)};
}
