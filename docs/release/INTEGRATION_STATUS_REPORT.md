# Integration Status Report
**Date:** 2026-06-16
**Key:** PASS = verified working/correct in code & locally · FAIL = broken · UNKNOWN = needs live/dashboard access to confirm

---

## Supabase

| Aspect | Status | Evidence |
|---|---|---|
| Client init reads env (both apps) | PASS | `TradeDoc-/src/lib/supabase.ts`, `agrismes-ai/.../client.ts` use `import.meta.env`, throw/guard on missing |
| Service-role usage server-side only | PASS | 16 handlers via `process.env`/`Deno.env`; 0 in client bundle |
| RLS hardening migrations present | PASS | `*_rls_hardening.sql` in both products |
| Auth OTP wiring | PASS (code) | TradeDoc `supabase.auth`, AgriSMES `api/auth-otp.js` |
| Edge functions deployed (incl. S-1 fix) | UNKNOWN | Cannot verify without Supabase access; **must deploy 3 admin fns** |
| Auth redirect URLs include staging/prod domain | UNKNOWN | Dashboard-only |
| `ADMIN_SESSION_SECRET` set | UNKNOWN | Must be set before admin login works |

## Polar

| Aspect | Status | Evidence |
|---|---|---|
| Webhook signature verification | PASS (code) | `verifyPolarSignature` → 401 on invalid (both apps) |
| Idempotency / duplicate-event handling | PASS (code) | duplicate check before processing |
| Webhook secret configured | UNKNOWN | `POLAR_WEBHOOK_SECRET` set in Vercel? dashboard-only |
| Live webhook round-trip | UNKNOWN | Requires staging + Polar test event |
| Portal URL configured | UNKNOWN | `*_POLAR_PORTAL_URL` set? |

## Sentry

| Aspect | Status | Evidence |
|---|---|---|
| Frontend init (guarded by DSN) | PASS (code) | `Sentry.init` in both `main.tsx` |
| React ErrorBoundary | PASS (code) | `Sentry.ErrorBoundary` wraps App (both) |
| Backend capture helper | PASS (code) | `api/_observability.js` wired into critical handlers |
| `@sentry/node` installed | PASS | both `package.json` + lockfiles |
| DSN configured | UNKNOWN | `VITE_SENTRY_DSN`/`SENTRY_DSN` not set; app runs without |
| Events actually delivered to Sentry | UNKNOWN | Requires DSN + deploy + test error |

## Vercel

| Aspect | Status | Evidence |
|---|---|---|
| `vercel.json` valid (both) | PASS | build cmd, output dir, SPA rewrite, function durations, cron (TD), cache headers + PWA (Agri) |
| Build command reproducible | PASS | clean-install build verified locally |
| Env vars set in Vercel | UNKNOWN | dashboard-only |
| Production domain reachable | UNKNOWN | not probed |
| Serverless function bundling (`@sentry/node` backend-only) | PASS | confirmed not in client bundle |

---

## Summary

| Integration | PASS | UNKNOWN | FAIL |
|---|---|---|---|
| Supabase | 4 | 3 | 0 |
| Polar | 2 | 3 | 0 |
| Sentry | 4 | 2 | 0 |
| Vercel | 3 | 2 | 0 |

**No FAILs in code.** Every UNKNOWN requires a live environment (Vercel/Supabase/Polar/Sentry dashboards or a staging deploy) and is therefore an operational-validation item, not an engineering defect. They must be resolved during staging.
