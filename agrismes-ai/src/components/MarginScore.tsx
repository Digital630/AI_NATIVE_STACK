interface ScoreProps {
  grossMargin: number
  vsBenchmark: number
  netYield: number
  breakevenPrice: number
  priceUsd: number
  role: string
}

export default function MarginScore({ grossMargin, vsBenchmark, netYield, breakevenPrice, priceUsd, role }: ScoreProps) {
  
  // Calculate score 1-10
  function calcScore(): number {
    let score = 5
    if (grossMargin >= 25) score += 3
    else if (grossMargin >= 20) score += 2
    else if (grossMargin >= 15) score += 1
    else if (grossMargin >= 10) score -= 1
    else if (grossMargin >= 5) score -= 2
    else score -= 3
    if (vsBenchmark > 10) score += 1
    else if (vsBenchmark < -10) score -= 1
    const priceAboveBreakeven = ((priceUsd - breakevenPrice) / breakevenPrice) * 100
    if (priceAboveBreakeven > 20) score += 1
    else if (priceAboveBreakeven < 5) score -= 1
    return Math.max(1, Math.min(10, score))
  }

  const score = calcScore()

  const verdict = score >= 8 ? 'STRONG DEAL' : score >= 5 ? 'PROCEED WITH CAUTION' : 'WALK AWAY'
  const verdictColor = score >= 8 ? '#16a34a' : score >= 5 ? '#d97706' : '#dc2626'
  const verdictBg = score >= 8 ? '#f0fdf4' : score >= 5 ? '#fffbeb' : '#fef2f2'
  const verdictBorder = score >= 8 ? '#bbf7d0' : score >= 5 ? '#fde68a' : '#fecaca'

  const reason = score >= 8
    ? `Margin of ${grossMargin.toFixed(1)}% is strong. Price sits ${((priceUsd - breakevenPrice) / breakevenPrice * 100).toFixed(1)}% above breakeven.`
    : score >= 5
    ? `Margin of ${grossMargin.toFixed(1)}% is acceptable but thin. Monitor costs carefully before committing.`
    : `Margin of ${grossMargin.toFixed(1)}% is below safe threshold. This deal carries significant risk.`

  // Benchmark data by grade estimate
  const marketAvg = 18
  const topPerformer = 26
  const yourMargin = grossMargin

  const maxBar = Math.max(topPerformer, yourMargin) + 5

  return (
    <div style={{ marginBottom: 20 }}>

      {/* Margin Score Card */}
      <div style={{
        background: verdictBg, border: `1.5px solid ${verdictBorder}`,
        borderRadius: 14, padding: '20px 20px', marginBottom: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 4 }}>
              MARGIN SCORE
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 48, fontWeight: 800, color: verdictColor, lineHeight: 1 }}>
                {score}
              </span>
              <span style={{ fontSize: 18, color: '#94a3b8', fontWeight: 500 }}>/10</span>
            </div>
          </div>
          <div style={{
            background: verdictColor, color: '#fff',
            borderRadius: 10, padding: '8px 16px',
            fontSize: 13, fontWeight: 800, letterSpacing: 0.5,
            textAlign: 'center'
          }}>
            {verdict}
          </div>
        </div>

        {/* Score bar */}
        <div style={{ background: 'rgba(0,0,0,0.08)', borderRadius: 99, height: 8, marginBottom: 10 }}>
          <div style={{
            width: `${score * 10}%`, height: '100%',
            background: verdictColor, borderRadius: 99,
            transition: 'width 1s ease'
          }} />
        </div>

        <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.5 }}>
          {reason}
        </p>
      </div>

      {/* Benchmark Intelligence */}
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0',
        borderRadius: 14, padding: '18px 20px'
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 14 }}>
          BENCHMARK INTELLIGENCE
        </div>

        {[
          { label: 'Your Deal', value: yourMargin, color: verdictColor, bold: true },
          { label: 'Market Average', value: marketAvg, color: '#64748b', bold: false },
          { label: 'Top Performer', value: topPerformer, color: '#16a34a', bold: false },
        ].map(item => (
          <div key={item.label} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: item.bold ? '#0f172a' : '#64748b', fontWeight: item.bold ? 700 : 500 }}>
                {item.label}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>
                {item.value.toFixed(1)}%
              </span>
            </div>
            <div style={{ background: '#f1f5f9', borderRadius: 99, height: 6 }}>
              <div style={{
                width: `${(item.value / maxBar) * 100}%`,
                height: '100%', background: item.color,
                borderRadius: 99, transition: 'width 1s ease 0.3s'
              }} />
            </div>
          </div>
        ))}

        <div style={{
          marginTop: 14, paddingTop: 12, borderTop: '1px solid #f1f5f9',
          fontSize: 12, color: '#94a3b8'
        }}>
          {yourMargin > marketAvg
            ? `Your margin is ${(yourMargin - marketAvg).toFixed(1)}% above market average — competitive position.`
            : `Your margin is ${(marketAvg - yourMargin).toFixed(1)}% below market average — review cost structure.`
          }
          {' '}Benchmarks based on cashew kernel export estimates (W180–W320).
        </div>
      </div>

    </div>
  )
}
