# Supabase Key Rotation Plan
**Date:** 2026-06-16  
**Trigger:** Service role key present in `agrismes-ai/.env.local` (untracked; bare paste error on line 3)  
**Anon key:** Was hardcoded in 6 source files (fixed in commit `0949938`)

**DO NOT execute this plan without operator approval.**  
**DO NOT modify Supabase, Vercel, or any production system during automated sessions.**

---

## Decision Matrix

| Scenario | Action |
|---|---|
| Service role key was never pushed or shared | Rotate anon key only (precaution); service role key optional but recommended |
| Service role key may have been exposed | Rotate BOTH keys immediately (steps below) |
| Anon key rotation only | Steps 1–4 only |
| Full rotation | Steps 1–8 |

**Current assessment:** Service role key appears local-only (not in git). Anon key was in git history. Recommend rotating anon key now; rotate service role key at next maintenance window.

---

## Step 1 — Generate new keys in Supabase

1. Log into [supabase.com](https://supabase.com) → project `pttcugqwslvdstmrbyhu`
2. Navigate to: **Settings → API**
3. Click **"Reveal"** next to both `anon/public` and `service_role` keys to confirm current values
4. Click **"Roll API Keys"** (or **"Regenerate"** next to the key you're rotating)
   - Supabase will generate new JWT-signed keys with the same project ref but a new signature
   - Old keys are **immediately invalidated** upon regeneration

> ⚠️ All users with active sessions using the old anon key will be logged out. The app will be broken until new keys are deployed.

---

## Step 2 — Update Vercel environment variables

### AgriSMES
1. Go to [vercel.com](https://vercel.com) → `agrismes-ai` project → **Settings → Environment Variables**
2. Update:
   - `VITE_SUPABASE_ANON_KEY` → new anon key
   - `VITE_SUPABASE_PUBLISHABLE_KEY` → new anon key (same value, aliased)
   - `SUPABASE_SERVICE_ROLE_KEY` → new service role key (if rotating)
   - `SUPABASE_URL` → unchanged
3. Apply to: **Production**, **Preview**, **Development**

### TradeDoc
1. Go to Vercel → `tradedoc` project → **Settings → Environment Variables**
2. Update:
   - `VITE_SUPABASE_ANON_KEY` → new anon key
   - `SUPABASE_SERVICE_ROLE_KEY` → new service role key (if rotating)
   - `VITE_SUPABASE_URL` → unchanged

---

## Step 3 — Update local `.env.local` files

### `agrismes-ai/.env.local`
```
VITE_SUPABASE_URL=https://pttcugqwslvdstmrbyhu.supabase.co
VITE_SUPABASE_ANON_KEY=<new-anon-key>
SUPABASE_URL=https://pttcugqwslvdstmrbyhu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<new-service-role-key>
ANTHROPIC_API_KEY=<existing-value>
RESEND_API_KEY=<existing-value>
```

> **Fix the paste error:** Remove the bare JWT on line 3 that has no variable name. The corrected file should have named key=value pairs only.

### `TradeDoc-/.env.local`
```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<new-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<new-service-role-key>
```

---

## Step 4 — Redeploy both products

1. Trigger a new Vercel deployment for both projects after updating env vars
2. Confirm deployments succeed (build logs should show no env var errors)
3. Test: sign in to each product with a real account and confirm auth works

---

## Step 5 — Update Supabase Edge Function secrets (if rotating service role key)

Supabase Edge Functions receive `SUPABASE_SERVICE_ROLE_KEY` automatically from the Supabase project settings — no manual update needed for edge functions.

However, if any edge function has a manually set secret via `supabase secrets set`, update it:
```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<new-key> --project-ref pttcugqwslvdstmrbyhu
```

---

## Step 6 — Verify git history does not contain service role key

```bash
git log -p | grep "service_role" | grep "eyJ"
```
Expected: no output (service role key was never in git).

```bash
# Use the trailing signature segment of the OLD anon key as the search needle:
git log -p | grep "<old-anon-key-signature>"
```
This will show the old anon key in history (commits before `0949938`). This is acceptable for an anon key (public by design) but confirms the history contains it.

---

## Step 7 — Confirm rotation is complete

- [ ] Old anon key no longer accepted by Supabase (test: make a request with old key)
- [ ] App loads in production without errors
- [ ] New sign-in flow works end-to-end
- [ ] All Vercel env vars updated
- [ ] Local `.env.local` files updated
- [ ] Paste error on line 3 of `agrismes-ai/.env.local` removed

---

## Step 8 — Post-rotation (optional hardening)

Consider adding a pre-commit hook to prevent future key leaks:

```bash
# .git/hooks/pre-commit (or via Husky)
if git diff --cached | grep -E "eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}"; then
  echo "ERROR: JWT token detected in staged files. Remove before committing."
  exit 1
fi
```
