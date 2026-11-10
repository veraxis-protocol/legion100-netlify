import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import nim,{config} from './netlify/functions/nim-review.mjs';
import status from './netlify/functions/status.mjs';
const before = Object.fromEntries(['NVIDIA_API_KEY','NIM_API_KEY','NIM_MODEL','LEGION_NIM_DEMO_ENABLED','LEGION_NIM_DEMO_ACCESS_TOKEN'].map(k=>[k,process.env[k]]));
const fetchOriginal=globalThis.fetch;
const tests=[];
const post=(parts=[{name:'Sensor M12',part_number:'ABC-123',qty:20}])=>new Request('https://legion100.netlify.app/api/nim-review',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({parts,drawing_sha256:'a'.repeat(64)})});
try {
  assert.equal(config.path,'/api/nim-review');assert.deepEqual(config.rateLimit,{windowLimit:2,windowSize:180,aggregateBy:['ip','domain']});tests.push('Netlify Free per-IP/domain rateLimit configured');
  process.env.LEGION_NIM_DEMO_ENABLED='true';process.env.NVIDIA_API_KEY='test-secret';process.env.NIM_MODEL='nvidia/nemotron-3.5-lightning-30b-a3b';delete process.env.LEGION_NIM_DEMO_ACCESS_TOKEN;
  let d=await (await status(new Request('https://legion100.netlify.app/.netlify/functions/status'))).json();assert.equal(d.nim_ready,true);tests.push('readiness with no customer token');
  let count=0;
  globalThis.fetch=async (url,opts)=>{count++;assert.equal(url,'https://integrate.api.nvidia.com/v1/chat/completions');assert.equal(opts.headers.authorization,'Bearer test-secret');const body=JSON.parse(opts.body);assert.equal(body.model,'nvidia/nemotron-3.5-lightning-30b-a3b');assert.equal(body.max_tokens,256);assert.equal(body.chat_template_kwargs.enable_thinking,false);return Response.json({choices:[{message:{content:'Verify M12 connection pinout, manufacturer documentation and revision before sourcing.'}}]});};
  const r=await nim(post());assert.equal(r.status,200);let j=await r.json();assert.equal(j.admission,'Z');assert.match(j.review,/Verify M12/);assert.equal(count,1);tests.push('token-free customer POST => mock NVIDIA 200, admission Z');
  assert.equal((await nim(post([{name:'BAD',qty:0}]))).status,400);tests.push('invalid quantity blocked before NIM');
  assert.equal((await nim(post([]))).status,400);tests.push('empty BOM blocked before NIM');
  process.env.LEGION_NIM_DEMO_ENABLED='false';assert.equal((await nim(post())).status,503);tests.push('server-side kill switch blocks NIM');
  process.env.LEGION_NIM_DEMO_ENABLED='true';globalThis.fetch=async()=>new Response('quota exhausted',{status:429});assert.equal((await nim(post())).status,502);tests.push('upstream failure fails closed');
  const html=readFileSync(new URL('./public/index.html',import.meta.url),'utf8');const js=readFileSync(new URL('./public/assets/app.js',import.meta.url),'utf8');
  for(const source of [html,js]){assert.doesNotMatch(source,/demoAccessCode|Private demo code|LEGION_NIM_DEMO_ACCESS_TOKEN|NVIDIA_API_KEY\s*=/);}
  assert.match(js,/fetch\('\/api\/nim-review'/);assert.doesNotMatch(js,/authorization.*demoCode/);tests.push('browser has no access-code UI, no authorization header');
  assert.ok(count===1);tests.push('all invalid and disabled requests did not invoke NVIDIA');
  console.log(JSON.stringify({passed:tests.length,failed:0,tests},null,2));
}finally {globalThis.fetch=fetchOriginal;for(const [k,v] of Object.entries(before)){if(v===undefined)delete process.env[k];else process.env[k]=v}}
