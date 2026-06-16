import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AdminCodeEntry } from '../components/AdminCodeEntry'

// Regression guard for the admin-code hardening: the input must accept strong
// codes (8-64 chars, letters/numbers/symbols) and reject the old 4-digit-class
// short codes. Server-side auth is covered separately by adminAuth.test.ts.

vi.mock('../integrations/supabase/client', () => ({
  supabase: { functions: { invoke: vi.fn().mockResolvedValue({ data: { success: false }, error: null }) } },
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

function renderDialog() {
  return render(
    <AdminCodeEntry isOpen={true} onClose={() => {}} onAdminVerified={() => {}} />
  )
}

describe('AdminCodeEntry — strong admin code input', () => {
  beforeEach(() => vi.clearAllMocks())

  it('allows letters, numbers, and symbols (no longer numeric-only)', () => {
    renderDialog()
    const input = screen.getByPlaceholderText(/min 8 characters/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Adm!n_C0de#2026' } })
    expect(input.value).toBe('Adm!n_C0de#2026') // not stripped to digits
  })

  it('accepts up to 64 characters', () => {
    renderDialog()
    const input = screen.getByPlaceholderText(/min 8 characters/i) as HTMLInputElement
    const long = 'A1!'.repeat(30) // 90 chars
    fireEvent.change(input, { target: { value: long } })
    expect(input.value.length).toBe(64) // capped at 64, not 4
  })

  it('disables verify for codes shorter than 8 characters', () => {
    renderDialog()
    const input = screen.getByPlaceholderText(/min 8 characters/i) as HTMLInputElement
    const verifyBtn = screen.getByRole('button', { name: /verify|unlock|grant/i })
    fireEvent.change(input, { target: { value: '2468' } }) // old 4-digit code
    expect(verifyBtn).toBeDisabled()
  })

  it('enables verify once the code is at least 8 characters', () => {
    renderDialog()
    const input = screen.getByPlaceholderText(/min 8 characters/i) as HTMLInputElement
    const verifyBtn = screen.getByRole('button', { name: /verify|unlock|grant/i })
    fireEvent.change(input, { target: { value: 'StrongPass1!' } })
    expect(verifyBtn).not.toBeDisabled()
  })
})
