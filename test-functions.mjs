import status from './netlify/functions/status.mjs';
import nim from './netlify/functions/nim-review.mjs';
import intake from './netlify/functions/intake.mjs';
import checkout from './netlify/functions/paypal-checkout.mjs';
import assert from 'node:assert/strict';
const items=[];
for(const [name,fn,method,data,expected] of [
 ['status without secrets',status,'GET',undefined,200],
 ['NIM fails closed',nim,'POST',{parts:[{name:'x',qty:1}]},503],
 ['engineering intake fails closed',intake,'POST',{drawing_sha256:'a'.repeat(64),lines:[]},503],
 ['payment fails closed',checkout,'POST',{contract_id:'12345678',spec_digest:'a'.repeat(64)},503],
 ['payment method gate',checkout,'GET',undefined,405],
 ['intake method gate',intake,'GET',undefined,405],
 ['NIM method gate',nim,'GET',undefined,405]
]){
 const req=new Request('https://legion-example.netlify.app/.netlify/functions/'+name,{method,headers:{'content-type':'application/json'},body:method==='POST'?JSON.stringify(data):undefined});
 const res=await fn(req);assert.equal(res.status,expected,name);items.push({name,status:res.status,pass:true});
 if(name==='status without secrets'){const d=await res.json();assert.equal(d.nim_ready,false);assert.equal(d.paypal_backend_ready,false);assert.equal(d.agent_runtime_ready,false)}
}
console.log(JSON.stringify({tests:items.length,passed:items.length,items},null,2));
