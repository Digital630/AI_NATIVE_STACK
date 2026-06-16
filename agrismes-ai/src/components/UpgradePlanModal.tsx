interface UpgradePlanModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function UpgradePlanModal({ isOpen, onClose }: UpgradePlanModalProps) {
  if (!isOpen) return null;

  const handleUpgrade = () => {
    if (onClose) onClose();
    window.location.href = '/pricing';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Upgrade to AgriSMES Pro</h2>
        <p className="text-gray-400 text-sm mb-6">Unlock unlimited analyses, saved trades, PDF export, and full margin intelligence.</p>
        <div className="text-3xl font-bold text-white mb-1">$9<span className="text-base font-normal text-gray-400">/month</span></div>
        <p className="text-xs text-gray-500 mb-6">Or $7.99/month billed annually</p>
        <button
          onClick={handleUpgrade}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-xl transition-colors mb-3">
          See Payment Options
        </button>
        <button
          onClick={onClose}
          className="w-full text-gray-500 hover:text-gray-400 text-sm py-2 transition-colors">
        </button>
      </div>
    </div>
  );
}
