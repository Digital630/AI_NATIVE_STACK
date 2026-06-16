# Admin Auth Fix Plan — AgriSMES
**Date:** 2026-06-16
**Status:** Implemented in code this session (commit follows). Deployment + secret config required before it takes effect.

---

## Architecture Decision

| Option | Fit | Decision |
|---|---|---|
| **A — Supabase Auth + RLS** | Ideal long-term. Requires real admin user accounts, a custom `role` claim/`is_admin` table, and re-enabling RLS on `commodity_listings`/`admin_user_messages` with admin policies. Large change touching schema + every admin query. | Deferred (recommended as the eventual target) |
| **B — Signed JWT admin session** | Fits the *existing* design: `admin-verify` already validates a code with lockout. Add server-signed token issuance there; verify the signature in the privileged functions. Minimal surface, no schema change. | **CHOSEN** |
| **C — Server-side session store** | Works but adds a DB table + lookup per request and session-cleanup overhead for no security gain over B here. | Not needed |

**Avoided (all eliminated by Option B):** client-side trust, localStorage-as-authorization, magic strings.

---

## Design (Option B)

### New secret
`ADMIN_SESSION_SECRET` — a long random string (≥ 32 bytes), set in Supabase function env. Independent of `ADMIN_CODE`.

### Token
HMAC-SHA256 signed token: `base64url(payload).base64url(signature)`
payload = `{ role: "admin", exp: <unix-seconds> }`, TTL 1 hour.
Signed/verified with `ADMIN_SESSION_SECRET` via Web Crypto (`crypto.subtle`, available in Deno).

### Flow (fixed)
1. `admin-verify` validates `ADMIN_CODE` (+ existing lockout) → on success **mints an admin token** and returns it.
2. Client stores the token (`agrismes_admin_token`) and sends it as `adminToken` to privileged functions.
3. `admin-listings` / `admin-messages` **verify the token's signature + expiry server-side**. No token / bad signature / expired → 401. The static `"verified"` string and the client-supplied `adminCode` are removed.

### Why this closes both attack paths
- The credential is now an HMAC signature an attacker **cannot forge** without `ADMIN_SESSION_SECRET` (server-only).
- It expires (1h), bounding any leak.
- It is minted **only** by `admin-verify`, which retains the lockout/rate-limit — so brute force is gated again, and the privileged endpoints inherit that protection transitively (you can't get a valid token without passing `admin-verify`).

---

## Files Changed

| File | Change |
|---|---|
| `supabase/functions/_shared/adminAuth.ts` | **New.** `mintAdminToken()` / `verifyAdminToken()` (Web Crypto HMAC-SHA256). |
| `supabase/functions/admin-verify/index.ts` | On success, mint token; return `{ success, token }`. |
| `supabase/functions/admin-listings/index.ts` | Replace `adminToken === "verified"` with `verifyAdminToken(adminToken, SECRET)`. Remove dead `ADMIN_CODE`. |
| `supabase/functions/admin-messages/index.ts` | Replace `adminCode === ADMIN_CODE` with `verifyAdminToken(adminToken, SECRET)`. |
| `src/components/AdminCodeEntry.tsx` | Store returned token in `localStorage["agrismes_admin_token"]`. |
| `src/hooks/useListingsAdmin.ts` | Send stored token instead of `"verified"`. |
| `src/pages/UnlockExclusiveServices.tsx` | Send stored token instead of `adminCode: "2468"`. |

The `agrismes_admin_access` boolean remains **only** for non-security UI gating (icon/contact-detail display); it no longer authorizes any privileged operation.

---

## Deployment Checklist (operator — NOT done this session)

1. Generate a secret: `openssl rand -base64 48`
2. Set it in Supabase: `supabase secrets set ADMIN_SESSION_SECRET=<value> --project-ref <ref>`
3. Deploy the three functions **and** the client together (the token format is a breaking contract change):
   `supabase functions deploy admin-verify admin-listings admin-messages`
4. Rotate `ADMIN_CODE` to a longer value (the 4-digit "2468" is weak); update the legitimate admin's known code. Consider removing the hardcoded code from the client entirely (prompt the admin to type it).
5. Smoke test: verify → receive token → perform a listing action → confirm a forged/expired token is rejected (401).

> **Ordering matters:** old deployed functions expect the old format. Deploy functions + client as one release, after the secret is set. Until then, the code change is inert (not deployed).

---

## Residual Recommendations
- Migrate to **Option A** (Supabase Auth + RLS) long-term so privileged data is protected by RLS even if an edge function is misconfigured (defense in depth).
- Add lockout/rate-limiting directly to `admin-listings`/`admin-messages` as belt-and-suspenders.
- Remove the hardcoded admin code from the client bundle.
