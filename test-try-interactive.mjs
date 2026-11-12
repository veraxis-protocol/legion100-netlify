// TRY-INTERACTIVE-003. Non-mutating release contract; run at repository root.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read = path => readFileSync(new URL(path,import.meta.url),'utf8');
const html=read('./public/try/index.html');
const js=read('./public/try/try-interactive.js');
const css=read('./public/try/try-interactive.css');
const core=read('./public/try/try.js');
const evidenceRaw=read('./public/try/evidence.json');
const data=JSON.parse(evidenceRaw);
const sha=(v)=>createHash('sha1').update(Buffer.from(`blob ${Buffer.byteLength(v)}\0`)).update(v).digest('hex');
const tests=[
 ['original source core byte-for-byte unchanged',()=>assert.equal(sha(core),'9c6eb0af289a942590106fcd0da9dea6d6e14399')],
 ['evidence source byte-for-byte unchanged',()=>assert.equal(sha(evidenceRaw),'65aaf62745ca436c06d7ec35e32586095c9f9da6')],
 ['new JS included',()=>assert.match(html,/src="\.\/try-interactive\.js"/)],
 ['new CSS included',()=>assert.match(html,/href="\.\/try-interactive\.css"/)],
 ['original stage sequence preserved',()=>assert.deepEqual([...html.matchAll(/data-stage="(\d)"/g)].map(x=>Number(x[1])),[0,1,2,3,4])],
 ['original source remains read-only',()=>assert.match(core,/read-only, pinned evidence/)],
 ['only local pinned evidence fetch in enhancement',()=>{assert.match(js,/const URL_EVIDENCE\s*=\s*'\.\/evidence\.json'/);assert.equal([...js.matchAll(/\bfetch\(/g)].length,1)}],
 ['no consequential HTTP methods',()=>assert.doesNotMatch(js,/\bPOST\b\s*[:=]|method\s*:\s*['"]POST['"]|api\/paypal|api\/orders|\/capture/)],
 ['case A still unknown and blocked',()=>{assert.equal(data.case_a.engineering_admission,'Z');assert.equal(data.case_a.procurement,'BLOCKED');assert.equal(data.case_a.new_paypal_captures,0)}],
 ['all 40 source vectors unchanged',()=>assert.equal(data.case_a.vectors.length,40)],
 ['all 40 vectors retain engineering Z',()=>assert.ok(data.case_a.vectors.every(x=>x.engineering_verdict==='Z'))],
 ['recorded case B has five unique captures',()=>{assert.equal(data.case_b.captures.length,5);assert.equal(new Set(data.case_b.captures).size,5)}],
 ['recorded case B has no new captures',()=>assert.equal(data.case_b.new_provider_posts,0)],
 ['exact historic negotiation amounts',()=>assert.deepEqual(data.case_b.offers.map(x=>x.total_cents),[48000,54000,49500])],
 ['five buyer MOQ model remains separate',()=>{assert.equal(data.coalition_fixture.buyers*data.coalition_fixture.units_each,100);assert.notEqual(data.coalition_fixture.all_in_cents,data.case_b.payPal_test_cents)}],
 ['source color design retained',()=>assert.match(css,/#164cb8/i)],
 ['mobile CSS present',()=>assert.match(css,/@media\(max-width:560px\)/)],
 ['requirements not promoted by form',()=>assert.match(js,/Drafted ≠ independently verified/)],
 ['interactive replay and reset actions present',()=>{assert.match(js,/replay-deal/);assert.match(js,/reset-buyers/);assert.match(js,/try-another/)}],
 ['scope remains labelled local/read-only',()=>assert.match(js,/READ-ONLY/)],
];
let failed=0;
for(const [name,fn] of tests){try{fn();console.log('PASS',name)}catch(e){console.error('FAIL',name,':',e.message);failed++}}
console.log(`${tests.length-failed}/${tests.length} release contracts PASS; failures=${failed}`);
if(failed)process.exit(1);
