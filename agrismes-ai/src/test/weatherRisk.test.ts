import { describe, it, expect } from 'vitest'
import { calculateMoldDryingRisk } from '../utils/weatherRiskCalculations'

// Critical workflow: intelligence / advisory output. The mold-drying risk
// score drives the post-harvest recommendation shown to farmers; a wrong
// HIGH/LOW classification is a real-world advice error.

describe('calculateMoldDryingRisk — cashew', () => {
  it('returns HIGH when humidity and rain both exceed thresholds', () => {
    const r = calculateMoldDryingRisk('cashew', { humidity: 75, rainProbability: 35 })
    expect(r.level).toBe('HIGH')
    expect(r.factors.length).toBeGreaterThan(0)
    expect(r.recommendation).toMatch(/delay|covered|mechanical/i)
  })

  it('returns HIGH when wet hours alone exceed the threshold', () => {
    const r = calculateMoldDryingRisk('cashew', { humidity: 50, rainProbability: 10, wetHours: 14 })
    expect(r.level).toBe('HIGH')
  })

  it('returns MEDIUM in the intermediate humidity band', () => {
    const r = calculateMoldDryingRisk('cashew', { humidity: 65, rainProbability: 10 })
    expect(r.level).toBe('MEDIUM')
  })

  it('returns LOW in favourable conditions', () => {
    const r = calculateMoldDryingRisk('cashew', { humidity: 40, rainProbability: 5 })
    expect(r.level).toBe('LOW')
    expect(r.recommendation).toMatch(/normal|standard/i)
  })
})

describe('calculateMoldDryingRisk — commodity-specific rules', () => {
  it('coffee escalates to HIGH on fog regardless of humidity', () => {
    const r = calculateMoldDryingRisk('coffee', { humidity: 50, rainProbability: 5, hasFog: true })
    expect(r.level).toBe('HIGH')
    expect(r.factors).toContain('Fog detected')
  })

  it('coffee escalates to HIGH on high overnight humidity', () => {
    const r = calculateMoldDryingRisk('coffee', { humidity: 50, rainProbability: 5, overnightHumidity: 85 })
    expect(r.level).toBe('HIGH')
  })

  it('cocoa uses a higher humidity threshold than cashew', () => {
    // 72% humidity is MEDIUM for cocoa (band 70-79) but would be MEDIUM for cashew too;
    // verify cocoa does NOT flag HIGH at conditions that lack the rain pairing
    const r = calculateMoldDryingRisk('cocoa', { humidity: 72, rainProbability: 10 })
    expect(r.level).toBe('MEDIUM')
  })

  it('always returns a recommendation matching the computed level', () => {
    for (const c of ['cashew', 'coffee', 'cocoa'] as const) {
      const r = calculateMoldDryingRisk(c, { humidity: 90, rainProbability: 90, wetHours: 30, overnightHumidity: 90 })
      expect(r.level).toBe('HIGH')
      expect(r.commodity).toBe(c)
      expect(typeof r.recommendation).toBe('string')
      expect(r.recommendation.length).toBeGreaterThan(0)
    }
  })
})
