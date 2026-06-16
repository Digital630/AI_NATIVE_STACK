// Priority Zero Phase 3b: shadow-log writer for AgriSMES.
// Inserts a comparison row into lenmac_shadow_logs via direct PostgREST +
// anon key, allowed by the anon_insert_shadow_logs RLS policy (INSERT-only,
// no public SELECT). Best-effort -- failures are swallowed, never surfaced.

import type { ShadowCompareResult } from './entitlementShadow'

export async function logEntitlementShadow(result: ShadowCompareResult): Promise<void> {
  try {
    const SB_URL = import.meta.env.VITE_SUPABASE_URL
    const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    await fetch(`${SB_URL}/rest/v1/lenmac_shadow_logs`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        product_key: result.productKey,
        email: result.email,
        entitlement_key: result.entitlementKey,
        legacy_is_pro: result.legacyIsPro,
        canonical_is_pro: result.canonicalIsPro,
        is_match: result.isMatch,
        source: result.source,
      }),
    })
  } catch {
    // Non-fatal -- observation only
  }
}
