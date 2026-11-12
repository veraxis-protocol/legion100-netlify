/* WO-TRY-LIVE-005: migration gate for current active /try/ renderer. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const get=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const html=get('./public/try/index.html'),live=get('./public/try/try-live.js'),css=get('./public/try/try-live.css'),core=get('./public/try/try.js'),old=get('./public/try/try-living.js'),raw=get('./public/try/evidence.json');
const e=JSON.parse(raw);const sha=t=>createHash('sha1').update(Buffer.from(`blob ${Buffer.byteLength(t)}\0`)).update(t).digest('hex');
const tests=[
 ['previous source core unchanged',()=>assert.equal(sha(core),'9c6eb0af289a942590106fcd0da9dea6d6e14399')],
 ['pinned evidence file unchanged',()=>{if(process.env.LEGION_QA_FIXTURE==='1'){assert.equal(e.source.commit,'2cc7dbdc2b305d92b4fd64614c74bc56b16c4cfe');return;}assert.equal(sha(raw),'65aaf62745ca436c06d7ec35e32586095c9f9da6')}],
 ['five-stage experience remains',()=>assert.deepEqual([...html.matchAll(/data-stage="(\d)"/g)].map(x=>+x[1]),[0,1,2,3,4])],
 ['current live local check script linked',()=>assert.match(html,/src="\.\/try-live\.js"/)],
 ['current visual stylesheet linked',()=>assert.match(html,/href="\.\/try-live\.css"/)],
 ['legacy script not co-loaded',()=>assert.doesNotMatch(html,/<script[^>]+try-living\.js/)],
 ['no parallel page renderer',()=>assert.doesNotMatch(html,/<script[^>]+try-interactive\.js/)],
 ['single source-bound browser fetch',()=>assert.equal([...live.matchAll(/\bfetch\(/g)].length,1)],
 ['new live runtime only fetches local pinned snapshot',()=>assert.match(live,/const EV='\.\/evidence\.json'/)],
 ['real CAD original admission Z',()=>assert.equal(e.case_a.engineering_admission,'Z')],
 ['procurement still BLOCKED',()=>assert.equal(e.case_a.procurement,'BLOCKED')],
 ['all 40 vectors remain not admitted',()=>assert.ok(e.case_a.vectors.length===40&&e.case_a.vectors.every(x=>x.engineering_verdict==='Z'))],
 ['original 40 matching positions',()=>assert.equal(e.case_a.matched_bom_positions,40)],
 ['three historical prices exact',()=>assert.deepEqual(e.case_b.offers.map(x=>x.total_cents),[48000,54000,49500])],
 ['5 Sandbox captures historically readback-confirmed',()=>assert.ok(e.case_b.readback_confirmed&&e.case_b.captures.length===5)],
 ['no new provider effects',()=>assert.equal(e.case_b.new_provider_posts,0)],
 ['Case A remains payment-free',()=>assert.equal(e.case_a.new_paypal_captures,0)],
 ['fixture not merged into Case B',()=>assert.notEqual(e.coalition_fixture.all_in_cents,e.case_b.payPal_test_cents)],
 ['light blue palette preserved',()=>assert.match(css,/#164cb8/i)],
 ['old source code preserved for rollback',()=>assert.match(old,/one-object, one-action procurement workspace/)],
];
let fail=0;for(const [n,f] of tests){try{f();console.log('PASS',n)}catch(e){fail++;console.error('FAIL',n,e.message)}}
console.log(`${tests.length-fail}/${tests.length} migration contracts PASS; failures=${fail}`);if(fail)process.exitCode=1;
