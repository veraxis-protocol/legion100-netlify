/* WO-TRY-LIVE-005: source contracts, event-runtime controls, explicit evidence scope. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const get=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const html=get('./public/try/index.html'),js=get('./public/try/try-live.js'),css=get('./public/try/try-live.css');
const evidence=JSON.parse(get('./public/try/evidence.json'));
const sha=t=>createHash('sha1').update(Buffer.from(`blob ${Buffer.byteLength(t)}\0`)).update(t).digest('hex');
const tests=[
 ['canonical /try document remains only entrypoint',()=>assert.match(html,/<title>Try LEGION/)],
 ['five stages still present',()=>assert.deepEqual([...html.matchAll(/data-stage="(\d)"/g)].map(x=>Number(x[1])),[0,1,2,3,4])],
 ['new JS linked exactly once',()=>assert.equal((html.match(/src="\.\/try-live\.js"/g)||[]).length,1)],
 ['new CSS linked exactly once',()=>assert.equal((html.match(/href="\.\/try-live\.css"/g)||[]).length,1)],
 ['v4 renderer is not co-loaded',()=>assert.doesNotMatch(html,/src="\.\/try-living\.js"/)],
 ['no old interactive overlay rendered',()=>assert.doesNotMatch(html,/src="\.\/try-interactive\.js"/)],
 ['engineering auto-start',()=>assert.match(js,/render\(\);startScan\(true\)/)],
 ['all 40 vectors iterated from immutable evidence',()=>assert.match(js,/state\.e\.case_a\.vectors\[i\]/)],
 ['source geometry metadata labelled not live compute',()=>assert.match(js,/not live geometry computation/)],
 ['checkpoints preserve uncertainty',()=>assert.match(js,/verdict:'Z'/)],
 ['formal evaluation explicitly recorded, not executed',()=>assert.match(js,/Formal Core is not called live/)],
 ['source engineer Z gate must remain',()=>assert.equal(evidence.case_a.engineering_admission,'Z')],
 ['real procurement remains blocked',()=>assert.equal(evidence.case_a.procurement,'BLOCKED')],
 ['40 original vector admission states all unknown',()=>assert.ok(evidence.case_a.vectors.length===40&&evidence.case_a.vectors.every(v=>v.engineering_verdict==='Z'))],
 ['supplying draft cannot grant authority',()=>assert.match(js,/cannot promote engineering admission from Z to T/)],
 ['supplier cards explicitly lack real verified logos',()=>assert.match(js,/NOT verified supplier logos/)],
 ['supplier preflight never claims a live provider request',()=>assert.match(js,/No live supplier request/)],
 ['no supplier auth or credentials',()=>assert.doesNotMatch(js,/fetch\([^)]*\/api\//)],
 ['agent route scan has no external API',()=>assert.match(js,/Local authority check only\. No supplier calls/)],
 ['only one GET, pinned local evidence',()=>{assert.equal([...js.matchAll(/\bfetch\(/g)].length,1);assert.match(js,/const EV='\.\/evidence\.json'/)}],
 ['no consequential HTTP verbs',()=>assert.doesNotMatch(js,/method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]|\/capture|api\/paypal/i)],
 ['case handoff explicitly marked',()=>assert.match(js,/New synthetic MOQ fixture opened/)],
 ['buyer starts at 1',()=>assert.match(js,/buyers:1/)],
 ['buyer count bounded at 5',()=>assert.match(js,/state\.buyers<5/)],
 ['MOQ arithmetic matches pinned evidence',()=>assert.equal(evidence.coalition_fixture.units_each*evidence.coalition_fixture.buyers,evidence.coalition_fixture.moq)],
 ['fixture not linked to case B money',()=>assert.notEqual(evidence.coalition_fixture.all_in_cents,evidence.case_b.payPal_test_cents)],
 ['three historical prices unmodified',()=>assert.deepEqual(evidence.case_b.offers.map(x=>x.total_cents),[48000,54000,49500])],
 ['540 rejected at per-buyer cap',()=>assert.ok(54000/5>evidence.case_b.buyer_cap_cents)],
 ['495 signed with $99 per buyer',()=>assert.equal(49500/5,9900)],
 ['contract replay not live',()=>assert.match(js,/Historical event playback; no provider calls/)],
 ['5 distinct recorded provider receipts',()=>assert.ok(evidence.case_b.captures.length===5&&new Set(evidence.case_b.captures).size===5)],
 ['no new real-CAD captures',()=>assert.equal(evidence.case_a.new_paypal_captures,0)],
 ['no new Case-B provider POSTs',()=>assert.equal(evidence.case_b.new_provider_posts,0)],
 ['recorded readback is readback confirmed',()=>assert.equal(evidence.case_b.readback_confirmed,true)],
 ['payment replay not live calls',()=>assert.match(js,/Display-only historical receipts, no network calls/)],
 ['fail-closed DOM load error exists',()=>assert.match(html,/id="loadError"[^>]*hidden/)],
 ['failure keeps workspace hidden',()=>assert.match(js,/\$\('#workspace'\)\.hidden=true/)],
 ['source label flags both execution types',()=>assert.match(html,/LIVE LOCAL CHECK · RECORDED FORMAL EVIDENCE/)],
 ['company names are not fabricated as integrated suppliers',()=>assert.doesNotMatch(js,/CONNECTED LIVE SUPPLIER|PROVIDER-CONFIRMED RFQ/)],
 ['mobile responsive breakpoint present',()=>assert.match(css,/@media\(max-width:480px\)/)],
 ['mobile rail not vertically broken',()=>assert.match(css,/\.intent-rail\{display:none!important\}/)],
 ['reduced motion supported',()=>assert.match(css,/prefers-reduced-motion:reduce/)],
 ['single active canvas',()=>assert.equal((html.match(/id="workCanvas"/g)||[]).length,1)],
 ['evidence same old pinned version, not overwritten',()=>assert.equal(evidence.source.commit,'2cc7dbdc2b305d92b4fd64614c74bc56b16c4cfe')],
];
let fail=0;for(const [name,fn] of tests){try{fn();console.log('PASS',name)}catch(e){fail++;console.error('FAIL',name,e.message)}}
console.log(`${tests.length-fail}/${tests.length} try-live contracts PASS; failures=${fail}`);
if(fail)process.exitCode=1;
