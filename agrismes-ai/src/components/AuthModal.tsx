import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

type AuthView = 'email' | 'code' | 'opening'

export default function AuthModal({ onClose, reason }: {
  onClose: () => void
  reason?: 'second_run' | 'limit_reached'
}) {
  const [view, setView] = useState<AuthView>('email')
  const [email, setEmail] = useState('')
  const [boxes, setBoxes] = useState<string[]>(Array(6).fill(''))
  const boxRefs = useRef<(HTMLInputElement | null)[]>([])
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [resendIn, setResendIn] = useState(0)

  const fullCode = boxes.join('')
  const codeComplete = fullCode.length === 6 && boxes.every(b => b.length === 1)

  const startResendTimer = () => {
    setResendIn(20)
    const iv = setInterval(() => setResendIn(s => {
      if (s <= 1) { clearInterval(iv); return 0 }
      return s - 1
    }), 1000)
  }

  const handleSendCode = async () => {
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      const r = await fetch('/api/auth-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request', email: email.trim() }),
      })
      const data = await r.json()
      if (data.success) {
        setView('code')
        startResendTimer()
        setTimeout(() => boxRefs.current[0]?.focus(), 100)
      } else {
        setError(data.error || 'Could not send code. Try again.')
      }
    } catch {
      setError('Network error. Check your connection.')
    }
    setLoading(false)
  }

  const handleVerify = async (overrideBoxes?: string[]) => {
    const src = overrideBoxes || boxes
    const code = src.join('').trim()
    if (code.length !== 6) { setError('Enter the full 6-digit code.'); return }
    setVerifying(true)
    setError('')
    try {
      const r = await fetch('/api/auth-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', email: email.trim(), code }),
      })
      const data = await r.json()
      if (data.success && data.access_token) {
        // Set the Supabase session from the tokens returned by our API
        const { error: sessionErr } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        })
        if (sessionErr) {
          setError('Session error: ' + sessionErr.message)
          setVerifying(false)
          return
        }
        setView('opening')
        setTimeout(() => onClose(), 1600)
      } else {
        setError(data.error || 'Incorrect code. Try again or resend.')
        setVerifying(false)
      }
    } catch {
      setError('Network error. Check your connection.')
      setVerifying(false)
    }
  }

  const handleResend = async () => {
    if (resendIn > 0) return
    setLoading(true)
    setError('')
    setBoxes(Array(6).fill(''))
    await handleSendCodeInner()
    setLoading(false)
  }

  const handleSendCodeInner = async () => {
    try {
      const r = await fetch('/api/auth-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request', email: email.trim() }),
      })
      const data = await r.json()
      if (data.success) {
        startResendTimer()
        setTimeout(() => boxRefs.current[0]?.focus(), 100)
      } else {
        setError(data.error || 'Could not resend. Try again.')
      }
    } catch {
      setError('Network error.')
    }
  }

  const headline = reason === 'limit_reached'
    ? "You've used your 5 free analyses"
    : "Sign in to AgriSMES"

  const subtext = reason === 'limit_reached'
    ? "Create a free account to get 5 analyses per month, or upgrade to Pro."
    : "Get 5 free analyses per month. No credit card required."

  if (view === 'opening') {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#F7F8FA', zIndex: 2000,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center', padding: 24,
      }}>
        <img src="/agrismes-logo.png" alt="AgriSMES" style={{
          width: 48, height: 48, borderRadius: 10, objectFit: 'contain',
          marginBottom: 24, animation: 'agFadeIn 0.35s ease-out',
        }} />
        <div style={{ width: 52, height: 52, position: 'relative', margin: '0 auto 18px' }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'rgba(27,67,50,0.15)',
            animation: 'agPulse 1.4s ease-out infinite',
          }} />
          <div style={{
            position: 'relative', width: 52, height: 52, borderRadius: '50%',
            background: '#1B4332', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff"
              strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" style={{
                strokeDasharray: 30, strokeDashoffset: 30,
                animation: 'agDraw 0.5s ease-out 0.15s forwards',
              }} />
            </svg>
          </div>
        </div>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>Verified</p>
        <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Opening AgriSMES...</p>
        <style>{`
          @keyframes agFadeIn { from { opacity:0;transform:translateY(-6px) } to { opacity:1;transform:translateY(0) } }
          @keyframes agPulse  { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.8);opacity:0} }
          @keyframes agDraw   { to { stroke-dashoffset:0 } }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '0 16px',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '36px 28px',
        width: '100%', maxWidth: 380, position: 'relative',
        boxShadow: '0 24px 64px rgba(0,0,0,0.18)', boxSizing: 'border-box',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 14, right: 14, background: 'none',
          border: 'none', fontSize: 18, cursor: 'pointer', color: '#aaa', lineHeight: 1,
        }}>x</button>

        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{
            width: 44, height: 44, background: '#1a3a2a', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px', color: '#fff', fontSize: 20, fontWeight: 800,
          }}>A</div>
          {view === 'code' ? (
            <>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, color: '#111' }}>Check your email</h2>
              <p style={{ color: '#777', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                We sent a 6-digit code to<br /><strong style={{ color: '#111' }}>{email}</strong>
              </p>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#111' }}>{headline}</h2>
              <p style={{ color: '#777', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{subtext}</p>
            </>
          )}
        </div>

        {view === 'code' ? (
          <>
            <label style={{
              fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.5px', color: '#64748B', display: 'block',
              marginBottom: 12, textAlign: 'center',
            }}>Enter your 6-digit code</label>

            <div
              style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 4 }}
              onPaste={e => {
                e.preventDefault()
                const t = (e.clipboardData.getData('text') || '').replace(/[^0-9]/g, '').slice(0, 6)
                const next = Array(6).fill('')
                t.split('').forEach((c, i) => { next[i] = c })
                setBoxes(next)
                if (error) setError('')
                const fi = Math.min(t.length, 5)
                setTimeout(() => boxRefs.current[fi]?.focus(), 0)
                if (t.length === 6) handleVerify(next)
              }}
            >
              {Array(6).fill(0).map((_, i) => (
                <input key={i}
                  ref={el => { boxRefs.current[i] = el }}
                  value={boxes[i]}
                  maxLength={1}
                  inputMode="numeric"
                  onChange={e => {
                    const v = e.target.value.replace(/[^0-9]/g, '')
                    if (!v) return
                    const next = [...boxes]; next[i] = v
                    setBoxes(next)
                    if (error) setError('')
                    if (i < 5) boxRefs.current[i + 1]?.focus()
                    else handleVerify(next)
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Backspace') {
                      e.preventDefault()
                      const next = [...boxes]
                      if (next[i]) { next[i] = ''; setBoxes(next) }
                      else if (i > 0) { next[i-1] = ''; setBoxes(next); boxRefs.current[i-1]?.focus() }
                    }
                    if (e.key === 'Enter' && codeComplete) handleVerify()
                    if (e.key === 'ArrowLeft' && i > 0) boxRefs.current[i-1]?.focus()
                    if (e.key === 'ArrowRight' && i < 5) boxRefs.current[i+1]?.focus()
                  }}
                  style={{
                    width: 44, height: 52, textAlign: 'center', fontSize: 22,
                    fontWeight: 800, fontFamily: 'monospace', color: '#0F172A',
                    background: boxes[i] ? '#f0fdf4' : '#fff',
                    border: `2px solid ${error ? '#ef4444' : boxes[i] ? '#1B4332' : '#E2E8F0'}`,
                    borderRadius: 8, outline: 'none', cursor: 'text',
                    transition: 'border-color .15s, background .15s',
                  }}
                />
              ))}
            </div>

            {error && (
              <div style={{
                fontSize: 13, color: '#dc2626', background: '#fef2f2',
                border: '1px solid #fecaca', borderRadius: 6,
                padding: '8px 12px', marginTop: 10,
              }}>{error}</div>
            )}

            <button onClick={() => handleVerify()} disabled={verifying || !codeComplete} style={{
              width: '100%', padding: '13px', marginTop: 14, borderRadius: 10,
              background: verifying || !codeComplete ? '#94a3b8' : '#1B4332',
              color: '#fff', border: 'none', fontSize: 14, fontWeight: 700,
              cursor: verifying || !codeComplete ? 'not-allowed' : 'pointer',
              boxSizing: 'border-box',
            }}>
              {verifying ? 'Verifying...' : 'Verify and Continue'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <button onClick={() => { setView('email'); setError(''); setBoxes(Array(6).fill('')) }} style={{
                fontSize: 13, color: '#94a3b8', background: 'none', border: 'none',
                cursor: 'pointer', fontWeight: 500, padding: 0,
              }}>Change email</button>
              <button onClick={handleResend} disabled={resendIn > 0 || loading} style={{
                fontSize: 13, color: resendIn > 0 ? '#cbd5e1' : '#1B4332',
                background: 'none', border: 'none',
                cursor: resendIn > 0 ? 'default' : 'pointer', fontWeight: 600, padding: 0,
              }}>
                {loading ? 'Sending...' : resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
              </button>
            </div>
          </>
        ) : (
          <div>
            <input type="email" placeholder="you@example.com" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendCode()}
              autoFocus
              style={{
                width: '100%', padding: '13px 14px', borderRadius: 10,
                border: '1.5px solid #E2E8F0', fontSize: 14, color: '#0F172A',
                marginBottom: 12, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
              }} />
            {error && <p style={{ color: '#dc2626', fontSize: 12, marginBottom: 10 }}>{error}</p>}
            <button onClick={handleSendCode} disabled={loading || !email.trim()} style={{
              width: '100%', padding: '13px 16px', borderRadius: 10,
              background: loading || !email.trim() ? '#94a3b8' : '#1a3a2a',
              color: '#fff', border: 'none', fontSize: 14, fontWeight: 700,
              cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
              boxSizing: 'border-box',
            }}>
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
            <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: 14 }}>
              5 free analyses per month. Pro from $9/mo.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
