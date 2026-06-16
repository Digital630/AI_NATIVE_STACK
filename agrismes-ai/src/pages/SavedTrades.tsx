import { useSavedTrades } from '@/hooks/useSavedTrades';
import { Trash2, Star, BookmarkCheck } from 'lucide-react';

const signalColor: Record<string, string> = {
  PROCEED: 'bg-green-500/20 text-green-400 border border-green-500/30',
  CAUTION: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  DANGER:  'bg-red-500/20  text-red-400  border border-red-500/30',
};

export default function SavedTrades({ isPro }: { isPro: boolean }) {
  const { trades, loading, deleteTrade, toggleFavourite } = useSavedTrades();
  const visible = isPro ? trades : trades.slice(0, 3);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh] text-gray-400">
      Loading saved trades...
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <BookmarkCheck className="text-green-400" size={24} />
        <h1 className="text-xl font-semibold text-white">Saved Trades</h1>
        <span className="ml-auto text-xs text-gray-500">{trades.length} saved</span>
      </div>

      {trades.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p>No saved trades yet.</p>
          <p className="text-sm mt-1">Run an analysis and click Save Trade to store it here.</p>
        </div>
      )}

      <div className="space-y-3">
        {visible.map(t => (
          <div key={t.id} className="bg-[#111] border border-white/8 rounded-xl p-4 flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white font-medium text-sm truncate">
                  {t.name || `${t.origin_country} → ${t.destination_country}`}
                </span>
                {t.decision_signal && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${signalColor[t.decision_signal] || signalColor.CAUTION}`}>
                    {t.decision_signal}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{t.grade || '—'}</span>
                <span>·</span>
                <span>{t.incoterm || '—'}</span>
                <span>·</span>
                <span>{t.gross_margin_pct != null ? `${t.gross_margin_pct}% margin` : '—'}</span>
                <span>·</span>
                <span>{new Date(t.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggleFavourite(t.id, !t.is_favourite)}
                className={`p-1.5 rounded-lg transition-colors ${t.is_favourite ? 'text-amber-400' : 'text-gray-600 hover:text-gray-400'}`}
              >
                <Star size={15} fill={t.is_favourite ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={() => deleteTrade(t.id)}
                className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {!isPro && trades.length > 3 && (
        <div className="mt-6 text-center py-6 border border-dashed border-white/10 rounded-xl">
          <p className="text-sm text-gray-400 mb-3">
            {trades.length - 3} more trades hidden — upgrade to Pro to see all
          </p>
          <a href="/pricing" className="text-xs bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-colors">
            Upgrade to Pro
          </a>
        </div>
      )}
    </div>
  );
}
