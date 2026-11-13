/* WO-FRIDAY13: independent source/UX/safety contract checks.
 * Must run in actual repo after patch; fixture is allowed only for local QA.
 */
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const get=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const html=get('./public/try/index.html'),css=get('./public/try/friday13.css'),js=get('./public/try/friday13.js');
const original='./public/try/evidence.json';
if(process.env.LEGION_FRIDAY13_REAL_EVIDENCE==='1'&&!existsSync(new URL(original,import.meta.url))){throw Error('Real evidence.json not found: NO_GO');}
const evidence=JSON.parse(existsSync(new URL(original,import.meta.url))?get(original):get('./qa/fixture_preview.json'));
const sha=(txt)=>createHash('sha1').update(Buffer.from(`blob ${Buffer.byteLength(txt)}\0`)).update(txt).digest('hex');
const tests=[
['new single root element',()=>assert.match(html,/<div id="root"/)],
['one active JS',()=>assert.equal((html.match(/src="\.\/friday13\.js"/g)||[]).length,1)],
['one active stylesheet',()=>assert.equal((html.match(/href="\.\/friday13\.css"/g)||[]).length,1)],
['no competing legacy renderer loaded',()=>assert.doesNotMatch(html,/<script[^>]+(?:try-live|try-living|try-interactive)\.js/)],
['existing canonical entrypoint remains a single /try/',()=>assert.match(html,/<title>Try LEGION/)],
['40 real source-bound vectors',()=>assert.equal(evidence.case_a.vectors.length,40)],
['40 part identities unique',()=>assert.equal(new Set(evidence.case_a.vectors.map(x=>x.part_id)).size,40)],
['40 BOM vectors pinned to CAD',()=>assert.ok(evidence.case_a.vectors.every(x=>x.source_geometry_sha256===evidence.source.cad_sha256))],
['real engineering still unknown',()=>assert.equal(evidence.case_a.engineering_admission,'Z')],
['real procurement blocked',()=>assert.equal(evidence.case_a.procurement,'BLOCKED')],
['no new Case A capture',()=>assert.equal(evidence.case_a.new_paypal_captures,0)],
['no new Case B provider POST',()=>assert.equal(evidence.case_b.new_provider_posts,0)],
['five recorded captures distinct',()=>assert.equal(new Set(evidence.case_b.captures).size,5)],
['63 / 63 historical checks',()=>assert.deepEqual([evidence.case_b.judge_checks_passed,evidence.case_b.judge_checks_total],[63,63])],
['separate Case B $495',()=>assert.equal(evidence.case_b.payPal_test_cents,49500)],
['Coalition fixture separate from Case B',()=>assert.notEqual(evidence.coalition_fixture.all_in_cents,evidence.case_b.payPal_test_cents)],
['5×20=100 fixture',()=>assert.equal(evidence.coalition_fixture.buyers*evidence.coalition_fixture.units_each,100)],
['6 default demo providers',()=>assert.equal((js.match(/\{id:'(?:xometry|protolabs|fictiv|mfg|craftcloud|sculpteo)'/g)||[]).length,6)],
['all providers selected initially',()=>assert.match(js,/selectedProviders:new Set\(providers\.map\(s=>s\.id\)\)/)],
['40 independent source part events',()=>assert.match(js,/case_a\.vectors\.forEach\(\(v,i\)=>plan\.push\(event\(1\+/)],
['40 per-part engineering checks',()=>assert.match(js,/case_a\.vectors\.forEach\(\(v,i\)=>plan\.push\(event\(12\+/)],
['four procurement sample routes',()=>assert.ok(['direct','coalition','requote','input'].every(x=>js.includes(x+":'")))],
['X-Ray agent trace event captures tool source',()=>assert.match(js,/function event\(tick,partId,agent,action,title,detail,tool,source/)],
['X-Ray evidence details expandable',()=>assert.match(js,/data-expand=/)],
['buyer approval is a required local action',()=>assert.match(js,/data-act="confirm"/)],
['no live buyer action signed or authorized',()=>assert.match(js,/No engineering admission, payment or supplier authority was created|No engineering admission, payment or supplier authority/)],
['buyer local approval cannot become original admission',()=>assert.match(js,/engineering Z/)],
['no automatic live supplier requests',()=>assert.equal([...js.matchAll(/\bfetch\(/g)].length,1)],
['only local GET evidence allowed',()=>assert.match(js,/fetch\('\.\/evidence\.json',\{method:'GET'/)],
['no mutating HTTP request in frontend',()=>assert.doesNotMatch(js,/method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]|fetch\(['"]https?:\/\//)],
['no paypal checkout API client',()=>assert.doesNotMatch(js,/\/api\/paypal|paypal-checkout|capture-order|\/v2\/checkout\/orders/)],
['Case A, S, B shown separated',()=>assert.match(js,/Case A \(40 Z-held vectors\), synthetic provider\/order simulation S/)],
['Recorded vs simulated labelled',()=>assert.match(js,/Recorded \+ simulated/)],
['checkout preview no charge',()=>assert.match(js,/No new checkout here/)],
['local file input does not upload',()=>assert.match(js,/No file was uploaded/)],
['interactive pause / restart',()=>assert.match(js,/case'restart':reset\(true\)/)],
['mobile responsive breakpoint',()=>assert.match(css,/@media\(max-width:730px\)/)],
['mobile rail navigation available',()=>assert.match(js,/class="bottom-nav"/)],
['reduced motion supported',()=>assert.match(css,/prefers-reduced-motion:reduce/)],
['fail-closed evidence error',()=>assert.match(js,/Evidence contract rejected: fail closed/)],
['recorded source commit fixed',()=>assert.equal(evidence.source.commit,'2cc7dbdc2b305d92b4fd64614c74bc56b16c4cfe')]
];
let fail=0;for(const [name,fn] of tests){try{fn();console.log('PASS',name);}catch(e){fail++;console.error('FAIL',name,'=>',e.message);}}
console.log(`FRIDAY13_CONTRACTS ${tests.length-fail}/${tests.length} PASS`);if(fail)process.exitCode=1;
