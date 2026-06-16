# Runtime Validation Checklist
**Date:** 2026-06-16
**Use:** Execute against the **staging** deployment after env vars are set. Each item lists the action, expected result, and how to confirm.
**Status now:** None executed (no deployment). Items map to code paths verified to exist; runtime confirmation is pending staging.

---

## TradeDoc

| # | Test | Steps | Expected | Auto-test backing |
|---|---|---|---|---|
| T1 | Login (OTP) | Enter work email + company → submit code | OTP email arrives; valid code logs in; dashboard loads | `tradedocApi.test.ts` (auth gate) |
| T2 | Logout | Click Sign out | Session cleared; returns to login; reload stays logged out | — |
| T3 | Session restore | Log in → refresh page | Still authenticated (Supabase `persistSession`, `storageKey: tradedoc.auth`) | — |
| T4 | Document generation | Fill a free template (e.g. Commercial Invoice) → Generate PDF | PDF downloads; required-field validation blocks empty form | `docTypes.test.ts`, `tradedocApi.test.ts` (generateDoc payload) |
| T5 | Subscription detection | Log in as free vs pro account | Free sees pro templates gated; pro can generate pro docs (`plan_status`) | `tradedocApi.test.ts` (plan_status flows) |
| T6 | Export workflow | Generate → verify PDF content + filename | PDF renders fields correctly | indirect (smoke render) |
| T7 | Error handling | Trigger a 403 (free user → pro doc) | Friendly error shown, not raw server text; ErrorBoundary catches render errors | `tradedocApi.test.ts` (error surfacing) |

---

## AgriSMES

| # | Test | Steps | Expected | Auto-test backing |
|---|---|---|---|---|
| A1 | Login (OTP) | Email → OTP code | Logs in; session set | `validation.test.ts` (email/password rules) |
| A2 | Logout | Sign out | Session + admin token cleared from localStorage | — |
| A3 | Session restore | Login → refresh | Still authenticated | — |
| A4 | Trade margin calculation | Run an analysis with sample trade input | Margin/yield/signal computed; freight rate fetched or default used | partial (calc inline; freight fallback covered) |
| A5 | Intelligence workflows | Open Market Intelligence; view freight/alerts | Live data renders (typed `FreightAlert`/`FreightRoute`); falls back to static if API down | `weatherRisk.test.ts` (risk classification) |
| A6 | Admin login | Open admin entry → enter rotated `ADMIN_CODE` | `admin-verify` returns `{success, token}`; lockout after 3 wrong attempts | `adminAuth.test.ts` (token validity) |
| A7 | Admin token issuance | After A6, inspect localStorage | `agrismes_admin_token` present (signed JWT-like) | `adminAuth.test.ts` (mint) |
| A8 | Admin action authorized | As admin, approve/delete a listing | Succeeds with valid token | code path verified |
| A9 | Admin token expiry | Wait > TTL (1h) or set short TTL → retry admin action | 401 Unauthorized; must re-verify | `adminAuth.test.ts` (`rejects an expired token`) |
| A10 | Admin logout | Click logout | `agrismes_admin_token` + `agrismes_admin_access` removed; admin actions 401 | code path verified (ExploreListings/UnlockExclusiveServices) |
| A11 | **Forged token rejection** | `curl admin-listings` with `adminToken:"verified"` or random string | **401 Unauthorized** (the old bypass) | `adminAuth.test.ts` (`rejects the old magic string`, wrong-secret, tampered) |
| A12 | Expired token rejection (server) | `curl admin-messages` with an expired signed token | **401 Unauthorized** | `adminAuth.test.ts` (expired) |

---

## Critical staging acceptance gates (must pass before prod)

- [ ] **A11 forged-token rejection** — confirm `{"adminToken":"verified"}` is now rejected (proves S-1 closed in the deployed function)
- [ ] **A12 expired-token rejection** — confirm signature/expiry enforced server-side
- [ ] **A6 admin login** end-to-end with the **rotated** `ADMIN_CODE`
- [ ] **T1/A1 login** OTP delivery + verify
- [ ] **T5 subscription** gating correct for free vs pro

---

## Backing evidence today (pre-deploy)
- TradeDoc 17/17 + AgriSMES 39/39 unit tests pass locally.
- `adminAuth.test.ts` already proves forged/expired/tampered/wrong-secret tokens are rejected at the function level — A11/A12 validate the **deployed** behaviour matches.
- Runtime items without unit backing (T2/T3/A2/A3/A8/A10) require manual staging execution.
