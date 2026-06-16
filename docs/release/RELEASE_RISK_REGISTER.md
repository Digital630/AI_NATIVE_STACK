# Release Risk Register
**Date:** 2026-06-16
**Classification:** Critical / High / Medium / Low — by likelihood × customer/security impact. Cosmetic items excluded.

---

## CRITICAL

| ID | Risk | Domain | Mitigation / Status |
|---|---|---|---|
| R1 | **S-1 admin-auth fix is code-only, not deployed.** Until the 3 edge functions + client are deployed *together* with `ADMIN_SESSION_SECRET` set, production AgriSMES admin endpoints remain bypassable (static `"verified"` / `"2468"`). | Security | Fix committed (`c8ed1c0`) + 8 tests. **Deploy as a coordinated unit; validate A11/A12 in staging.** Blocks prod. |
| R2 | **Weak `ADMIN_CODE` (`"2468"`) still live** until rotated. Even with the token fix, a 4-digit code mints valid tokens. | Security | Rotate to a strong value in Supabase before staging admin testing. Blocks prod. |

---

## HIGH

| ID | Risk | Domain | Mitigation / Status |
|---|---|---|---|
| R3 | **Service-role key sat in untracked `.env.local`** (paste error). Not in git, not pushed, but should be rotated as precaution. | Security | `SUPABASE_KEY_ROTATION_PLAN.md`. Rotate before/at prod. |
| R4 | **Deployment ordering of the breaking auth change.** Old client + new functions (or vice-versa) breaks admin auth (token-format mismatch). | Deployment | Runbook mandates same-release deploy of functions+client after secret is set. |
| R5 | **Production env vars unverified.** ~28 required vars across both apps; any missing critical one breaks auth/payments/DB. 5 are "Unknown" purpose. | Deployment / Ops | `STAGING_DEPLOYMENT_RUNBOOK.md` enumerates all. Confirm in Vercel/Supabase; clarify Unknowns with owner. |

---

## MEDIUM

| ID | Risk | Domain | Mitigation / Status |
|---|---|---|---|
| R6 | **Admin token replay / no revocation.** Tokens carry `{role,exp}` only — no jti/binding; a captured token is replayable ≤1h; logout is client-side only (no server revocation). | Security | Acceptable for admin-only/1h TTL; recommend shorter TTL + visitorId binding. Not a launch blocker. |
| R7 | **Observability unverified end-to-end + partial backend coverage.** `captureError` not wired into all handlers; no DSN set; delivery unconfirmed. | Reliability / Ops | Set DSN in staging, confirm a test error lands; wire remaining handlers post-launch. |
| R8 | **CI never run on GitHub.** Local clean-install passes, but remote green unconfirmed; edge functions not in CI. | Ops | First push triggers CI; confirm green before staging. |
| R9 | **Integrations (Polar/Supabase/Sentry/Vercel) unverified live.** All correct in code; none confirmed against real services. | Reliability | Validate during staging per `INTEGRATION_STATUS_REPORT.md`. |
| R10 | **Privileged data not RLS-protected** (relies on edge-function authz; service role bypasses RLS). | Security (defense-in-depth) | Option A (Supabase Auth + RLS) recommended long-term. |

---

## LOW

| ID | Risk | Domain | Mitigation / Status |
|---|---|---|---|
| R11 | Two inert nested CI workflow files (`*/.github/workflows/ci.yml`). | Ops hygiene | Ignored by Actions; delete in cleanup. |
| R12 | Node version delta (local v26 vs CI 20/22). | Reliability | Toolchain supports 20+; no version-specific code. Confirmed by first CI run. |
| R13 | AgriSMES 130 non-critical `any` lint items + single 1.2MB bundle (no route splitting). | Maintainability / Perf | Deferred; no runtime/security impact. |
| R14 | Untracked third app `lenmac-alex-assist/` in working tree (has own `.env`). | Ops hygiene | Gitignored `.env`; don't `git add -A`. |

---

## Blocker Summary

| Gate | Blocking risks |
|---|---|
| GitHub Push | none (R14 is a procedural caution, not a blocker) |
| Staging | R1/R2/R4/R5 are *prerequisites to perform* in staging, not blockers of staging itself |
| Production | **R1, R2** (critical) + R3, R5 (high) + staging validation of R7–R9 |
