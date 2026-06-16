# Release Readiness Scorecard
**Date:** 2026-06-16  
**Auditor:** Claude (Opus 4.8)  
**Rule:** Evidence only. No estimates. No score inflation. A category with a known critical defect cannot score high regardless of surrounding quality.

---

## Scores at a Glance

| Category | TradeDoc | AgriSMES |
|---|---|---|
| Security | 90% | **40%** ⛔ |
| Testing | 75% | 75% |
| Type Safety | 95% | 88% |
| CI/CD | 85% | 85% |
| Deployment | 80% | 70% |
| Observability | 80% | 80% |
| Performance | 85% | 80% |
| Maintainability | 88% | 82% |
| **Overall** | **85%** | **72%** |

---

## Evidence by Category

### Security — TradeDoc 90% / AgriSMES 40%
- ✅ Zero hardcoded secrets in tracked files (`git ls-files | grep` scans empty)
- ✅ All 16 service-role usages via `process.env`/`Deno.env`
- ✅ Polar webhook: HMAC verify + idempotency (both)
- ✅ Anon keys moved to env (`0949938`)
- ⛔ **AgriSMES S-1 (CRITICAL):** `admin-listings`/`admin-messages` accept static `"verified"` string as admin auth → unauthenticated service-role access to admin data. **This alone caps AgriSMES security at 40%.**
- ⚠️ Service-role key in untracked `.env.local` — rotation recommended
- TradeDoc has no equivalent admin-bypass; its 90% reflects the untracked-key rotation item + unverified prod env.

### Testing — 75% / 75%
- ✅ TradeDoc 17/17; AgriSMES 31/31 (real assertions)
- ✅ Covered: login/auth gate, subscription status, document generation, export error handling, email/password validation, mold-risk intelligence
- ❌ Gaps: trade-margin math (inline in component), webhook handlers, PDF rendering — not unit-tested
- No coverage gate in CI

### Type Safety — TradeDoc 95% / AgriSMES 88%
- ✅ TradeDoc: `tsc -b` clean, **0 lint errors**
- ✅ AgriSMES: auth/session typed (`Session | null`), external API responses typed (freight, Anthropic), payment SDK typed
- ⚠️ AgriSMES: 130 remaining `any` lint errors — all classified non-critical (`catch(e:any)`, documented `(supabase as any)` casts, UI style objects); none at runtime/security boundaries (see TYPE_SAFETY_REPORT)

### CI/CD — 85% / 85%
- ✅ **Clean-install reproducibility verified** for both (rm node_modules → npm ci → build → test, all pass)
- ✅ Lockfiles valid after `@sentry/node` addition
- ✅ Monorepo paths correct (no submodules)
- ⚠️ Not yet executed on GitHub (push pending)
- ⚠️ Edge functions (Deno) not in CI — S-1 lives there, uncaught

### Deployment — TradeDoc 80% / AgriSMES 70%
- ✅ Both: complete `vercel.json`, build verified, env vars documented
- ✅ AgriSMES PWA + Capacitor configured
- ❌ AgriSMES admin endpoint FAIL (S-1)
- ⚠️ Many UNKNOWNs: Vercel env values, Supabase redirect URLs, edge-function deploy state — require operator/dashboard access

### Observability — 80% / 80%
- ✅ `Sentry.ErrorBoundary` added to both (React render errors now captured)
- ✅ Global error + unhandled rejection captured by Sentry.init defaults
- ✅ Backend `captureError` helper wired into critical handlers (guarded, never crashes)
- ⚠️ End-to-end event delivery UNVERIFIED (needs live DSN + deploy)

### Performance — TradeDoc 85% / AgriSMES 80%
- ✅ Measured: TradeDoc ~357 KB gzip (chunks split), AgriSMES ~238 KB gzip
- ✅ No duplicate packages; `@sentry/node` confirmed backend-only
- ⚠️ AgriSMES single chunk (no route splitting); framer-motion overhead
- Deferred per "no premature optimization" directive

### Maintainability — TradeDoc 88% / AgriSMES 82%
- ✅ Monorepo merged, secrets gitignored, 9 audit docs
- ✅ TradeDoc lint clean; consistent env patterns
- ⚠️ AgriSMES: 130 type-debt items, hardcoded project URLs, React version differs from TradeDoc

---

## Path to 95% (what remains)

| Action | Unblocks | Owner |
|---|---|---|
| **Fix S-1 admin auth** (server-signed token) | AgriSMES Security 40→90, Deployment | needs approval + Supabase deploy |
| Rotate service-role key | Security (both) | operator |
| Set + verify Sentry DSN, confirm event delivery | Observability 80→95 | operator + deploy |
| Confirm Vercel env vars + Supabase redirect URLs | Deployment UNKNOWNs | operator |
| Run CI green on GitHub | CI/CD 85→95 | push approval |
| Unit-test trade-margin math + webhook handlers | Testing 75→90 | dev |

---

## Honest Bottom Line

- **TradeDoc: 85%** — near-ready. No critical defects. Remaining gaps are verification (CI run, prod env) and test depth.
- **AgriSMES: 72%** — **blocked by S-1.** Engineering quality (build, types, tests, observability) is solid, but the admin access-control bypass is a hard security blocker. Fix S-1 and verify env/CI → ~90%.

**Neither product is at a verified 95% yet.** The honest ceiling today is TradeDoc 85%, AgriSMES 72%, and the single biggest lever is remediating S-1.
