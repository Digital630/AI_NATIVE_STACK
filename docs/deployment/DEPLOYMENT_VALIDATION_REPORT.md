# Deployment Validation Report
**Date:** 2026-06-16  
**Key:** ✅ PASS · ❌ FAIL · ⚠️ UNKNOWN (not verifiable without prod access)

---

## TradeDoc

| Item | Status | Evidence |
|---|---|---|
| Vercel config present | ✅ PASS | `vercel.json`: buildCommand, outputDirectory, SPA rewrite, function maxDuration, cron |
| Build command | ✅ PASS | `npm run build` → `tsc -b && vite build`, verified clean |
| Output directory | ✅ PASS | `dist/` produced |
| API function config | ✅ PASS | `api/tradedoc.js` maxDuration 120s; cron `0 6 * * *` |
| Supabase client | ✅ PASS | `src/lib/supabase.ts` reads env, throws if missing |
| Webhook endpoint | ✅ PASS | `api/polar-webhook.js` — HMAC verify, idempotency |
| Auth callbacks (Supabase OTP) | ⚠️ UNKNOWN | Redirect URLs must be set in Supabase dashboard |
| Env vars documented | ✅ PASS | `.env.example` now lists all 16 (fixed `1284d44`) |
| Env vars set in Vercel | ⚠️ UNKNOWN | Requires Vercel dashboard access |
| Production URL reachable | ⚠️ UNKNOWN | Not deployed/probed this session |
| Observability (Sentry) | ✅ PASS (code) / ⚠️ UNKNOWN (delivery) | ErrorBoundary + backend capture wired; DSN not set/verified |
| PWA | N/A | TradeDoc is not a PWA |

---

## AgriSMES

| Item | Status | Evidence |
|---|---|---|
| Vercel config present | ✅ PASS | `vercel.json`: 5 API functions, cache headers, SPA rewrite |
| Build command | ✅ PASS | `npm run build` → vite + PWA, verified clean |
| Output directory | ✅ PASS | `dist/` + `sw.js` + `workbox-*.js` |
| API functions | ✅ PASS | notify-pro, signals, anthropic-analyse, polar-webhook, auth-otp |
| Supabase client | ✅ PASS | `src/lib/supabase.ts` reads env |
| Webhook endpoint | ✅ PASS | `api/polar-webhook.js` — HMAC verify, idempotency |
| **Admin endpoints** | ❌ FAIL | `admin-listings`/`admin-messages` static-string auth bypass (see FINAL_SECURITY_REPORT S-1) |
| Auth callbacks (custom OTP) | ⚠️ UNKNOWN | `api/auth-otp.js` present; Supabase redirect URLs need dashboard check |
| Polar config | ⚠️ UNKNOWN | Webhook secret + portal URL set in Vercel? Not verifiable |
| Paddle config | ⚠️ UNKNOWN | `VITE_PADDLE_CLIENT_TOKEN` documented; live token unverified |
| Env vars documented | ✅ PASS | `.env.example` updated (fixed `1284d44`) |
| Env vars set in Vercel | ⚠️ UNKNOWN | Requires Vercel dashboard access |
| PWA service worker | ✅ PASS | `generateSW`, 24 precache entries, manifest present |
| Capacitor (mobile) | ✅ PASS | `capacitor.config.ts` — appId `com.fundmysme.smeflow` |
| Supabase edge functions present | ✅ PASS | 10 functions in `supabase/functions/` |
| Edge functions deployed | ⚠️ UNKNOWN | Cannot verify without Supabase CLI/dashboard |
| Observability (Sentry) | ✅ PASS (code) / ⚠️ UNKNOWN (delivery) | ErrorBoundary + backend capture wired |

---

## Summary

| | TradeDoc | AgriSMES |
|---|---|---|
| PASS | 9 | 11 |
| FAIL | 0 | 1 (admin auth) |
| UNKNOWN | 4 | 7 |

**Blocking FAIL:** AgriSMES admin endpoint access control (S-1).  
**UNKNOWNs** are almost entirely "requires Vercel/Supabase dashboard access" — they cannot be resolved under the no-prod-access restriction and must be confirmed by an operator before go-live.
