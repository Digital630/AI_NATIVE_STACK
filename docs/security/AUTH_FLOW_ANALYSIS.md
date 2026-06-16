# Admin Authentication Flow Analysis — AgriSMES
**Date:** 2026-06-16
**Verdict:** **CONFIRMED EXPLOITABLE** (both `admin-listings` and `admin-messages`)
**Method:** Full source trace — edge functions, client callers, Supabase function config, RLS posture.

---

## Components Traced

| Layer | File | Role |
|---|---|---|
| Login UI | `src/components/AdminCodeEntry.tsx` | Collects admin code, calls `admin-verify` |
| localStorage | (client) `agrismes_admin_access = "true"` | Boolean flag set on successful verify |
| Verification | `supabase/functions/admin-verify/index.ts` | Validates `ADMIN_CODE`, rate-limit + lockout |
| Privileged op (listings) | `supabase/functions/admin-listings/index.ts` | approve/reject/delete/clear_all listings (service role) |
| Privileged op (messages) | `supabase/functions/admin-messages/index.ts` | list/markRead/reply admin messages (service role) |
| Client caller (listings) | `src/hooks/useListingsAdmin.ts` | Sends `adminToken: "verified"` |
| Client caller (messages) | `src/pages/UnlockExclusiveServices.tsx` | Sends `adminCode: "2468"` |
| Function exposure | `supabase/config.toml` | `verify_jwt = false` for all three |

---

## Sequence Diagram (intended flow)

```
Admin            AdminCodeEntry         admin-verify(edge)        localStorage          admin-listings/messages(edge, service-role)
  |                    |                      |                        |                          |
  |--enter code------->|                      |                        |                          |
  |                    |--invoke(code)-------->|                        |                          |
  |                    |                       |--check ADMIN_CODE      |                          |
  |                    |                       |  + lockout/rate-limit  |                          |
  |                    |<--{success:true}------|                        |                          |
  |                    |--setItem("agrismes_admin_access","true")------>|                          |
  |                    |                                                |                          |
  |--click delete----->|                                                |                          |
  |              (useListingsAdmin)                                     |                          |
  |                    |--invoke(action, adminToken:"verified")------------------------------------>|
  |                    |                                                |    check adminToken==="verified"
  |                    |                                                |    -> service-role DELETE |
  |                    |<--{success:true}-----------------------------------------------------------|
```

**The defect:** the privileged endpoints do not consult `admin-verify`, the lockout state, or any server-issued secret tied to the verification. They trust a value the client puts in the request body.

---

## Trust Boundaries

```
┌─────────────────────────── UNTRUSTED (public internet) ───────────────────────────┐
│  Browser / curl / any HTTP client                                                  │
│   - knows the anon key (public, in bundle)                                         │
│   - can read client JS: "verified" string and adminCode "2468"                     │
│   - can send arbitrary request bodies                                              │
└───────────────────────────────────────────────────────────────────────────────────┘
                │  (verify_jwt = false → NO JWT required to invoke)
                ▼
┌─────────────────────────── SUPABASE EDGE (service-role) ──────────────────────────┐
│  admin-listings : gate = (adminToken === "verified")   ← string is public          │
│  admin-messages : gate = (adminCode === ADMIN_CODE)    ← ADMIN_CODE = "2468"        │
│  admin-verify   : gate = (code === ADMIN_CODE) + lockout  ← only place lockout lives│
│  → all use SUPABASE_SERVICE_ROLE_KEY → bypass ALL RLS                               │
└───────────────────────────────────────────────────────────────────────────────────┘
```

The trust boundary is supposed to be the edge-function authorization check. In practice the "credential" required to cross it is **public knowledge** (a constant string / a 4-digit code embedded in the client bundle), so the boundary is not enforced.

---

## Authorization Checks (as built)

| Endpoint | `verify_jwt` | Auth check | Secret strength | Rate limit | Verdict |
|---|---|---|---|---|---|
| `admin-verify` | false | `code === ADMIN_CODE` | weak (4-digit "2468") | ✅ yes (3 → 15m/30m/24h) | Acceptable *for the verify step* |
| `admin-listings` | false | `adminToken === "verified"` | **none** (constant) | ❌ none | **BROKEN** |
| `admin-messages` | false | `adminCode === ADMIN_CODE` | weak ("2468", in client bundle) | ❌ none | **BROKEN** |

Note: `ADMIN_CODE` is loaded but **never referenced** in `admin-listings` (dead import).

---

## Attack Paths (no prior verification required)

### Attack 1 — Destroy/manipulate all listings (`admin-listings`)
The required "credential" is the literal string `verified`, visible in `useListingsAdmin.ts` and shipped in the bundle.
```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/admin-listings \
  -H "Content-Type: application/json" \
  -d '{"action":"clear_all","listingIds":["<id1>","<id2>"],"adminToken":"verified"}'
# → service-role DELETE on commodity_listings, RLS bypassed. No auth, no rate limit.
```
Also supports `delete`, `approve`, `reject` on any `listingId`.

### Attack 2 — Read/forge admin messages (`admin-messages`)
The "credential" is `ADMIN_CODE = "2468"` — hardcoded in `UnlockExclusiveServices.tsx` and thus in the bundle. Even without reading it, `admin-messages` has **no lockout** (only `admin-verify` does), so 0000–9999 is brute-forceable in seconds.
```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/admin-messages \
  -H "Content-Type: application/json" \
  -d '{"action":"list","adminCode":"2468"}'
# → returns up to 200 admin_user_messages rows (visitor PII / contact data).
# action:"reply" lets an attacker impersonate the admin to users.
```

### Why CORS/JWT do not help
- `verify_jwt = false` → no project JWT required at all.
- `Access-Control-Allow-Origin: *` → callable from any origin (and curl ignores CORS regardless).

---

## Can an unauthenticated external actor invoke these without completing verification?

**YES — confirmed for both.**
- `admin-listings`: yes, with a publicly-known constant string.
- `admin-messages`: yes, with a 4-digit code that is hardcoded client-side and unprotected by rate limiting at this endpoint.

The `admin-verify` lockout/rate-limiting provides **no protection** for the privileged endpoints because they never consult it.

---

## Correction to prior report (S-1)

The earlier `FINAL_SECURITY_REPORT.md` stated both endpoints share the static `"verified"` bypass. Precise finding after full trace:
- `admin-listings` → static `"verified"` string (no secret). ✅ as described.
- `admin-messages` → checks `ADMIN_CODE`, but the code is `"2468"`, hardcoded in the client bundle and unprotected by lockout at this endpoint. Different vector, **same conclusion: exploitable**.

Both are remediated by the same fix (see `ADMIN_AUTH_FIX_PLAN.md`).
