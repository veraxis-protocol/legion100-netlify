/* Read-only business effects: validates POST data into an ephemeral RFQ preview. */
import {normalizeRfq,InputError} from '../lib/rfq-preview-core.mjs';
export const config={path:'/api/rfq-preview',method:'POST'};
const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','x-legion-financial-effects':'0','x-legion-persisted':'false'};
const error=(code,status=400)=>Response.json({status:'NO_GO',code,external_effects:{supplier_requests:0,payment_calls:0,payment_captures:0}},{status,headers});
async function readBounded(req,limit){
 const length=req.headers.get('content-length');if(length&&Number(length)>limit)throw new InputError('PAYLOAD_TOO_LARGE',413);
 if(!req.body)return '';
 const reader=req.body.getReader();let total=0;const chunks=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>limit)throw new InputError('PAYLOAD_TOO_LARGE',413);chunks.push(value);}}finally{reader.releaseLock();}
 return new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks.map(x=>Buffer.from(x))));
}
export default async function handler(request){
 if(request.method!=='POST')return error('METHOD_NOT_ALLOWED',405);
 const url=new URL(request.url),origin=request.headers.get('origin');
 if(!(/^localhost$/.test(url.hostname)||url.hostname.endsWith('.netlify.app')))return error('HOST_DENIED',403);
 if(origin&&origin!==url.origin)return error('CROSS_ORIGIN_DENIED',403);
 if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))return error('CONTENT_TYPE_REQUIRED',415);
 try{const content=await readBounded(request,100_000);let input;try{input=JSON.parse(content);}catch{return error('JSON_INVALID',400);}
  return Response.json(normalizeRfq(input),{status:200,headers});
 }catch(e){return error(e instanceof InputError?e.code:'INVALID_REQUEST',e instanceof InputError?e.status:400);}
}
