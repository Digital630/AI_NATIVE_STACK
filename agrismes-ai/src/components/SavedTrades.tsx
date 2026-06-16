import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'

const SB_URL = import.meta.env.VITE_SUPABASE_URL as string
const ANON   = import.meta.env.VITE_SUPABASE_ANON_KEY as string

interface SavedTrade {
  id: string
  name: string
  grade: string
  origin_country: string
  destination_country: string
  quantity_mt: number
  price_usd_mt: number
  gross_margin_pct: number
  net_yield_per_mt: number
  decision_signal: string
  is_favourite: boolean
  created_at: string
}

interface Props {
  session: Session | null
  onLoadTrade?: (input: string) => void
  onUpgradeRequest?: () => void
}

export default function SavedTrades({ session, onLoadTrade, onUpgradeRequest }: Props) {
  const [trades, setTrades]   = useState<SavedTrade[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState<'all'|'favourite'>('all')
  const [deleting, setDeleting] = useState<string|null>(null)

  useEffect(() => {
    if (!session?.access_token) { setLoading(false); return }
    fetchTrades()
  }, [session, filter])

  const fetchTrades = async () => {
    setLoading(true)
    try {
      let url = `${SB_URL}/rest/v1/saved_trades?select=*&order=created_at.desc`
      if (filter === 'favourite') url += '&is_favourite=eq.true'

      const r = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': ANON,
        }
      })
      if (r.ok) setTrades(await r.json())
    } catch { /* silent */ }
    setLoading(false)
  }

  const toggleFavourite = async (id: string, current: boolean) => {
    await fetch(`${SB_URL}/rest/v1/saved_trades?id=eq.${id}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${session.access_token}`, 'apikey': ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_favourite: !current })
    })
    setTrades(prev => prev.map(t => t.id === id ? { ...t, is_favourite: !current } : t))
  }

  const deleteTrade = async (id: string) => {
    setDeleting(id)
    await fetch(`${SB_URL}/rest/v1/saved_trades?id=eq.${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${session.access_token}`, 'apikey': ANON }
    })
    setTrades(prev => prev.filter(t => t.id !== id))
    setDeleting(null)
  }

  const signalColor = (d: string) =>
    d?.includes('PROCEED') ? '#15803D' : d?.includes('CAUTION') ? '#92400E' : '#991B1B'

  const signalBg = (d: string) =>
    d?.includes('PROCEED') ? '#F0FDF4' : d?.includes('CAUTION') ? '#FFFBEB' : '#FEF2F2'

  if (!session) return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <p style={{ fontSize: 15, color: '#475569', margin: '0 0 16px' }}>
        Sign in to access your saved trade library.
      </p>
    </div>
  )

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 16px 48px', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '32px 0 20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0F172A' }}>Saved Trades</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
            {trades.length} trade{trades.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all','favourite'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 500,
              border: 'none', cursor: 'pointer',
              background: filter === f ? '#1B4332' : '#F1F5F9',
              color: filter === f ? '#fff' : '#475569'
            }}>
              {f === 'all' ? 'All trades' : '★ Favourites'}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontSize: 14 }}>
          Loading your trades...
        </div>
      )}

      {/* Empty state */}
      {!loading && trades.length === 0 && (
        <div style={{
          background: '#F8FAFC', border: '1px dashed #CBD5E1',
          borderRadius: 12, padding: '40px 24px', textAlign: 'center'
        }}>
          <p style={{ fontSize: 15, color: '#64748B', margin: '0 0 8px' }}>
            {filter === 'favourite' ? 'No favourites yet' : 'No saved trades yet'}
          </p>
          <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>
            Run an analysis and tap "Save trade" to build your library.
          </p>
        </div>
      )}

      {/* Trade cards */}
      {!loading && trades.map(trade => (
        <div key={trade.id} style={{
          background: '#fff', border: '1px solid #E2E8F0',
          borderRadius: 12, padding: '16px 18px',
          marginBottom: 12, position: 'relative'
        }}>
          {/* Top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{
                  background: signalBg(trade.decision_signal),
                  color: signalColor(trade.decision_signal),
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99
                }}>
                  {trade.decision_signal || 'ANALYSED'}
                </span>
                {trade.is_favourite && <span style={{ fontSize: 14 }}>★</span>}
              </div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0F172A' }}>
                {trade.name || `${trade.grade || 'Cashew'} — ${trade.origin_country || '?'} → ${trade.destination_country || '?'}`}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => toggleFavourite(trade.id, trade.is_favourite)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 16, color: trade.is_favourite ? '#F59E0B' : '#CBD5E1', padding: 4
              }}>★</button>
              <button onClick={() => deleteTrade(trade.id)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 14, color: deleting === trade.id ? '#DC2626' : '#CBD5E1', padding: 4
              }}>✕</button>
            </div>
          </div>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
            {[
              ['Margin', `${(trade.gross_margin_pct||0).toFixed(1)}%`],
              ['Net Yield', `$${(trade.net_yield_per_mt||0).toFixed(0)}/MT`],
              ['Price', `$${(trade.price_usd_mt||0).toFixed(0)}/MT`],
              ['Volume', `${trade.quantity_mt||0}MT`],
            ].map(([label, val]) => (
              <div key={label} style={{ background: '#F8FAFC', borderRadius: 6, padding: '8px 10px' }}>
                <p style={{ margin: '0 0 2px', fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>{label}</p>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{val}</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#94A3B8' }}>
              {new Date(trade.created_at).toLocaleDateString('en-GB', { day:'numeric',month:'short',year:'numeric' })}
            </span>
            {onLoadTrade && (
              <button
                onClick={() => onLoadTrade(trade.id)}
                style={{
                  background: '#1B4332', color: '#fff', border: 'none',
                  borderRadius: 6, padding: '5px 12px', fontSize: 12,
                  fontWeight: 600, cursor: 'pointer'
                }}
              >
                Reload analysis →
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Compare CTA */}
      {trades.length >= 2 && (
        <div style={{
          background: '#EAF3DE', border: '1px solid #C0DD97',
          borderRadius: 10, padding: '12px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <p style={{ margin: 0, fontSize: 13, color: '#27500A' }}>
            Compare any two trades side by side — Pro feature.
          </p>
          <button onClick={onUpgradeRequest} style={{
            background: '#1B4332', color: '#fff', border: 'none',
            borderRadius: 6, padding: '5px 14px', fontSize: 12,
            fontWeight: 600, cursor: 'pointer'
          }}>
            Upgrade →
          </button>
        </div>
      )}
    </div>
  )
}
