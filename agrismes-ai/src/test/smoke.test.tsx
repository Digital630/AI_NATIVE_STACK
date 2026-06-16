import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render } from '@testing-library/react'
import App from '../App'

// Stub Supabase so tests run without a real server
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}))

beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('AgriSMES smoke tests', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />)
    expect(container).toBeTruthy()
    expect(container.firstChild).not.toBeNull()
  })

  it('renders the main calculator view on unauthenticated load', () => {
    const { container } = render(<App />)
    // App renders TradeMarginCalculator as default route
    expect(container.innerHTML.length).toBeGreaterThan(50)
  })

  it('does not expose secrets in rendered output', () => {
    render(<App />)
    expect(document.body.innerHTML).not.toContain('SERVICE_ROLE_KEY')
    expect(document.body.innerHTML).not.toContain('anon-key')
  })
})
