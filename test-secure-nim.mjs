import status from './netlify/functions/status.mjs';
import nim from './netlify/functions/nim-review.mjs';
import assert from 'node:assert/strict';
const keys=['NVIDIA_API_KEY','NIM_API_KEY','NIM_MODEL','LEGION_NIM_DEMO_ENABLED','LEGION_NIM_DEMO_ACCESS_TOKEN','NIM_API_URL'];
const before=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
const tests=[];
function post(token){return new Request('https://legion100.netlify.app/.netlify/functions/nim-review',{method:'POST',headers:{'content-type':'application/json',...token?{authorization:`Bearer ${token}`}:{}} ,body:JSON.stringify({drawing_sha256:'a'.repeat(64),parts:[{name:'A',qty:20}]})});}
try{
  delete process.env.LEGION_NIM_DEMO_ACCESS_TOKEN;
  assert.equal((await nim(post())).status,503);tests.push('no access token denies');
  process.env.LEGION_NIM_DEMO_ACCESS_TOKEN='abcdefghijklmnopqrstuvwxyz012345';
  assert.equal((await nim(post())).status,401);tests.push('missing browser token denies');
  assert.equal((await nim(post('wrong-access-token'))).status,401);tests.push('wrong token denies');
  assert.equal((await nim(post('abcdefghijklmnopqrstuvwxyz012345'))).status,503);tests.push('correct token but no NIM creds denies');
  process.env.NVIDIA_API_KEY='private-test-key';process.env.NIM_MODEL='unit-test-model';process.env.LEGION_NIM_DEMO_ENABLED='true';
  let d=await (await status(new Request('https://legion100.netlify.app/.netlify/functions/status'))).json();assert.equal(d.nim_ready,true);tests.push('ready true with all four configured');
  const orig=globalThis.fetch;
  let seen=false;
  globalThis.fetch=async (url,options)=>{assert.equal(url,'https://integrate.api.nvidia.com/v1/chat/completions');assert.equal(options.headers.authorization,'Bearer private-test-key');seen=true;return Response.json({choices:[{message:{content:'Part A requires material verification. Revision missing. No order admission.'}}]});};
  try{let r=await nim(post('abcdefghijklmnopqrstuvwxyz012345'));assert.equal(r.status,200);let j=await r.json();assert.equal(j.admission,'Z');assert.equal(seen,true);tests.push('authorized NIM advisory round trip, Z admission');}finally{globalThis.fetch=orig}
  process.env.LEGION_NIM_DEMO_ACCESS_TOKEN='short';d=await (await status(new Request('https://legion100.netlify.app/.netlify/functions/status'))).json();assert.equal(d.nim_ready,false);tests.push('weak token fails readiness');
}finally{for(const k of keys){if(before[k]===undefined)delete process.env[k];else process.env[k]=before[k]}}
console.log(JSON.stringify({passed:tests.length,tests},null,2));
