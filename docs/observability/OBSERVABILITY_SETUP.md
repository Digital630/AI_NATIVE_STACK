# Observability Setup
**Date:** 2026-06-16  
**Products:** TradeDoc, AgriSMES  
**Commit:** `d94b949`  
**Tool:** Sentry (`@sentry/react` frontend, `@sentry/node` backend)

---

## Frontend

### Initialisation (pre-existing, verified)
Both apps call `Sentry.init()` in `src/main.tsx`, guarded by `VITE_SENTRY_DSN`:
```ts
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 0,
  });
}
```

### What `Sentry.init` covers by default
Sentry's default browser integrations include `globalHandlersIntegration`, which captures:
- `window.onerror` — uncaught synchronous errors ✅
- `window.onunhandledrejection` — unhandled promise rejections ✅

So those two requirements are met by initialisation alone — no extra code needed.

### React Error Boundary (ADDED this session)
React render errors do **not** surface to `window.onerror` — they require a React error boundary. Previously **missing in both apps**. Now added:
```tsx
<Sentry.ErrorBoundary fallback={<FallbackError />}>
  <App />
</Sentry.ErrorBoundary>
```
- Captures any error thrown during React render/lifecycle
- Shows a user-facing fallback ("Something went wrong" + Reload button) instead of a white screen
- Reports the error to Sentry automatically

| Requirement | Status |
|---|---|
| React/Vite startup init | ✅ pre-existing |
| Global error boundary | ✅ added this session |
| Unhandled promise rejection capture | ✅ via Sentry default integrations |

---

## Backend

### `api/_observability.js` (ADDED this session)
A shared helper present in both `TradeDoc-/api/` and `agrismes-ai/api/`:

```js
export async function captureError(error, context = {}) {
  // 1. Always: structured JSON to stdout (ingested by Vercel runtime logs)
  console.error(JSON.stringify({ level: 'error', message, stack, ...context, ts }));
  // 2. Optional: forward to Sentry if SENTRY_DSN set and @sentry/node resolves
  const Sentry = await getSentry();   // lazy, guarded, init-once
  if (Sentry) Sentry.captureException(error, { extra: context });
}
```

**Design choices:**
- **Never throws.** If `SENTRY_DSN` is unset or the SDK fails to load, it silently falls back to console logging. A monitoring failure can never break a request handler.
- **Lazy init.** Sentry is only imported and initialised on first error when a DSN is present — zero cold-start cost otherwise.
- **Structured logs.** Even without Sentry, errors are queryable JSON in Vercel logs.

### Wired into critical handlers

| Product | Handler | Boundary type |
|---|---|---|
| TradeDoc | `api/polar-webhook.js` | Payment webhook |
| TradeDoc | `api/tradedoc.js` | Main API (auth, docs, dashboard) |
| AgriSMES | `api/polar-webhook.js` | Payment webhook |
| AgriSMES | `api/anthropic-analyse.js` | AI proxy + usage gate |

Each calls `captureError(err, { handler, ...context })` in its top-level catch.

---

## Configuration Required (before errors reach Sentry)

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SENTRY_DSN` | Vercel (both) — Production | Frontend error reporting |
| `SENTRY_DSN` | Vercel (both) — Production | Backend error reporting (no VITE_ prefix) |

Both are documented in `.env.example`. Until set, the apps run normally and log to console; no errors are lost, they're just not aggregated in Sentry.

---

## Verification

| Check | Result |
|---|---|
| Frontend build (both) | ✅ pass |
| Backend `node --check` (all 6 modified/new handlers) | ✅ pass |
| Tests (both) | ✅ 3/3 |
| No broken imports | ✅ verified |
| End-to-end event delivery to Sentry | ⚠️ UNVERIFIED — requires a real DSN + deploy (restricted this session) |

**Honest limitation:** Code paths are in place and build-verified. Confirming events actually arrive in a Sentry dashboard requires setting a live DSN and deploying — both out of scope under the no-deploy restriction.

---

## Recommended Follow-up

1. Create Sentry projects (one per app), set `VITE_SENTRY_DSN` + `SENTRY_DSN` in Vercel
2. After first deploy, trigger a test error and confirm it appears in Sentry
3. Wire `captureError` into remaining handlers (`auth-otp.js`, `signals.js`, `notify-pro.js`, `subscription-status.js`)
4. Add release tracking (`Sentry.init({ release: VERCEL_GIT_COMMIT_SHA })`) for per-deploy error attribution
