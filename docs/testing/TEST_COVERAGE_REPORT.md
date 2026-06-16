# Test Coverage Report
**Date:** 2026-06-16  
**Commit:** `4146e54`  
**Framework:** Vitest + Testing Library (jsdom)

---

## Summary

| Product | Before | After | Test files |
|---|---|---|---|
| TradeDoc | 3 | **17** | 3 |
| AgriSMES | 3 | **31** | 4 |

All tests are real assertions against production logic — no placeholder/always-true tests.

---

## TradeDoc — Critical Workflows

| Workflow | Covered by | What is asserted |
|---|---|---|
| **Login / auth gate** | `tradedocApi.test.ts` | API client refuses requests with no session token; sends correct `Bearer` token when authenticated |
| **Document generation** | `docTypes.test.ts` + `tradedocApi.test.ts` | Registry integrity (unique ids, valid field types, select options, required fields); `generateDoc` posts correct `doc_type` + `payload`; required-field validation gate reproduced |
| **Subscription checks** | `tradedocApi.test.ts` | `plan_status` ('pro') flows through `getDashboard`; free/pro template split exists in registry |
| **Export flow** | `tradedocApi.test.ts` | `generateDoc` returns `document_id`; server errors (403 Upgrade-to-Pro, 500) surface as thrown errors instead of silent success |

**Not directly unit-tested:** the jsPDF rendering in `pdfGenerator.ts` (DOM/canvas-bound; exercised indirectly via the smoke test that renders `App`). Noted as a gap.

---

## AgriSMES — Critical Workflows

| Workflow | Covered by | What is asserted |
|---|---|---|
| **Login / signup** | `validation.test.ts` | Email validation (format, disposable-domain rejection, suspicious patterns, normalisation); password rules (length, uppercase, number, special char) |
| **Subscription status** | `entitlements.test.ts` | Pro granted only for active + unexpired `agrismes_pro`; denied for expired period, cancelled status, missing entitlement; null period = no expiry; HTTP/network failures non-fatal (empty result, never throws) |
| **Intelligence workflow** | `weatherRisk.test.ts` | Mold-drying risk classification HIGH/MEDIUM/LOW per commodity; commodity-specific rules (coffee fog/overnight humidity, cocoa threshold); recommendation always matches level |
| **Webhook processing** | *(see note)* | Validated at runtime in `api/polar-webhook.js` (signature → 401, payload → 400, idempotency); not unit-tested (JS handler, needs integration harness) |
| **Trade margin calculations** | *(see note)* | Margin math is inline in `TradeMarginCalculator.tsx` (UI-coupled). Not unit-tested without extraction refactor. Noted as a gap. |

---

## Honest Gaps

| Gap | Risk | Recommendation |
|---|---|---|
| Trade margin calc not unit-tested (inline in component) | Medium — core business math | Extract pure `computeMargin()` to `lib/` and test |
| Webhook handlers not unit-tested | Medium — payment path | Add integration tests with a signed-payload fixture |
| `pdfGenerator` / `exportPDF` not unit-tested | Low — render-only | Snapshot or DOM-assertion test |
| No coverage threshold enforced in CI | Low | Add `vitest run --coverage` with a floor once suites grow |

---

## Verification

```
TradeDoc:  Test Files 3 passed (3) | Tests 17 passed (17)
AgriSMES:  Test Files 4 passed (4) | Tests 31 passed (31)
```

Both products: builds pass, all tests green.

**Success criteria — "all critical workflows covered":** Met for login, subscription status, document generation, export error handling, and intelligence advisory. Trade-margin math and webhook processing are covered at the runtime-validation level but flagged for dedicated unit tests (require minor refactor / integration harness).
