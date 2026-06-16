import { useEffect, useRef } from 'react'
import { useEntitlements } from './useEntitlements'
import { compareEntitlements } from '../lib/entitlementShadow'
import { logEntitlementShadow } from '../lib/entitlementShadowLog'

const PRODUCT_KEY = 'agrismes' as const
const ENTITLEMENT_KEY = 'agrismes_pro' as const

// Priority Zero Phase 3b: shadow-read observation.
//
// Compares the legacy isPro signal (derived from agrismes_subscriptions,
// as computed in TradeMarginCalculator.tsx's checkProStatus effect) against
// the canonical lenmac_entitlements signal, and logs the comparison to
// lenmac_shadow_logs.
//
// THIS HOOK NEVER CHANGES USER-FACING BEHAVIOR. Its return value is
// informational only and must not be wired into any gate, redirect, or
// feature flag until Phase 3c is separately reviewed and approved.
export function useIsProShadow(
  email: string | undefined | null,
  legacyIsPro: boolean,
  legacyReady: boolean,
  source = 'agrismes_TradeMarginCalculator',
  accessToken?: string | null
) {
  const { entitlements, loaded: canonicalLoaded } = useEntitlements(email, accessToken)
  const loggedKeyRef = useRef<string | null>(null)

  const canonicalEnt = entitlements.find(e => e.entitlement_key === ENTITLEMENT_KEY)
  const canonicalIsPro = !!canonicalEnt
    && canonicalEnt.status === 'active'
    && (!canonicalEnt.current_period_end || new Date(canonicalEnt.current_period_end) > new Date())

  useEffect(() => {
    if (!email || !legacyReady || !canonicalLoaded) return

    // Log once per distinct (email, legacy, canonical) combination per
    // mount, to avoid spamming on every re-render.
    const dedupeKey = `${email}:${legacyIsPro}:${canonicalIsPro}`
    if (loggedKeyRef.current === dedupeKey) return
    loggedKeyRef.current = dedupeKey

    const result = compareEntitlements({
      productKey: PRODUCT_KEY,
      email,
      entitlementKey: ENTITLEMENT_KEY,
      legacyIsPro,
      canonicalIsPro,
      source,
    })

    if (!result.isMatch) {
      console.warn('[lenmac-shadow] entitlement mismatch', {
        productKey: PRODUCT_KEY, email, entitlementKey: ENTITLEMENT_KEY,
        legacyIsPro, canonicalIsPro, source,
      })
    }

    logEntitlementShadow(result)
  }, [email, legacyIsPro, legacyReady, canonicalLoaded, canonicalIsPro, source])

  // Informational only -- NOT a gate. Do not use to show/hide features.
  return { canonicalIsPro, loading: !canonicalLoaded }
}
