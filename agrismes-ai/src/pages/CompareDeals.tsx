import { useState, useEffect } from 'react'

const SB_URL = 'https://pttcugqwslvdstmrbyhu.supabase.co'
const ANON   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0dGN1Z3F3c2x2ZHN0bXJieWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwOTg2NTgsImV4cCI6MjA5MjY3NDY1OH0.aMk9ZIzC9wQ1fWEK2itSlQ3qoQaOQJUTm7TDSwvbpaY'

interface Calc {
  id: string
  grade: string
  quantity_mt: number
  price_per_mt: number
  incoterm: string
  origin_port: string
  destination: string
  gross_margin_pct: number
  net_yield_per_mt: number
  net_yield_total: number
  total_costs_per_mt: number
  freight_per_mt: number
  import_duty_per_mt: number
  breakeven_price_per_mt: number
  decision_signal: string
  vs_benchmark_pct: number
  created_at: string
  role: string
}

interface Props { session: any; onUpgradeRequest?: () => void }

const signalColor = (d: string) =>
  d?.includes('PROCEED') ? '#15803D' : d?.includes('CAUTION') ? '#92400E' : '#991B1B'

const signalBg = (d: string) =>
  d?.includes('PROCEED') ? '#F0FDF4' : d?.includes('CAUTION') ? '#FFFBEB' : '#FEF2F2'

const fmt = (n: number, dec = 1) => n?.toFixed(dec) ?? '—'
const fmtUsd = (n: number) => n ? `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—'

export default function CompareDeals({ session, onUpgradeRequest }: Props) {
  const [calcs, setCalcs]     = useState<Calc[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string[]>([])
  const [comparing, setComparing] = useState(false)

  useEffect(() => {
    if (!session?.access_token) { setLoading(false); return }
    fetchCalcs()
  }, [session])

  const fetchCalcs = async () => {
    setLoading(true)
    const r = await fetch(
      `${SB_URL}/rest/v1/agrismes_calculations?select=id,grade,quantity_mt,price_per_mt,incoterm,origin_port,destination,gross_margin_pct,net_yield_per_mt,net_yield_total,total_costs_per_mt,freight_per_mt,import_duty_per_mt,breakeven_price_per_mt,decision_signal,vs_benchmark_pct,created_at,role&order=created_at.desc&limit=20`,
      { headers: { 'Authorization': `Bearer ${session.access_token}`, 'apikey': ANON } }
    )
    if (r.ok) setCalcs(await r.json())
    setLoading(false)
  }

  const toggleSelect = (id: string) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 2 ? [...prev, id] : [prev[1], id]
    )
  }

  const tradeA = calcs.find(c => c.id === selected[0])
  const tradeB = calcs.find(c => c.id === selected[1])

  const better = (a: number, b: number, higherIsBetter = true) => {
    if (!a || !b) return null
    return higherIsBetter ? (a > b ? 'A' : 'B') : (a < b ? 'A' : 'B')
  }

  const winnerStyle = (isWinner: boolean): React.CSSProperties => ({
    background: isWinner ? '#F0FDF4' : 'transparent',
    borderRadius: 6, padding: '2px 6px',
    fontWeight: isWinner ? 700 : 400,
    color: isWinner ? '#14532D' : '#475569'
  })

  if (!session) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', fontFamily: 'Inter,sans-serif' }}>
      <p style={{ color: '#475569', fontSize: 15 }}>Sign in to compare your trade analyses.</p>
    </div>
  )

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 16px 60px', fontFamily: 'Inter,sans-serif' }}>

      {/* Header */}
      <div style={{ margin: '32px 0 24px' }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#0F172A' }}>Compare Deals</h2>
        <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>
          Select any two analyses to compare margin, costs, and risk side by side.
        </p>
      </div>

      {/* Pro badge */}
      <div style={{
        background: '#EAF3DE', border: '1px solid #C0DD97',
        borderRadius: 8, padding: '10px 14px', marginBottom: 20,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <p style={{ margin: 0, fontSize: 13, color: '#27500A' }}>
          ✓ Pro feature — unlimited deal comparisons from your analysis history.
        </p>
        <span style={{
          background: '#1B4332', color: '#fff',
          fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
          letterSpacing: 1
        }}>PRO</span>
      </div>

      {loading && <p style={{ textAlign: 'center', color: '#94A3B8', padding: 40 }}>Loading your analyses...</p>}

      {!loading && calcs.length === 0 && (
        <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: 12, padding: '40px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 15, color: '#64748B', margin: '0 0 6px' }}>No analyses yet</p>
          <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 16px' }}>
            Run trade analyses on the main page — they'll appear here for comparison.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            style={{ background: '#1B4332', color: '#fff', border: 'none', borderRadius: 7, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Run an analysis →
          </button>
        </div>
      )}

      {/* Trade selection list */}
      {!loading && calcs.length > 0 && !comparing && (
        <>
          <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 10px' }}>
            {selected.length === 0 && 'Select two trades to compare'}
            {selected.length === 1 && 'Now select a second trade'}
            {selected.length === 2 && '✓ Two trades selected — tap Compare'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {calcs.map(calc => {
              const isSelected = selected.includes(calc.id)
              const isFirst = selected[0] === calc.id
              const isSecond = selected[1] === calc.id
              return (
                <div
                  key={calc.id}
                  onClick={() => toggleSelect(calc.id)}
                  style={{
                    background: '#fff',
                    border: `2px solid ${isSelected ? '#1B4332' : '#E2E8F0'}`,
                    borderRadius: 10, padding: '12px 16px',
                    cursor: 'pointer', position: 'relative',
                    transition: 'border-color 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {/* Selection indicator */}
                      <div style={{
                        width: 24, height: 24, borderRadius: 12, flexShrink: 0,
                        background: isFirst ? '#1B4332' : isSecond ? '#3B6D11' : '#F1F5F9',
                        color: isSelected ? '#fff' : '#94A3B8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700
                      }}>
                        {isFirst ? 'A' : isSecond ? 'B' : '○'}
                      </div>
                      <div>
                        <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                          {calc.grade || 'Cashew'} · {calc.quantity_mt}MT · {calc.incoterm}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: '#64748B' }}>
                          {calc.origin_port || '?'} → {calc.destination || '?'} · {new Date(calc.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        background: signalBg(calc.decision_signal),
                        color: signalColor(calc.decision_signal),
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99
                      }}>
                        {calc.decision_signal?.split('—')[0]?.trim() || 'ANALYSED'}
                      </span>
                      <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                        {fmt(calc.gross_margin_pct)}%
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <button
            onClick={() => setComparing(true)}
            disabled={selected.length < 2}
            style={{
              width: '100%', background: selected.length === 2 ? '#1B4332' : '#E2E8F0',
              color: selected.length === 2 ? '#fff' : '#94A3B8',
              border: 'none', borderRadius: 8, padding: '12px',
              fontSize: 14, fontWeight: 700, cursor: selected.length === 2 ? 'pointer' : 'not-allowed'
            }}
          >
            {selected.length === 2 ? 'Compare these two trades →' : `Select ${2 - selected.length} more trade${2 - selected.length > 1 ? 's' : ''}`}
          </button>
        </>
      )}

      {/* Comparison view */}
      {comparing && tradeA && tradeB && (
        <div>
          <button
            onClick={() => setComparing(false)}
            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 13, marginBottom: 16, padding: 0 }}
          >
            ← Back to selection
          </button>

          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
            <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '12px 14px' }}>
              <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: 1 }}>METRIC</p>
            </div>
            {[{label:'A', trade:tradeA},{label:'B', trade:tradeB}].map(({label, trade}) => (
              <div key={label} style={{
                background: label === 'A' ? '#1B4332' : '#27500A',
                borderRadius: 8, padding: '12px 14px'
              }}>
                <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 700, color: '#97C459', letterSpacing: 1 }}>TRADE {label}</p>
                <p style={{ margin: 0, fontSize: 12, color: '#fff', fontWeight: 600 }}>
                  {trade.grade || 'Cashew'} · {trade.quantity_mt}MT
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#97C459' }}>
                  {trade.origin_port || '?'} → {trade.destination || '?'}
                </p>
              </div>
            ))}
          </div>

          {/* Comparison rows */}
          {[
            { label: 'Decision',        fmtA: tradeA.decision_signal?.split('—')[0]?.trim(), fmtB: tradeB.decision_signal?.split('—')[0]?.trim(), winner: null, raw: false },
            { label: 'Gross Margin',    fmtA: `${fmt(tradeA.gross_margin_pct)}%`,   fmtB: `${fmt(tradeB.gross_margin_pct)}%`,   winner: better(tradeA.gross_margin_pct, tradeB.gross_margin_pct) },
            { label: 'Net Yield/MT',    fmtA: fmtUsd(tradeA.net_yield_per_mt),       fmtB: fmtUsd(tradeB.net_yield_per_mt),       winner: better(tradeA.net_yield_per_mt, tradeB.net_yield_per_mt) },
            { label: 'Total Net Yield', fmtA: fmtUsd(tradeA.net_yield_total),         fmtB: fmtUsd(tradeB.net_yield_total),         winner: better(tradeA.net_yield_total, tradeB.net_yield_total) },
            { label: 'Price/MT',        fmtA: fmtUsd(tradeA.price_per_mt),            fmtB: fmtUsd(tradeB.price_per_mt),            winner: null },
            { label: 'Total Costs/MT',  fmtA: fmtUsd(tradeA.total_costs_per_mt),      fmtB: fmtUsd(tradeB.total_costs_per_mt),      winner: better(tradeA.total_costs_per_mt, tradeB.total_costs_per_mt, false) },
            { label: 'Freight/MT',      fmtA: fmtUsd(tradeA.freight_per_mt),          fmtB: fmtUsd(tradeB.freight_per_mt),          winner: better(tradeA.freight_per_mt, tradeB.freight_per_mt, false) },
            { label: 'Import Duty/MT',  fmtA: fmtUsd(tradeA.import_duty_per_mt),      fmtB: fmtUsd(tradeB.import_duty_per_mt),      winner: better(tradeA.import_duty_per_mt, tradeB.import_duty_per_mt, false) },
            { label: 'Breakeven/MT',    fmtA: fmtUsd(tradeA.breakeven_price_per_mt),  fmtB: fmtUsd(tradeB.breakeven_price_per_mt),  winner: better(tradeA.breakeven_price_per_mt, tradeB.breakeven_price_per_mt, false) },
            { label: 'vs Benchmark',    fmtA: tradeA.vs_benchmark_pct ? `${tradeA.vs_benchmark_pct > 0 ? '+' : ''}${fmt(tradeA.vs_benchmark_pct)}%` : '—', fmtB: tradeB.vs_benchmark_pct ? `${tradeB.vs_benchmark_pct > 0 ? '+' : ''}${fmt(tradeB.vs_benchmark_pct)}%` : '—', winner: better(tradeA.vs_benchmark_pct, tradeB.vs_benchmark_pct) },
            { label: 'Quantity',        fmtA: `${tradeA.quantity_mt}MT`,              fmtB: `${tradeB.quantity_mt}MT`,              winner: null },
            { label: 'Incoterm',        fmtA: tradeA.incoterm || '—',                 fmtB: tradeB.incoterm || '—',                 winner: null },
          ].map(({ label, fmtA, fmtB, winner }, idx) => (
            <div key={label} style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 6
            }}>
              <div style={{
                background: idx % 2 === 0 ? '#F8FAFC' : '#fff',
                border: '1px solid #F1F5F9', borderRadius: 6, padding: '10px 12px'
              }}>
                <p style={{ margin: 0, fontSize: 12, color: '#64748B', fontWeight: 500 }}>{label}</p>
              </div>
              {[{val: fmtA, side: 'A'}, {val: fmtB, side: 'B'}].map(({ val, side }) => {
                const isWinner = winner === side
                return (
                  <div key={side} style={{
                    background: idx % 2 === 0 ? '#F8FAFC' : '#fff',
                    border: `1px solid ${isWinner ? '#BBF7D0' : '#F1F5F9'}`,
                    borderRadius: 6, padding: '10px 12px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: isWinner ? 700 : 400, color: isWinner ? '#14532D' : '#0F172A' }}>
                      {val}
                    </p>
                    {isWinner && <span style={{ fontSize: 10, color: '#16A34A', fontWeight: 700 }}>BETTER</span>}
                  </div>
                )
              })}
            </div>
          ))}

          {/* Winner summary */}
          {(() => {
            const metrics = [
              better(tradeA.gross_margin_pct, tradeB.gross_margin_pct),
              better(tradeA.net_yield_per_mt, tradeB.net_yield_per_mt),
              better(tradeA.total_costs_per_mt, tradeB.total_costs_per_mt, false),
              better(tradeA.breakeven_price_per_mt, tradeB.breakeven_price_per_mt, false),
            ]
            const aWins = metrics.filter(m => m === 'A').length
            const bWins = metrics.filter(m => m === 'B').length
            const winner = aWins > bWins ? 'A' : bWins > aWins ? 'B' : null
            if (!winner) return (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '14px 16px', marginTop: 16 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#92400E' }}>These trades are closely matched across key metrics.</p>
              </div>
            )
            const winTrade = winner === 'A' ? tradeA : tradeB
            return (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '14px 16px', marginTop: 16 }}>
                <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#14532D' }}>
                  Trade {winner} wins on {Math.max(aWins, bWins)} of 4 key metrics
                </p>
                <p style={{ margin: 0, fontSize: 12, color: '#166534' }}>
                  {winTrade.grade || 'Cashew'} · {winTrade.origin_port} → {winTrade.destination} · {fmt(winTrade.gross_margin_pct)}% margin · {fmtUsd(winTrade.net_yield_per_mt)}/MT net yield
                </p>
              </div>
            )
          })()}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button
              onClick={() => { setComparing(false); setSelected([]) }}
              style={{ flex: 1, background: '#F1F5F9', border: 'none', borderRadius: 7, padding: '10px', fontSize: 13, cursor: 'pointer', color: '#475569' }}
            >
              Compare different trades
            </button>
            <button
              onClick={() => window.print()}
              style={{ flex: 1, background: '#1B4332', border: 'none', borderRadius: 7, padding: '10px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}
            >
              Export comparison →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
