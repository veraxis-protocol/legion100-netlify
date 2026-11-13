import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const get=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const html=get('./public/try/index.html'),js=get('./public/try/try-live.js'),css=get('./public/try/try-live.css');
const companies=['Xometry','Protolabs','Fictiv','MFG','Craftcloud','Sculpteo'];
const slugs=['xometry','protolabs','fictiv','mfg','craftcloud','sculpteo'];
const tests=[
 ['one canonical five-step product experience',()=>assert.deepEqual([...html.matchAll(/data-stage="(\d)"/g)].map(x=>Number(x[1])),[0,1,2,3,4])],
 ['entrypoint loads only one engine',()=>assert.equal((html.match(/src="\.\/try-live\.js"/g)||[]).length,1)],
 ['existing evidence remains read-only',()=>assert.match(js,/const EV='\.\/evidence\.json'/)],
 ['only one evidence fetch in runtime',()=>assert.equal([...js.matchAll(/\bfetch\(/g)].length,1)],
 ['no external supplier requests or payment effects',()=>assert.doesNotMatch(js,/method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]|\bXMLHttpRequest\b|\bWebSocket\b|\bEventSource\b/)],
 ['new stage labels are product-language',()=>assert.deepEqual([...html.matchAll(/journey-name">([^<]+)/g)].map(x=>x[1]),['Check drawing','Review parts','Find suppliers','Group order','Payment'])],
 ['first screen says CAD already loaded',()=>assert.match(js,/Your reBot CAD has already been analyzed/)],
 ['first scene explains user task not technology',()=>assert.match(js,/YOUR FIRST TASK · NO UPLOAD NEEDED/)],
 ['40 component checks retained',()=>assert.match(js,/state\.e\.case_a\.vectors\[i\]/)],
 ['engineering hold cannot be bypassed',()=>assert.match(js,/Supplier RFQs stay blocked|Manufacturer contact remains on hold/)],
 ['formal verdict remains unknown',()=>assert.match(js,/verdict:'Z'/)],
 ['visual approval only checks source data',()=>assert.match(js,/no new formal approval runs here/)],
 ['six exact sources preserved',()=>companies.forEach(x=>assert.ok(js.includes(`name:'${x}'`),x))],
 ['all directory identities have visual assets',()=>slugs.forEach(x=>assert.ok(existsSync(new URL(`./public/try/brands/${x}.svg`,import.meta.url)),x))],
 ['SVG assets contain their accessible brand names',()=>slugs.forEach(x=>assert.match(get(`./public/try/brands/${x}.svg`),new RegExp(x,'i')))],
 ['no brand declared a partnership',()=>assert.match(js,/not LEGION partners/)],
 ['no supplier is represented as contacted',()=>assert.match(js,/LEGION has not queried this platform/)],
 ['each card shows no live quote',()=>assert.match(js,/NOT REQUESTED/)],
 ['supplier cards selectable',()=>assert.match(js,/data-supplier-index/)],
 ['six local route preflights',()=>assert.match(js,/6\/6 example platforms/)],
 ['source A distinct from MOQ example',()=>assert.match(js,/This real CAD order cannot proceed/)],
 ['separate contract disclosed',()=>assert.match(js,/It is not a quote for your reBot drawing/)],
 ['five buyers times 20 requires 100',()=>assert.match(js,/state.buyers\*20/)],
 ['historical negotiation still exists',()=>assert.match(js,/state.e.case_b.offers/)],
 ['five existing sandbox receipts shown',()=>assert.match(js,/b.captures.map/)],
 ['familiar provider payment title',()=>assert.match(js,/See how each buyer paid/)],
 ['zero fake live checkout',()=>assert.match(js,/no new payment requests|zero new payment requests|no new formal approval runs here/)],
 ['logo assets local no third party requests',()=>assert.doesNotMatch(html,/https?:\/\/[^" ]+\.(svg|png|webp)/)],
 ['mobile responsive supplier grid',()=>assert.match(css,/@media\(max-width:560px\)/)],
 ['reduced motion support retained',()=>assert.match(css,/prefers-reduced-motion:reduce/)],
 ['single work canvas',()=>assert.equal((html.match(/id="workCanvas"/g)||[]).length,1)],
];
let failed=0;for(const [name,fn] of tests){try{fn();console.log('PASS',name)}catch(e){failed++;console.error('FAIL',name,e.message)}}
console.log(`${tests.length-failed}/${tests.length} product workflow contracts PASS; failures=${failed}`);if(failed)process.exitCode=1;
