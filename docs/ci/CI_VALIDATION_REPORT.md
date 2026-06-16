# CI Validation Report
**Date:** 2026-06-16  
**Method:** Clean-install reproducibility test (this session)

---

## Clean-Install Validation (evidence)

Both products had `node_modules` deleted and were rebuilt from lockfile. This is the real "clones and builds from scratch" test — and it was run **after** the `@sentry/node` dependency was added, validating the updated lockfiles.

### TradeDoc
| Step | Command | Result |
|---|---|---|
| Install | `rm -rf node_modules && npm ci` | ✅ exit 0 |
| Build | `npm run build` (tsc -b && vite build) | ✅ built (964ms), 0 TS errors |
| Test | `npm test` | ✅ 17/17 passed |
| Lint | `npm run lint` | ✅ 0 errors |

### AgriSMES
| Step | Command | Result |
|---|---|---|
| Install | `rm -rf node_modules && npm ci` | ✅ exit 0 |
| Build | `npm run build` (vite build + PWA) | ✅ built (6.10s) |
| Test | `npm test` | ✅ 31/31 passed |
| Lint | `npm run lint` | ⚠️ 174 problems (130 err / 44 warn) — non-blocking (`continue-on-error`) |

**Verdict: repository reproducibly builds from scratch. ✅**

---

## GitHub Actions Workflow (`.github/workflows/ci.yml`)

| Attribute | Value | Status |
|---|---|---|
| Triggers | push (`main`, `fix/**`, `feat/**`), PR to `main` | ✅ |
| `tradedoc` job | `working-directory: TradeDoc-`, Node 20 | ✅ |
| `agrismes` job | `working-directory: agrismes-ai`, Node 22 | ✅ |
| npm cache | `cache: npm` + `cache-dependency-path` per product | ✅ |
| Install | `npm ci` | ✅ matches local validation |
| Build env stubs | `VITE_SUPABASE_*` placeholders | ✅ present |
| Lint | `continue-on-error: true` | ⚠️ intentional — lint won't fail the build |

### Monorepo path correctness
Both products are now first-class directories (nested `.git` removed in `bf201fe`). `actions/checkout@v4` pulls both trees in a single clone. `working-directory` scoping is correct. **No submodule configuration needed.**

---

## npm ci Compatibility

| Product | Lockfile | `npm ci` |
|---|---|---|
| TradeDoc | `package-lock.json` | ✅ in sync with package.json (incl. @sentry/node) |
| AgriSMES | `package-lock.json` (+ bun.lock present, unused by CI) | ✅ in sync |

Both lockfiles were regenerated when `@sentry/node` was added and pass `npm ci` cleanly.

---

## Gaps

| Gap | Impact | Note |
|---|---|---|
| CI has not executed on GitHub | Medium | Push not yet approved — remote green run unconfirmed |
| Edge functions (Deno) not built/tested in CI | Medium | `supabase/functions/*` deployed separately; S-1 vuln lives here, uncaught by CI |
| No coverage gate | Low | Add `--coverage` floor when suites mature |
| Lint is non-blocking | Low | Acceptable interim; critical lint already at zero (TradeDoc) / critical-only-fixed (AgriSMES) |

---

## Success Criterion

**"Repository reproducibly builds from scratch": MET (locally verified, both products).**  
Remote GitHub Actions confirmation pending push approval.
