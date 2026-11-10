export default async (request) => {
  if (request.method !== 'GET') return Response.json({error:'Method not allowed'}, {status:405});
  return Response.json({
    service:'legion-netlify',state:'NO_LIVE_ADMISSION_CLAIM',
    nim_ready:process.env.LEGION_NIM_DEMO_ENABLED==='true'&&Boolean(process.env.NVIDIA_API_KEY||process.env.NIM_API_KEY)&&Boolean(process.env.NIM_MODEL)&&Boolean(process.env.LEGION_NIM_DEMO_ACCESS_TOKEN&&process.env.LEGION_NIM_DEMO_ACCESS_TOKEN.length>=32),
    engineering_backend_ready:Boolean(process.env.LEGION_ENGINEERING_BACKEND_URL),
    agent_runtime_ready:Boolean(process.env.LEGION_AGENTS_STATUS_URL),
    paypal_backend_ready:Boolean(process.env.LEGION_PAYMENT_ADMISSION_URL&&process.env.LEGION_PAYPAL_GATEWAY_URL),
    scope:'Configuration alone does not prove successful calls, admissible orders or paid captures.'
  },{headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}})
}
