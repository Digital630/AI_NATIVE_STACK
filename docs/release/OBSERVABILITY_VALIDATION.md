# Observability Validation
**Date:** 2026-06-16
**Tool:** Sentry (`@sentry/react`, `@sentry/node`)

---

## Frontend (both products)

| Capability | Mechanism | Status | Note |
|---|---|---|---|
| Startup init | `Sentry.init({ dsn, environment, tracesSampleRate: 0.1 })` guarded by `VITE_SENTRY_DSN` | ✅ code | inert until DSN set |
| **ErrorBoundary** (React render errors) | `<Sentry.ErrorBoundary fallback={<FallbackError/>}>` wraps `<App/>` | ✅ code (added `d94b949`) | shows fallback UI instead of white screen |
| Unhandled exceptions (`window.onerror`) | Sentry default `globalHandlersIntegration` | ✅ by default | no extra code needed |
| Rejected promises (`onunhandledrejection`) | Sentry default `globalHandlersIntegration` | ✅ by default | no extra code needed |

**Verification limit:** Code paths present and build-verified. Actual capture requires a live `VITE_SENTRY_DSN` + a deliberately triggered error in staging. UNVERIFIED end-to-end.

---

## Backend (Vercel serverless, both products)

`api/_observability.js` → `captureError(error, context)`:
- Always logs structured JSON to stdout (Vercel runtime logs ingest)
- Forwards to Sentry via lazy `@sentry/node` init **if** `SENTRY_DSN` set
- Guarded: never throws, never blocks the handler

| Failure type | Wired? | Location |
|---|---|---|
| Webhook failures | ✅ | `polar-webhook.js` catch → `captureError({handler:'polar-webhook', eventType, eventId})` (both apps) |
| Auth failures | ⚠️ partial | TradeDoc `tradedoc.js` top-level catch covers auth actions; AgriSMES `auth-otp.js` logs via `console.error` but `captureError` **not** wired |
| AI failures | ✅ | AgriSMES `anthropic-analyse.js` catch → `captureError`; TradeDoc AI path under `tradedoc.js` catch |
| Server exceptions (generic) | ✅ | `tradedoc.js` + `anthropic-analyse.js` + both webhooks |

**Gap:** `captureError` is wired into the 4 highest-value handlers, **not all** (`auth-otp.js`, `signals.js`, `notify-pro.js`, `subscription-status.js` still console-only). These still produce Vercel logs but not Sentry events. Non-blocking; noted for follow-up.

---

## Verification Matrix

| Requirement | Code present | Verified live |
|---|---|---|
| FE ErrorBoundary | ✅ | ❌ (needs DSN+deploy) |
| FE unhandled exceptions | ✅ (default) | ❌ |
| FE rejected promises | ✅ (default) | ❌ |
| BE webhook failures | ✅ | ❌ |
| BE auth failures | ⚠️ partial | ❌ |
| BE AI failures | ✅ | ❌ |
| BE server exceptions | ✅ | ❌ |

---

## Verdict
Observability is **code-complete for the critical paths** and degrades safely without a DSN. It is **not runtime-verified** — set `VITE_SENTRY_DSN`/`SENTRY_DSN` in staging and confirm a test error appears in the Sentry dashboard before relying on it in production. Wiring the remaining backend handlers is a recommended (non-blocking) follow-up.
