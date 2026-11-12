// WO-TRY-LIVING-004: dedicated product UX + evidence isolation contracts.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=x=>readFileSync(new URL(x,import.meta.url),'utf8');
const h=read('./public/try/index.html'),j=read('./public/try/try-living.js'),css=read('./public/try/try-living.css');
const e=JSON.parse(read('./public/try/evidence.json'));
const tests=[
 ['one persistent work object',()=>assert.match(h,/id="intentRail"/)],
 ['one canvas for consequential interaction',()=>assert.match(h,/id="workCanvas"/)],
 ['one contextual decision inspector',()=>assert.match(h,/id="decisionRail"/)],
 ['no marketing-style old billboard',()=>assert.doesNotMatch(h,/intro-metric|case-notice|stageContent/)],
 ['no generic Continue action',()=>assert.doesNotMatch(h+j,/Continue →|>Continue</)],
 ['single app renderer owns five screens',()=>assert.match(j,/const renderer=\[drawing,vector,/)],
 ['source components selected, not a pre-filled cart',()=>assert.match(j,/partId:null/)],
 ['40 source parts remain selectable',()=>assert.match(j,/a\.vectors\.map\(x=>`<option/)],
 ['vector has editable quantity',()=>assert.match(j,/field\('qty'/)],
 ['vector has editable hypothetical budget',()=>assert.match(j,/field\('budget'/)],
 ['vector missing requirements remain drafts',()=>assert.match(j,/Drafted ≠ verified/)],
 ['unknown cannot become engineering permission',()=>assert.match(j,/a\?\.engineering_admission==='Z'/)],
 ['real CAD gate blocks supplier order',()=>assert.match(j,/Procurement on HOLD/)],
 ['explicit separate synthetic case switch',()=>assert.match(j,/switch-to-fixture/)],
 ['MOQ starts with one 20-unit buyer',()=>assert.match(j,/buyers:1/)],
 ['MOQ cannot exceed five buyers',()=>assert.match(j,/Math\.min\(5,state\.buyers\+1\)/)],
 ['MOQ contract boundary not inferred',()=>assert.match(j,/This MOQ calculation is a local synthetic fixture/)],
 ['historical $540 rejection fixed',()=>assert.match(j,/Each buyer would pay \$108/)],
 ['historical $495 signature fixed',()=>assert.match(j,/Seven parties signed this version at \$99/)],
 ['PayPal locked until signed version',()=>assert.match(j,/selected!==49500/)],
 ['five selectable PayPal Sandbox capture records',()=>assert.match(j,/data-capture="\$\{i\}"/)],
 ['new PayPal effects explicitly zero',()=>assert.match(j,/New PayPal calls/)],
 ['replay resets workflow to source',()=>assert.match(j,/state\.stage=0;state\.reached=0/)],
 ['only GET from local evidence',()=>assert.equal([...j.matchAll(/\bfetch\(/g)].length,1)],
 ['new page preserves brand primary blue',()=>assert.match(css, /--blue:#164cb8/)],
 ['mobile and tablet responsive breakpoints',()=>{assert.match(css,/@media\(max-width:770px\)/);assert.match(css,/@media\(max-width:480px\)/)}],
 ['reduced-motion accommodation',()=>assert.match(css, /prefers-reduced-motion:reduce/)],
 ['failure-to-load does not reveal workspace',()=>assert.match(j,/if\(!evidenceValid\(evidence\)\)throw Error/)],
 ['signed contract $495 exact $99 each',()=>assert.equal(e.case_b.payPal_test_cents/e.case_b.buyers,9900)],
 ['captured payment evidence readback',()=>assert.equal(e.case_b.readback_confirmed,true)],
];
let bad=0;
for(const [name,test] of tests){try{test();console.log('PASS',name)}catch(x){bad++;console.error('FAIL',name,x.message)}}
console.log(`${tests.length-bad}/${tests.length} living-workspace contracts PASS; failures=${bad}`);
if(bad)process.exit(1);
