export default async (request) => {
  if (request.method !== 'GET') return Response.json({error:'Method not allowed'}, {status:405});
  // The customer-facing API no longer asks for a token. These checks are
  // configuration presence only, NOT proof of a successful NVIDIA inference.
  const checks = {
    enabled_exactly_true: process.env.LEGION_NIM_DEMO_ENABLED === 'true',
    nvidia_api_key_present: Boolean(process.env.NVIDIA_API_KEY || process.env.NIM_API_KEY),
    nim_model_present: Boolean(process.env.NIM_MODEL)
  };
  return Response.json({
    service:'legion-netlify',state:'NO_LIVE_ADMISSION_CLAIM',
    nim_ready:Object.values(checks).every(Boolean),
    nim_configuration_checks:checks,
    engineering_backend_ready:Boolean(process.env.LEGION_ENGINEERING_BACKEND_URL),
    agent_runtime_ready:Boolean(process.env.LEGION_AGENTS_STATUS_URL),
    paypal_backend_ready:Boolean(process.env.LEGION_PAYMENT_ADMISSION_URL&&process.env.LEGION_PAYPAL_GATEWAY_URL),
    scope:'Configuration alone does not prove successful calls, admissible orders or paid captures.'
  },{headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}})
}
