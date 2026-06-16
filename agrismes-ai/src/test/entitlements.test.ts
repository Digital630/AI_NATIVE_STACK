import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchEntitlements } from '../lib/entitlements'

// Critical workflow: subscription status / Pro gating.
// fetchEntitlements decides whether a user gets Pro features. A wrong answer
// here either gives away paid features or locks out paying customers.

function mockFetchOnce(status: number, body: unknown) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as unknown as typeof fetch
}

const FUTURE = new Date(Date.now() + 86_400_000).toISOString()
const PAST = new Date(Date.now() - 86_400_000).toISOString()

describe('fetchEntitlements — subscription status', () => {
  beforeEach(() => vi.restoreAllMocks())
  afterEach(() => vi.restoreAllMocks())

  it('returns isPro=false for empty email without calling the network', async () => {
    const spy = vi.fn()
    globalThis.fetch = spy as unknown as typeof fetch
    const result = await fetchEntitlements('')
    expect(result.isPro).toBe(false)
    expect(result.entitlements).toEqual([])
    expect(spy).not.toHaveBeenCalled()
  })

  it('grants Pro when an active agrismes_pro entitlement exists', async () => {
    mockFetchOnce(200, [
      { product_key: 'agrismes', entitlement_key: 'agrismes_pro', status: 'active', current_period_end: FUTURE },
    ])
    const result = await fetchEntitlements('paid@example.com', 'token')
    expect(result.isPro).toBe(true)
  })

  it('denies Pro when the entitlement period has expired', async () => {
    mockFetchOnce(200, [
      { product_key: 'agrismes', entitlement_key: 'agrismes_pro', status: 'active', current_period_end: PAST },
    ])
    const result = await fetchEntitlements('expired@example.com', 'token')
    expect(result.isPro).toBe(false)
  })

  it('denies Pro when status is not active (e.g. cancelled)', async () => {
    mockFetchOnce(200, [
      { product_key: 'agrismes', entitlement_key: 'agrismes_pro', status: 'cancelled', current_period_end: FUTURE },
    ])
    const result = await fetchEntitlements('cancelled@example.com', 'token')
    expect(result.isPro).toBe(false)
  })

  it('denies Pro when no agrismes_pro entitlement is present (other product only)', async () => {
    mockFetchOnce(200, [
      { product_key: 'tradedoc', entitlement_key: 'tradedoc_pro', status: 'active', current_period_end: FUTURE },
    ])
    const result = await fetchEntitlements('other@example.com', 'token')
    expect(result.isPro).toBe(false)
    expect(result.entitlements).toHaveLength(1)
  })

  it('treats an active entitlement with null period_end as valid (no expiry)', async () => {
    mockFetchOnce(200, [
      { product_key: 'agrismes', entitlement_key: 'agrismes_pro', status: 'active', current_period_end: null },
    ])
    const result = await fetchEntitlements('lifetime@example.com', 'token')
    expect(result.isPro).toBe(true)
  })

  it('is non-fatal on HTTP error — returns empty result, never throws', async () => {
    mockFetchOnce(500, { message: 'server error' })
    const result = await fetchEntitlements('err@example.com', 'token')
    expect(result.isPro).toBe(false)
    expect(result.entitlements).toEqual([])
  })

  it('is non-fatal on network rejection — returns empty result', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network down')) as unknown as typeof fetch
    const result = await fetchEntitlements('down@example.com', 'token')
    expect(result.isPro).toBe(false)
  })
})
