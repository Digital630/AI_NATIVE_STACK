import { LANGS, ANALYSE_BTN } from '../langs'
import React, { useState, useRef, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'

interface PaddleGlobal {
  Environment: { set: (env: string) => void }
  Initialize: (opts: { token: string }) => void
}
import { useUsage } from '../hooks/useUsage'
import { PaywallBanner } from '../components/PaywallBanner'
import VerificationLayer from '../components/VerificationLayer'
import LeadCapture from '../components/LeadCapture'
import RealizedOutcome from '../components/RealizedOutcome'


// ─── Types ─────────────────────────────────────────────────────────────────
type Role = 'Exporter' | 'Importer' | 'Processor' | 'Broker/Trader' | 'Farmer'
type Decision = 'PROCEED' | 'CAUTION' | 'REJECT' | 'SELL NOW' | 'HOLD' | 'NEGOTIATE'

interface ExtractedData {
  commodity: string
  grade: string
  quantity_mt: number
  price_per_mt: number
  price_currency: string
  incoterm: string
  origin_port: string
  destination_port: string
  destination_country: string
  role: string
  missing_fields: string[]
}

interface CostLine {
  item: string
  per_mt: number
  pct: number
}

interface CalcResult {
  price_usd: number
  tcb_levy: number
  sgs_fee: number
  port_handling: number
  freight: number
  insurance: number
  agent_commission: number
  import_duty: number
  total_costs: number
  net_yield_per_mt: number
  gross_margin_pct: number
  landed_cost_per_mt: number
  breakeven_price: number
  total_net_yield: number
  vs_benchmark_pct: number
  benchmark: number
  decision: Decision
  effective_wfk_cost?: number
  quantity_mt: number
  lines: CostLine[]
  farmer_diff_usd?: number
  farmer_diff_tzs?: number
}

// ─── Placeholders ───────────────────────────────────────────────────────────
const PLACEHOLDERS: Record<Role, string> = {
  Exporter: 'e.g. W320 cashew kernels, 40MT, procurement 3,200 TZS/kg in Tanzania, selling FOB Dar es Salaam at $6,200/MT, shipping to Rotterdam',
  Importer: 'e.g. W320 cashew kernels, 25MT, buying FOB Vietnam at $7,200/MT, importing to Rotterdam, include Netherlands import duty',
  Processor: 'e.g. RCN 80MT from Mtwara at $1,400/MT, processing to W320, expected outturn 44kg per 100kg RCN, selling at $6,000/MT',
  'Broker/Trader': 'Example: W240 CIF Dubai $7,800/MT, 15MT, spread between Tanzania exporter and UAE buyer...',
  Farmer: 'Example: RCN farmgate offer 2,800 TZS/kg, 5 tonnes, Mtwara region, TCB auction season...',
}

// ─── Constants ──────────────────────────────────────────────────────────────
const BENCHMARKS: Record<string, number> = {
  W180: 2900, W240: 2500, W320: 2000, W450: 1720,
  SW: 1480, LWP: 1320, BP: 930, RCN: 820,
}

const FREIGHT_TABLE: Record<string, number> = {
  // Tanzania
  'DSM-ROTTERDAM': 72, 'DSM-ANTWERP': 74, 'DSM-DUBAI': 52,
  'DSM-TORONTO': 88, 'DSM-DURBAN': 28, 'DSM-SINGAPORE': 55,
  'DSM-MUMBAI': 45, 'DSM-SHANGHAI': 68, 'DSM-HOCHIMINH': 70,
  'MTWARA-ROTTERDAM': 75, 'MTWARA-ANTWERP': 77, 'MTWARA-DUBAI': 55,
  'MTWARA-HOCHIMINH': 72, 'MTWARA-NHAVASHEVA': 52,
  'MTWARA-CHENNAI': 50, 'MTWARA-SHANGHAI': 82,
  // Kenya
  'MOMBASA-DUBAI': 45, 'MOMBASA-ROTTERDAM': 65, 'MOMBASA-ANTWERP': 67,
  'MOMBASA-SHANGHAI': 65, 'MOMBASA-SINGAPORE': 48,
  // West Africa
  'ABIDJAN-ROTTERDAM': 58, 'ABIDJAN-ANTWERP': 56, 'ABIDJAN-DUBAI': 68,
  'ABIDJAN-NHAVASHEVA': 62, 'ABIDJAN-HOCHIMINH': 75,
  'COTONOU-ROTTERDAM': 62, 'COTONOU-ANTWERP': 60, 'COTONOU-NHAVASHEVA': 65,
  'DAKAR-ROTTERDAM': 48, 'DAKAR-ANTWERP': 46,
  'BISSAU-ROTTERDAM': 52, 'BISSAU-ANTWERP': 50,
  'TEMA-ROTTERDAM': 58, 'TEMA-ANTWERP': 56,
  'APAPA-ROTTERDAM': 60, 'APAPA-ANTWERP': 58,
  'MAPUTO-ROTTERDAM': 78, 'MAPUTO-DUBAI': 58,
  // Asia
  'NHAVASHEVA-ROTTERDAM': 38, 'NHAVASHEVA-ANTWERP': 36,
  'HOCHIMINH-ROTTERDAM': 42, 'HOCHIMINH-ANTWERP': 40,
  'HOCHIMINH-NHAVASHEVA': 28,
}

// AI freight lookup cache — avoids repeated lookups in same session
const freightCache: Record<string, number> = {}

async function lookupFreightRate(origin: string, destination: string): Promise<number | null> {
  const key = origin.toUpperCase() + '-' + destination.toUpperCase()
  if (freightCache[key]) return freightCache[key]
  try {   const response = await fetch('/api/anthropic-analyse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `What is the current container freight rate per MT for a 20ft container from ${origin} port to ${destination} port for agricultural commodities like cashew nuts? Give me ONLY a single number in USD per metric ton. No explanation.`
        }]
      })
    })
    const data: { content?: Array<{ type: string; text?: string }> } = await response.json().catch(() => ({}))
    const text = data.content?.filter((b) => b.type === 'text').map((b) => b.text).join('')
    const match = text?.match(/\d+(\.\d+)?/)
    if (match) {
      const rate = parseFloat(match[0])
      if (rate > 10 && rate < 500) {
        freightCache[key] = rate
        return rate
      }
    }
  } catch {
    // Network/parse failure — fall through to default freight rate below
  }
  return null
}

const IMPORT_DUTY: Record<string, number> = {
  NETHERLANDS: 0, BELGIUM: 0, GERMANY: 0, FRANCE: 0, UK: 0,
  CANADA: 0, SINGAPORE: 0, SOUTHAFRICA: 0,
  UAE: 0.05, SAUDIARABIA: 0.05, USA: 0.05, VIETNAM: 0.05,
  CHINA: 0.10, INDIA: 1.0,
}

const PORT_HANDLING: Record<string, number> = {
  // East Africa
  DSM: 18, 'DAR ES SALAAM': 18, MTWARA: 14, MOMBASA: 16, TANGA: 16,
  // West Africa
  ABIDJAN: 22, COTONOU: 24, DAKAR: 20, BISSAU: 26,
  APAPA: 28, TEMA: 22, MAPUTO: 20,
  // Asia
  NHAVASHEVA: 18, 'HO CHI MINH': 16, HOCHIMINH: 16,
  SHANGHAI: 14, CHENNAI: 18, MUMBAI: 18,
}

const TANZANIA_PORTS = ['DSM', 'DAR ES SALAAM', 'MTWARA', 'TANGA']

// ─── Calculation Engine ─────────────────────────────────────────────────────
function calculate(data: ExtractedData, role: Role): CalcResult {
  // Currency normalisation
  let price = data.price_per_mt
  const curr = (data.price_currency || 'USD').toUpperCase()
  if (curr === 'TZS') price = price / 2600
  // Per-kg → per-MT
  if (price < 50) price = price * 1000
  const price_usd = price

  const origin = (data.origin_port || '').toUpperCase().trim()
  const dest_port = (data.destination_port || '').toUpperCase().trim()
  const dest_country = (data.destination_country || '').toUpperCase().replace(/\s+/g, '')
  const quantity = data.quantity_mt || 1
  const grade = (data.grade || '').toUpperCase().trim()
  const commodity = (data.commodity || '').toUpperCase().trim()

  // TCB levy – Tanzania only
  const is_tanzania = TANZANIA_PORTS.some(p => origin.includes(p))
  const tcb_levy = is_tanzania ? price_usd * 0.04 : 0

  // SGS
  const sgs_fee = 22

  // Port handling
  const ph_key = Object.keys(PORT_HANDLING).find(k => origin.includes(k))
  const port_handling = ph_key ? PORT_HANDLING[ph_key] : 18

  // Freight
  const freight_key = Object.keys(FREIGHT_TABLE).find(k => {
    const [fOrigin, fDest] = k.split('-')
    return origin.includes(fOrigin) && (dest_port.includes(fDest) || dest_country.includes(fDest))
  })
  const freight = freight_key ? FREIGHT_TABLE[freight_key] : 75

  // Insurance
  const insurance = 0.005 * (price_usd + freight)

  // Agent commission – Broker/Trader only
  const agent_commission = role === 'Broker/Trader' ? price_usd * 0.015 : 0

  // Import duty
  const duty_rate_key = Object.keys(IMPORT_DUTY).find(k => dest_country.includes(k))
  const duty_rate = duty_rate_key !== undefined ? IMPORT_DUTY[duty_rate_key] : 0.05
  const import_duty = price_usd * duty_rate

  const total_costs = tcb_levy + sgs_fee + port_handling + freight + insurance + agent_commission + import_duty

  const net_yield_per_mt = price_usd - total_costs
  const gross_margin_pct = (net_yield_per_mt / price_usd) * 100
  const landed_cost_per_mt = price_usd + freight + insurance + import_duty
  const breakeven_price = total_costs / 0.90
  const total_net_yield = net_yield_per_mt * quantity

  // Benchmark
  const benchmark_key = Object.keys(BENCHMARKS).find(k => grade.includes(k) || k === grade)
  const benchmark = benchmark_key ? BENCHMARKS[benchmark_key] : (commodity.includes('RCN') ? 820 : 2000)
  const vs_benchmark_pct = ((price_usd - benchmark) / benchmark) * 100

  // Decision signal
  let decision: Decision
  if (role === 'Farmer') {
    const rcn_benchmark = 820
    if (price_usd >= rcn_benchmark) decision = 'SELL NOW'
    else if (price_usd < rcn_benchmark * 0.90) decision = 'HOLD'
    else decision = 'NEGOTIATE'
  } else {
    if (gross_margin_pct >= 15) decision = 'PROCEED'
    else if (gross_margin_pct >= 5) decision = 'CAUTION'
    else decision = 'REJECT'
  }

  // Processor outturn
  let effective_wfk_cost: number | undefined
  if (commodity.includes('RCN') && role === 'Processor') {
    const outturn = 0.46
    const processing_cost = 180
    effective_wfk_cost = (price_usd + processing_cost) / outturn
  }

  // Farmer diff
  let farmer_diff_usd: number | undefined
  let farmer_diff_tzs: number | undefined
  if (role === 'Farmer') {
    farmer_diff_usd = price_usd - 820
    farmer_diff_tzs = farmer_diff_usd * 2600 / 1000 // per kg
  }

  // Cost table lines
  const lines: CostLine[] = []
  const push = (item: string, val: number) => {
    if (val > 0) lines.push({ item, per_mt: val, pct: (val / price_usd) * 100 })
  }
  if (tcb_levy > 0) push('TCB Levy', tcb_levy)
  push('SGS Inspection', sgs_fee)
  push('Port Handling', port_handling)
  push('Freight', freight)
  push('Insurance', insurance)
  if (import_duty > 0) push('Import Duty', import_duty)
  if (agent_commission > 0) push('Agent Commission', agent_commission)

  return {
    price_usd, tcb_levy, sgs_fee, port_handling, freight, insurance,
    agent_commission, import_duty, total_costs, net_yield_per_mt,
    gross_margin_pct, landed_cost_per_mt, breakeven_price, total_net_yield,
    vs_benchmark_pct, benchmark, decision, effective_wfk_cost, quantity_mt: quantity,
    lines, farmer_diff_usd, farmer_diff_tzs,
  }
}

// ─── Supabase silent save ───────────────────────────────────────────────────
async function saveCalculation(data: ExtractedData, result: CalcResult, userId?: string) {
  if (!userId) return
  try {
    const { supabase } = await import('../lib/supabase')
    track('analysis_run', { user_id: session && session.user ? session.user.id : undefined, email: session && session.user ? session.user.email : undefined, page: '/' });
    await supabase.from('agrismes_calculations').insert({
      user_id: userId,
      role: data.role,
      commodity: data.commodity,
      grade: data.grade,
      quantity_mt: data.quantity_mt,
      price_per_mt: result.price_usd,
      incoterm: data.incoterm,
      origin_port: data.origin_port,
      destination: data.destination_port,
      net_yield_per_mt: result.net_yield_per_mt,
      gross_margin_pct: result.gross_margin_pct,
      total_costs_per_mt: result.total_costs,
      freight_per_mt: result.freight,
      import_duty_per_mt: result.import_duty,
      decision_signal: result.decision,
      breakeven_price_per_mt: result.breakeven_price,
      calculated_at: new Date().toISOString(),
    })
  } catch (err) { console.error('[saveCalculation] Supabase write failed:', err); }
}

async function saveWaitlistEmail(email: string, role: Role) {
  try {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    if (!url || !key) return
    await fetch(`${url}/rest/v1/agrismes_waitlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        email,
        role,
        plan_interest: 'Pro',
        captured_at: new Date().toISOString(),
      }),
    })
  } catch (_) { /* silent */ }
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

const fmtD = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// ─── Main Component ─────────────────────────────────────────────────────────

function AccountPanel({ session, onHistoryRequest }: { session: Session | null; onHistoryRequest: () => void }) {
  const [open, setOpen] = React.useState(false);
  const email = session?.user?.email || '';
  const initials = email.charAt(0).toUpperCase();
  return (
    <div style={{ position: 'fixed', bottom: 20, left: 20, zIndex: 100 }}>
      {open && (
        <div style={{
          position: 'absolute', bottom: 52, left: 0,
          background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14, padding: '10px 6px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)', minWidth: 220,
        }}>
          <div style={{ padding: '6px 12px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 4 }}>
            <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>Signed in as</div>
            <div style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
          </div>
          <button onClick={onHistoryRequest} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none', background: 'none', color: '#4ade80', fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left' as const }}>📋 History</button>
          <button onClick={() => window.location.href='/market'} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none', background: 'none', color: '#fbbf24', fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left' as const }}>📈 Market Prices</button>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: 4, paddingTop: 4 }}>
            <button onClick={async () => { const m = await import('../lib/supabase'); await m.supabase.auth.signOut(); window.location.reload(); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 12px', borderRadius: 8, border: 'none', background: 'none', color: 'rgba(255,255,255,0.2)', fontSize: 11, cursor: 'pointer', textAlign: 'left' as const }}>Sign out</button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen(!open)} style={{
        width: 40, height: 40, borderRadius: '50%',
        background: open ? '#1e293b' : '#1e293b',
        border: '2px solid rgba(255,255,255,0.12)',
        color: '#94a3b8', fontSize: 14, fontWeight: 700,
        cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}>
        {initials}
      </button>
    </div>
  );
}

export default function TradeMarginCalculator({ session, onSignInRequest, onUpgradeRequest, onHistoryRequest }: { session: Session | null, onSignInRequest: (reason?: 'second_run' | 'limit_reached') => void, onUpgradeRequest: () => void, onHistoryRequest: () => void }) {
  const { canRun, needsAuth, needsUpgrade, incrementRun, runCount, getLimit, plan, subscription } = useUsage(session)
  const [role, setRole] = useState<Role>('Exporter')
  const [userInput, setUserInput] = useState('')
  const isPro = plan === 'pro' || plan === 'enterprise'
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [result, setResult] = useState<CalcResult | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)
  const [parseError, setParseError] = useState('')
  const [showCostBreakdown, setShowCostBreakdown] = useState(false)

  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [paddle, setPaddle] = useState<PaddleGlobal | null>(null)

  useEffect(() => {
    const win = window as Window & { Paddle?: PaddleGlobal }
    if (win.Paddle) {
      win.Paddle.Environment.set('production')
      win.Paddle.Initialize({ token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN })
      setPaddle(win.Paddle)
    }
  }, [])
  const [analysisCount, setAnalysisCount] = useState(0)
  const [isPrinting, setIsPrinting] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

  const apiMissing = false

  const roles: Role[] = ['Importer', 'Exporter', 'Processor', 'Broker/Trader', 'Farmer']

  function handleExportPDF() {
    setIsPrinting(true)
    setTimeout(() => {
      window.print()
      setTimeout(() => setIsPrinting(false), 500)
    }, 100)
  }

  function normalizeInput(text) {
    var t = text;
    // "240" or "grade 240" -> "W240"
    t = t.replace(/\bgrade[s]?\s*(\d{3})\b/gi, 'W$1');
    t = t.replace(/\bgrade[s]?\s+(\d{3})\b/gi, 'W$1');
    t = t.replace(/(?<![Ww])(\b)(180|240|320|450)(\b)(?!\s*\/)/g, 'W$2');
    // "6.8 usd per kg" -> "6800 USD/MT"
    t = t.replace(/(\d+\.?\d*)\s*(?:usd|\$)?\s*per\s*kg/gi, function(m, n) {
      return Math.round(parseFloat(n) * 1000) + ' USD/MT';
    });
    t = t.replace(/(\d+\.?\d*)\s*(?:usd|\$)\/kg/gi, function(m, n) {
      return Math.round(parseFloat(n) * 1000) + ' USD/MT';
    });
    // TZS/kg -> USD/MT
    t = t.replace(/(\d+[,.]?\d*)\s*(?:tzs?)\/kg/gi, function(m, n) {
      return Math.round(parseFloat(n.replace(',','')) / 2.6) + ' USD/MT';
    });
    // "40 tons" -> "40 MT"
    t = t.replace(/(\d+)\s*(?:tons?|tonnes?|metric\s*tons?)/gi, '$1 MT');
    // "desitantion" typo fix
    t = t.replace(/desitan?t?i?o?n?/gi, 'destination');
    return t;
  }

  async function handleAnalyse() {
    if (!userInput.trim() || isLoading) return
    setIsLoading(true)
    setLoadingStep(1)
    setResult(null)
    setParseError('')
    setExtractedData(null)

    try {
      const systemPrompt =
        'You are an expert cashew trade analyst. A trader has given you a rough description of their trade. Your job is to extract trade details and ALWAYS return valid JSON — never return an error or refuse. Even if the input is messy, abbreviated, or incomplete, make your best intelligent guess. EXTRACTION RULES: Grade: "240"/"grade 240"/"W-240" all mean "W240". "320" means "W320". "180" means "W180". "RCN"/"raw" means "RCN". Price: if per kg multiply by 1000 for per MT.$6.8/kg" = 6800 USD/MT. "3200 tzs/kg" = divide by 2.6 = ~1230 USD/MT. Quantity: "tons"/"tonnes"/"MT"/"metric tons" all mean MT. Origin: "tanzania"/"TZ"/"dar" = "Dar es Salaam". "mtwara" = "Mtwara". "ivory coast"/"CI" = "Abidjan". Destination: "UAE"/"dubai" = "Dubai". "rotterdam"/"netherlands"/"NL" = "Rotterdam". "india" = "Nhava Sheva". Incoterm: if not stated default to "FOB". If a number appears without context, guess based on cashew market: price 1000-9000 = price_per_mt, quantity 1-500 = quantity_mt. NEVER return missing_fields that blocks analysis — always fill with best guess and note in missing_fields. Return ONLY this JSON, no markdown, no explanation: {"commodity":"cashew","grade":"","quantity_mt":0,"price_per_mt":0,"price_currency":"USD","incoterm":"FOB","origin_port":"Dar es Salaam","destination_port":"","destination_country":"","role":"","missing_fields":[]}'

      const response = await fetch(
        `/api/anthropic-analyse`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1000,
            system: systemPrompt,
            messages: [{ role: 'user', content: 'Role: ' + role + '\nTrade input: ' + normalizeInput(userInput) }]
          }),
        }
      )

      const data = await response.json().catch(() => ({content: []}))
      const text = data.content?.[0]?.text ?? ''
      const clean = (() => { let t = text; t = t.replace(/```json|```/g, '').trim(); const m = t.match(/\{[\s\S]*\}/); return m ? m[0] : t; })()

      setLoadingStep(2)
      let extracted: ExtractedData
      try {
        const m = clean.match(/\{[\s\S]*\}/)
        extracted = JSON.parse(m ? m[0] : clean)
      } catch {
        const ni = normalizeInput(userInput).toLowerCase()
        const gm = ni.match(/\b(w180|w240|w320|w450|rcn|swp|lwp)\b/i)
        const pm = ni.match(/(\d{3,6})\s*(?:usd\/mt|per mt)/i) || ni.match(/\$\s*(\d{4,6})/i)
        const qm = ni.match(/(\d+)\s*mt/i) || ni.match(/(\d{1,4})\s*tons?/i)
        const dm = ni.match(/(?:destination|to)[\s:]+([a-z]+)/i)
        const om = ni.match(/(?:origin|from)[\s:]+([a-z]+)/i)
        if (!pm && !qm) {
          setParseError('Could not read your trade. Try: W240 kernels, 40MT, $6800/MT, Tanzania to UAE')
          setIsLoading(false); return
        }
        extracted = {
          commodity: 'cashew',
          grade: gm ? gm[0].toUpperCase() : 'W320',
          quantity_mt: qm ? parseFloat(qm[1]) : 20,
          price_per_mt: pm ? parseFloat(pm[1]) : 6200,
          price_currency: 'USD',
          incoterm: ni.includes('cif') ? 'CIF' : ni.includes('cfr') ? 'CFR' : 'FOB',
          origin_port: om ? om[1].trim() : 'Dar es Salaam',
          destination_port: dm ? dm[1].trim() : '',
          destination_country: dm ? dm[1].trim() : '',
          role: role,
          missing_fields: ['fallback']
        }
      }
      // Inject role
      extracted.role = role

      setLoadingStep(3)
      const calc = calculate(extracted, role)

      if (needsAuth()) { onSignInRequest('second_run'); return; }
      if (!isPro && needsUpgrade()) { onUpgradeRequest(); return; }
      await incrementRun()
      await saveCalculation(extracted, calc, session?.user?.id)

      setExtractedData(extracted)
      setResult(calc)
      setAnalysisCount(c => c + 1)

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err) {
      setParseError('Could not read your trade. Try one line like: W240 kernels, 40MT, $6,800/MT, Tanzania to UAE')
    } finally {
      setIsLoading(false)
      setLoadingStep(0)
    }
  }

  async function handleEmailSubmit() {
    if (!emailInput.trim()) return
    await saveWaitlistEmail(emailInput.trim(), role)
    try {
      await fetch('/api/notify-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput.trim(), role })
      })
    } catch (_) {}
    setEmailSubmitted(true)
  }

  // ── Decision config ──────────────────────────────────────────────────────
  function getSignalConfig(decision: Decision) {
    switch (decision) {
      case 'PROCEED':
      case 'SELL NOW':
        return {
          bg: '#D1FAE5', text: '#065F46', icon: '✓',
          label: decision === 'SELL NOW'
            ? 'SELL NOW — Offer is above benchmark price'
            : 'PROCEED — This trade is viable',
          reasons: [
            'Gross margin exceeds the 15% institutional threshold',
            'All-in costs absorbed while preserving positive yield',
            'Price competitive versus market benchmark',
          ],
        }
      case 'CAUTION':
      case 'NEGOTIATE':
        return {
          bg: '#FEF3C7', text: '#92400E', icon: '▲',
          label: decision === 'NEGOTIATE'
            ? 'NEGOTIATE — Offer is close to benchmark'
            : 'CAUTION — Review before committing',
          reasons: [
            'Margin is thin — small cost overruns will erode yield',
            'Negotiate freight or port fees before signing contract',
            'Consider hedging currency exposure',
          ],
        }
      case 'REJECT':
      case 'HOLD':
        return {
          bg: '#FEE2E2', text: '#991B1B', icon: '✕',
          label: decision === 'HOLD'
            ? 'HOLD — Wait for better market conditions'
            : 'REJECT — This trade loses money',
          reasons: [
            'Total variable costs exceed acceptable yield threshold',
            'Trade is loss-making at current price and cost structure',
            'Renegotiate price or reduce logistics costs before proceeding',
          ],
        }
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {session && (
        <AccountPanel session={session} onHistoryRequest={onHistoryRequest} />
      )}
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#F7F8FA', minHeight: '100vh' }}>

      {/* API Missing Banner */}
      {apiMissing && (
        <div style={{
          background: '#FEF3C7', color: '#92400E', textAlign: 'center',
          padding: '10px 16px', fontSize: 13, fontWeight: 500,
        }}>
          API configuration required — analyses unavailable
        </div>
      )}

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '80px 20px 60px' }}>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
            <img src="/agrismes-logo.png" alt="AgriSMES" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "contain" }} />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 4, color: '#1B4332', textTransform: 'uppercase' }}>AgriSMES</span>
            <span style={{ width: 1, height: 16, background: '#CBD5E1' }} />
            <span style={{ fontSize: 12, color: '#94A3B8', letterSpacing: 2, textTransform: 'uppercase' }}>Trade Intelligence</span>
          </div>

          <h1 style={{ fontSize: 38, fontWeight: 800, color: '#0F172A', margin: '0 0 10px', lineHeight: 1.1, letterSpacing: -1.5 }}>
            Trade Margin Verification
          </h1>
          <p style={{ fontSize: 16, color: '#64748B', margin: '0 0 4px', fontWeight: 400 }}>
            Understand real margin before money moves.
          </p>
          <p style={{ fontSize: 13, fontStyle: 'italic', color: '#94A3B8', margin: 0 }}>
          </p>
        </div>

        {/* ── Role Selector ─────────────────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 14, color: '#475569', marginBottom: 12, fontWeight: 500 }}>
            What is your role in this trade?
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {roles.map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                style={{
                  padding: '8px 20px', borderRadius: 9999, border: '1px solid',
                  borderColor: role === r ? '#1B4332' : '#E2E8F0',
                  background: role === r ? '#1B4332' : '#ffffff',
                  color: role === r ? '#ffffff' : '#475569',
                  fontSize: 14, fontWeight: 500, cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* ── Input Card ────────────────────────────────────────────────── */}
        <div style={{ background: "#f0fdf4", borderRadius: 10, border: "1px solid #bbf7d0", padding: "10px 14px", marginBottom: 12, fontSize: 12, color: "#166534" }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Include: grade (W180/W320/RCN) · quantity (MT) · price/MT · origin · destination · incoterm</div>
          <div style={{ color: "#15803d" }}>e.g. W320 kernels, 20MT, buying 3200 TZS/kg Tanzania, selling FOB Dar es Salaam at $6200/MT to Rotterdam</div>
        </div>
        <div style={{
          background: '#ffffff', borderRadius: 16, border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
          padding: '20px 24px', marginBottom: 32,
        }}>
          <textarea
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAnalyse(); } }}
            placeholder={PLACEHOLDERS[role]}
            rows={4}
            style={{
              width: '100%', border: 'none', outline: 'none',
              background: 'transparent', resize: 'vertical',
              minHeight: 100, fontSize: 15, color: '#0F172A',
              lineHeight: 1.6, fontFamily: "'Inter', sans-serif",
              boxSizing: 'border-box',
            }}
          />

          {/* Divider */}
          <div style={{ height: 1, background: '#F1F5F9', margin: '12px 0' }} />

          {/* Bottom row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>

            {/* Analyse button */}
            <button
              onClick={handleAnalyse}
              disabled={!userInput.trim() || isLoading || apiMissing}
              style={{
                padding: '8px 24px', borderRadius: 8,
                background: (!userInput.trim() || isLoading || apiMissing) ? '#94A3B8' : '#1B4332',
                color: '#ffffff', fontSize: 14, fontWeight: 600,
                border: 'none', cursor: (!userInput.trim() || isLoading || apiMissing) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'background 0.15s ease',
              }}
              onMouseOver={e => {
                if (!(!userInput.trim() || isLoading || apiMissing))
                  (e.currentTarget as HTMLButtonElement).style.background = '#14532D'
              }}
              onMouseOut={e => {
                if (!(!userInput.trim() || isLoading || apiMissing))
                  (e.currentTarget as HTMLButtonElement).style.background = '#1B4332'
              }}
            >
              {isLoading ? (
                <>
                  <span style={{
                    width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#ffffff', borderRadius: '50%',
                    display: 'inline-block', animation: 'spin 0.8s linear infinite',
                  }} />
                  Analysing...
                </>
              ) : 'Analyse →'}
            </button>
          </div>
        </div>

        {/* ── Loading Steps ──────────────────────────────────────────────── */}
        {isLoading && (
          <div style={{
            background: '#ffffff', borderRadius: 12, border: '1px solid #E2E8F0',
            padding: '20px 24px', marginBottom: 24,
          }}>
            {[
              'Extracting trade details',
              'Calculating costs and margins',
              'Generating trade signal',
            ].map((step, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '6px 0', opacity: loadingStep >= i + 1 ? 1 : 0.35,
              }}>
                <span style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: loadingStep > i + 1 ? '#1B4332' : (loadingStep === i + 1 ? '#D1FAE5' : '#F1F5F9'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: loadingStep > i + 1 ? '#ffffff' : '#1B4332',
                  flexShrink: 0,
                }}>
                  {loadingStep > i + 1 ? '✓' : (loadingStep === i + 1 ? '•' : '')}
                </span>
                <span style={{ fontSize: 14, color: '#475569', display: 'flex', alignItems: 'center' }}>{step}{loadingStep === i + 1 && <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, marginLeft: 8, position: 'relative', verticalAlign: 'middle' }}><span style={{ position: 'absolute', width: 28, height: 28, borderRadius: '50%', background: 'rgba(22,163,74,0.15)', animation: 'sunPulseOuter 1.5s ease-in-out infinite' }} /><span style={{ position: 'absolute', width: 20, height: 20, borderRadius: '50%', background: 'rgba(22,163,74,0.3)', animation: 'sunPulseMiddle 1.5s ease-in-out infinite 0.2s' }} /><span style={{ position: 'absolute', width: 12, height: 12, borderRadius: '50%', background: '#16a34a', boxShadow: '0 0 8px #16a34a, 0 0 16px rgba(22,163,74,0.8)', animation: 'sunPulseCore 1.5s ease-in-out infinite 0.4s' }} /></span>}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Parse Error ────────────────────────────────────────────────── */}
        {parseError && (
          <div style={{
            background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10,
            padding: '12px 16px', marginBottom: 24, color: '#92400E', fontSize: 14,
          }}>
            {parseError}
          </div>
        )}

        {/* ── Results ───────────────────────────────────────────────────── */}
        {result && extractedData && (() => {
          const cfg = getSignalConfig(result.decision)
          return (
            <div
              ref={resultRef}
              style={{ animation: 'fadeInUp 0.4s ease both' }}
            >
              {/* Signal Banner */}
              <div style={{
                background: cfg.bg, borderRadius: 12, padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: 12,
                marginBottom: 20,
              }}>
                <span style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: cfg.text, color: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, flexShrink: 0,
                }}>
                  {cfg.icon}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: cfg.text }}>
                    {cfg.label}
                  </div>
                  {result.decision !== 'SELL NOW' && result.decision !== 'HOLD' && result.decision !== 'NEGOTIATE' && (
                    <div style={{ fontSize: 13, color: cfg.text, opacity: 0.8, marginTop: 2 }}>
                      Gross margin: {fmtD(result.gross_margin_pct)}% &nbsp;·&nbsp; Threshold: 15%
                    </div>
                  )}
                </div>
                <div style={{
                  background: cfg.text, color: '#ffffff', borderRadius: 20,
                  padding: '4px 12px', fontSize: 12, fontWeight: 700, flexShrink: 0,
                }}>
                  {fmtD(result.gross_margin_pct)}% margin
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 12, marginBottom: 20,
              }}>
                {[
                  { label: 'Net Yield/MT', value: `$${fmt(result.net_yield_per_mt)}`, sub: 'after all costs' },
                  { label: 'Total Net Yield', value: `$${fmt(result.total_net_yield)}`, sub: `on ${result.quantity_mt} MT` },
                  { label: 'Gross Margin', value: `${fmtD(result.gross_margin_pct)}%`, sub: 'vs 15% threshold' },
                  { label: 'Breakeven Price', value: `$${fmt(result.breakeven_price)}/MT`, sub: 'minimum needed' },
                ].map(card => (
                  <div key={card.label} style={{
                    background: '#ffffff', borderRadius: 12, border: '1px solid #E2E8F0',
                    padding: '16px 18px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}>
                    <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500, marginBottom: 4 }}>
                      {card.label}
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>
                      {card.value}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>{card.sub}</div>
                  </div>
                ))}
              </div>

              {/* Processor outturn */}
              {result.effective_wfk_cost !== undefined && (
                <div style={{
                  background: '#EFF6FF', borderRadius: 10, padding: '12px 16px',
                  marginBottom: 16, border: '1px solid #BFDBFE',
                }}>
                  <span style={{ fontSize: 13, color: '#1E40AF', fontWeight: 600 }}>
                    Processor view — Effective WFK cost at 46% outturn: ${fmt(result.effective_wfk_cost)}/MT
                  </span>
                </div>
              )}

              {/* Farmer view */}
              {result.farmer_diff_usd !== undefined && (
                <div style={{
                  background: '#F0FDF4', borderRadius: 10, padding: '12px 16px',
                  marginBottom: 16, border: '1px solid #BBF7D0',
                }}>
                  <div style={{ fontSize: 13, color: '#166534', fontWeight: 600, marginBottom: 4 }}>
                    Farmgate vs RCN Benchmark ($820/MT)
                  </div>
                  <div style={{ fontSize: 13, color: '#166534' }}>
                    Difference: {result.farmer_diff_usd! >= 0 ? '+' : ''}{fmtD(result.farmer_diff_usd!)} USD/MT
                    &nbsp;({result.farmer_diff_tzs! >= 0 ? '+' : ''}{fmtD(result.farmer_diff_tzs!)} TZS/kg)
                  </div>
                </div>
              )}

              {/* Vs benchmark */}
              <div style={{
                background: '#F8FAFC', borderRadius: 10, padding: '10px 16px',
                marginBottom: 16, border: '1px solid #E2E8F0',
                fontSize: 13, color: '#475569',
              }}>
                Price vs {extractedData.grade || 'RCN'} benchmark (${fmt(result.benchmark)}/MT):&nbsp;
                <span style={{ fontWeight: 600, color: result.vs_benchmark_pct >= 0 ? '#065F46' : '#991B1B' }}>
                  {result.vs_benchmark_pct >= 0 ? '+' : ''}{fmtD(result.vs_benchmark_pct)}%
                </span>
              </div>

              {/* Cost Breakdown toggle */}
              <button
                onClick={() => setShowCostBreakdown(v => !v)}
                style={{
                  width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0',
                  borderRadius: 10, padding: '10px 16px', textAlign: 'left',
                  fontSize: 13, color: '#475569', fontWeight: 500, cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 4,
                }}
              >
                <span>Cost Breakdown</span>
                <span>{showCostBreakdown ? '▲' : '▼'}</span>
              </button>

              {showCostBreakdown && (
                <div style={{
                  background: '#ffffff', border: '1px solid #E2E8F0',
                  borderRadius: '0 0 10px 10px', marginBottom: 16, overflow: 'hidden',
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC' }}>
                        {['Item', '$/MT', '% of price'].map(h => (
                          <th key={h} style={{
                            padding: '8px 14px', textAlign: 'left',
                            color: '#94A3B8', fontWeight: 600, fontSize: 11,
                            borderBottom: '1px solid #F1F5F9',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.lines.map((l, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #F8FAFC' }}>
                          <td style={{ padding: '7px 14px', color: '#475569' }}>{l.item}</td>
                          <td style={{ padding: '7px 14px', color: '#0F172A', fontWeight: 500 }}>${fmtD(l.per_mt)}</td>
                          <td style={{ padding: '7px 14px', color: '#94A3B8' }}>{fmtD(l.pct)}%</td>
                        </tr>
                      ))}
                      <tr style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '8px 14px', color: '#0F172A', fontWeight: 700 }}>Total Costs</td>
                        <td style={{ padding: '8px 14px', color: '#0F172A', fontWeight: 700 }}>${fmtD(result.total_costs)}</td>
                        <td style={{ padding: '8px 14px', color: '#0F172A', fontWeight: 700 }}>{fmtD((result.total_costs / result.price_usd) * 100)}%</td>
                      </tr>
                      <tr style={{ background: cfg.bg }}>
                        <td style={{ padding: '8px 14px', color: cfg.text, fontWeight: 700 }}>Net Yield</td>
                        <td style={{ padding: '8px 14px', color: cfg.text, fontWeight: 700 }}>${fmtD(result.net_yield_per_mt)}</td>
                        <td style={{ padding: '8px 14px', color: cfg.text, fontWeight: 700 }}>{fmtD(result.gross_margin_pct)}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              <VerificationLayer
                priceUsd={result.price_usd}
                freight={result.freight}
                totalCosts={result.total_costs}
                netYield={result.net_yield_per_mt}
                grossMargin={result.gross_margin_pct}
                breakeven={result.breakeven_price}
                quantity={result.quantity_mt}
                isTanzania={result.tcb_levy > 0}
                role={role}
                effectiveWfkCost={result.effective_wfk_cost}
              />

              {/* Reasons */}
              <div style={{ marginBottom: 16 }}>
                {cfg.reasons.map((r, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 8, padding: '5px 0',
                    fontSize: 13, color: cfg.text, alignItems: 'flex-start',
                  }}>
                    <span style={{ fontWeight: 700, flexShrink: 0 }}>·</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>

              {/* Missing fields */}
              {extractedData.missing_fields?.length > 0 && (
                <div style={{
                  background: '#FFFBEB', border: '1px solid #FDE68A',
                  borderRadius: 10, padding: '12px 16px', marginBottom: 20,
                  fontSize: 13, color: '#92400E',
                }}>
                  <strong>Estimated values used for:</strong>{' '}
                  {extractedData.missing_fields.join(', ')}.
                  Add exact values for higher accuracy.
                </div>
              )}

              {!isPro ? (
                <div style={{
                  background: '#ffffff', borderRadius: 16, border: '1px solid #E2E8F0',
                  padding: '24px', marginTop: 8, marginBottom: 24,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, color: '#475569', marginBottom: 6, fontWeight: 500 }}>
                      You have used {runCount} of 5 free analyses this month
                    </div>
                    <div style={{
                      height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', background: '#1B4332',
                        width: `${Math.min((runCount / 5) * 100, 100)}%`,
                        borderRadius: 3, transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>

                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>
                    Upgrade to Pro — $9/month
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 16 }}>
                    {[
                      'Unlimited analyses', 'All grades and routes',
                      'Save and compare trades', 'Price alerts',
                      'PDF export', '30-day history',
                    ].map(b => (
                      <div key={b} style={{ fontSize: 13, color: '#475569', display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ color: '#1B4332', fontWeight: 700 }}>✓</span> {b}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => onUpgradeRequest()}
                    style={{
                      width: '100%', background: '#1B4332', color: '#ffffff',
                      border: 'none', borderRadius: 8, padding: '12px',
                      fontSize: 15, fontWeight: 600, cursor: 'pointer',
                      marginBottom: 10,
                    }}
                    onMouseOver={e => { (e.currentTarget as HTMLButtonElement).style.background = '#14532D' }}
                    onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1B4332' }}
                  >
                    Upgrade to Pro →
                  </button>
                  <div style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8' }}>
                    Enterprise — custom pricing · API, team seats, white-label{' '}
                    <span style={{ color: '#1B4332', cursor: 'pointer' }} onClick={() => window.location.href='mailto:ai@lenmacai.com?subject=AgriSMES Enterprise Inquiry&body=Hello, I am interested in AgriSMES Enterprise. My name is: %0D%0ACompany: %0D%0ATeam size: %0D%0AUse case: '}>· Learn more →</span>
                  </div>
                </div>
              ) : (
                <div style={{
                  background: '#F0FDF4', borderRadius: 16, border: '1px solid #BBF7D0',
                  padding: '20px', marginTop: 8, marginBottom: 24,
                }}>
                  {result && (
                    <button
                      onClick={handleExportPDF}
                      style={{
                        width: '100%', background: '#fff', color: '#166534',
                        border: '1px solid #86EFAC', borderRadius: 10,
                        padding: '11px 0', fontSize: 14, fontWeight: 800,
                        cursor: 'pointer', marginBottom: 12, letterSpacing: 0
                      }}
                    >
                      Export as PDF →
                    </button>
                  )}
                  <div style={{ fontSize: 14, color: '#166534', fontWeight: 800, marginBottom: 6 }}>
                    AgriSMES {plan === 'enterprise' ? 'Enterprise' : 'Pro'} active
                  </div>
                  <div style={{ fontSize: 13, color: '#166534' }}>
                    Unlimited analyses are unlocked for this account.
                    {subscription.manageUrl ? (
                      <button
                        onClick={() => window.location.href = subscription.manageUrl!}
                        style={{ marginLeft: 8, color: '#14532D', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Manage subscription
                      </button>
                    ) : (
                      <a href={`mailto:${subscription.supportEmail}?subject=AgriSMES subscription management`} style={{ marginLeft: 8, color: '#14532D', fontWeight: 800 }}>
                        Manage subscription
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })()}

        {/* ── Lead Capture ────────────────────────────────────────────── */}
        {result && (
          <LeadCapture analysisQuery={userInput} />
        )}

        {/* ── Realized Outcome ────────────────────────────────────────────── */}
        {result && extractedData && (
          <RealizedOutcome
            assumedMarginPct={result.gross_margin_pct}
            assumedFreightUsdMt={result.freight}
            assumedBreakevenUsdMt={result.breakeven_price}
            grade={extractedData.grade || ''}
            originCountry={extractedData.origin_port || ''}
            destinationCountry={extractedData.destination_country || ''}
            quantityMt={extractedData.quantity_mt || 0}
            incoterm={extractedData.incoterm || ''}
          />
        )}

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', paddingTop: 24, borderTop: '1px solid #F1F5F9' }}>
          <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 0 4px' }}>
            Results are analytical estimates. Users remain responsible for final commercial decisions.
          </p>
          <p style={{ fontSize: 12, color: '#CBD5E1', margin: 0 }}>
            Powered by AgriSMES
          </p>
        </div>
      </div>

      {/* ── Email Modal ─────────────────────────────────────────────────── */}

      {/* ── Global styles ─────────────────────────────────────────────── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes cursorBlink { 0%,100%{opacity:1;transform:scaleY(1)} 45%{opacity:0;transform:scaleY(0.15)} 55%{opacity:0} } 40%{opacity:0;transform:scaleY(0.2)} 60%{opacity:0} }
         
        @keyframes sunPulseOuter { 0%,100%{transform:scale(1);opacity:0.15} 50%{transform:scale(1.4);opacity:0.3} }
        @keyframes sunPulseMiddle { 0%,100%{transform:scale(1);opacity:0.3} 50%{transform:scale(1.3);opacity:0.5} }
        @keyframes sunPulseCore { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.2);opacity:0.8} }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 768px) {
          h1 { font-size: 28px !important; }
          .metrics-grid { grid-template-columns: 1fr !important; }
        }
        * { box-sizing: border-box; }
        textarea::placeholder { color: #94A3B8; }
        @media print {
          body { background: #fff !important; }
          button { display: none !important; }
          textarea { display: none !important; }
        }
      `}</style>
    </div>
    </>
  )
}
