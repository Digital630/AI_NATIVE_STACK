interface UpgradeModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  message?: string;
}

export default function UpgradeModal({ isOpen, onClose, message }: UpgradeModalProps) {
  if (!isOpen) return null;

  const handleUpgrade = () => {
    if (onClose) onClose();
    window.location.href = '/pricing';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center">
        <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 11c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1 4h-2v-2h2v2z" fill="#fbbf24"/>
          </svg>
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Pro Feature</h2>
        <p className="text-gray-400 text-sm mb-6">{message || 'This feature requires an AgriSMES Pro subscription.'}</p>
        <button
          onClick={handleUpgrade}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-xl transition-colors mb-3">
          Upgrade to Pro - $9/mo
        </button>
        <button
          onClick={onClose}
          className="w-full text-gray-500 hover:text-gray-400 text-sm py-2 transition-colors">
          Not now
        </button>
      </div>
    </div>
  );
}
