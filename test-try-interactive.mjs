// WO-TRY-LIVING-004: updated 20-contract test replacing the obsolete layered UI assertion.
// In production the exact source hashes MUST match remote pinned GitHub blobs.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=x=>readFileSync(new URL(x,import.meta.url),'utf8');
const html=read('./public/try/index.html'),living=read('./public/try/try-living.js'),css=read('./public/try/try-living.css');
const source=read('./public/try/try.js'),raw=read('./public/try/evidence.json'),e=JSON.parse(raw);
const sha=x=>createHash('sha1').update(Buffer.from(`blob ${Buffer.byteLength(x)}\0`)).update(x).digest('hex');
const fixture=process.env.LEGION_FIXTURE_QA==='1';
const tests=[
 ['T: old original JS blob unchanged',()=>assert.equal(sha(source),'9c6eb0af289a942590106fcd0da9dea6d6e14399')],
 ['T: real pinned source JSON preserved',()=>{if(!fixture) assert.equal(sha(raw),'65aaf62745ca436c06d7ec35e32586095c9f9da6');else assert.equal(e.schema,'legion.try.evidence.v1')}],
 ['T: five original stages remain',()=>assert.deepEqual([...html.matchAll(/data-stage="(\d)"/g)].map(x=>Number(x[1])),[0,1,2,3,4])],
 ['T: living script linked',()=>assert.match(html,/src="\.\/try-living\.js"/)],
 ['T: living CSS linked',()=>assert.match(html,/href="\.\/try-living\.css"/)],
 ['T: legacy render scripts not loaded',()=>assert.doesNotMatch(html,/(?:src="\.\/try\.js"|src="\.\/try-interactive\.js")/)],
 ['T: no old layered stage container',()=>assert.doesNotMatch(html,/id="stageContent"/)],
 ['T: canonical entrypoint remains single /try/',()=>assert.match(html,/<title>Try LEGION — Procurement Workspace<\/title>/)],
 ['T: no customer tokens or API keys',()=>assert.doesNotMatch(living,/NIM_API_KEY|PAYPAL_CLIENT_SECRET|secret_token|Bearer /)],
 ['T: one local evidence retrieval only',()=>{assert.match(living,/const EVIDENCE_URL = '\.\/evidence\.json'/);assert.equal([...living.matchAll(/\bfetch\(/g)].length,1)}],
 ['T: no consequential requests',()=>assert.doesNotMatch(living,/fetch\(['"]https|method\s*:\s*['"]POST['"]|api\/paypal|api\/orders/)],
 ['T: fail-closed source engineering',()=>{assert.equal(e.case_a.engineering_admission,'Z');assert.equal(e.case_a.procurement,'BLOCKED');assert.equal(e.case_a.new_paypal_captures,0)}],
 ['T: 40 source purchasing vectors',()=>assert.equal(e.case_a.vectors.length,40)],
 ['T: no original vector upgraded',()=>assert.ok(e.case_a.vectors.every(x=>x.engineering_verdict==='Z'))],
 ['T: original MOQ fixture is separate',()=>assert.notEqual(e.coalition_fixture.all_in_cents,e.case_b.payPal_test_cents)],
 ['T: exact three historical offers',()=>assert.deepEqual(e.case_b.offers.map(x=>x.total_cents),[48000,54000,49500])],
 ['T: five historical captures, no new posts',()=>{assert.equal(e.case_b.captures.length,5);assert.equal(e.case_b.new_provider_posts,0)}],
 ['T: real-case to synthetic-case handoff explicit',()=>assert.match(living,/independent synthetic MOQ experiment/)],
 ['T: hidden fail-closed workspace cannot display',()=>assert.match(css,/\[hidden\]\{display:none!important\}/)],
 ['T: all 5 original nav buttons gated and accessible',()=>{assert.match(living,/b\.disabled=n>state\.reached/);assert.match(html,/aria-label="LEGION workflow stages"/)}]
];
let bad=0;
for(const [name,test] of tests){try{test();console.log('PASS',name)}catch(e){bad++;console.error('FAIL',name,e.message)}}
console.log(`${tests.length-bad}/${tests.length} legacy-interface migration contracts PASS; failures=${bad}`);
if(bad)process.exit(1);
