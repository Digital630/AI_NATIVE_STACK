import { useState, useEffect } from 'react'

const SB_URL = import.meta.env.VITE_SUPABASE_URL as string
const ANON   = import.meta.env.VITE_SUPABASE_ANON_KEY as string

const GRADES = ['W180','W240','W320','W450','SWP','LWP','Pieces','RCN']
const COUNTRIES = ['Tanzania','Ivory Coast','Benin','Vietnam','India','Mozambique','Guinea-Bissau','Brazil']

interface Alert { id:string; grade:string; alert_type:string; threshold_usd_mt:number; is_active:boolean; trigger_count:number; last_triggered_at:string|null }

export default function PriceAlerts({ session, onUpgradeRequest }: { session:any; onUpgradeRequest?:()=>void }) {
  const [alerts, setAlerts]   = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding]   = useState(false)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const [grade, setGrade]       = useState('W320')
  const [origin, setOrigin]     = useState('')
  const [alertType, setAlertType] = useState<'below'|'above'>('below')
  const [threshold, setThreshold] = useState('')
  const [email, setEmail]       = useState(session?.user?.email || '')

  useEffect(() => { if (session) fetchAlerts() }, [session])

  const fetchAlerts = async () => {
    setLoading(true)
    const r = await fetch(`${SB_URL}/rest/v1/price_alerts?select=*&order=created_at.desc`, {
      headers: { 'Authorization': `Bearer ${session.access_token}`, 'apikey': ANON }
    })
    if (r.ok) setAlerts(await r.json())
    setLoading(false)
  }

  const saveAlert = async () => {
    if (!threshold || !email) { setError('Enter threshold and email'); return }
    setError(''); setSaving(true)
    const r = await fetch(`${SB_URL}/rest/v1/price_alerts`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session.access_token}`, 'apikey': ANON, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify({ grade, origin_country: origin || null, alert_type: alertType, threshold_usd_mt: parseFloat(threshold), email, is_active: true })
    })
    if (r.ok) {
      const data = await r.json()
      setAlerts(prev => [data[0], ...prev])
      setAdding(false); setThreshold('')
    } else {
      setError('Failed to save alert. Please try again.')
    }
    setSaving(false)
  }

  const toggleAlert = async (id: string, current: boolean) => {
    await fetch(`${SB_URL}/rest/v1/price_alerts?id=eq.${id}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${session.access_token}`, 'apikey': ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current })
    })
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_active: !current } : a))
  }

  const deleteAlert = async (id: string) => {
    await fetch(`${SB_URL}/rest/v1/price_alerts?id=eq.${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${session.access_token}`, 'apikey': ANON }
    })
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  const sel: React.CSSProperties = { border:'1px solid #CBD5E1', borderRadius:6, padding:'8px 10px', fontSize:13, color:'#0F172A', background:'#FAFAFA', outline:'none', width:'100%' }

  if (!session) return (
    <div style={{ textAlign:'center', padding:'40px 20px' }}>
      <p style={{ color:'#475569', fontSize:15, margin:'0 0 12px' }}>Sign in to set price alerts.</p>
    </div>
  )

  return (
    <div style={{ maxWidth:720, margin:'0 auto', padding:'0 16px 48px', fontFamily:'Inter,sans-serif' }}>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', margin:'32px 0 20px' }}>
        <div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:700, color:'#0F172A' }}>Price Alerts</h2>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#64748B' }}>Get notified when cashew prices hit your threshold.</p>
        </div>
        <button onClick={() => setAdding(true)} style={{
          background:'#1B4332', color:'#fff', border:'none',
          borderRadius:8, padding:'8px 16px', fontSize:13, fontWeight:600, cursor:'pointer'
        }}>+ New alert</button>
      </div>

      {/* Add alert form */}
      {adding && (
        <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, padding:'18px', marginBottom:16 }}>
          <p style={{ margin:'0 0 14px', fontSize:14, fontWeight:600, color:'#0F172A' }}>Create price alert</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            <div>
              <label style={{ fontSize:11, color:'#64748B', display:'block', marginBottom:4 }}>Grade</label>
              <select value={grade} onChange={e => setGrade(e.target.value)} style={sel}>
                {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, color:'#64748B', display:'block', marginBottom:4 }}>Origin country (optional)</label>
              <select value={origin} onChange={e => setOrigin(e.target.value)} style={sel}>
                <option value="">Any origin</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, color:'#64748B', display:'block', marginBottom:4 }}>Alert type</label>
              <select value={alertType} onChange={e => setAlertType(e.target.value as any)} style={sel}>
                <option value="below">Price drops below</option>
                <option value="above">Price rises above</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, color:'#64748B', display:'block', marginBottom:4 }}>Threshold $/MT</label>
              <input type="number" placeholder="e.g. 6500" value={threshold}
                onChange={e => setThreshold(e.target.value)} style={sel} />
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ fontSize:11, color:'#64748B', display:'block', marginBottom:4 }}>Notify email</label>
              <input type="email" placeholder="your@email.com" value={email}
                onChange={e => setEmail(e.target.value)} style={sel} />
            </div>
          </div>
          {error && <p style={{ fontSize:12, color:'#DC2626', margin:'0 0 8px' }}>{error}</p>}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => { setAdding(false); setError('') }} style={{ flex:1, background:'#F1F5F9', border:'none', borderRadius:7, padding:'9px', fontSize:13, cursor:'pointer', color:'#475569' }}>Cancel</button>
            <button onClick={saveAlert} disabled={saving} style={{ flex:2, background:'#1B4332', border:'none', borderRadius:7, padding:'9px', fontSize:13, fontWeight:600, color:'#fff', cursor:'pointer' }}>
              {saving ? 'Saving...' : 'Create alert →'}
            </button>
          </div>
        </div>
      )}

      {loading && <p style={{ textAlign:'center', color:'#94A3B8', padding:32 }}>Loading alerts...</p>}

      {!loading && alerts.length === 0 && !adding && (
        <div style={{ background:'#F8FAFC', border:'1px dashed #CBD5E1', borderRadius:12, padding:'40px 24px', textAlign:'center' }}>
          <p style={{ fontSize:15, color:'#64748B', margin:'0 0 6px' }}>No price alerts yet</p>
          <p style={{ fontSize:13, color:'#94A3B8', margin:0 }}>Set a threshold and get notified when cashew prices hit it.</p>
        </div>
      )}

      {alerts.map(alert => (
        <div key={alert.id} style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:10, padding:'14px 16px', marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <span style={{ fontWeight:700, fontSize:14, color:'#0F172A' }}>{alert.grade}</span>
              <span style={{ fontSize:12, color:'#64748B' }}>
                {alert.alert_type === 'below' ? '↓ below' : '↑ above'} ${alert.threshold_usd_mt}/MT
              </span>
              {!alert.is_active && <span style={{ fontSize:11, color:'#94A3B8', background:'#F1F5F9', padding:'1px 8px', borderRadius:99 }}>Paused</span>}
            </div>
            <p style={{ margin:0, fontSize:12, color:'#94A3B8' }}>
              Triggered {alert.trigger_count || 0} time{alert.trigger_count !== 1 ? 's' : ''}
              {alert.last_triggered_at ? ` · Last: ${new Date(alert.last_triggered_at).toLocaleDateString()}` : ''}
            </p>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <button onClick={() => toggleAlert(alert.id, alert.is_active)} style={{
              padding:'5px 12px', borderRadius:6, border:'1px solid #E2E8F0',
              fontSize:12, cursor:'pointer', background:'#fff', color:'#475569'
            }}>{alert.is_active ? 'Pause' : 'Resume'}</button>
            <button onClick={() => deleteAlert(alert.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#CBD5E1', fontSize:16 }}>✕</button>
          </div>
        </div>
      ))}
    </div>
  )
}
