import { useEffect } from 'react';

interface PaywallBannerProps {
  runsUsed: number;
  onUpgrade: () => void;
}

const FREE_COLS = ['5 analyses/month', 'All grades', 'Basic margin calc', 'Stress test preview'];
const PRO_COLS = ['Unlimited analyses', 'Saved Trade Library', 'Full History', 'PDF Export', 'Advanced intelligence', 'Priority support'];

export function PaywallBanner({ runsUsed, onUpgrade }: PaywallBannerProps) {
  useEffect(() => {
    if (runsUsed >= 5) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [runsUsed]);

  if (runsUsed < 5) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-[#0f1a14] border border-green-500/30 rounded-2xl p-8 max-w-lg w-full text-center shadow-2xl">
        <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">5 free analyses used</h2>
        <p className="text-gray-400 text-sm mb-6">Upgrade to Pro for unlimited analyses and full intelligence access.</p>
        <div className="grid grid-cols-2 gap-3 mb-6 text-left">
          <div className="rounded-xl p-4 border border-white/10 bg-white/5">
            <p className="text-sm font-bold text-gray-400 mb-2">Free</p>
            {FREE_COLS.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 mb-1">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span className="text-xs text-gray-500">{f}</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-4 border border-green-500/40 bg-green-500/5">
            <p className="text-sm font-bold text-green-400 mb-2">Pro</p>
            {PRO_COLS.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 mb-1">
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span className="text-xs text-gray-300">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={onUpgrade} className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
          Upgrade to Pro - $9/month
        </button>
        <p className="text-xs text-gray-600 mt-3">Or $7.99/month billed annually. No hidden fees.</p>
      </div>
    </div>
  );
}
