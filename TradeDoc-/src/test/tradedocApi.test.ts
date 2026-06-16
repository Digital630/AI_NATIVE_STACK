import { describe, it, expect, vi, beforeEach } from 'vitest'

// Control the Supabase session the API client reads for its auth token.
// vi.mock is hoisted, so the mock fn must be created via vi.hoisted.
const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }))
vi.mock('../lib/supabase', () => ({
  supabase: { auth: { getSession } },
}))

import { tradedoc } from '../lib/tradedoc'

function mockFetch(status: number, body: unknown) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as unknown as typeof fetch
}

describe('tradedoc API client — auth gating', () => {
  beforeEach(() => {
    getSession.mockReset()
    vi.restoreAllMocks()
  })

  it('refuses requests when there is no session token (login gate)', async () => {
    getSession.mockResolvedValue({ data: { session: null } })
    await expect(tradedoc.getDashboard()).rejects.toThrow(/sign in/i)
  })

  it('sends the bearer token and action when authenticated (dashboard / subscription check)', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'tok-123' } } })
    mockFetch(200, { plan_status: 'pro', documents_generated: 4, document_limit: 100 })

    const dash = await tradedoc.getDashboard()
    expect(dash.plan_status).toBe('pro') // subscription status flows through

    const [, init] = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(init.headers.Authorization).toBe('Bearer tok-123')
    expect(JSON.parse(init.body).action).toBe('get_dashboard')
  })

  it('document generation posts doc_type + payload (export flow)', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } })
    mockFetch(200, { document_id: 'doc_1' })

    const res = await tradedoc.generateDoc({ doc_type: 'commercial_invoice', payload: { invoice_number: 'INV-1' } })
    expect(res.document_id).toBe('doc_1')

    const [, init] = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    const sent = JSON.parse(init.body)
    expect(sent.action).toBe('generate_doc')
    expect(sent.doc_type).toBe('commercial_invoice')
    expect(sent.payload.invoice_number).toBe('INV-1')
  })

  it('surfaces server error messages instead of silently succeeding', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } })
    mockFetch(403, { error: 'Upgrade to Pro to generate this document.' })
    await expect(
      tradedoc.generateDoc({ doc_type: 'contract', payload: {} })
    ).rejects.toThrow(/upgrade to pro/i)
  })

  it('throws on non-OK HTTP without an error body', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } })
    mockFetch(500, null)
    await expect(tradedoc.getDashboard()).rejects.toThrow()
  })

  it('legacy signup/confirmEmail shims throw (OTP-only auth)', async () => {
    await expect(tradedoc.signup({})).rejects.toThrow(/removed/i)
    await expect(tradedoc.confirmEmail('123456')).rejects.toThrow(/removed/i)
  })
})
