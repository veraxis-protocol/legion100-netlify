# Try LEGION Now — evidence and UX contract (v1)

**Normative priority:** `Evidence → admitted permissions → consequence`. Evidence of one case must never be used as authorization in another.

## Purpose

Five-stage Netlify experience:

1. DRAWING — show real, source-pinned STEP input and its SHA-256. Snapshot, not computation on Netlify.
2. PARTS — show 40 source-bound purchasing vectors with known fields and required missing fields. Status per vector is `Z` for engineering admission, not a qualified purchase.
3. LEGION AT WORK — show ZTL engineer's real reBot `OPEN` / procurement `BLOCKED`; separately show a local interactive synthetic coalition MOQ calculator.
4. REVIEW — display recorded synthetic contract versions and independent Judge (CASE B). Do not describe the synthetic buyers as associated with the reBot.
5. PAYPAL — show five recorded test captures bound to CASE B only; no new payments, charges, RFQs or supplier messages.

## Case invariants

- `A.ENGINEERING_ADMISSION = Z ⇒ A.PROCUREMENT = BLOCKED`, `A.NEW_PAYPAL_CAPTURES = 0`.
- `CASE_A_CONTRACT ≠ CASE_B_CONTRACT` and `CASE_B_CAPTURE ⇒ NOT_CASE_A_CAPTURE`.
- `CAPTURE_DISPLAYED ⇒ CASE_B_RECORDED_SANDBOX ∧ ID_IN_PINNED_EVIDENCE ∧ READBACK_CONFIRMED`.
- `PART_VECTOR.REQUIREMENTS_MISSING ≠ [] ⇒ PART_VECTOR.ENGINEERING_VERDICT ≠ T`.
- `DISPLAYED_PRICE != LIVE_SUPPLIER_QUOTE` unless from a provider-confirmed quote tied to the same contract; no such quote is included here.
- No browser-side API key, checkout, supplier API call, or new agent execution is authorized by this UX.

## Pins and status

Original: `/PayPal/WO_PAYPAL_LEGION_004_20261109/JUDGE_E2E_001/` in user's Dropbox, 2026-11-12. Code: `veraxis-protocol/LEGION-Deal-Rescue@2cc7dbdc2b305d92b4fd64614c74bc56b16c4cfe`.

- `CAD_XCAF_RESULT`: 33 subassemblies / 64 definitions / 326 instances, source SHA `a1e301ee…`.
- `BOM_RESULT`: mandatory 40/40 positions and 53/53 instances, each vector carries STEP/readme source digest.
- `ZTL_RESULT` and `JUDGE_GO_NO_GO`: reBot engineering admission `Z`, procurement blocked.
- `COMMERCE_REPLAY_RESULT`: independent contract replay rebuilt; recorded 63/63 independent Judge checks.
- `PAYPAL_EVIDENCE_CHECK`: 5/5 readback-confirmed captures, $495 in test money, zero new POSTs.

**Do not infer production payment permission, supplier acceptance, actual shipping, profitability or real buyer demand.**

## Environment requirements

This patch is an independent static subpath. `public/index.html` retains its existing upload and token-free NIM-review button. The static `/try/` page does not need or read API credentials. If Netlify host is unavailable, the UI can still run locally with `python -m http.server --directory public`.

## GO/NO-GO

`GO_STATIC` when 20/20 contract tests pass and the UI source has no live payment endpoint; `GO_BROWSER` when automated 1280×720 and 390×844 browser tests pass; `GO_DEPLOYMENT` only after a direct HTTP 200 response at `/try/`, full `evidence.json` readback, and independent judge click-through. Until then public Try it now remains `Z`.
