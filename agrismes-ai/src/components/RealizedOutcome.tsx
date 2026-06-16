import { useState } from 'react'

const SB_URL  = 'https://pttcugqwslvdstmrbyhu.supabase.co'
const ANON    = import.meta.env.VITE_SUPABASE_ANON_KEY as string

interface Props {
  assumedMarginPct: number
  assumedFreightUsdMt: number
  assumedBreakevenUsdMt: number
  grade: string
  originCountry: string
  destinationCountry: string
  quantityMt: number
  incoterm: string
}

export default function RealizedOutcome({
  assumedMarginPct, assumedFreightUsdMt, assumedBreakevenUsdMt,
  grade, originCountry, destinationCountry, quantityMt, incoterm
}: Props) {
  const [open, setOpen]       = useState(false)
  const [step, setStep]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState('')

  // Step 1 — outcome
  const [result, setResult] = useState<'profitable'|'breakeven'|'loss'|'cancelled'|''>('')

  // Step 2 — realized numbers
  const [realMargin, setRealMargin]   = useState('')
  const [realFreight, setRealFreight] = useState('')
  const [realPrice, setRealPrice]     = useState('')

  // Step 3 — what went wrong/right
  const [flags, setFlags] = useState({
    priceRenegotiation: false,
    freightShock:       false,
    moistureIssue:      false,
    qualityRejection:   false,
    paymentDelay:       false,
    fxLoss:             false,
  })
  const [notes, setNotes] = useState('')

  const toggleFlag = (k: keyof typeof flags) =>
    setFlags(prev => ({ ...prev, [k]: !prev[k] }))

  const submit = async () => {
    if (!result) { setError('Select a trade outcome'); return }
    setError(''); setLoading(true)
    try {
      const tradeId = `trade_${Date.now()}_${Math.random().toString(36).slice(2,8)}`
      const payload = {
        trade_id:                   tradeId,
        commodity:                  'cashew',
        grade:                      grade || null,
        origin_country:             originCountry || null,
        destination_country:        destinationCountry || null,
        incoterm:                   incoterm || null,
        quantity_mt:                quantityMt || null,
        assumed_margin_pct:         assumedMarginPct,
        assumed_freight_usd_mt:     assumedFreightUsdMt,
        assumed_breakeven_usd_mt:   assumedBreakevenUsdMt,
        realized_margin_pct:        realMargin  ? parseFloat(realMargin)  : null,
        realized_freight_usd_mt:    realFreight ? parseFloat(realFreight) : null,
        realized_price_usd_mt:      realPrice   ? parseFloat(realPrice)   : null,
        had_price_renegotiation:    flags.priceRenegotiation,
        had_freight_shock:          flags.freightShock,
        had_moisture_issue:         flags.moistureIssue,
        had_quality_rejection:      flags.qualityRejection,
        had_payment_delay:          flags.paymentDelay,
        had_fx_loss:                flags.fxLoss,
        trade_result:               result,
        deal_date:                  new Date().toISOString().split('T')[0],
        notes:                      notes || null,
        source:                     'user_submitted',
      }

      const r = await fetch(`${SB_URL}/rest/v1/realized_trade_outcomes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ANON}`,
          'apikey':         ANON,
          'Content-Type':   'application/json',
          'Prefer':         'return=minimal',
        },
        body: JSON.stringify(payload),
      })

      if (r.ok || r.status === 201) {
        setDone(true)
        // ── Trigger self-learning pipeline immediately ──────────────────
        // Fire-and-forget — does not block UI or affect user experience
        fetch('https://pttcugqwslvdstmrbyhu.supabase.co/functions/v1/atlas-pipeline-orchestrator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'learning_only', trigger: 'realized_outcome_submitted' })
        }).catch(() => null) // silent — never fail the user flow
      } else {
        const b = await r.json().catch(() => ({}))
        setError(b.message || 'Submission failed. Please try again.')
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      style={{
        width: '100%', marginTop: 12,
        background: 'transparent',
        border: '1px dashed #CBD5E1',
        borderRadius: 8, padding: '10px 16px',
        fontSize: 13, color: '#64748B',
        cursor: 'pointer', textAlign: 'left',
        display: 'flex', alignItems: 'center', gap: 8,
      }}
    >
      <span style={{ fontSize: 16 }}>📊</span>
      <span>Did this trade execute? Submit the realized outcome — helps calibrate AgriSMES for everyone.</span>
    </button>
  )

  if (done) return (
    <div style={{
      background: '#F0FDF4', border: '1px solid #BBF7D0',
      borderRadius: 10, padding: '16px 20px', marginTop: 12,
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>✓</span>
      <div>
        <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#14532D' }}>
          Outcome recorded — thank you
        </p>
        <p style={{ margin: 0, fontSize: 12, color: '#166534', lineHeight: 1.5 }}>
          Your realized trade data improves margin verification accuracy for every processor,
          exporter, and financier using AgriSMES. The system learns from every submission.
        </p>
      </div>
    </div>
  )

  const S: React.CSSProperties = {
    background: '#fff', border: '1px solid #E2E8F0',
    borderRadius: 10, padding: '18px 18px 14px',
    marginTop: 12,
  }

  const inputStyle: React.CSSProperties = {
    border: '1px solid #CBD5E1', borderRadius: 6,
    padding: '8px 10px', fontSize: 13, color: '#0F172A',
    width: '100%', outline: 'none', background: '#FAFAFA',
  }

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '7px 14px', borderRadius: 99, fontSize: 12, fontWeight: 500,
    cursor: 'pointer', border: 'none',
    background: active ? '#1B4332' : '#F1F5F9',
    color: active ? '#fff' : '#475569',
  })

  const flagStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
    border: `1px solid ${active ? '#1B4332' : '#E2E8F0'}`,
    background: active ? '#F0FDF4' : '#FAFAFA',
    fontSize: 12, color: active ? '#14532D' : '#64748B',
  })

  return (
    <div style={S}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
          Submit Realized Outcome
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: '#94A3B8' }}>Step {step} of 3</span>
          <button
            onClick={() => setOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 18, lineHeight: 1 }}
          >×</button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: '#F1F5F9', borderRadius: 2, marginBottom: 16 }}>
        <div style={{ height: 3, background: '#1B4332', borderRadius: 2, width: `${(step/3)*100}%`, transition: 'width .3s' }} />
      </div>

      {/* ── Step 1: Outcome ── */}
      {step === 1 && (
        <div>
          <p style={{ margin: '0 0 10px', fontSize: 12, color: '#64748B' }}>
            Did this trade execute and how did it perform?
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {(['profitable','breakeven','loss','cancelled'] as const).map(r => (
              <button key={r} style={chipStyle(result === r)} onClick={() => setResult(r)}>
                {r === 'profitable' ? '✓ Profitable'
                 : r === 'breakeven' ? '≈ Breakeven'
                 : r === 'loss'      ? '↓ Loss'
                 :                    '✕ Cancelled'}
              </button>
            ))}
          </div>
          {error && <p style={{ fontSize: 12, color: '#DC2626', margin: '0 0 8px' }}>{error}</p>}
          <button
            onClick={() => { if (!result) { setError('Select an outcome'); return } setError(''); setStep(2) }}
            style={{ ...chipStyle(true), width: '100%', textAlign: 'center', padding: '10px' }}
          >
            Next →
          </button>
        </div>
      )}

      {/* ── Step 2: Numbers ── */}
      {step === 2 && (
        <div>
          <p style={{ margin: '0 0 10px', fontSize: 12, color: '#64748B' }}>
            Optional — enter realized numbers for maximum calibration value.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>
                Realized gross margin %
                <span style={{ color: '#94A3B8', marginLeft: 6 }}>(assumed: {assumedMarginPct.toFixed(1)}%)</span>
              </label>
              <input
                type="number" placeholder="e.g. 18.5"
                value={realMargin} onChange={e => setRealMargin(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>
                Realized freight $/MT
                <span style={{ color: '#94A3B8', marginLeft: 6 }}>(assumed: ${assumedFreightUsdMt}/MT)</span>
              </label>
              <input
                type="number" placeholder="e.g. 92"
                value={realFreight} onChange={e => setRealFreight(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>
                Final settled price $/MT
              </label>
              <input
                type="number" placeholder="e.g. 7150"
                value={realPrice} onChange={e => setRealPrice(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setStep(1)} style={{ ...chipStyle(false), flex: 1, textAlign: 'center' }}>← Back</button>
            <button onClick={() => setStep(3)} style={{ ...chipStyle(true), flex: 2, textAlign: 'center' }}>Next →</button>
          </div>
        </div>
      )}

      {/* ── Step 3: Risk flags + submit ── */}
      {step === 3 && (
        <div>
          <p style={{ margin: '0 0 10px', fontSize: 12, color: '#64748B' }}>
            Did any of these occur? (select all that apply)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {[
              ['priceRenegotiation', 'Buyer renegotiated price at arrival'],
              ['freightShock',       'Freight rate spiked during transit'],
              ['moistureIssue',      'Moisture or quality issue at destination'],
              ['qualityRejection',   'Lot rejected or downgraded'],
              ['paymentDelay',       'Payment delayed beyond contract terms'],
              ['fxLoss',             'FX movement caused loss'],
            ].map(([key, label]) => (
              <button
                key={key}
                style={flagStyle(flags[key as keyof typeof flags])}
                onClick={() => toggleFlag(key as keyof typeof flags)}
              >
                <span>{flags[key as keyof typeof flags] ? '✓' : '○'}</span>
                {label}
              </button>
            ))}
          </div>
          <textarea
            placeholder="Any other notes about this trade? (optional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: 'none', marginBottom: 10, fontSize: 12 }}
          />
          {error && <p style={{ fontSize: 12, color: '#DC2626', margin: '0 0 8px' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setStep(2)} style={{ ...chipStyle(false), flex: 1, textAlign: 'center' }}>← Back</button>
            <button
              onClick={submit}
              disabled={loading}
              style={{ ...chipStyle(true), flex: 2, textAlign: 'center', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Submitting...' : 'Submit outcome →'}
            </button>
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 11, color: '#94A3B8', textAlign: 'center' }}>
            Data is anonymised and used only to improve AgriSMES calibration accuracy.
          </p>
        </div>
      )}
    </div>
  )
}
