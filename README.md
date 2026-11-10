# LEGION Netlify Deploy 003 — private NIM review safeguard

This is the updated deploy bundle for **the same existing Netlify project `legion100`**. It preserves the public procurement workspace and four Netlify Functions, and adds a private demo access gate to the NIM endpoint. It does not run the 100 agents, engineer/supplier attestations or payment gateway.

## Browser-only deployment (no scripts)

1. Netlify dashboard > Projects > legion100 > Deploys: upload the extracted `LEGION_NETLIFY_DEPLOY_003` folder (with `netlify.toml`, `public/`, and `netlify/functions/` at the same directory level). Confirm Functions shows four functions after deploy.
2. Netlify > Project configuration > Environment variables > Add variables (Production and Functions scope):
   - `NVIDIA_API_KEY`: your actual NVIDIA NIM API key, mark secret;
   - `NIM_MODEL`: a model ID enabled for your account, not a guessed name;
   - `LEGION_NIM_DEMO_ENABLED`: `true`;
   - `LEGION_NIM_DEMO_ACCESS_TOKEN`: a unique high-entropy passphrase **at least 32 characters**, mark secret; do not copy this token into code or share it. Use your password manager to create the value.
   - `NIM_API_URL`: optional, only if your NIM endpoint is not the default `https://integrate.api.nvidia.com/v1/chat/completions`.
3. Save variables, then **redeploy** the same folder. Netlify locks env vars per deploy. Do not publish `.env` or API keys in the `public/` folder.
4. Open https://legion100.netlify.app/.netlify/functions/status — expect `nim_ready:true`; this proves configuration only. On the site, upload a BOM CSV or annotated DXF, enter the **private demo code** into the small field and press `Ask connected NIM`. The model reply is **advisory**, admission stays `Z`.
5. Netlify > Functions > `nim-review` > Logs should record an invocation without exposing the secret. Remove or rotate the NIM key and demo token after filming.

## Safety

- This function is intentionally usable only by people who know the demo access token; it has no full identity/tenant model or persistent quota limiter. Use only for a short private hackathon demo, and configure provider spending limits. A public website does not by itself authorize public inference spending.
- Payment remains disabled and no suppliers or 100-agent runtime are connected. The UI cannot truthfully say orders were placed without per-line supplier acknowledgments and independent engineering/verifier receipts.
- Service can return `nim_ready:true` with wrong model ID, exhausted quota or unreachable upstream; only a real POST and NIM response establish runtime success.

## Tests

`node test-functions.mjs` and `node test-secure-nim.mjs`. Secret never travels in deployed static assets; the browser input is volatile and not persisted.
