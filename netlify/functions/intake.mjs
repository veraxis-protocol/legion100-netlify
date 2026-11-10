/** Dispatch local BOM metadata to a permissioned engineering intake endpoint. No model claim. */
export default async (request) => {
 if(request.method!=='POST')return Response.json({error:'Method not allowed'},{status:405});
 const endpoint=process.env.LEGION_ENGINEERING_BACKEND_URL;
 if(!endpoint||!/^https:\/\//i.test(endpoint))return Response.json({error:'No HTTPS engineering intake backend configured',status:'Z'},{status:503});
 let raw;
 try{raw=await request.text();if(raw.length>50000)throw Error('Too long');const p=JSON.parse(raw);if(!/^[0-9a-f]{64}$/i.test(p.drawing_sha256)||!Array.isArray(p.lines)||p.lines.length>2000)throw Error('Bad input')}
 catch{return Response.json({error:'Invalid drawing fingerprint or BOM payload'},{status:400})}
 const ac=new AbortController();const t=setTimeout(()=>ac.abort(),18000);
 try{
  const h={'content-type':'application/json'};if(process.env.LEGION_BACKEND_TOKEN)h.authorization=`Bearer ${process.env.LEGION_BACKEND_TOKEN}`;
  const res=await fetch(endpoint,{method:'POST',headers:h,body:raw,signal:ac.signal});
  const text=(await res.text()).slice(0,25000);
  if(!res.ok)return Response.json({error:`Engineering service returned ${res.status}`,status:'Z'},{status:502});
  const data=JSON.parse(text);
  // Acknowledgement is not a signed verification certificate.
  return Response.json({received:true,backend_receipt:data.receipt_id||null,engineering_admission:'Z',note:'The service accepted intake metadata. Independent ZTL verdict is not inferred.'},{headers:{'cache-control':'no-store'}})
 }catch{return Response.json({error:'Engineering backend unreachable or malformed response',status:'Z'},{status:502})}
 finally{clearTimeout(t)}
}
