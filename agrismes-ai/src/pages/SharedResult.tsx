import { useEffect, useState } from 'react'

export default function SharedResult({ shareId }: { shareId: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { supabase } = await import('../lib/supabase')
        const { data, error } = await supabase
          .from('agrismes_calculations')
          .select('*')
          .eq('share_id', shareId)
          .single()
        if (error) throw error
        setData(data)
      } catch (_) {
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [shareId])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui' }}>
      Loading analysis...
    </div>
  )

  if (!data) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui', gap: 16 }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>Result not found</div>
      <div style={{ color: '#64748b' }}>This shared analysis may have expired or been deleted.</div>
      <a href="/" style={{ color: '#1B4332', fontWeight: 600 }}>Run your own analysis</a>
    </div>
  )

  const isGood = data.decision_signal === 'PROCEED'
  const isMid = data.decision_signal === 'CAUTION'
  const bg = isGood ? '#f0fdf4' : isMid ? '#fffbeb' : '#fef2f2'

  return (
    <div style={{ fontFamily: 'system-ui', maxWidth: 640, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 3, color: '#1B4332', textTransform: 'uppercase', marginBottom: 4 }}>AgriSMES</div>
        <div style={{ fontSize: 12, color: '#94a3b8', letterSpacing: 2, textTransform: 'uppercase' }}>Shared Trade Analysis</div>
      </div>

      <div style={{ background: bg, borderRadius: 14, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
          {data.decision_signal} — {data.grade} {data.role}
        </div>
        <div style={{ fontSize: 13, color: '#64748b' }}>{data.commodity} | {Math.round(data.gross_margin_pct)}% margin</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Price', value: `$${data.price_per_mt}/MT` },
          { label: 'Net Yield/MT', value: `$${Math.round(data.net_yield_per_mt)}` },
          { label: 'Gross Margin', value: `${Math.round(data.gross_margin_pct)}%` },
          { label: 'Breakeven', value: `$${Math.round(data.breakeven_price_per_mt)}/MT` },
        ].map((item) => (
          <div key={item.label} style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marnBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center' }}>
        <a href="/" style={{ display: 'inline-block', background: '#1B4332', color: '#fff', padding: '12px 28px', borderRadius: 10, fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>
          Run your own analysis →
        </a>
      </div>
    </div>
  )
}
