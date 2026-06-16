import { useState } from 'react'

const SUPABASE_URL = 'https://pttcugqwslvdstmrbyhu.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0dGN1Z3F3c2x2ZHN0bXJieWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwOTg2NTgsImV4cCI6MjA5MjY3NDY1OH0.aMk9ZIzC9wQ1fWEK2itSlQ3qoQaOQJUTm7TDSwvbpaY'

const ROLES = ['Exporter','Importer','Processor','Broker/Trader','Financier','Farmer','Other']

export default function LeadCapture({ analysisQuery }: { analysisQuery?: string }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!email || !email.includes('@')) { setError('Enter a valid email'); return }
    if (!role) { setError('Select your role'); return }
    setError('')
    setLoading(true)
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/agrismes_leads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          role,
          source: 'website',
          source_page: 'trade-margin-calculator',
          first_analysis_query: analysisQuery || null,
          is_subscribed: true
        })
      })
      if (r.ok || r.status === 201) {
        setDone(true)
      } else {
        const b = await r.json().catch(() => ({}))
        // Duplicate email — still show success
        if (b.code === '23505') { setDone(true); return }
        setError('Something went wrong. Please try again.')
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <div style={{
      background: '#F0FDF4', border: '1px solid #BBF7D0',
      borderRadius: 10, padding: '16px 20px', marginTop: 20,
      display: 'flex', alignItems: 'center', gap: 10
    }}>
      <span style={{ fontSize: 20 }}>✓</span>
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#14532D' }}>You're on the list</p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#166534' }}>
          We'll notify you when the AgriSMES Margin Brief launches and when Pro features go live.
        </p>
      </div>
    </div>
  )

  return (
    <div style={{
      background: '#F8FAFC', border: '1px solid #E2E8F0',
      borderRadius: 12, padding: '20px', marginTop: 24
    }}>
      <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
        Get the AgriSMES Margin Brief
      </p>
      <p style={{ margin: '0 0 14px', fontSize: 12, color: '#64748B' }}>
        Monthly cashew margin intelligence. TCB auction data. Freight alerts. No spam.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          style={{
            border: '1px solid #CBD5E1', borderRadius: 7,
            padding: '9px 12px', fontSize: 13, color: '#0F172A',
            outline: 'none', background: '#fff', width: '100%'
          }}
        />
        <select
          value={role}
          onChange={e => setRole(e.target.value)}
          style={{
            border: '1px solid #CBD5E1', borderRadius: 7,
            padding: '9px 12px', fontSize: 13, color: role ? '#0F172A' : '#94A3B8',
            background: '#fff', outline: 'none', width: '100%'
          }}
        >
          <option value="">Your role in cashew trade</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        {error && <p style={{ margin: 0, fontSize: 12, color: '#DC2626' }}>{error}</p>}

        <button
          onClick={submit}
          disabled={loading}
          style={{
            background: loading ? '#94A3B8' : '#1B4332',
            color: '#fff', border: 'none', borderRadius: 7,
            padding: '10px', fontSize: 13, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', width: '100%'
          }}
        >
          {loading ? 'Saving...' : 'Get the Margin Brief →'}
        </button>
      </div>

      <p style={{ margin: '10px 0 0', fontSize: 11, color: '#94A3B8', textAlign: 'center' }}>
        Free. Unsubscribe anytime. No marketing.
      </p>
    </div>
  )
}
