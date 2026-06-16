import { useEffect, useState } from 'react'

export default function SignalOS() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updated, setUpdated] = useState('')

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/signals')
      const d = await r.json()
      setData(d)
      setUpdated(new Date().toLocaleTimeString())
    } catch(e) {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const s = data?.summary || {}
  const signals = data?.signals || []
  const grades = data?.top_grades || []
  const routes = data?.top_routes || []
  const roles = data?.top_roles || []
  const waitlist = data?.waitlist || []
  const PC: any = { HIGH: '#dc2626', MEDIUM: '#d97706', LOW: '#2563eb' }
  const PB: any = { HIGH: '#fef2f2', MEDIUM: '#fffbeb', LOW: '#eff6ff' }

  return (
    <div style={{ fontFamily: 'Inter,sans-serif', background: '#F7F8FA', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#16a34a', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, letterSpacing: 2 }}>SIGNALOS LIVE</span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', margin: 0 }}>Operational Intelligence</h1>
            <p style={{ fontSize: 14, color: '#64748b', margin: '4px 0 0' }}>AgriSMES · LenDigital Solutions {updated && ('· ' + updated)}</p>
          </div>
          <button onClk={load} style={{ padding: '8px 18px', background: '#0f2318', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }}>
          {[
            ['Total analyses', s.total || 0, '#0f2318'],
            ['Pro requests', s.pro_requests || 0, '#16a34a'],
            ['Avg margin', (s.avg_margin || 0) + '%', '#2563eb'],
            ['Proceed rate', (s.proceed_rate || 0) + '%', '#d97706'],
          ].map(([label, value, color]: any) => (
            <div key={label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 18px' }}>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 6px' }}>{label}</p>
              <p style={{ fontSize: 26, fontWeight: 700, color, margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>

        {signals.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: '#64748b', letterSpacing: 2, margin: '0 0 12px' }}>PRIORITY SIGNALS</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {signals.map((sig: any, i: number) => (
                <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, borderLeft: '4px solid ' + (PC[sig.priority] || '#94a3b8') }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{sig.title}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: PB[sig.priority] || '#f1f5f9', color: PC[sig.priority] || '#64748b' }}>{sig.priority}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{sig.detail}</p>
                  </div>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{sig.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '18px 20px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#64748b', letterSpacing: 2, margin: '0 0 14px' }}>TOP GRADES</h3>
            {grades.length === 0 ? <p style={{ color: '#94a3b8', fontSize: 13 }}>No data yet</p> : grades.map((g: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < grades.length-1 ? '1px solid #f1f5f9' : 'none' }}>
                <span style={{ fontSize: 14, color: '#0f172a', fontWeight: 500 }}>{g[0]}</span>
                <span style={{ fontSize: 13, color: '#64748b' }}>{g[1]}</span>
              </div>
            ))}
          </div>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '18px 20px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#64748b', letterSpacing: 2, margin: '0 0 14px' }}>TOP ROUTES</h3>
            {routes.length === 0 ? <p style={{ color: '#94a3b8', fontSize: 13 }}>No data yet</p> : routes.map((r: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < routes.length-1 ? '1px solid #f1f5f9' : 'none' }}>
                <span style={{ fontSize: 13, color: '#0f172a' }}>{r[0]}</span>
                <span style={{ fontSize: 13, color: '#64748b' }}>{r[1]}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '18px 20px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#64748b', letterSpacing: 2, margin: '0 0 14px' }}>USER ROLES</h3>
            {roles.length === 0 ? <p style={{ color: '#94a3b8', fontSize: 13 }}>No data yet</p> : roles.map((r: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < roles.length-1 ? '1px solid #f1f5f9' : 'none' }}>
                <span style={{ fontSize: 14, color: '#0f172a' }}>{r[0]}</span>
                <span style={{ fontSize: 13, color: '#64748b' }}>{r[1]}</span>
              </div>
            ))}
          </div>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '18px 20px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#64748b', letterSpacing: 2, margin: '0 0 14px' }}>PRO WAITLIST</h3>
            {waitlist.length === 0 ? <p style={{ color: '#94a3b8', fontSize: 13 }}>No requests yet</p> : waitlist.map((w: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < waitlist.length-1 ? '1px solid #f1f5f9' : 'none' }}>
                <span style={{ fontSize: 13, color: '#0f172a' }}>{w.email}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{w.role}</span>
              </div>
            ))}
          </div>
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, color: '#cbd5e1', marginTop: 32 }}>SignalOS · LenDigital Solutions</p>
      </div>
      <style>{'@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}'}</style>
    </div>
  )
}
