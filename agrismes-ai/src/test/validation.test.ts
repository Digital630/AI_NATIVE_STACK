import { describe, it, expect } from 'vitest'
import { validateEmail, isValidEmailFormat } from '../utils/emailValidation'
import { validatePassword } from '../utils/passwordValidation'

// Critical workflow: login / signup input validation. These gate every
// account-creation and auth path; a regression here lets bad data into auth.

describe('validateEmail — auth input', () => {
  it('accepts a normal business email', () => {
    const r = validateEmail('buyer@company.com')
    expect(r.isValid).toBe(true)
    expect(r.riskLevel).toBe('low')
  })

  it('rejects empty input', () => {
    expect(validateEmail('').isValid).toBe(false)
  })

  it('rejects malformed addresses', () => {
    expect(validateEmail('not-an-email').isValid).toBe(false)
    expect(validateEmail('missing@domain').isValid).toBe(false)
    expect(validateEmail('@nolocal.com').isValid).toBe(false)
  })

  it('rejects known disposable domains', () => {
    const r = validateEmail('throwaway@mailinator.com')
    expect(r.isValid).toBe(false)
    expect(r.riskLevel).toBe('high')
  })

  it('rejects suspicious test/fake patterns', () => {
    expect(validateEmail('test@example.com').isValid).toBe(false)
    expect(validateEmail('fake@example.com').isValid).toBe(false)
  })

  it('normalises case and whitespace before validating', () => {
    expect(validateEmail('  Buyer@Company.COM  ').isValid).toBe(true)
  })

  it('isValidEmailFormat is a lenient real-time check', () => {
    expect(isValidEmailFormat('a@b.co')).toBe(true)
    expect(isValidEmailFormat('bad')).toBe(false)
  })
})

describe('validatePassword — auth input', () => {
  it('accepts a strong password meeting all rules', () => {
    const r = validatePassword('Str0ng!Pass')
    expect(r.isValid).toBe(true)
    expect(r.hasMinLength && r.hasUppercase && r.hasNumber && r.hasSpecialChar).toBe(true)
  })

  it('fails when shorter than 8 characters', () => {
    expect(validatePassword('Ab1!').hasMinLength).toBe(false)
    expect(validatePassword('Ab1!').isValid).toBe(false)
  })

  it('fails without an uppercase letter', () => {
    expect(validatePassword('str0ng!pass').hasUppercase).toBe(false)
    expect(validatePassword('str0ng!pass').isValid).toBe(false)
  })

  it('fails without a number', () => {
    expect(validatePassword('Strong!Pass').hasNumber).toBe(false)
    expect(validatePassword('Strong!Pass').isValid).toBe(false)
  })

  it('fails without a special character', () => {
    expect(validatePassword('Str0ngPass').hasSpecialChar).toBe(false)
    expect(validatePassword('Str0ngPass').isValid).toBe(false)
  })
})
