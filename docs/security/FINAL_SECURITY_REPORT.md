# Final Security Report — LenDigital Monorepo
**Date:** 2026-06-16  
**Scope:** Full tracked repository, both products  
**Method:** Automated pattern scan + manual auth-flow review

---

## Headline

| # | Finding | Severity | Status |
|---|---|---|---|
| **S-1** | **Broken access control on AgriSMES admin edge functions** | **CRITICAL** | ⛔ OPEN — go-live blocker |
| S-2 | Hardcoded Supabase anon keys (6 files) | HIGH | ✅ FIXED (`0949938`) |
| S-3 | Service role JWT in `agrismes-ai/.env.local` (untracked) | HIGH | ⚠️ Rotation recommended (untracked, not pushed) |
| S-4 | Hardcoded Supabase project URLs/refs in source | LOW | ℹ️ Accepted (public by design) |
| S-5 | Secrets in git | — | ✅ NONE found |

---

## S-1 — Broken Access Control (CRITICAL) ⛔

### The vulnerability
The AgriSMES admin edge functions `admin-listings` and `admin-messages` authorize callers with a **static, client-controlled string**:

```ts
// supabase/functions/admin-listings/index.ts
const { action, listingId, listingIds, adminToken } = body;
if (adminToken !== "verified") {        // <-- "verified" is a magic constant
  return new Response(..., { status: 401 });
}
```

The client sends this string whenever a localStorage flag is set:
```ts
// src/hooks/useListingsAdmin.ts
adminToken: isAdminVerified() ? "verified" : "invalid",
// isAdminVerified() === localStorage.getItem("agrismes_admin_access") === "true"
```

### Why it's exploitable
- `admin-verify` correctly checks a secret `ADMIN_CODE` — **but that check is irrelevant to the privileged endpoints.**
- `admin-listings` / `admin-messages` never re-verify the code or any server-issued token. They trust the literal string `"verified"`.
- **Any unauthenticated attacker** can call these endpoints directly:
  ```
  POST /functions/v1/admin-listings
  { "action": "delete", "listingId": "<any>", "adminToken": "verified" }
  ```
  and the request is accepted.
- These functions run with the **service role key** (bypasses all RLS). Impact: delete/modify any listing, read all admin messages.

### Severity: CRITICAL
Confidentiality + integrity of all admin-managed data. No valid credential required — the "auth" is a guessable constant shipped in the client bundle.

### Why NOT patched in this session
A correct fix changes the auth contract across the client, two edge functions, and requires a Supabase deploy:
- `admin-verify` must issue a **server-signed, time-limited token** (e.g. HMAC/JWT) on success
- `admin-listings`/`admin-messages` must **verify that token server-side** (or re-check `ADMIN_CODE` from a secure header), not a static string
- Edge functions are deployed separately to Supabase (out of this repo's build/CI, and modifying Supabase production is restricted this session)

Blind-patching risks locking out the real admin or leaving a partial hole. **This requires explicit approval and a coordinated deploy.**

### Recommended remediation (for approval)
1. In `admin-verify`: on valid `ADMIN_CODE`, mint a short-lived HMAC token signed with a new `ADMIN_SESSION_SECRET` env var; return it to the client.
2. Client stores that token (not a boolean) and sends it in `Authorization`.
3. In `admin-listings`/`admin-messages`: verify the HMAC + expiry server-side; reject otherwise.
4. Rotate `ADMIN_CODE` after deploy.

---

## S-2 — Hardcoded Anon Keys (HIGH) ✅ FIXED
6 AgriSMES source files embedded the production anon JWT. Replaced with `import.meta.env.VITE_SUPABASE_ANON_KEY` in commit `0949938`. Anon keys are RLS-protected and browser-safe, but hardcoding prevented rotation. Verified zero hardcoded JWTs remain:
```
git ls-files | xargs grep -l "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" → (none)
```

## S-3 — Service Role Key in `.env.local` (HIGH) ⚠️
A bare service_role JWT sits in `agrismes-ai/.env.local` (line 3, paste error). **Not tracked in git** (confirmed) and **not pushed**. Risk limited to local filesystem. Rotation plan: `SUPABASE_KEY_ROTATION_PLAN.md`. Recommended before go-live as a precaution.

## S-4 — Hardcoded Project URLs (LOW) ℹ️
`https://pttcugqwslvdstmrbyhu.supabase.co` and ref appear in several handlers. Supabase project URLs are **public by design** (sent in every browser request) — not secrets. Both products point at the **same Supabase project**. Recommend moving to env vars for maintainability/multi-env, but no security exposure.

## S-5 — Secrets in Git ✅ NONE
| Check | Result |
|---|---|
| Hardcoded JWTs in tracked files | NONE |
| Service role key literal in tracked files | NONE |
| `sk-ant` / `re_` / `polar_` key patterns | NONE |
| `.env` / `.env.local` tracked | NONE (only `.env.example`) |
| Service role usage | All via `process.env` / `Deno.env` (16 handlers verified) |

---

## Webhook & Auth Boundary Review

| Boundary | Verdict |
|---|---|
| `polar-webhook.js` (both) | ✅ HMAC signature verification → 401; payload validation → 400; idempotency |
| `auth-otp.js` | ✅ OTP via `ADMIN_CODE`-style secret; rate-limit/lockout tables present |
| `admin-verify` | ✅ Validates `ADMIN_CODE`; logs attempts; lockout state |
| `admin-listings` / `admin-messages` | ⛔ **S-1 — static-string auth bypass** |

---

## Go / No-Go (Security)

**NO-GO until S-1 is remediated.** The admin endpoints are effectively unauthenticated against a service-role-backed data store. S-3 rotation should accompany the fix. All other findings are resolved or accepted.
