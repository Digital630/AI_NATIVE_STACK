// Priority Zero Phase 3a/3b -- canonical entitlement shadow-comparison helper.
// Pure function, no side effects, no network calls. Used by useIsProShadow
// to compare the legacy (agrismes_subscriptions-derived) isPro signal
// against the canonical lenmac_entitlements signal, for OBSERVATION ONLY.
// Does not gate any feature and is not consumed by any UI decision.

export type ProductKey = 'agrismes' | 'tradedoc'
export type EntitlementKey = 'agrismes_pro' | 'tradedoc_pro'

export interface ShadowCompareInput {
  productKey: ProductKey
  email: string
  entitlementKey: EntitlementKey
  legacyIsPro: boolean
  canonicalIsPro: boolean
  source: string
}

export interface ShadowCompareResult extends ShadowCompareInput {
  isMatch: boolean
}

export function compareEntitlements(input: ShadowCompareInput): ShadowCompareResult {
  return { ...input, isMatch: input.legacyIsPro === input.canonicalIsPro }
}
