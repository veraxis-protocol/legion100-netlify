import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('./public/index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('./public/assets/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('./public/assets/app.css',import.meta.url),'utf8');
const checks=[
  ['landing CTA visible in hero',()=>assert.match(html,/<div class="actions">[\s\S]*?id="trydemo"[^>]*>Review sample with AI/)],
  ['hero button runs sample and NIM in same handler',()=>assert.match(js,/\$\('trydemo'\)\.addEventListener\('click',\(\)=>\{openCurrent\(structuredClone\(sample\)\);void requestNimReview\(\)\}\)/)],
  ['review sends exactly one POST path',()=>assert.match(js,/fetch\('\/api\/nim-review'/)],
  ['no token field in customer UI',()=>assert.doesNotMatch(html+js,/demoAccessCode|Private demo code|LEGION_NIM_DEMO_ACCESS_TOKEN|authorization.*demoCode/i)],
  ['no frontend readiness gate for review',()=>assert.doesNotMatch(js,/if\(!runtime\.nim_ready\)/)],
  ['deduplicate concurrent review clicks',()=>assert.match(js,/if\(nimPending\)return;/)],
  ['display review outcome',()=>assert.match(js,/set\('nimResult','NIM advisory only/)],
  ['refresh JS asset URL',()=>assert.match(html,/assets\/app\.js\?v=005-one-click/)],
  ['hidden workspace can become visible',()=>assert.match(css,/\.workspace\[hidden\]\{display:none!important\}/)]
];
for (const [name,check] of checks) {check();console.log('PASS '+name)}
console.log('PASS - 9/9 one-click UI contract checks');
