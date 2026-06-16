// Priority Zero Phase 3a: canonical entitlement reader for AgriSMES.
// Reads the unified lenmac_entitlements table via direct PostgREST + the
// anon key -- the SAME idiom Pricing.tsx / TradeMarginCalculator.tsx already
// use against agrismes_subscriptions, enabled by the open_read RLS policy
// added in Phase 2. PREPARATION ONLY -- not yet used for any gating decision.

export interface LenmacEntitlement {
  product_key: string
  entitlement_key: string
  status: string
  current_period_end: string | null
}

export interface EntitlementsResult {
  entitlements: LenmacEntitlement[]
  isPro: boolean
}

const ENTITLEMENT_KEY = 'agrismes_pro'

function isActive(row: LenmacEntitlement): boolean {
  if (row.status !== 'active') return false
  if (row.current_period_end && new Date(row.current_period_end) < new Date()) return false
  return true
}

// Fetches ALL lenmac_entitlements rows for an email (cross-product), plus a
// convenience agrismes_pro isPro flag. Failures are non-fatal -- returns an
// empty result so callers can no-op safely.
//
// accessToken: the logged-in user's Supabase session access token. RLS on
// lenmac_entitlements (authenticated_read_own) requires
// auth.jwt()->>'email' to match the row's email -- the bare anon key has no
// email claim and returns zero rows. Pass session.access_token here so the
// request is made as the user; falls back to the anon key (returns no rows
// under current RLS, but keeps the call non-throwing) if no token.
export async function fetchEntitlements(email: string, accessToken?: string | null): Promise<EntitlementsResult> {
  const empty: EntitlementsResult = { entitlements: [], isPro: false }
  if (!email) return empty

  try {
    const SB_URL = import.meta.env.VITE_SUPABASE_URL
    const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    const res = await fetch(
      `${SB_URL}/rest/v1/lenmac_entitlements?email=eq.${encodeURIComponent(email)}&select=product_key,entitlement_key,status,current_period_end`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${accessToken || SB_KEY}` } }
    )
    if (!res.ok) return empty
    const rows: LenmacEntitlement[] = await res.json()
    const agrismesEnt = rows.find(r => r.entitlement_key === ENTITLEMENT_KEY)
    return { entitlements: rows, isPro: !!agrismesEnt && isActive(agrismesEnt) }
  } catch {
    return empty
  }
}
