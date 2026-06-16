# Staging Deployment Runbook
**Date:** 2026-06-16
**Status:** Instructions only — **NO DEPLOYMENT PERFORMED.**
**Env vars below are derived directly from code references (grep of `import.meta.env` / `process.env` / `Deno.env`).**

Legend: **Required** = app/feature breaks without it · **Optional** = degrades gracefully · **Unknown** = purpose/criticality not verifiable from code alone.

---

## TradeDoc

### Vercel — Frontend (build-time, `VITE_` → shipped to browser)
| Var | Class | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | **Required** | Supabase client; client throws if missing |
| `VITE_SUPABASE_ANON_KEY` | **Required** | Supabase client; public/RLS-protected |
| `VITE_SENTRY_DSN` | Optional | Frontend error reporting; app runs without |

### Vercel — Serverless (`api/`, server-side, NO `VITE_` prefix)
| Var | Class | Notes |
|---|---|---|
| `SUPABASE_URL` | **Required** | `api/tradedoc.js`, `api/polar-webhook.js` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Required** | DB writes; throws if missing |
| `ANTHROPIC_API_KEY` | **Required** | AI features in `api/tradedoc.js` |
| `RESEND_API_KEY` | **Required** | Transactional email |
| `TRADEDOC_FROM_EMAIL` | **Required** | Email sender |
| `TRADEDOC_FALLBACK_FROM_EMAIL` | Optional | Fallback sender |
| `POLAR_WEBHOOK_SECRET` | **Required** | Webhook signature verify |
| `TRADEDOC_POLAR_WEBHOOK_SECRET` | **Required** | Alt webhook secret (code checks both) |
| `TRADEDOC_POLAR_PORTAL_URL` | **Required** | Subscription portal link |
| `CRON_SECRET` | **Required** | Authenticates daily cron `/api/tradedoc?action=daily_job` |
| `PAYMENT_WEBHOOK_SECRET` | **Unknown** | Generic/legacy webhook secret — confirm if still used |
| `OPENAI_API_KEY` | **Unknown** | Referenced in `api/tradedoc.js`; confirm if an active feature |
| `SUPABASE_MANAGEMENT_API_TOKEN` | **Unknown** | Referenced for DB via management API; confirm necessity vs service role |
| `SENTRY_DSN` | Optional | Backend error capture |
| `VERCEL_ENV` | Auto | Set by Vercel |

### Supabase (TradeDoc)
- Project URL + service role key (above)
- **Auth → URL Configuration:** add staging Vercel domain to Site URL + Redirect URLs (OTP login)
- **Auth → Email provider:** enabled
- Edge function `tradedoc` deployed; migrations applied (`tradedoc_security`, `tradedoc_rls_hardening`)

---

## AgriSMES

### Vercel — Frontend (`VITE_`)
| Var | Class | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | **Required** | Supabase client |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | **Required** | Primary client key (`integrations/supabase/client.ts`) |
| `VITE_SUPABASE_ANON_KEY` | **Required** | Same value; used by direct-fetch components (entitlements, freight, etc.) |
| `VITE_PADDLE_CLIENT_TOKEN` | **Required** (if Paddle billing live) | Paddle init in TradeMarginCalculator |
| `VITE_SENTRY_DSN` | Optional | Frontend errors |

### Vercel — Serverless (`api/`)
| Var | Class | Notes |
|---|---|---|
| `SUPABASE_URL` | **Required** | api handlers |
| `SUPABASE_SERVICE_ROLE_KEY` | **Required** | usage gate, webhooks |
| `SUPABASE_ANON_KEY` | **Required** | referenced by api handlers |
| `ANTHROPIC_API_KEY` | **Required** | `api/anthropic-analyse.js` |
| `RESEND_API_KEY` | **Required** | `api/notify-pro.js` |
| `AGRISMES_FROM_EMAIL` | **Required** | email sender |
| `POLAR_WEBHOOK_SECRET` | **Required** | webhook signature verify |
| `POLAR_CUSTOMER_PORTAL_URL` | **Required** | portal link |
| `POLAR_PORTAL_URL` | **Required** | alias used in some handlers |
| `SENTRY_DSN` | Optional | backend errors |
| `VERCEL_ENV` | Auto | set by Vercel |

### Supabase Edge Function secrets (`supabase secrets set`, NOT Vercel)
| Var | Class | Notes |
|---|---|---|
| `ADMIN_SESSION_SECRET` | **Required (NEW)** | ≥32B random; signs admin session tokens. **If unset, admin login fails closed (500).** `openssl rand -base64 48` |
| `ADMIN_CODE` | **Required — ROTATE** | Admin login code. **Rotate off `"2468"`.** Login UI now accepts 8–64 chars (letters/numbers/symbols) — use a strong 16+ char value (≥64 bits entropy). Generate: `openssl rand -base64 12 \| tr -dc 'A-Za-z0-9' \| head -c 16`. |
| `SUPABASE_URL` | **Required** | edge fns |
| `SUPABASE_SERVICE_ROLE_KEY` | **Required** | edge fns (auto-provided by Supabase, but verify) |
| `RESEND_API_KEY` | **Required** | `send-chat-message`, `send-welcome-email` |
| `RESEND_FROM` | **Required** | email sender for edge fns |
| `ALPHA_VANTAGE_API_KEY` | **Unknown** | used by a fetch-* function; confirm which feature |
| `LOVABLE_API_KEY` | **Unknown** | referenced in an edge fn; confirm purpose/necessity |

### Supabase (AgriSMES)
- **Auth → URL Configuration:** add staging domain to Site URL + Redirect URLs
- **Deploy edge functions** — especially the 3 changed by the S-1 fix: `admin-verify`, `admin-listings`, `admin-messages` (the `_shared/adminAuth.ts` helper deploys with them)
- Apply RLS hardening migration (`agrismes_rls_hardening`)

---

## Deployment Order (CRITICAL — admin-auth is a breaking contract change)

1. Set `ADMIN_SESSION_SECRET` + rotated `ADMIN_CODE` in staging Supabase secrets **first**.
2. Deploy AgriSMES edge functions `admin-verify`, `admin-listings`, `admin-messages` **together**.
3. Deploy the AgriSMES client (Vercel) **in the same release** — old client + new functions (or vice-versa) will break admin auth (token-format mismatch).
4. Set all Vercel env vars (both products) before triggering the Vercel build.
5. Set `VITE_SENTRY_DSN` + `SENTRY_DSN` if validating observability in staging.

---

## Summary Counts
| Product | Required | Optional | Unknown |
|---|---|---|---|
| TradeDoc | 12 | 2 | 3 (`PAYMENT_WEBHOOK_SECRET`, `OPENAI_API_KEY`, `SUPABASE_MANAGEMENT_API_TOKEN`) |
| AgriSMES | 16 | 2 | 2 (`ALPHA_VANTAGE_API_KEY`, `LOVABLE_API_KEY`) |

**The "Unknown" vars must be clarified with the product owner before production** — in staging, deploy without them and observe which features error.
