# Deployment Checklist
**Date:** 2026-06-16  
**Products:** TradeDoc, AgriSMES  
**Status key:** ✅ PASS | ❌ FAIL | ⚠️ UNKNOWN (not verifiable without production access)

---

## TradeDoc

### Environment Variables

| Variable | Required | In `.env.example` | Status |
|---|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | ✅ | ✅ PASS |
| `VITE_SUPABASE_ANON_KEY` | ✅ | ✅ | ✅ PASS |
| `VITE_SENTRY_DSN` | Optional | ✅ | ✅ PASS (optional) |
| `SUPABASE_URL` | ✅ (server) | ❌ Missing | ❌ FAIL — not documented |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ (server) | ❌ Missing | ❌ FAIL — not documented |
| `ANTHROPIC_API_KEY` | ✅ (server) | ❌ Missing | ❌ FAIL — not documented |
| `RESEND_API_KEY` | ✅ (server) | ❌ Missing | ❌ FAIL — not documented |
| `POLAR_WEBHOOK_SECRET` | ✅ (server) | ❌ Missing | ❌ FAIL — not documented |
| `TRADEDOC_POLAR_WEBHOOK_SECRET` | ✅ (server) | ❌ Missing | ❌ FAIL — not documented |
| `CRON_SECRET` | ✅ (server) | ❌ Missing | ❌ FAIL — not documented |
| `PAYMENT_WEBHOOK_SECRET` | ✅ (server) | ❌ Missing | ❌ FAIL — not documented |
| `OPENAI_API_KEY` | ? (server) | ❌ Missing | ⚠️ UNKNOWN — verify if active |
| `SUPABASE_MANAGEMENT_API_TOKEN` | ? (server) | ❌ Missing | ⚠️ UNKNOWN — verify if active |
| `TRADEDOC_FROM_EMAIL` | ✅ (server) | ❌ Missing | ❌ FAIL — not documented |
| `TRADEDOC_FALLBACK_FROM_EMAIL` | ✅ (server) | ❌ Missing | ❌ FAIL — not documented |
| `TRADEDOC_POLAR_PORTAL_URL` | ✅ (server) | ❌ Missing | ❌ FAIL — not documented |

**Action required:** Update `TradeDoc-/.env.example` with all server-side env vars.

### Build & Deploy Config
| Item | Status |
|---|---|
| `vercel.json` present | ✅ PASS |
| `buildCommand: npm run build` | ✅ PASS |
| `outputDirectory: dist` | ✅ PASS |
| SPA rewrite (`/index.html` fallback) | ✅ PASS |
| API function `api/tradedoc.js` configured | ✅ PASS |
| API function max duration: 120s | ✅ PASS |
| Cron job `/api/tradedoc?action=daily_job` at 06:00 UTC | ✅ PASS |
| Polar webhook `api/polar-webhook.js` | ✅ PASS |

### Auth
| Item | Status |
|---|---|
| Supabase OTP email auth wired | ✅ PASS |
| Auth state persisted via `storageKey: 'tradedoc.auth'` | ✅ PASS |
| Session auto-refresh enabled | ✅ PASS |
| Supabase URL config (redirect URLs) | ⚠️ UNKNOWN — must verify in Supabase dashboard |

### Payments
| Item | Status |
|---|---|
| Polar webhook handler present | ✅ PASS |
| Webhook signature verification | ✅ PASS |
| Duplicate event idempotency | ✅ PASS |
| Polar env vars documented | ❌ FAIL — missing from `.env.example` |

---

## AgriSMES

### Environment Variables

| Variable | Required | In `.env.example` | Status |
|---|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | ✅ | ✅ PASS |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ | ✅ | ✅ PASS |
| `SUPABASE_URL` | ✅ (server) | ✅ | ✅ PASS |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ (server) | ✅ | ✅ PASS |
| `ANTHROPIC_API_KEY` | ✅ (server) | ✅ | ✅ PASS |
| `RESEND_API_KEY` | ✅ (server) | ✅ | ✅ PASS |
| `POLAR_WEBHOOK_SECRET` | ✅ (server) | ✅ | ✅ PASS |
| `POLAR_CUSTOMER_PORTAL_URL` | ✅ (server) | ✅ | ✅ PASS |
| `VITE_SENTRY_DSN` | Optional | ✅ | ✅ PASS (optional) |
| `VITE_SUPABASE_ANON_KEY` | ✅ | ❌ Missing | ❌ FAIL — code uses it, not documented |
| `VITE_PADDLE_CLIENT_TOKEN` | ✅ | ❌ Missing | ❌ FAIL — not documented |
| `AGRISMES_FROM_EMAIL` | ✅ (server) | ❌ Missing | ❌ FAIL — not documented |
| `POLAR_PORTAL_URL` | ✅ (server) | ❌ Missing | ❌ FAIL — not documented |

### Build & Deploy Config
| Item | Status |
|---|---|
| `vercel.json` present | ✅ PASS |
| `buildCommand: npm run build` | ✅ PASS |
| `outputDirectory: dist` | ✅ PASS |
| SPA rewrite configured | ✅ PASS |
| API functions (5): `notify-pro`, `signals`, `anthropic-analyse`, `polar-webhook`, `auth-otp` | ✅ PASS |
| Cache headers for static assets | ✅ PASS |
| PWA service worker (`dist/sw.js`) | ✅ PASS |

### Auth
| Item | Status |
|---|---|
| Custom OTP auth via `api/auth-otp.js` | ✅ PASS |
| Supabase anon client configured | ✅ PASS |
| Supabase URL config (redirect URLs) | ⚠️ UNKNOWN — must verify in Supabase dashboard |

### Payments
| Item | Status |
|---|---|
| Polar webhook handler | ✅ PASS |
| Webhook signature verification | ✅ PASS |
| Duplicate event idempotency | ✅ PASS |
| Paddle client token configured | ❌ FAIL — missing from `.env.example` |

### PWA
| Item | Status |
|---|---|
| `vite-plugin-pwa` configured | ✅ PASS |
| Service worker `generateSW` mode | ✅ PASS |
| Web manifest present | ✅ PASS |
| Precache 24 entries | ✅ PASS |
| Capacitor config (`capacitor.config.ts`) | ✅ PASS (mobile: `com.fundmysme.smeflow`) |

### Supabase Edge Functions
| Function | Status |
|---|---|
| `admin-listings` | ✅ Present |
| `admin-lockout-check` | ✅ Present |
| `admin-messages` | ✅ Present |
| `admin-verify` | ✅ Present |
| `ask-agrismes` | ✅ Present |
| `chat-stream` | ✅ Present |
| `chat-triage` | ✅ Present |
| `send-welcome-email` | ✅ Present |
| `submit-inquiry` | ✅ Present |
| `waitlist-signup` | ✅ Present |
| Deployed to Supabase | ⚠️ UNKNOWN — cannot verify without Supabase CLI access |

---

## Action Required Before First Deploy

1. **TradeDoc:** Update `.env.example` with all 13 missing server-side variables
2. **AgriSMES:** Add `VITE_SUPABASE_ANON_KEY`, `VITE_PADDLE_CLIENT_TOKEN`, `AGRISMES_FROM_EMAIL`, `POLAR_PORTAL_URL` to `.env.example`
3. **Both:** Verify Supabase Auth redirect URLs include production Vercel domain
4. **Both:** Confirm all env vars are set in Vercel project settings before deploying
5. **AgriSMES:** Rotate service role key per `SUPABASE_KEY_ROTATION_PLAN.md` (recommended)
