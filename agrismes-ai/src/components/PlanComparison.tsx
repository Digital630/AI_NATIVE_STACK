const FREE_FEATURES = [
  '5 analyses per month',
  'All grades (W180, W240, W320)',
  'Basic margin calculation',
  'Stress test preview',
  'Mobile-friendly',
];

const PRO_FEATURES = [
  'Unlimited analyses',
  'RCN + All kernel grades',
  'All routes and incoterms',
  'Saved Trade Library',
  'Full Analysis History',
  'PDF Export',
  'Margin Survival Analysis',
  'Stress Testing Engine',
  'Hidden Risk Detection',
  'Freight and FX Shock Analysis',
  'Priority support',
];

const Check = ({ color }: { color: string }) => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
    <path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export function PlanComparison() {
  return (
    <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
      <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-6">
        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Free</p>
        <div className="text-3xl font-bold text-white mb-4">
          $0<span className="text-base font-normal text-gray-500">/mo</span>
        </div>
        <div className="space-y-2 mb-6">
          {FREE_FEATURES.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <Check color="#6b7280" />
              <span className="text-sm text-gray-500">{f}</span>
            </div>
          ))}
        </div>
        <a href="/" className="block text-center border border-white/10 text-gray-400 py-2.5 rounded-xl text-sm hover:bg-white/5 transition-colors">
          Get Started Free
        </a>
      </div>

      <div className="bg-[#0f1a14] border border-green-500/30 rounded-2xl p-6 relative">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
          MOST POPULAR
        </div>
        <p className="text-xs uppercase tracking-wider text-green-400 mb-1">Pro</p>
        <div className="text-3xl font-bold text-white mb-4">
          $9<span className="text-base font-normal text-gray-400">/mo</span>
        </div>
        <div className="space-y-2 mb-6">
          {PRO_FEATURES.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <Check color="#4ade80" />
              <span className="text-sm text-gray-300">{f}</span>
            </div>
          ))}
        </div>
        <a href="/pricing" className="block text-center bg-green-600 hover:bg-green-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
          Upgrade to Pro
        </a>
      </div>
    </div>
  );
}
