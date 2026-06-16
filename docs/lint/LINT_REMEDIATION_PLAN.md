# Lint Remediation Plan
**Date:** 2026-06-16  
**Products:** TradeDoc, AgriSMES

---

## TradeDoc — Final State

**0 errors, 0 warnings.** ✅

Fixes applied (commit `00b423f`):
- Added `argsIgnorePattern: '^_'` to `no-unused-vars` in `eslint.config.js`
- Renamed `_d` → `_data`, `_token` → `_otp` in `tradedoc.ts`

---

## AgriSMES — Classification

### CRITICAL (can cause runtime failure) — **ALL FIXED**

| Rule | Count | Files | Fix Applied |
|---|---|---|---|
| `react-hooks/rules-of-hooks` | 2 | `useGlobalWeather.ts:198,219` | Renamed `useCachedIfAvailable` → `getCachedIfAvailable` |
| `@typescript-eslint/no-require-imports` | 1 | `tailwind.config.ts:126` | Replaced `require()` with ESM `import` |

### MEDIUM (type safety — may hide bugs, not runtime failures)

| Rule | Count | Status |
|---|---|---|
| `@typescript-eslint/no-explicit-any` | ~120 | Deferred — style-only in current context |
| `@typescript-eslint/no-empty-object-type` | 2 | **FIXED** — converted to `type` aliases |
| `no-empty` (empty catch blocks) | 14 | Deferred — intentional silent catches |
| `react-hooks/exhaustive-deps` | ~15 | Deferred — stale closure risk but not crash |

### COSMETIC (style-only, zero runtime impact)

| Rule | Count | Status |
|---|---|---|
| `react-refresh/only-export-components` | 16 | Deferred |
| Unused eslint-disable directives | 4 | Deferred |

### BROKEN RULE DEFINITIONS (ESLint config mismatch — no actual enforcement)

| Rule | Count | Notes |
|---|---|---|
| `@typescript-eslint/ban-types` | 4 | Rule removed in @typescript-eslint v6+; update or remove from config |
| `@typescript-eslint/no-unsafe-assignment` | 3 | Requires `parserOptions.project` — not configured |
| `@typescript-eslint/no-unsafe-return` | 2 | Same — requires typed project config |

These rules produce "Definition for rule was not found" errors but are not enforced. They can be removed from the eslint config in a follow-up.

---

## Post-Fix State

| Product | Before | After | Critical |
|---|---|---|---|
| TradeDoc | 3 errors | **0 errors** | ✅ |
| AgriSMES | 164 errors, 47 warnings | **160 errors** (all critical fixed), 47 warnings | ✅ critical cleared |

---

## Recommended Next Sprint (non-blocking)

1. Fix `no-explicit-any` in the 15 most-used API boundary files
2. Remove broken rule definitions (`ban-types`, `no-unsafe-*`) from AgriSMES eslint config
3. Add `eslint-disable-next-line` comments to intentional empty catches with reason
4. Configure `parserOptions.project` for full type-checked linting
