# CI Readiness Report
**Date:** 2026-06-16  
**Scope:** LenDigital monorepo — TradeDoc + AgriSMES

---

## Architecture

Both products are first-class directories in the monorepo (no git submodules). A single `actions/checkout@v4` pulls the full tree. Each CI job uses `defaults.run.working-directory` to scope to its product directory.

---

## CI File: `.github/workflows/ci.yml`

| Attribute | Value |
|---|---|
| Trigger | push to `main`, `fix/**`, `feat/**`; PR to `main` |
| Jobs | `tradedoc`, `agrismes` (run in parallel) |
| Runner | `ubuntu-latest` |
| Checkout | `actions/checkout@v4` |
| Node (TradeDoc) | 20 |
| Node (AgriSMES) | 22 |

---

## Package Lock Integrity

| Product | Lock file | Compatible with `npm ci` |
|---|---|---|
| TradeDoc | `package-lock.json` (npm v10) | ✅ Yes |
| AgriSMES | `package-lock.json` + `bun.lock` + `bun.lockb` | ✅ Yes (npm ci uses package-lock.json) |

> AgriSMES has both npm and bun lock files. CI uses npm. This is consistent — no conflict found.

---

## Build Reproducibility

### TradeDoc
```
npm ci            → clean install, exact lock
npm run build     → tsc -b && vite build
  Output: dist/ (5 assets, deterministic hashes)
  tsc errors: 0
  Build time: ~1.0s
```

### AgriSMES
```
npm ci            → clean install, exact lock
npm run build     → vite build (PWA mode)
  Output: dist/ + dist/sw.js + dist/workbox-*.js
  Build time: ~4.0s
```

**CI env var stubs** (required for Vite to not throw at build time):
- TradeDoc: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- AgriSMES: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`

These are correctly set in the CI workflow.

---

## Clone-to-Build Test (local simulation)

Simulated fresh build after `npm ci` — both products completed without errors.

| Step | TradeDoc | AgriSMES |
|---|---|---|
| `npm ci` | ✅ | ✅ |
| `npm run build` | ✅ | ✅ |
| `npm test` | ✅ 3/3 | ✅ 3/3 |
| `npm run lint` | ✅ 0 errors | ⚠️ 160 style errors (no-explicit-any) |

---

## Known CI Gaps

| Gap | Impact | Action |
|---|---|---|
| CI has not yet run on GitHub (push pending) | Medium — cannot confirm remote CI passes | Push and verify after approval |
| AgriSMES lint 160 remaining errors (`no-explicit-any`) | Low — `continue-on-error: true` in CI | Schedule remediation sprint |
| No test coverage reporting | Low | Add `vitest --coverage` when test suite grows |
| No Vercel preview deploy check in CI | Low | Can be added via `vercel --prebuilt` action |

---

## Verdict

**Repository can be cloned and built from scratch: CONFIRMED (locally verified).**  
Remote CI confirmation pending push approval.
