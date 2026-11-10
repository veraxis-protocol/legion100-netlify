/**
 * Fail-closed broker. No payments can occur without two separate external services.
 * Admission must be checked by a trusted verifier, not by a browser-supplied flag.
 * Gateway must enforce own authenticated permits, idempotency and buyer approval.
 * Not triggered from demo sample UI.
 */
export default async(request)=>{
 if(request.method!=='POST')return Response.json({error:'Method not allowed'},{status:405});
 const gateUrl=process.env.LEGION_PAYMENT_ADMISSION_URL;
 const payUrl=process.env.LEGION_PAYPAL_GATEWAY_URL;
 const auth=process.env.LEGION_BACKEND_TOKEN;
 if(!gateUrl||!payUrl||!auth||!gateUrl.startsWith('https://')||!payUrl.startsWith('https://'))
   return Response.json({error:'Payment is blocked. Signed admission and payment gateway are not configured.',status:'Z'},{status:503});
 let data;
 try{const txt=await request.text();if(txt.length>12000)throw Error('Too long');data=JSON.parse(txt);
   if(!/^[a-zA-Z0-9_-]{8,100}$/.test(String(data.contract_id||''))||!/^[0-9a-f]{64}$/i.test(String(data.spec_digest||''))||!data.buyer_approval_reference||!data.quote_reference)throw Error('Missing bindings');
 }catch{return Response.json({error:'Invalid bound contract request'},{status:400})}
 try{
   const headers={'content-type':'application/json',authorization:`Bearer ${auth}`};
   const gate=await fetch(gateUrl,{method:'POST',headers,body:JSON.stringify({contract_id:data.contract_id,spec_digest:data.spec_digest,quote_reference:data.quote_reference,buyer_approval_reference:data.buyer_approval_reference})});
   if(!gate.ok)return Response.json({status:'F',error:'Independent admission unavailable or denied'},{status:409});
   const admitted=await gate.json();
   if(admitted.verdict!=='T'||!admitted.signed_permit||!admitted.epoch||!admitted.bound_contract_id||admitted.bound_contract_id!==data.contract_id)
     return Response.json({status:'Z',error:'No signed current-epoch payment permit for this contract'},{status:409});
   const pay=await fetch(payUrl,{method:'POST',headers,body:JSON.stringify({contract_id:data.contract_id,permit:admitted.signed_permit,epoch:admitted.epoch,idempotency_key:data.contract_id,expected_spec_digest:data.spec_digest})});
   if(!pay.ok)return Response.json({status:'Z',error:'Payment service did not confirm creation. Reconcile before retry.'},{status:502});
   const paybody=await pay.json();
   // Approval and capture are separate; gateway must enforce both.
   return Response.json({status:'PAYMENT_AWAITING_BUYER',approval_url:paybody.approval_url||null,order_reference:paybody.order_reference||null,notice:'Not captured or supplier-confirmed.'},{headers:{'cache-control':'no-store'}})
 }catch{return Response.json({status:'Z',error:'Uncertain gateway response: reconcile before retry'},{status:502})}
}
