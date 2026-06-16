import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { TrustBar } from '@/components/TrustBar';
import { supabase } from '@/lib/supabase';
import { useSubscription } from '@/hooks/useSubscription';

const FN = (import.meta.env.VITE_SUPABASE_URL || '') + '/functions/v1/pro-payment';
const FX_URL = (import.meta.env.VITE_SUPABASE_URL || '') + '/functions/v1/get-fx-rate';

const PAYMENT_METHODS = [
  { id: 'wire_usd', label: 'USD Wire Transfer (International)', details: [
    { label: 'Account Name', value: 'Lenmac Company Limited' },
    { label: 'Account Number', value: '10385010074' },
    { label: 'Bank Name', value: 'CRDB Bank PLC' },
    { label: 'Branch', value: 'Lumumba Branch, Dar es Salaam' },
    { label: 'SWIFT Code', value: 'CORUTZTZ' },
    { label: 'Currency', value: 'USD' },
    { label: 'Note', value: 'AgriSMES is a product of Lenmac Company Limited' },
  ]},
  { id: 'tips_tzs', label: 'Lipa Hapa TIPS (Tanzania)', details: [
    { label: 'TIPS Number', value: '116433564' },
    { label: 'Account Name', value: 'Lenmac Company Limited' },
  ]},
  { id: 'tzs_crdb', label: 'TZS Bank Transfer (Tanzania)', details: [
    { label: 'Account Name', value: 'Lenmac Company Limited' },
    { label: 'Account Number', value: '10380945067' },
    { label: 'Bank Name', value: 'CRDB Bank PLC' },
    { label: 'Branch', value: 'Lumumba Branch, Dar es Salaam' },
  ]},
  { id: 'mobile', label: 'Mobile Money (M-Pesa / Airtel / Tigo)', details: [
    { label: 'Contact', value: 'margin@agrismes.com' },
  ]},
];

const PRO_FEATURES = [
  'Unlimited trade analyses','Saved Trade Library','Full Analysis History',
  'PDF Export','Advanced margin intelligence','Priority support',
];

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-gray-500 w-36 shrink-0">{label}</span>
      <span className="text-xs text-white font-mono flex-1 text-right pr-2">{value}</span>
      <button onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="text-xs shrink-0 text-gray-600 hover:text-green-400 transition-colors ml-1">
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

export default function Pricing() {
  const [session, setSession] = useState<Session | null>(null);
  const [method, setMethod] = useState('');
  const [ref, setRef] = useState('');
  const [plan, setPlan] = useState<'pro_monthly' | 'pro_annual'>('pro_monthly');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [tzsRate, setTzsRate] = useState<number | null>(null);
  const subscription = useSubscription(session);

  const amount = plan === 'pro_monthly' ? 9 : 7.99;
  const selectedMethod = PAYMENT_METHODS.find(m => m.id === method);
  const isTzs = ['tips_tzs', 'tzs_crdb', 'mobile'].includes(method);
  const tzsAmount = tzsRate && isTzs ? Math.ceil(amount * tzsRate).toLocaleString() + ' TZS' : null;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    fetch(FX_URL)
      .then(r => r.json())
      .then(d => d.usd_to_tzs && setTzsRate(d.usd_to_tzs))
      .catch(() => setTzsRate(2650));

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async () => {
    if (!method || !ref.trim()) { setError('Please select a payment method and enter your reference.'); return; }
    setLoading(true); setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('Please sign in first.'); setLoading(false); return; }
      const res = await fetch(FN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token },
        body: JSON.stringify({ action: 'submit', plan, payment_method: method, payment_reference: ref, amount_usd: amount, amount_tzs: tzsAmount, email })
      });
      const data = await res.json();
      if (data.success) { setDone(true); } else { setError(data.error || 'Something went wrong.'); }
    } catch { setError('Network error. Please try again.'); }
    setLoading(false);
  };

  if (done) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Payment Reference Received</h1>
        <p className="text-gray-400 mb-2">We will verify your payment and activate Pro access. Usually same day.</p>
        <a href="/" className="text-sm text-green-400 hover:text-green-300">Return to AgriSMES</a>
      </div>
    </div>
  );

  if (subscription.isPro) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center bg-[#111] border border-green-500/20 rounded-2xl p-8">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">AgriSMES Pro Active</h1>
        <p className="text-gray-400 mb-6">This account already has active Pro access.</p>
        {subscription.manageUrl ? (
          <a href={subscription.manageUrl} className="block w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-xl transition-colors mb-3">
            Manage Subscription
          </a>
        ) : (
          <a href={`mailto:${subscription.supportEmail}?subject=AgriSMES subscription management`} className="block w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-xl transition-colors mb-3">
            Manage Subscription
          </a>
        )}
        <a href="/" className="text-sm text-green-400 hover:text-green-300">Return to AgriSMES</a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Upgrade to AgriSMES Pro</h1>
          <p className="text-gray-400 text-sm">Verification infrastructure for serious cashew traders</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-4">Choose Plan</h2>
            <div className="flex gap-2 mb-5">
              {(['pro_monthly', 'pro_annual'] as const).map(p => (
                <button key={p} onClick={() => setPlan(p)}
                  className={'flex-1 py-2 rounded-xl text-sm font-medium transition-colors ' + (plan === p ? 'bg-green-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10')}>
                  {p === 'pro_monthly' ? 'Monthly' : 'Annual'}
                </button>
              ))}
            </div>
            <div className="mb-5">
              <span className="text-4xl font-bold text-white">${amount}</span>
              <span className="text-gray-500 text-sm ml-2">{plan === 'pro_monthly' ? '/month' : '/month billed annually'}</span>
              {plan === 'pro_annual' && <p className="text-xs text-green-400 mt-1">Save 11% vs monthly</p>}
            </div>
            <div className="space-y-2">
              {PRO_FEATURES.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className="text-sm text-gray-300">{f}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-1">Payment Details</h2>
            <p className="text-xs text-gray-500 mb-4">Pay using any method below then submit your transaction reference.</p>
            <div className="space-y-2 mb-4">
              {PAYMENT_METHODS.map(m => (
                <div key={m.id} onClick={() => setMethod(m.id)}
                  className={'border rounded-xl p-3 cursor-pointer transition-colors ' + (method === m.id ? 'border-green-500/40 bg-green-500/5' : 'border-white/8 hover:border-white/20')}>
                  <div className="flex items-center gap-2">
                    <div className={'w-3 h-3 rounded-full border-2 shrink-0 ' + (method === m.id ? 'border-green-400 bg-green-400' : 'border-gray-600')} />
                    <span className="text-sm text-white">{m.label}</span>
                  </div>
                </div>
              ))}
            </div>
            {tzsAmount && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 mb-4 text-center">
                <p className="text-green-400 font-semibold text-sm">Amount to pay: {tzsAmount}</p>
                <p className="text-xs text-gray-500 mt-1">Rate: 1 USD = {tzsRate?.toFixed(0)} TZS (live rate)</p>
              </div>
            )}
            {selectedMethod && (
              <div className="bg-black/40 border border-white/8 rounded-xl p-3 mb-4">
                <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Bank Details</p>
                {selectedMethod.details.map((d, i) => <CopyRow key={i} label={d.label} value={d.value} />)}
              </div>
            )}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">Your Email Address</label>
              <input value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500/40 mb-3" />
              <label className="block text-xs text-gray-500 mb-1">Transaction Reference Number</label>
              <input value={ref} onChange={e => setRef(e.target.value)}
                placeholder="Enter your transaction reference"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500/40" />
            </div>
            {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
              {loading ? 'Submitting...' : 'Submit Payment Reference'}
            </button>
            <p className="text-xs text-gray-600 text-center mt-3">
              Pro access activated after payment verification. Usually same day.
              Questions: <a href="mailto:margin@agrismes.com" className="text-green-500/70">margin@agrismes.com</a>
            </p>
          </div>
        </div>
      </div>
      <TrustBar />
    </div>
  );
}
