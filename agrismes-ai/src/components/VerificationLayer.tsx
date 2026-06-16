import ReactMarkdown from 'react-markdown'
import { useState } from 'react'
import { TCB_AUCTION_PRICES, TZS_USD_RATE } from '../data/tcb_market_data'

interface VerifyProps {
  priceUsd: number
  freight: number
  totalCosts: number
  netYield: number
  grossMargin: number
  breakeven: number
  quantity: number
  isTanzania: boolean
  role?: string
  effectiveWfkCost?: number
}

export default function VerificationLayer({
  priceUsd, freight, totalCosts, grossMargin, isTanzania, role, effectiveWfkCost
}: VerifyProps) {

  const [aiInsight, setAiInsight] = useState<string>('')
  const [aiLoading, setAiLoading] = useState(false)

  function marginUnder(newPrice: number, newFreight: number) {
    const costDelta = newFreight - freight
    const newTotalCosts = totalCosts + costDelta
    const ny = newPrice - newTotalCosts
    return (ny / newPrice) * 100
  }

  const scenarios = [
    { label: 'Price drops 5%', detail: 'Buyer renegotiates down at arrival', margin: marginUnder(priceUsd * 0.95, freight) },
    { label: 'Price drops 10%', detail: 'Market softens before settlement', margin: marginUnder(priceUsd * 0.90, freight) },
    { label: 'Freight surges 25%', detail: 'Container rate spike or rerouting', margin: marginUnder(priceUsd, freight * 1.25) },
    { label: 'FX moves 5% against you', detail: 'Local currency strengthens vs USD', margin: marginUnder(priceUsd * 0.95, freight) },
  ]

  const priceFloor = totalCosts
  const priceCushionPct = ((priceUsd - priceFloor) / priceUsd) * 100

  function marginColor(m: number) {
    if (m >= 15) return '#16a34a'
    if (m >= 5) return '#d97706'
    if (m >= 0) return '#ea580c'
    return '#dc2626'
  }

  const flags: { level: string; text: string }[] = []
  if (priceCushionPct < 12) flags.push({ level: 'high', text: `Price is only ${priceCushionPct.toFixed(1)}% above total cost — almost no room before loss.` })
  if (grossMargin < 15 && grossMargin >= 5) flags.push({ level: 'med', text: `Margin of ${grossMargin.toFixed(1)}% sits below the 15% safety threshold — limited buffer for surprises.` })
  if (grossMargin < 5) flags.push({ level: 'high', text: `Margin of ${grossMargin.toFixed(1)}% is dangerously thin — small cost shifts turn this negative.` })
  const freightPct = (freight / totalCosts) * 100
  if (freightPct > 35) flags.push({ level: 'med', text: `Freight is ${freightPct.toFixed(0)}% of total cost — high logistics exposure to rate swings.` })
  if (marginUnder(priceUsd * 0.90, freight) < 0) flags.push({ level: 'high', text: `A 10% price drop wipes out the margin entirely — no downside protection.` })
  if (isTanzania) flags.push({ level: 'low', text: `TCB levy (4%) applies at origin — factored in, but confirm current rate before commitment.` })
  if (isTanzania) {
    const seasonData = TCB_AUCTION_PRICES.filter(d => d.season === '2025/26')
    if (seasonData.length > 0) {
      const marketMax = Math.max(...seasonData.map(d => d.max_tzs_kg)) / TZS_USD_RATE * 1000
      const marketMin = Math.min(...seasonData.map(d => d.min_tzs_kg)) / TZS_USD_RATE * 1000
      if (priceUsd > marketMax) {
        flags.push({ level: 'high', text: `RCN price $${priceUsd.toFixed(0)}/MT exceeds the 2025/26 TCB auction ceiling of $${marketMax.toFixed(0)}/MT. Replacement cost risk is elevated.` })
      } else if (priceUsd > marketMax * 0.85) {
        flags.push({ level: 'med', text: `RCN price $${priceUsd.toFixed(0)}/MT is at the upper end of 2025/26 Tanzania auction range ($${marketMin.toFixed(0)}–$${marketMax.toFixed(0)}/MT). High procurement cost increases margin fragility.` })
      } else {
        flags.push({ level: 'low', text: `RCN price $${priceUsd.toFixed(0)}/MT sits within the 2025/26 Tanzania auction range ($${marketMin.toFixed(0)}–$${marketMax.toFixed(0)}/MT). Source: TCB.` })
      }
    }
  }
  if (flags.length === 0) flags.push({ level: 'low', text: `No structural weaknesses detected in the entered cost structure. Margin holds under moderate stress.` })

  const flagColor: any = { high: '#dc2626', med: '#d97706', low: '#16a34a' }
  const flagBg: any = { high: '#fef2f2', med: '#fffbeb', low: '#f0fdf4' }
  const flagBorder: any = { high: '#fecaca', med: '#fde68a', low: '#bbf7d0' }

  // Outturn stress scenarios for Processor role
  const isProcessor = role === 'Processor' && effectiveWfkCost !== undefined
  const processingCost = 180
  const outturns = [
    { label: '46 kg / 100 kg (assumed)', outturn: 0.46, note: 'Your entered assumption' },
    { label: '44 kg / 100 kg (-2 lb drop)', outturn: 0.44, note: 'Common seasonal variance' },
    { label: '42 kg / 100 kg (-4 lb drop)', outturn: 0.42, note: 'Poor quality lot' },
    { label: '40 kg / 100 kg (-6 lb drop)', outturn: 0.40, note: 'Rejection-level quality' },
  ]

  async function generateAiInsight() {
    setAiLoading(true)
    setAiInsight('')
    try {
      const flagTexts = flags.map(f => f.text).join(' ')
      const outurnNote = isProcessor ? `This is a Processor deal. At 46% outturn the effective WFK cost is $${effectiveWfkCost?.toFixed(0)}/MT. If outturn drops to 44%, cost rises to $${((priceUsd + processingCost) / 0.44).toFixed(0)}/MT.` : ''
      const prompt = `You are the lead cashew commodity trade risk analyst at a global institutional intelligence desk. You have deep knowledge of the ENTIRE global cashew supply chain.

GLOBAL ORIGIN INTELLIGENCE (reference when origin is known):
- Ivory Coast: largest producer 800K-900K MT RCN/yr, peak season Mar-Jun, competitive pricing vs Tanzania
- Tanzania: TCB auction system, 2025/26 range $2310-$3520/MT RCN, 4% export levy + cess fees, Mtwara/Dar es Salaam ports
- India: Kerala/Goa processing hub, imports 600K+ MT RCN/yr, 30-45 day buyer payment
- Vietnam: largest kernel exporter 300K+ MT kernels/yr, tight moisture specs, 14-30 day payment
- Benin/Ghana/Nigeria/Guinea-Bissau/Senegal/Mozambique: West Africa origins, lower price floor than Tanzania
- Brazil: Ceara state, premium quality, higher price floor than Africa
- Cambodia/Indonesia: emerging origins, lower processing standards

GRADE & OUTTURN INTELLIGENCE:
- W180: 38-40 lb per 80 lbs RCN — premium, tight supply, highest price
- W240: 41-43 lb — most traded grade globally
- W320: 44-46 lb — highest volume, benchmark grade
- W450: 46-48 lb — lower value
- SWP/LWP/Pieces: 50-55 lb effective — price sensitive
- Processing cost: $150-200/MT RCam/India; $180-250/MT in East Africa
- Moisture above 9%: rejection risk; EU aflatoxin limit 4 ug/kg

FREIGHT INTELLIGENCE:
- Dar es Salaam/Mtwara to Rotterdam: $85-120/MT Q1 peak, $65-90/MT Q3
- Abidjan to Rotterdam: $55-75/MT
- Nhava Sheva to Rotterdam: $45-65/MT
- Ho Chi Minh to Rotterdam: $50-70/MT
- Q4 container shortage: typically 15-25% surcharge
- Demurrage: $150-200/day per container

BUYER MARKET INTELLIGENCE:
- EU/Rotterdam: highest price, strictest specs, 60-90 day payment
- India importers: 30-45 day payment, volume buyers, price sensitive
- Vietnam processors: 14-30 day payment, tight moisture specs
- Middle East/Dubai: 30-60 day payment, growth market
- USA: premium for organic/fair trade certified

FINANCING: typical trade finance 8-12% annualized; 45-90 day cycle = 1-3% cost on capital

Respond in EXACTLY this structure:

VERDICT: [VIABLE | MARGIN RISK | CRITICAL RISK | DEAL FAILURE]

RISK SUMMARY: [One sentence. The single most dangerous variable with exact numbers. Reference global benchmarks.]

ANALYSIS: [2-3 sentences. Sentence 1: what numbers reveal about this deal vs global market. Sentence 2: specific mechanism destroying margin. Sentence 3 if needed: what comparable origin/grade/route combinations show in practice.]

ACTION: [One direct executable instruction with specific threshold. Never use the word consider.]

Deal parameters:
- Selling price: $${priceUsd}/MT
- Gross margin: ${grossMargin.toFixed(1)}%
- Freight: $${freight}/MT (${freightPct.toFixed(0)}% of total landed cost)
- Price cushion above breakeven: ${priceCushionPct.toFixed(1)}%
- Tanzania origin: ${isTanzania}
- Trader role: ${role || 'Exporter'}
${outurnNote}
- Structural risk flags: ${flagTexts}

Rules: Zero generic statements. Every claim must reference a specific number. No markdown headers. No bullet points. If Tanzania origin, cross-reference TCB auction data. If freight exceeds 20% of costs, flag seasonal exposure with specific quarter. If margin cushion below 8%, name exact dollar amount at risk per MT.`

      const response = await fetch('/api/anthropic-analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const data = await response.json()
      const text = data.content?.[0]?.text || ''
      setAiInsight(text)
    } catch (_) {
      setAiInsight('Analysis unavailable. Review the risk flags above manually.')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ background: '#0f172a', borderRadius: 14, padding: '20px 22px', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: 1, marginBottom: 8 }}>MARGIN SURVIVAL</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', lineHeight: 1.45 }}>
          {priceCushionPct > 0
            ? <>This deal survives a price drop down to <span style={{ color: '#4ade80' }}>${priceFloor.toFixed(0)}/MT</span>. Below that, you lose money.</>
            : <>This deal is already below breakeven — it loses money at the entered price.</>}
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>Cushion: {priceCushionPct.toFixed(1)}% above total cost</div>
      </div>

      <div style={{ ckground: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 14 }}>STRESS TEST</div>
        {scenarios.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{s.label}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.detail}</div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: marginColor(s.margin), minWidth: 70, textAlign: 'right' }}>
              {s.margin.toFixed(1)}%
              {s.margin < 0 && <div style={{ fontSize: 10, fontWeight: 600 }}>LOSS</div>}
            </div>
          </div>
        ))}
        <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 12 }}>Stress-tested against the cost structure you entered. Each row shows resulting margin under that single shock.</div>
      </div>

      {isProcessor && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 4 }}>OUTTURN STRESS — PROCESSOR</div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>Effective white kernel cost rises sharply as outturn drops. This is the biggest single margin killer in cashew processing.</div>
          {outturns.map(o => {
            const effectiveCost = (priceUsd + processingCost) / o.outturn
            const isBase = o.outturn === 0.46
            return (
              <div key={o.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f8fafc', background: isBase ? '#f0fdf4' : 'transparent', borderdius: isBase ? 8 : 0, paddingLeft: isBase ? 8 : 0 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: isBase ? 700 : 600, color: '#0f172a' }}>{o.label}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{o.note}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: effectiveCost > priceUsd * 1.3 ? '#dc2626' : effectiveCost > priceUsd * 1.15 ? '#d97706' : '#16a34a' }}>
                    ${effectiveCost.toFixed(0)}/MT
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>WFK cost</div>
                </div>
              </div>
            )
          })}
          <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 12 }}>WFK = white kernel cost per MT after processing. Lower outturn = higher cost per unit produced.</div>
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 14 }}>RISK FLAGS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {flags.map((f, i) => (
            <div key={i} style={{ background: flagBg[f.level], border: `1px solid ${flagBorder[f.level]}`, borderRadius: 9, padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ color: flagColor[f.level], fontWeight: 800, fontSize: 13, lineHeight: 1.4 }}>{f.level === 'high' ? '!' : f.level === 'med' ? '•' : '✓'}</span>
              <span style={{ fontSize: 13, color: '#334155', lineHeight: 1.45 }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 14 }}>TRADE INTELLIGENCE</div>
        {!aiInsight && !aiLoading && (
          <button
            onClick={generateAiInsight}
            style={{ width: '100%', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5 }}
          >
            Analyse Hidden Risk →
          </button>
        )}
        {aiLoading && (
          <div style={{ fontSize: 13, color: '#64748b', textAlign: 'center', padding: '16px 0' }}>Analysing deal structure...</div>
        )}
        {aiInsight && (
          <div>
          {(() => {
            const verdictMatch = aiInsight.match(/VERDICT:\s*(.+)/);
            const summaryMatch = aiInsight.match(/RISK SUMMARY:\s*(.+)/);
            const analysisMatch = aiInsight.match(/ANALYSIS:\s*([\s\S]+?)(?=ACTION:|$)/);
            const actionMatch = aiInsight.match(/ACTION:\s*(.+)/);
            const verdict = verdictMatch ? verdictMatch[1].trim() : '';
            const summary = summaryMatch ? summaryMatch[1].trim() : '';
            const analysis = analysisMatch ? analysisMatch[1].trim() : '';
            const action = actionMatch ? actionMatch[1].trim() : '';
            const verdictColor = verdict.includes('CRITICAL') || verdict.includes('FAILURE') ? '#dc2626' : verdict.includes('MARGIN') ? '#d97706' : '#16a34a';
            const verdictBg = verdict.includes('CRITICAL') || verdict.includes('FAILURE') ? '#fef2f2' : verdict.includes('MARGIN') ? '#fffbeb' : '#f0fdf4';
            const verdictBorder = verdict.includes('CRITICAL') || verdict.includes('FAILURE') ? '#fecaca' : verdict.includes('MARGIN') ? '#fde68a' : '#bbf7d0';
            return (
              <div>
                {verdict && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: verdictBg, border: `1px solid ${verdictBorder}`, borderRadius: 6, padding: '4px 10px', marginBottom: 14 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: verdictColor, display: 'inline-block' }}></span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: verdictColor, letterSpacing: 0.8 }}>{verdict}</span>
                  </div>
                )}
                {summary && (
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.8, display: 'block', marginBottom: 3 }}>RISK SUMMARY</span>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: 1.55, margin: 0 }}>{summary}</p>
                  </div>
                )}
                {analysis && (
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.8, display: 'block', marginBottom: 3 }}>ANALYSIS</span>
                    <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.65, margin: 0 }}>{analysis}</p>
                  </div>
                )}
                {action && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', marginTop: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.8, display: 'block', marginBottom: 3 }}>RECOMMENDED ACTION</span>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: 1.5, margin: 0 }}>{action}</p>
                  </div>
                )}
                {!verdict && !summary && !analysis && !action && (
                  <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.65, margin: 0 }}>{aiInsight}</p>
                )}
              </div>
            );
          })()}
        </div>
        )}
        {aiInsight && (
          <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 12 }}>AI analysis based on the cost structure and risk flags above. Verify all assumptions before committing capital.</div>
        )}
      </div>
    </div>
  )
}
