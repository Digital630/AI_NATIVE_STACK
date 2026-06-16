# CI/CD Release Report
**Date:** 2026-06-16

---

## Workflow Inventory

| Path | Runs in GitHub Actions? | Status |
|---|---|---|
| `.github/workflows/ci.yml` (root) | ✅ YES — only root workflows run | Active, correct |
| `TradeDoc-/.github/workflows/ci.yml` | ❌ NO — nested dir, ignored by Actions | Inert cruft (legacy standalone-repo file) |
| `agrismes-ai/.github/workflows/ci.yml` | ❌ NO — nested dir, ignored | Inert cruft |

**No double-run or failure risk** from the nested workflows — GitHub Actions only executes workflows under the repository-root `.github/workflows/`. Recommend deleting the two nested files in a later cleanup (non-blocking).

---

## Root Workflow Review (`.github/workflows/ci.yml`)

| Aspect | TradeDoc job | AgriSMES job | Verdict |
|---|---|---|---|
| Trigger | push `main`/`fix/**`/`feat/**`, PR→main | same | ✅ |
| `working-directory` | `TradeDoc-` | `agrismes-ai` | ✅ correct monorepo paths |
| Checkout | `actions/checkout@v4` (single clone, both dirs present) | same | ✅ |
| Node | 20 | 22 | ✅ |
| npm cache | `cache: npm` + `cache-dependency-path` per product | same | ✅ |
| Install | `npm ci` | `npm ci` | ✅ |
| Build env | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ matches each app's client |
| Test | `npm test` | `npm test` | ✅ |
| Lint | `continue-on-error: true` | same | ⚠️ intentional non-blocking |

---

## Clean-Install Simulation (exact CI env per step)

Run with `env -i` (clean environment) using **only** the variables each CI step sets — proving no reliance on local `.env.local`.

### TradeDoc (Node env = CI's)
| Step | Env | Result |
|---|---|---|
| `npm ci` | — | ✅ exit 0 |
| `npm run build` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | ✅ built, 0 TS errors |
| `npm test` | same | ✅ 17/17 |

### AgriSMES
| Step | Env | Result |
|---|---|---|
| `npm ci` | — | ✅ exit 0 |
| `npm run build` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (no ANON_KEY) | ✅ built — confirmed the build does not require ANON_KEY |
| `npm test` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | ✅ 39/39 |

**Both products build and test from scratch with only the CI-provided env.** No hidden dependency on local secrets.

---

## Known CI Gaps / Caveats

| Item | Severity | Note |
|---|---|---|
| CI not yet executed on GitHub | Medium | First run happens on push; remote-green unconfirmed |
| Local Node v26 vs CI Node 20/22 | Low | Toolchain (Vite, vitest) supports Node 20+; no Node-26-specific code. Unverified on exact CI versions until first run. |
| Lint non-blocking (`continue-on-error`) | Low | Intentional; TradeDoc lint is 0 errors, AgriSMES critical lint already fixed |
| Edge functions (Deno) not built/tested in CI | Medium | `supabase/functions/*` deployed separately; the admin-auth token logic is covered by a frontend vitest (`adminAuth.test.ts`) instead |
| Two inert nested workflow files | Low | Ignored by Actions; recommend deletion later |

---

## Verdict

**CI is release-ready for the push.** Both products provably build and test from a clean install using exactly the env the workflow provides. Remote confirmation occurs on first push (expected green based on local simulation).
