/* LEGION real-tool X-Ray endpoint — source-bound, read-only streaming NDJSON. */
import { verifyPinnedBytes, observePart, EvidenceError } from '../lib/part-observe-core.mjs';
export const config={path:'/api/part-observe',method:'GET'};
const err=(code,status=400)=>Response.json({status:'NO_GO',code},{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
export default async function handler(request){
  if(request.method!=='GET')return err('METHOD_NOT_ALLOWED',405);
  const url=new URL(request.url);const partId=url.searchParams.get('part');
  if(!partId||!/^[A-Z0-9_]{3,80}$/.test(partId))return err('PART_ID_INVALID');
  // Network is bounded to the site deployment's own immutable public readback; no user URLs accepted.
  if(!(/^localhost$/.test(url.hostname)||url.hostname.endsWith('.netlify.app')))return err('HOST_DENIED',403);
  const evidenceUrl=new URL('/try/evidence.json',url.origin);
  let validated;
  try{
    const response=await fetch(evidenceUrl,{method:'GET',redirect:'error',headers:{'accept':'application/json','cache-control':'no-store'},signal:request.signal});
    if(!response.ok)return err('SOURCE_READ_FAILED',503);
    const data=Buffer.from(await response.arrayBuffer());
    validated=verifyPinnedBytes(data);
    if(!validated.evidence.case_a.vectors.some(v=>v.part_id===partId))return err('PART_NOT_FOUND',404);
  }catch(e){return err(e instanceof EvidenceError?e.code:'SOURCE_UNAVAILABLE',503);}
  const stream=new ReadableStream({
    async start(controller){
      try{
        const enc=new TextEncoder();
        for await(const event of observePart(validated,partId)){
          if(request.signal?.aborted)break;
          controller.enqueue(enc.encode(JSON.stringify(event)+'\n'));
        }
      }catch(e){controller.error(e);}finally{try{controller.close();}catch{}}
    }
  });
  return new Response(stream,{status:200,headers:{'content-type':'application/x-ndjson; charset=utf-8','cache-control':'no-store, max-age=0','x-content-type-options':'nosniff','x-legion-mode':'SERVER_SOURCE_BOUND_OBSERVATION','x-legion-financial-effects':'0'}});
}
