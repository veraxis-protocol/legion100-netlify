# LEGION — Try it now

**Public demo: https://legion100.netlify.app/try/** (also linked from the homepage as **Try LEGION Now →**).

There are five interactive screens: **DRAWING → PARTS → LEGION AT WORK → REVIEW → PAYPAL**.

- Navigation, part selection across 40 purchasing vectors, the coalition buyer stepper, offer comparison and evidence links all work.
- There is no signup, API key or charge. The page is read-only: it fetches only `./evidence.json` from the same origin.

## Evidence boundaries

**CASE A, real CAD.**
- The input is the Seeed reBot B601-DM STEP (SHA-256 `a1e301ee…`), computed in a pinned Judge Mode run of [LEGION-Deal-Rescue](https://github.com/veraxis-protocol/LEGION-Deal-Rescue).
- OpenCascade finds 33/64/326. The BOM matches 40/40 parts and 53/53 instances.
- The 40 vectors carry the quantity, material, process, bounding box, tolerance and missing requirements exactly as in that run's `BOM_RESULT.json`.
- The ZTL review is OPEN with `RAIL_TOLERANCE=Z`. **ENGINEERING_ADMISSION = Z** and procurement is **BLOCKED**. There are no payments.

**Coalition mechanism.** A synthetic fixture: 5 × 20 = MOQ 100. It is not CASE B.

**CASE B, recorded synthetic commerce.**
- $480 is invalidated, $540 is rejected by all five buyers' caps, and $495 is signed by seven parties. The independent Judge passes 63/63.
- There are **five recorded PayPal Sandbox captures ($495, test money)**, each readback-confirmed.
- These are not new or live transactions, and they never authorize CASE A.

The page never initiates a supplier request, PayPal order or capture, or any other external effect.

## Reproduce

| What | How |
|---|---|
| Evidence source | `git clone https://github.com/veraxis-protocol/LEGION-Deal-Rescue.git && cd LEGION-Deal-Rescue && python -m scripts.judge_demo` recomputes CASE A and checks CASE B on your machine. |
| This page's contract | `public/try/evidence.json` (schema `legion.try.evidence.v1`; see `TRY_NOW_CONTRACT.md`). |
| Tests | `node test-try-now.mjs` (20 contract checks), `node test-try-runtime.mjs` (16 interaction checks), and the existing `node test-one-click-ui.mjs`, `node test-functions.mjs` and `node test-customer-nim.mjs`. |
| Local preview | `python -m http.server 8766 --directory public`, then open `http://localhost:8766/try/`. |

---

# LEGION Customer Token-Free Fix 004

Public visitors upload a BOM or select the sample and press **Review component list with AI**. No API keys or access codes are collected from customers.

The Netlify Function `nim-review.mjs` serves `/api/nim-review`, uses `NIM_API_KEY` or `NVIDIA_API_KEY` exclusively server-side, and applies Netlify Free's code-based per-IP/domain rate limit (2 requests/180s). Cost is further bounded per request by 25 BOM lines, 12k characters, 25s upstream timeout, and `max_tokens=256`. This is **not** a global shared spending cap; distributed callers and the provider's own quotas are not fully controlled. Configure provider billing hard limits as required by your account.

The private `LEGION_NIM_DEMO_ACCESS_TOKEN` can be deleted from Netlify; it is ignored. `LEGION_NIM_DEMO_ENABLED` remains a server-side enable/disable switch.

Data returned by NIM is advisory. No ZTL certificate, supplier verification, 100-agent run or PayPal capture is claimed.

Run `node test-customer-nim.mjs` to test the HTTP handler in isolation with mocked NVIDIA upstream; test does not prove live NVIDIA inference.

## v005 — one-click AI review visible on landing
The landing button **Review sample with AI** immediately opens the sample BOM and sends one token-free request to `/api/nim-review`; the review is visible in Engineering review. For a user-uploaded BOM, the in-workspace **Review component list with AI** button remains available. Netlify server-side credentials only. No claim of formal engineering admission or real sourcing.
