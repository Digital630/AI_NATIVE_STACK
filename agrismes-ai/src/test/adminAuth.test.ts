import { describe, it, expect } from 'vitest'
import { mintAdminToken, verifyAdminToken } from '../../supabase/functions/_shared/adminAuth'

// Security regression test for the S-1 fix. The privileged admin edge functions
// now authorize via these HMAC-signed tokens instead of a client-supplied
// "verified" string / embedded admin code. These tests prove a client cannot
// forge a valid token without the server secret.

const SECRET = 'test-admin-session-secret-at-least-32-bytes-long'

describe('admin session token (S-1 fix)', () => {
  it('accepts a freshly minted token', async () => {
    const token = await mintAdminToken(SECRET)
    expect(await verifyAdminToken(token, SECRET)).toBe(true)
  })

  it('rejects the old magic string "verified"', async () => {
    expect(await verifyAdminToken('verified', SECRET)).toBe(false)
  })

  it('rejects an empty / missing token', async () => {
    expect(await verifyAdminToken('', SECRET)).toBe(false)
    expect(await verifyAdminToken(undefined, SECRET)).toBe(false)
    expect(await verifyAdminToken(null, SECRET)).toBe(false)
  })

  it('rejects a token signed with a different secret (no forgery)', async () => {
    const forged = await mintAdminToken('attacker-secret')
    expect(await verifyAdminToken(forged, SECRET)).toBe(false)
  })

  it('rejects a tampered payload', async () => {
    const token = await mintAdminToken(SECRET)
    const [, sig] = token.split('.')
    // Re-encode a payload that never expires, keep the original signature
    const forgedBody = btoa(JSON.stringify({ role: 'admin', exp: 9999999999 }))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    expect(await verifyAdminToken(`${forgedBody}.${sig}`, SECRET)).toBe(false)
  })

  it('rejects an expired token', async () => {
    const token = await mintAdminToken(SECRET, -10) // already expired
    expect(await verifyAdminToken(token, SECRET)).toBe(false)
  })

  it('rejects a token when no secret is configured', async () => {
    const token = await mintAdminToken(SECRET)
    expect(await verifyAdminToken(token, '')).toBe(false)
  })

  it('rejects malformed tokens', async () => {
    expect(await verifyAdminToken('not-a-token', SECRET)).toBe(false)
    expect(await verifyAdminToken('a.b.c.d', SECRET)).toBe(false)
    expect(await verifyAdminToken('.', SECRET)).toBe(false)
  })
})
