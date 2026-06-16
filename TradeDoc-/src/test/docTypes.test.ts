import { describe, it, expect } from 'vitest'
import { DOC_TYPES } from '../lib/docTypes'
import type { DocType } from '../lib/docTypes'

// Critical workflow: document generation. The DOC_TYPES registry defines every
// template the app can produce and which fields are required. A malformed
// registry (duplicate ids, missing fields, bad field types) breaks generation
// and the required-field validation gate in App.tsx.

const VALID_FIELD_TYPES = new Set(['text', 'textarea', 'number', 'date', 'select'])

describe('DOC_TYPES registry integrity', () => {
  it('exposes at least one document type', () => {
    expect(DOC_TYPES.length).toBeGreaterThan(0)
  })

  it('has unique document ids', () => {
    const ids = DOC_TYPES.map((d) => d.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every document has a label, description, and at least one field', () => {
    for (const doc of DOC_TYPES) {
      expect(doc.label, `${doc.id} label`).toBeTruthy()
      expect(doc.description, `${doc.id} description`).toBeTruthy()
      expect(doc.fields.length, `${doc.id} fields`).toBeGreaterThan(0)
    }
  })

  it('every field has a valid type and unique id within its document', () => {
    for (const doc of DOC_TYPES) {
      const fieldIds = doc.fields.map((f) => f.id)
      expect(new Set(fieldIds).size, `${doc.id} field ids unique`).toBe(fieldIds.length)
      for (const field of doc.fields) {
        expect(field.id, `${doc.id} field id`).toBeTruthy()
        expect(field.label, `${doc.id}.${field.id} label`).toBeTruthy()
        expect(VALID_FIELD_TYPES.has(field.type), `${doc.id}.${field.id} type=${field.type}`).toBe(true)
      }
    }
  })

  it('select fields always provide options', () => {
    for (const doc of DOC_TYPES) {
      for (const field of doc.fields) {
        if (field.type === 'select') {
          expect(field.options, `${doc.id}.${field.id} options`).toBeDefined()
          expect((field.options ?? []).length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('every document has at least one required field (so the gate is meaningful)', () => {
    for (const doc of DOC_TYPES) {
      const hasRequired = doc.fields.some((f) => f.required)
      expect(hasRequired, `${doc.id} has a required field`).toBe(true)
    }
  })

  it('exposes both free and pro templates (plan gating is exercised)', () => {
    const free = DOC_TYPES.filter((d: DocType) => !d.proOnly)
    const pro = DOC_TYPES.filter((d: DocType) => d.proOnly)
    expect(free.length).toBeGreaterThan(0)
    expect(pro.length).toBeGreaterThan(0)
  })

  it('reproduces the required-field validation used at generation time', () => {
    // Mirrors App.tsx: missing = fields.filter(required && empty)
    const doc = DOC_TYPES[0]
    const emptyForm: Record<string, string> = {}
    const missing = doc.fields.filter((f) => f.required && !emptyForm[f.id]?.trim())
    expect(missing.length).toBeGreaterThan(0) // empty form must be blocked

    const fullForm: Record<string, string> = {}
    for (const f of doc.fields) fullForm[f.id] = 'x'
    const missingWhenFull = doc.fields.filter((f) => f.required && !fullForm[f.id]?.trim())
    expect(missingWhenFull.length).toBe(0) // complete form must pass
  })
})
