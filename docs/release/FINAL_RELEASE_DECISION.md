# Final Release Decision
**Date:** 2026-06-16
**Basis:** Evidence from PRE_PUSH_REPORT, CI_RELEASE_REPORT, INTEGRATION_STATUS_REPORT, OBSERVABILITY_VALIDATION, RELEASE_RISK_REGISTER, and prior engineering audits. No optimism bias.

---

## 1. GitHub Push — **GO** ✅

**Evidence:**
- Committed tree scanned: no `.env`/`.env.local`, no `dist`/build artifacts, no service-role keys/JWTs, no third-project files, no live tokens in docs (last one sanitized).
- Both products build + test from a clean install with **only** CI-provided env (TradeDoc 17/17, AgriSMES 39/39).
- `.env*`, `dist/`, and `lenmac-alex-assist/` are gitignored; nothing sensitive staged.

**Condition:** Push committed history only — do **NOT** `git add -A` (R14).

---

## 2. Staging — **GO WITH CONDITIONS** 🟡

Staging is the correct venue to perform and validate the items that cannot be verified locally. Approved **to proceed**, conditioned on completing these *before/within* the staging deploy:

**Prerequisites (do in staging):**
1. Set `ADMIN_SESSION_SECRET` (≥32B) + **rotated** `ADMIN_CODE` in staging Supabase (R1, R2).
2. Deploy AgriSMES `admin-verify` + `admin-listings` + `admin-messages` **and** client as one release (R4).
3. Set all Required env vars (both apps) in staging Vercel; set Supabase Auth redirect URLs (R5).
4. Set `VITE_SENTRY_DSN`/`SENTRY_DSN` to validate observability (R7).

**Staging acceptance gates (must pass):**
- A11 forged-token rejected (proves S-1 closed in deployed fn)
- A12 expired-token rejected
- A6 admin login with rotated code; T1/A1 OTP login
- T5 subscription gating; Polar webhook round-trip; Sentry test error received

**Evidence supporting GO:** code-complete, reproducible builds, S-1 fixed + unit-proven; the open items are operational and are exactly what staging exists to confirm.

---

## 3. Production — **NO-GO** ⛔

**Blocking (must clear, with evidence):**
1. **R1** — S-1 fix validated in staging (A11/A12 pass against deployed functions).
2. **R2** — `ADMIN_CODE` rotated off `"2468"`.
3. **R3** — service-role key rotated.
4. **R5** — all Required prod env vars confirmed in Vercel/Supabase; "Unknown" vars (`OPENAI_API_KEY`, `SUPABASE_MANAGEMENT_API_TOKEN`, `PAYMENT_WEBHOOK_SECRET`, `ALPHA_VANTAGE_API_KEY`, `LOVABLE_API_KEY`) clarified.
5. **R8/R9** — CI green on GitHub; Polar/Supabase/Sentry confirmed live in staging.
6. **R7** — Sentry delivery confirmed.

**Recommended before prod (non-blocking):** R6 (shorten admin token TTL / bind to visitor), wire remaining backend handlers to `captureError`.

**Production cannot be approved until staging validation produces the above evidence.** The code is production-quality; the gate is operational verification of a breaking auth change + unverified prod configuration.

---

## Final Readiness (evidence-based, no inflation)

| Dimension | TradeDoc | AgriSMES |
|---|---|---|
| Engineering (build/test/types/security-code) | 90% | 88% |
| Operational (deploy-verified, integrations-live, CI-green) | ~35% | ~30% |
| **Release-ready (push)** | **GO** | **GO** |

**Overall release readiness: ~80% engineering-complete, operationally-unproven.**
The remaining ~20% is **not codeable** — it is staging deployment + live integration verification.

---

## One-line answers

1. **GitHub Push:** GO (commit history only)
2. **Staging:** GO WITH CONDITIONS (set secrets, coordinated deploy, run acceptance gates)
3. **Production:** NO-GO (until R1, R2, R3, R5 cleared + staging gates pass)
