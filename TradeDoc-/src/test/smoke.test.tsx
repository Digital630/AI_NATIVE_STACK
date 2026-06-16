import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render } from '@testing-library/react'
import App from '../App'

// Stub Supabase so tests run without a real server
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithOtp: vi.fn(),
      verifyOtp: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

beforeAll(() => {
  // Silence console.error for expected React warnings in tests
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('TradeDoc smoke tests', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />)
    expect(container).toBeTruthy()
    expect(container.firstChild).not.toBeNull()
  })

  it('renders non-empty content on unauthenticated load', () => {
    const { container } = render(<App />)
    // App renders something — loading state, auth form, or main view
    expect(container.innerHTML.length).toBeGreaterThan(10)
  })

  it('does not expose raw Supabase errors to the DOM', () => {
    render(<App />)
    expect(document.body.innerHTML).not.toContain('SUPABASE_SERVICE_ROLE_KEY')
    expect(document.body.innerHTML).not.toContain('anon-key')
  })
})
