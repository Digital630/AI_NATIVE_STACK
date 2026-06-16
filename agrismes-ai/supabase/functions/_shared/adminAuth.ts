// Shared admin-session token helpers for AgriSMES privileged edge functions.
//
// Replaces the previous client-trusted authorization (a static "verified"
// string and a client-embedded ADMIN_CODE) with an HMAC-SHA256 signed token
// that only the server can mint (it holds ADMIN_SESSION_SECRET) and that the
// privileged functions verify server-side. Uses Web Crypto (available in the
// Deno edge runtime) — no external dependencies.

const encoder = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(input: string): Uint8Array {
  let s = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4;
  if (pad) s += "=".repeat(4 - pad);
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

interface AdminTokenPayload {
  role: "admin";
  exp: number; // unix seconds
}

/** Mint a signed, short-lived admin token. Call ONLY after a valid ADMIN_CODE check. */
export async function mintAdminToken(secret: string, ttlSeconds = 3600): Promise<string> {
  const payload: AdminTokenPayload = {
    role: "admin",
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const body = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const key = await importKey(secret);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(body)));
  return `${body}.${base64UrlEncode(sig)}`;
}

/** Verify an admin token's signature and expiry. Returns true only for a valid, unexpired admin token. */
export async function verifyAdminToken(token: string | undefined | null, secret: string): Promise<boolean> {
  if (!token || !secret) return false;
  try {
    const dot = token.indexOf(".");
    if (dot <= 0) return false;
    const body = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    if (!body || !sig) return false;

    const key = await importKey(secret);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(sig),
      encoder.encode(body),
    );
    if (!valid) return false;

    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(body))) as AdminTokenPayload;
    if (payload.role !== "admin") return false;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
}
