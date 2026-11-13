/* LEGION WO-FRIDAY13-REALITY-001A
 * Authoritative, read-only, independently instrumented Part Order Unit observation.
 * No simulation, LLM thought, procurement authority, supplier API or PayPal calls.
 */
import { createHash, randomUUID } from 'node:crypto';

export const PINNED = Object.freeze({
  schema: 'legion.try.evidence.v1',
  sourceCommit: '2cc7dbdc2b305d92b4fd64614c74bc56b16c4cfe',
  gitBlob: '65aaf62745ca436c06d7ec35e32586095c9f9da6',
  cadSha256: 'a1e301ee03d46589e26d3fc2272d19ba53c1878f0104274695e5c9a88aa512d2',
  unitCount: 40
});
const hex=(data)=>createHash('sha256').update(data).digest('hex');
const blobHash=(buf)=>createHash('sha1').update(`blob ${buf.byteLength}\0`).update(buf).digest('hex');
const canonical = value => JSON.stringify(value); // fixed construction order, source is JSON, not arbitrary key reorder
const assert=(p,msg)=>{if(!p) throw new EvidenceError(msg);};
export class EvidenceError extends Error {constructor(code){super(code);this.code=code;this.name='EvidenceError';}}
const validHash=s=>typeof s==='string'&&/^[0-9a-f]{64}$/.test(s);
const validId=s=>typeof s==='string'&&/^[A-Z0-9_]{3,80}$/.test(s);

export function verifyPinnedBytes(bytes, {expectedBlob=PINNED.gitBlob}={}){
  const b=Buffer.isBuffer(bytes)?bytes:Buffer.from(bytes);
  assert(b.byteLength>1000&&b.byteLength<1_000_000,'SOURCE_SIZE_INVALID');
  const observedBlob=blobHash(b);
  assert(observedBlob===expectedBlob,'SOURCE_GIT_BLOB_MISMATCH');
  let e;
  try{e=JSON.parse(b.toString('utf8'));}catch{throw new EvidenceError('SOURCE_JSON_INVALID');}
  assert(e?.schema===PINNED.schema,'SOURCE_SCHEMA_MISMATCH');
  assert(e.source?.commit===PINNED.sourceCommit,'SOURCE_COMMIT_MISMATCH');
  assert(e.source?.cad_sha256===PINNED.cadSha256,'SOURCE_CAD_SHA_MISMATCH');
  assert(e.case_a?.engineering_admission==='Z','CASE_A_ADMISSION_MISMATCH');
  assert(e.case_a?.procurement==='BLOCKED','CASE_A_PROCUREMENT_MISMATCH');
  assert(e.case_a?.new_paypal_captures===0,'CASE_A_CAPTURE_MISMATCH');
  assert(Array.isArray(e.case_a?.vectors)&&e.case_a.vectors.length===PINNED.unitCount,'SOURCE_VECTOR_COUNT_MISMATCH');
  assert(new Set(e.case_a.vectors.map(v=>v.part_id)).size===PINNED.unitCount,'SOURCE_PART_IDS_DUPLICATED');
  for(const v of e.case_a.vectors){
    assert(validId(v.part_id),'SOURCE_PART_ID_INVALID');
    assert(Number.isSafeInteger(v.qty)&&v.qty>0,'SOURCE_QUANTITY_INVALID');
    assert(typeof v.material==='string'&&v.material.length<400,'SOURCE_MATERIAL_INVALID');
    assert(typeof v.process==='string'&&v.process.length<400,'SOURCE_PROCESS_INVALID');
    assert(v.geometry_bbox_mm==null||(Array.isArray(v.geometry_bbox_mm)&&v.geometry_bbox_mm.length===3&&v.geometry_bbox_mm.every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0)),'SOURCE_GEOMETRY_INVALID');
    assert(v.engineering_verdict==='Z','PART_ENGINEERING_UNKNOWN');
    assert(Array.isArray(v.missing)&&v.missing.every(s=>typeof s==='string'&&s.length<240),'PART_MISSING_INVALID');
    assert(v.source_geometry_sha256===PINNED.cadSha256,'PART_SOURCE_SHA_MISMATCH');
  }
  // Independent commerce records are read for invariant checks, never treated as this part's authority.
  assert(e.case_b?.new_provider_posts===0&&e.case_b?.payPal_test_cents===49500,'CASE_B_UNEXPECTED_EFFECT');
  assert(e.case_b?.captures?.length===5&&new Set(e.case_b.captures).size===5,'CASE_B_CAPTURE_READBACK_INVALID');
  return Object.freeze({evidence:e,gitBlob:observedBlob,byteLength:b.byteLength,sha256:hex(b)});
}

export function verifyChain(events){
  let previous='0'.repeat(64);
  for(let i=0;i<events.length;i++){
    const e=events[i];if(e.seq!==i+1||e.previous_hash!==previous)return false;
    const {event_hash,...signed}=e;
    if(hex(canonical(signed))!==event_hash)return false;
    previous=event_hash;
  }
  return true;
}

export async function* observePart(validated,partId,{clock=()=>new Date().toISOString(),runId=randomUUID()}={}){
  assert(validId(partId),'PART_ID_INVALID');
  const part=validated.evidence.case_a.vectors.find(v=>v.part_id===partId);
  assert(part,'PART_NOT_FOUND');
  let seq=0,previous='0'.repeat(64);
  // Tool events are emitted strictly after the tool result exists; no theatrical delays.
  const emit=(agent,action,tool,result,decision,evidenceScope='CASE_A')=>{
    const record={schema:'legion.part-observation.v1',run_id:runId,seq:++seq,observed_at:clock(),part_id:partId,agent,action,tool,result,decision,
      evidence:{scope:evidenceScope,git_blob:validated.gitBlob,source_sha256:validated.sha256,part_vector_sha256:hex(canonical(part))},
      previous_hash:previous};
    record.event_hash=hex(canonical(record));previous=record.event_hash;
    return record;
  };
  yield emit('Source Agent','source_readback','git_blob_sha1_verify',
    {match:true,source_git_blob:validated.gitBlob,source_bytes:validated.byteLength,cad_sha256:PINNED.cadSha256},
    'READ_ONLY_OBSERVATION');
  const unit={part_id:part.part_id,source_qty:part.qty,material:part.material,process:part.process,source_cad_sha256:part.source_geometry_sha256};
  yield emit('BOM Agent','part_bound','vector_identity_check',unit,'SOURCE_BOUND');
  const bb=part.geometry_bbox_mm;
  const geometry=bb==null?{state:'UNKNOWN',bbox_mm:null}:{state:'METADATA_PRESENT_NOT_CAD_REPARSED',bbox_mm:bb};
  yield emit('Engineering Agent','geometry_inspected','bounding_box_metadata_check',geometry,'NO_ENGINEERING_PERMIT');
  const requirement={missing:part.missing,missing_count:part.missing.length,engineering_verdict:part.engineering_verdict};
  yield emit('Engineering Agent','requirements_compared','requirements_gap_check',requirement,'NEEDS_INDEPENDENT_REVIEW');
  // Runtime guard. Source 'Z' and missing upstream permits always block consequential execution.
  const permitted=validated.evidence.case_a.engineering_admission==='T'&&part.engineering_verdict==='T'&&validated.evidence.case_a.procurement==='ADMITTED';
  assert(permitted===false,'UNEXPECTED_PERMIT_NONBLOCKED');
  yield emit('Admission Gate','procurement_denied','consequence_admission_check',
    {engineering_admission:'Z',procurement:'BLOCKED',permitted:false},'DENY');
  yield emit('Sourcing Agent','supplier_calls_skipped','supplier_connector_guard',
    {connected_suppliers:0,quotes_received:0,reason:'NO_VERIFIED_PROVIDER_ADAPTER_OR_ENGINEERING_PERMIT'},'NO_RFQ_SENT');
  const next=part.missing[0]??'independent engineering acceptance';
  yield emit('Buyer Assistant','next_action_identified','missing_requirements_to_question',
    {requested_clarification:next,source_part_id:partId,approval_state:'NOT_REQUESTED'},'ASK_BUYER_NO_EFFECT');
  yield emit('Readback Judge','run_completed','hash_chain_and_invariants',
    {source_bound:true,admission:'Z',procurement:'BLOCKED',provider_posts:0,new_captures:0},'OBSERVATION_COMPLETE_NOT_PURCHASE');
}

export async function collectPart(validated,id,opts={}){const out=[];for await(const e of observePart(validated,id,opts))out.push(e);assert(verifyChain(out),'TRACE_CHAIN_FAILED');return out;}
