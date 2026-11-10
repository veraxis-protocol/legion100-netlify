# LEGION Customer Token-Free Fix 004

Public visitors upload a BOM or select the sample and press **Review component list with AI**. No API keys or access codes are collected from customers.

The Netlify Function `nim-review.mjs` serves `/api/nim-review`, uses `NIM_API_KEY` or `NVIDIA_API_KEY` exclusively server-side, and applies Netlify Free's code-based per-IP/domain rate limit (2 requests/180s). Cost is further bounded per request by 25 BOM lines, 12k characters, 25s upstream timeout, and `max_tokens=256`. This is **not** a global shared spending cap; distributed callers and the provider's own quotas are not fully controlled. Configure provider billing hard limits as required by your account.

The private `LEGION_NIM_DEMO_ACCESS_TOKEN` can be deleted from Netlify; it is ignored. `LEGION_NIM_DEMO_ENABLED` remains a server-side enable/disable switch.

Data returned by NIM is advisory. No ZTL certificate, supplier verification, 100-agent run or PayPal capture is claimed.

Run `node test-customer-nim.mjs` to test the HTTP handler in isolation with mocked NVIDIA upstream; test does not prove live NVIDIA inference.
