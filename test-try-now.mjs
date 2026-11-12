import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=x=>readFileSync(new URL(x,import.meta.url),'utf8');
const data=JSON.parse(file('./public/try/evidence.json'));
const html=file('./public/try/index.html'),js=file('./public/try/try.js'),css=file('./public/try/try.css');
const tests=[
 ['T: 5-screen UI',()=>assert.deepEqual([...html.matchAll(/data-stage="(\d)"/g)].map(x=>Number(x[1])),[0,1,2,3,4])],
 ['T: evidence schema',()=>assert.equal(data.schema,'legion.try.evidence.v1')],
 ['T: 40 individually inspectable purchasing vectors',()=>assert.equal(data.case_a.vectors.length,40)],
 ['T: vector IDs unique',()=>assert.equal(new Set(data.case_a.vectors.map(x=>x.part_id)).size,40)],
 ['T: all vectors fail closed (not independently admitted)',()=>assert.ok(data.case_a.vectors.every(x=>x.engineering_verdict==='Z'))],
 ['T: every vector has source fingerprints',()=>assert.ok(data.case_a.vectors.every(x=>x.source_geometry_sha256===data.source.cad_sha256&&x.source_requirements_sha256.length===64))],
 ['T: 40 of 40 real BOM positions',()=>assert.equal(data.case_a.matched_bom_positions,40)],
 ['T: real CAD source pin',()=>assert.equal(data.source.cad_sha256,'a1e301ee03d46589e26d3fc2272d19ba53c1878f0104274695e5c9a88aa512d2')],
 ['T: real engineering remains Z and procurement blocked',()=>{assert.equal(data.case_a.engineering_admission,'Z');assert.equal(data.case_a.procurement,'BLOCKED');assert.equal(data.case_a.rfq,'DRAFT_NOT_SENT');}],
 ['T: snapshot does not claim new payment',()=>{assert.equal(data.case_a.new_paypal_captures,0);assert.equal(data.case_b.new_provider_posts,0);}],
 ['T: coalition fixture 5×20 meets MOQ 100',()=>assert.equal(data.coalition_fixture.buyers*data.coalition_fixture.units_each,data.coalition_fixture.moq)],
 ['T: synthetic fixture is NOT CASE B',()=>assert.notEqual(data.coalition_fixture.all_in_cents,data.case_b.payPal_test_cents)],
 ['T: 540 rejection and 495 signed',()=>{assert.equal(data.case_b.offers[1].total_cents,54000);assert.equal(data.case_b.offers[2].total_cents,49500);assert.equal(data.case_b.offers[1].total_cents/5>data.case_b.buyer_cap_cents,true);assert.equal(data.case_b.offers[2].total_cents/5<=data.case_b.buyer_cap_cents,true);}],
 ['T: readback 5 unique Sandbox captures',()=>{assert.equal(data.case_b.captures.length,5);assert.equal(new Set(data.case_b.captures).size,5);assert.equal(data.case_b.readback_confirmed,true);}],
 ['T: independent Judge 63/63',()=>{assert.equal(data.case_b.judge_checks_passed,63);assert.equal(data.case_b.judge_checks_total,63);}],
 ['T: frontend has no live payment calls',()=>assert.doesNotMatch(js,/fetch\(\s*['"]\/(?:api\/paypal|\.netlify\/functions\/paypal)/)],
 ['T: no server claim (read-only)',()=>assert.match(js,/read-only, pinned evidence/)],
 ['T: each step has evidence-link mechanism',()=>assert.match(js,/const link=/)],
 ['T: CSS is responsive',()=>assert.match(css,/@media\(max-width:560px\)/)],
 ['T: no false engineering approval',()=>assert.doesNotMatch(js,/ENGINEERING_ADMISSION[^\n]{0,90}(?:'T'|"T")/)]
];
let bad=0;
for(const [name,fn] of tests){try{fn();console.log('PASS '+name)}catch(e){bad++;console.error('FAIL '+name+' '+e.message)}}
if(bad)process.exit(1);
console.log('PASS 20/20 static evidence, negative-claim and UX contract checks');
