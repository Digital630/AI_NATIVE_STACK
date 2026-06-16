import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase'

interface Calculation {
  id: string
  share_id: string
  role: string
  commodity: string
  grade: string
  quantity_mt: number
  price_per_mt: number
  gross_margin_pct: number
  net_yield_per_mt: number
  decision_signal: string
  calculated_at: string
  incoterm: string
  origin_port: string
  destination_port: string
}

export default function History({ session, onBack }: { session: Session | null, onBack: () => void }) {
  const [calculations, setCalculations] = useState<Calculation[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    loadHistory()
  }, [session])

  async function loadHistory() {
    const { data, error } = await supabase
      .from('agrismes_calculations')
      .select('*')
      .eq('user_id', session.user.id)
      .order('calculated_at', { ascending: false })
      .limit(50)
    if (!error && data) setCalculations(data)
    setLoading(false)
  }

  async function deleteCalc(id: string) {
    await supabase.from('agrismes_calculations').delete().eq('id', id)
    setCalculations(prev => prev.filter(c => c.id !== id))
  }

  function copyShareLink(shareId: string, id: string) {
    const url = window.location.origin + '/share/' + shareId
    navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  function verdictColor(decision: string) {
    if (decision === 'PROCEED' || decision === 'SELL NOW') return '#16a34a'
    if (decision === 'CAUTION' || decision === 'NEGOTIATE') return '#d97706'
    return '#dc2626'
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  if (!session) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        Sign in to view your calculation history.
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack} style={{
          background: 'none', border: '1px solid #e2e8f0', borderRadius: 8,
          padding: '6px 12px', fontSize: 13, cursor: 'pointer', color: '#64748b'
        }}>
          Back
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Calculation History
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '2px 0 0' }}>
            {calculations.length} saved analyses
          </p>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading...</div>
      )}

      {!loading && calculations.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
          <p>No calculations yet. Run your first trade analysis.</p>
        </div>
      )}

      {!loading && calculations.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {calculations.map(calc => (
            <div key={calc.id} style={{
              background: '#fff', border: '1px solid #e2e8f0',
              borderRadius: 14, padding: '16px 18px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
                    {calc.grade || calc.commodity || 'Trade Analysis'} — {calc.role}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    {formatDate(calc.calculated_at)}
                  </div>
                </div>
                <div style={{
                  background: verdictColor(calc.decision_signal) + '22',
                  color: verdictColor(calc.decision_signal),
                  borderRadius: 20, padding: '4px 10px',
                  fontSize: 11, fontWeight: 700
                }}>
                  {calc.decision_signal}
                </div>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8, marginBottom: 12
              }}>
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>Quantity</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{calc.quantity_mt} MT</div>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>Price</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>${Number(calc.price_per_mt).toFixed(0)}/MT</div>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>Gross Margin</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{Number(calc.gross_margin_pct).toFixed(1)}%</div>
                </div>
              </div>

              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                {calc.incoterm} · {calc.origin_port} to {calc.destination_port}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => copyShareLink(calc.share_id, calc.id)}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8,
                    border: '1px solid #e2e8f0', background: '#fff',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    color: copied === calc.id ? '#16a34a' : '#475569'
                  }}>
                  {copied === calc.id ? 'Link Copied' : 'Share Result'}
                </button>
                <button
                  onClick={() => deleteCalc(calc.id)}
                  style={{
                    padding: '8px 12px', borderRadius: 8,
                    border: '1px solid #fecaca', background: '#fff',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#dc2626'
                  }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
