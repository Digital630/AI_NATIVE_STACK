import { useState, useEffect, useCallback } from 'react'
import { fetchEntitlements, type LenmacEntitlement } from '../lib/entitlements'

// Priority Zero Phase 3a: canonical entitlement reader hook for AgriSMES.
// PREPARATION ONLY -- not yet used for any gating decision.
export function useEntitlements(email?: string | null, accessToken?: string | null) {
  const [entitlements, setEntitlements] = useState<LenmacEntitlement[]>([])
  const [isPro, setIsPro] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(async () => {
    if (!email) return
    setLoading(true)
    try {
      const r = await fetchEntitlements(email, accessToken)
      setEntitlements(r.entitlements)
      setIsPro(r.isPro)
      setLoaded(true)
    } finally {
      setLoading(false)
    }
  }, [email, accessToken])

  useEffect(() => { refresh() }, [email, accessToken]) // eslint-disable-line react-hooks/exhaustive-deps

  return { entitlements, isPro, loading, loaded, refresh }
}
