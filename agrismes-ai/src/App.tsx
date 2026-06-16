import React from 'react';
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import AuthModal from './components/AuthModal'
import { UpgradePlanModal } from './components/UpgradePlanModal'
import TradeMarginCalculator from './pages/TradeMarginCalculator'
import History from './pages/History'
import Pricing from './pages/Pricing'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import Refund from './pages/Refund'
import SavedTrades from './components/SavedTrades'
import CompareDeals from './pages/CompareDeals'
import MarketIntelligence from "./pages/MarketIntelligence"
import PriceAlerts from './components/PriceAlerts'
import AnalysisHistory from '@/pages/AnalysisHistory';

function SharedResult({ shareId }: { shareId: string }) {
  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <h2 style={{ marginBottom:8 }}>Shared Analysis</h2>
        <p style={{ color:'#888', fontSize:14 }}>ID: {shareId}</p>
        <a href="/" style={{ color:'#4ade80', fontSize:13 }}>← Back to AgriSMES</a>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [authReason, setAuthReason] = useState<'second_run' | 'limit_reached'>('second_run')
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const handlePop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handlePop)
    // Also intercept pushState
    const orig = window.history.pushState.bind(window.history)
    window.history.pushState = (...args) => { orig(...args); setPath(window.location.pathname) }
    return () => { window.removeEventListener('popstate', handlePop) }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
      if (session) setShowAuth(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (showHistory) return <History session={session} onBack={() => setShowHistory(false)} />
  if (path.startsWith('/share/')) return <SharedResult shareId={path.replace('/share/', '')} />
if (path === '/saved-trades') return <SavedTrades session={session} onUpgradeRequest={() => window.location.href='/pricing'} />
  if (path === '/market') return <MarketIntelligence session={session} onUpgradeRequest={() => setShowUpgrade(true)} />
  if (path === '/alerts') return <PriceAlerts session={session} onUpgradeRequest={() => window.location.href='/pricing'} />
  if (path === '/compare') return <CompareDeals session={session} onUpgradeRequest={() => window.location.href='/pricing'} />
  if (path === '/pricing') return <Pricing />
  if (path === '/terms') return <Terms />
  if (path === '/privacy') return <Privacy />
  if (path === '/refund') return <Refund />

  return (
    <>
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          reason={authReason}
        />
      )}
      {showUpgrade && (
        <UpgradePlanModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
      )}
      <TradeMarginCalculator
        session={session}
        onSignInRequest={(reason) => {
          setAuthReason(reason || 'second_run')
          setShowAuth(true)
        }}
        onUpgradeRequest={() => setShowUpgrade(true)}
        onHistoryRequest={() => setShowHistory(true)}
      />
    </>
  )
}

