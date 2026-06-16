# Final Pre-Push Release Audit
**Date:** 2026-06-16
**Scope:** All commits since monorepo merge (`bf201fe..HEAD`)
**Stance:** Adversarial — assumptions challenged, including the auditor's own admin-auth fix.

---

## Commits Audited

```
7b5b069 docs(env): document ADMIN_CODE and ADMIN_SESSION_SECRET as Supabase secrets
c8ed1c0 fix(security): replace client-trusted admin auth with signed session tokens (S-1)
fc43c1b docs: release readiness scorecard
2de395a docs: phase 1-7 readiness reports
4146e54 test: cover critical workflows
d94b949 feat(observability): error boundaries + server error capture
a7d888b fix(types): auth/session + API boundary types
1284d44 docs: audit suite + env examples
00b423f fix(lint): critical lint errors
0949938 fix(security): hardcoded anon keys -> env
5a21612 ci: monorepo build verification
```

---

## 1. Security

| Check | Evidence | Verdict |
|---|---|---|
| Secrets in committed history | Full diff scan `git diff bf201fe^..HEAD` for JWT/`sk-ant`/`re_`/service-key patterns → **empty** | ✅ |
| Hardcoded anon keys | Removed (`0949938`); source scan for the JWT → none in `src/`/`supabase/` | ✅ |
| Anon key in client bundle | Present when built locally (Vite loads `.env.local`) — **by design**, anon key is public/RLS-protected. CI-style build with placeholder env bakes only `PLACEHOLDER_ANON` | ✅ (not a leak) |
| Service-role key leakage | Bundle scan: `SERVICE_ROLE_KEY` 0×, `ADMIN_SESSION_SECRET` 0×, `2468` 0×. (`service_role` 17× = Postgres role name inside bundled supabase-js, not a key) | ✅ |
| `.env` / third-app secrets | `.env`, `.env.local`, `lenmac-alex-assist/.env` all `git check-ignore` confirmed ignored | ✅ |
| Service-role key in `.env.local` | Untracked, not pushed; rotation recommended | ⚠️ |

**Challenged assumption "the anon JWT in dist is a leak":** Disproved. It is the public anon key, injected from env at build; controlled builds inject only placeholders; `dist/` is gitignored so no bundle is committed.

## 2. Authentication

| Item | Verdict |
|---|---|
| `admin-verify`: ADMIN_CODE + escalating lockout (3→15m/30m/24h) + logging | ✅ |
| Supabase OTP (both apps) | ✅ |
| ADMIN_CODE strength — still `"2468"` until operator rotates | ⚠️ now only mints a token *after* the lockout-protected check, but weak code should be rotated |

## 3. Authorization

| Item | Evidence | Verdict |
|---|---|---|
| `admin-listings` / `admin-messages` | Now `verifyAdminToken(adminToken, ADMIN_SESSION_SECRET)` server-side; static `"verified"` + client `adminCode` removed | ✅ (code) |
| All client callers migrated | 3 senders now pass the signed token; 0 stray `"verified"`/`"2468"` | ✅ |
| `admin-lockout-check` (newly audited) | Pre-auth by design; reads only non-sensitive lockout state by caller's own visitorId; no mutation | ✅ |
| Privileged data protected by RLS | NO — relies on edge-function authz; RLS bypass via service role | ⚠️ defense-in-depth gap (Option A long-term) |

**Privilege-escalation hunt:** No remaining path found via client-supplied constants. The only authz now is an HMAC signature an attacker cannot forge without the server secret.

## 4. New Admin Token Flow — Deep Validation

| Property | Finding | Verdict |
|---|---|---|
| Expiry | 1h TTL; `verifyAdminToken` rejects `exp < now`; test `rejects an expired token` passes | ✅ |
| Forgery | HMAC-SHA256; wrong-secret + tampered-payload tokens rejected (tests pass) | ✅ |
| Secret management | `ADMIN_SESSION_SECRET` server-only (`Deno.env`); 0× in client bundle; fail-closed (500) if unset; now documented | ✅ |
| **Replay** | Tokens carry only `{role, exp}` — **no jti/nonce, no visitor/IP binding, no server-side revocation**. A captured token (XSS on localStorage, shared device) is **replayable until exp (≤1h)** | ⚠️ **RESIDUAL** |
| Identity/attribution | `role:"admin"` only — no per-admin identity; can't attribute or revoke a single admin | ⚠️ minor |

**Replay verdict:** Materially better than the prior *permanent* static string (bounded 1h window, unforgeable), and acceptable for an admin-only surface — but it is a real residual. Recommend: shorten TTL (e.g. 15m), bind token to `visitorId`, and/or add a server-side revocation/version check for true logout. Documented in `ADMIN_AUTH_FIX_PLAN.md`.

## 5. Environment Variables

| Check | Verdict |
|---|---|
| Documented in `.env.example` (both apps) incl. new `ADMIN_SESSION_SECRET`/`ADMIN_CODE` | ✅ |
| TradeDoc server vars (16) documented | ✅ (`1284d44`) |
| Actual values set in Vercel / Supabase | ⚠️ UNKNOWN (no dashboard access) |
| Missing-var failure mode | Supabase client throws; admin flow fails closed — safe defaults | ✅ |

## 6. CI/CD & Build/Test Reproducibility

| Check | Evidence | Verdict |
|---|---|---|
| Clean-install reproducibility | Both: `rm -rf node_modules && npm ci && build && test` → TradeDoc 17/17, AgriSMES 39/39 | ✅ |
| Lockfile integrity post-`@sentry/node` | `npm ci` exit 0 both | ✅ |
| Lint | TradeDoc 0 errors; AgriSMES 130 (non-critical `any`/style, `continue-on-error`) | ✅ / ⚠️ |
| CI executed on GitHub | Not yet (push pending) | ⚠️ |
| Edge functions in CI | Not built/tested (Deno, deployed separately) — S-1 lived here uncaught | ⚠️ |

## 7. Integrations

| Integration | Verdict |
|---|---|
| Sentry — ErrorBoundary (both) + guarded backend `captureError` | ✅ code / ⚠️ delivery unverified (no DSN) |
| Polar — webhook HMAC verify + idempotency (both) | ✅ code / ⚠️ live secret unverified |
| Supabase — clients env-based; RLS hardening migrations present | ✅ code / ⚠️ edge-fn deploy state unknown |

## 8. Deployment Safety

| Risk | Note |
|---|---|
| **S-1 fix is a breaking contract change** | Old deployed functions expect old format. Must deploy `admin-verify` + `admin-listings` + `admin-messages` **+ client together**, after `ADMIN_SESSION_SECRET` is set. Code is inert until then. |
| Coordinated secret prerequisite | `ADMIN_SESSION_SECRET` must exist in Supabase before deploy or admin login 500s |
| Uncommitted/untracked tree | Session-1 doc edits + untracked `lenmac-alex-assist/` (third app) are **not** in any commit → not pushed. `git add -A` before push would be unsafe; push specific history only |

---

## GO / NO-GO Decisions

### 1. GitHub Push — **GO** ✅
**Evidence:** Committed history scanned clean (no secrets in any commit since merge). Both products build reproducibly and pass tests (17/17, 39/39) and required lint. `.env*` and the third app's `.env` are gitignored; `dist/` gitignored. Push also triggers the first real CI run.
**Condition:** Push the committed branch only — do **not** `git add -A` (would stage the untracked third app). The pre-existing uncommitted doc edits are out of scope and won't be pushed.

### 2. Staging Deployment — **GO (conditional)** 🟡
**Rationale:** Staging exists precisely to validate the coordinated admin-auth contract change and the unverified integrations before prod.
**Prerequisites (all required):**
- Set `ADMIN_SESSION_SECRET` (≥32B random) + a rotated `ADMIN_CODE` in **staging** Supabase
- Deploy the 3 edge functions **and** the client as one release
- Set Vercel staging env vars; set Supabase Auth redirect URLs
- Set Sentry `VITE_SENTRY_DSN`/`SENTRY_DSN` to confirm event delivery
**Must validate in staging:** verify→token→admin action works; a forged/expired token is rejected (401); Polar webhook round-trip; Sentry receives a test error.

### 3. Production Deployment — **NO-GO** ⛔
**Blockers (must clear first):**
1. S-1 fix validated end-to-end in **staging** (token issuance + forged-token rejection)
2. `ADMIN_CODE` rotated off `"2468"`; service-role key rotated (per `SUPABASE_KEY_ROTATION_PLAN.md`)
3. Sentry DSN set and event delivery confirmed
4. Vercel + Supabase production env vars and Auth redirect URLs confirmed present
5. CI green on GitHub
6. (Recommended) address token-replay residual: shorter TTL / visitorId binding
**The code is production-quality; the deploy is gated on operator configuration + staging validation of a breaking auth change.**

---

## Summary

| Target | Decision |
|---|---|
| GitHub Push | **GO** (commit history only) |
| Staging Deploy | **GO** with prerequisites |
| Production Deploy | **NO-GO** until blockers cleared |

No push, deploy, or production change was performed.
