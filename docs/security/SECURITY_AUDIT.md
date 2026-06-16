# Security Audit — LenDigital Monorepo
**Date:** 2026-06-16  
**Scope:** All tracked files in `AI_NATIVE_STACK` monorepo  
**Auditor:** Claude Sonnet 4.6 (automated + manual review)

---

## Summary

| Finding | Severity | Status |
|---|---|---|
| Hardcoded Supabase anon key in 6 AgriSMES source files | HIGH | **FIXED** (commit `0949938`) |
| Bare service role JWT in `agrismes-ai/.env.local` | HIGH | **NOT IN GIT** — rotation plan required |
| `agrismes-ai/.env.local` line 3: bare JWT paste error (no variable name) | HIGH | **NOT IN GIT** — document for dev awareness |
| TradeDoc API routes use `SUPABASE_SERVICE_ROLE_KEY` via `process.env` | INFO | Correct pattern — env var, not hardcoded |
| AgriSMES API routes use `SUPABASE_SERVICE_ROLE_KEY` via `process.env` | INFO | Correct pattern — env var, not hardcoded |

---

## Finding 1 — Hardcoded Supabase Anon Key (FIXED)

**Severity:** HIGH  
**Status:** FIXED in commit `0949938`

### What was found
Six production source files contained the live Supabase project anon JWT hardcoded as a string literal:

```
agrismes-ai/src/components/LeadCapture.tsx:4
agrismes-ai/src/components/PriceAlerts.tsx:4
agrismes-ai/src/components/RealizedOutcome.tsx:4
agrismes-ai/src/components/SavedTrades.tsx:4
agrismes-ai/src/pages/CompareDeals.tsx:4
agrismes-ai/src/pages/MarketIntelligence.tsx:6
```

### JWT decoded payload
```json
{
  "iss": "supabase",
  "ref": "pttcugqwslvdstmrbyhu",
  "role": "anon",
  "iat": 1777098658,
  "exp": 2092674658
}
```
**Role: `anon`** — not service_role. The anon key is designed to be exposed to browsers and is protected by RLS policies. However, hardcoding it:
1. Makes rotation impossible without a code deploy.
2. Embeds the project ref permanently in git history.
3. Violates the env-var pattern used by the rest of the codebase.

### Fix applied
Replaced all 6 hardcoded values with:
```ts
const SB_URL = import.meta.env.VITE_SUPABASE_URL as string
const ANON   = import.meta.env.VITE_SUPABASE_ANON_KEY as string
```

### Residual risk
The token is in git history prior to commit `0949938`. Since it is an anon key (not service_role), the risk is low — it cannot bypass RLS. However, if the Supabase project ref is considered sensitive, consider rotating anon key per the rotation plan.

---

## Finding 2 — Supabase Service Role Key in `.env.local`

**Severity:** HIGH  
**Status:** NOT IN GIT — untracked (confirmed `git ls-files` returns empty)

### What was found
`agrismes-ai/.env.local` contains:
- Line 1–2: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (expected)
- **Line 3: A bare service_role JWT with no variable name** — a paste error

### JWT decoded payload (line 3 token)
```json
{
  "iss": "supabase",
  "ref": "pttcugqwslvdstmrbyhu",
  "role": "service_role",
  "iat": 1777098658,
  "exp": 2092674658
}
```
**Role: `service_role`** — this key bypasses ALL Supabase RLS policies. If exposed:
- Full read/write access to all database tables
- Can bypass all authentication checks
- Can access any user's data

### Exposure assessment
- **Not in git** — confirmed by `git ls-files | grep env.local` returning nothing
- **Not pushed** — confirmed repo not pushed in this session
- **Local file only** — risk is limited to local filesystem access
- **No evidence of prior exposure** — the monorepo was only recently cloned from the product repos

### Action required
See `SUPABASE_KEY_ROTATION_PLAN.md`

---

## Finding 3 — Server-side Service Role Key Usage (CORRECT PATTERN)

**Severity:** INFO — no action required

All API routes that require the service role key use `process.env.SUPABASE_SERVICE_ROLE_KEY`:

| File | Usage |
|---|---|
| `agrismes-ai/api/signals.js` | `process.env.SUPABASE_SERVICE_ROLE_KEY` with null check |
| `agrismes-ai/api/anthropic-analyse.js` | `process.env.SUPABASE_SERVICE_ROLE_KEY` with warn if missing |
| `agrismes-ai/api/auth-otp.js` | Via `getSupabaseAdmin()` helper |
| `agrismes-ai/server/subscription-utils.js` | `process.env.SUPABASE_SERVICE_ROLE_KEY` with throw if missing |
| `TradeDoc-/api/tradedoc.js` | `process.env.SUPABASE_SERVICE_ROLE_KEY` with throw if missing |
| `TradeDoc-/api/polar-webhook.js` | `process.env.SUPABASE_SERVICE_ROLE_KEY` with null check |
| `agrismes-ai/supabase/functions/*/index.ts` | `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` — correct for edge functions |

This is the correct pattern. Service role key is never in source code.

---

## Scan Coverage

| Category | Method | Result |
|---|---|---|
| JWT tokens in source | `grep -rn "eyJ[...]{10,}"` across git ls-files | 6 found, all fixed |
| Raw API keys (`sk-ant-`, `re_`, `polar_`) | Pattern grep across git ls-files | None found |
| Credentials in `.env` files | `git ls-files \| grep env` | Only `.env.example` files tracked |
| `service_role` references | Full repo grep | All in SQL comments, RLS policies, or `process.env` — none hardcoded |
| Vercel config files | Manual review of `vercel.json` | No secrets — only routing config |
| GitHub Actions workflows | Manual review | Placeholder env vars only in CI |

---

## Post-Fix State

```
$ git ls-files | xargs grep -l "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" 2>/dev/null
(no output)
```

**Zero hardcoded JWTs remain in any tracked file.**
