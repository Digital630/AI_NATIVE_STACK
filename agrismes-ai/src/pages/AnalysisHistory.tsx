
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Clock, TrendingUp, AlertTriangle, XCircle, BookmarkPlus } from 'lucide-react';

const SIGNAL: Record<string, { cls: string; label: string }> = {
  PROCEED: { cls: 'text-green-400 bg-green-500/10 border-green-500/20', label: 'PROCEED' },
  CAUTION: { cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20', label: 'CAUTION' },
  DANGER:  { cls: 'text-red-400 bg-red-500/10 border-red-500/20',       label: 'DANGER'  },
};

interface Analysis {
  id: string; created_at: string; user_input?: string; decision_signal?: string;
  origin_country?: string; destination_country?: string; grade?: string;
  incoterm?: string; gross_margin_pct?: number; net_yield_per_mt?: number;
  quantity_mt?: number; price_usd_mt?: number;
}

export default function AnalysisHistory({ isPro, onSave }: { isPro: boolean; onSave?: (a: Analysis) => void }) {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const { data } = await supabase
        .from('analyses')
        .select('id,created_at,user_input,decision_signal,origin_country,destination_country,grade,incoterm,gross_margin_pct,net_yield_per_mt,quantity_mt,price_usd_mt')
        .order('created_at', { ascending: false })
        .limit(isPro ? 100 : 10);
      setAnalyses(data || []);
      setLoading(false);
    };
    load();
  }, [isPro]);

  const handleSave = async (a: Analysis) => {
    if (!onSave) return;
    setSaving(a.id);
    await onSave(a);
    setSaving(null);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[40vh] text-gray-400 text-sm">Loading history...</div>;

  if (analyses.length === 0) return (
    <div className="text-center py-16 text-gray-500">
      <Clock size={32} className="mx-auto mb-3 opacity-40" />
      <p>No analyses yet.</p>
      <p className="text-sm mt-1">Run your first trade analysis to see it here.</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Clock className="text-blue-400" size={22} />
        <h1 className="text-xl font-semibold text-white">Analysis History</h1>
        <span className="ml-auto text-xs text-gray-500">{analyses.length} analyses</span>
      </div>

      {!isPro && (
        <div className="mb-4 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400">
          Showing last 10 analyses. Upgrade to Pro for full history.
        </div>
      )}

      <div className="space-y-3">
        {analyses.map(a => {
          const sig = SIGNAL[a.decision_signal || ''] || SIGNAL.CAUTION;
          const margin = a.gross_margin_pct;
          const marginCls = margin == null ? '' : margin >= 10 ? 'text-green-400' : margin >= 5 ? 'text-amber-400' : 'text-red-400';
          return (
            <div key={a.id} className="bg-[#0f0f0f] border border-white/6 rounded-xl p-4 hover:border-white/12 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ' + sig.cls}>
                      {sig.label}
                    </span>
                    {a.grade && <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{a.grade}</span>}
                    {a.incoterm && <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{a.incoterm}</span>}
                  </div>
                  <div className="text-sm text-gray-300 mb-2">
                    {a.origin_country && a.destination_country
                      ? <span className="font-medium">{a.origin_country} to {a.destination_country}</span>
                      : <span className="text-gray-500 italic text-xs">{(a.user_input || 'Trade analysis').slice(0, 80)}</span>
                    }
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    {margin != null && <span className={marginCls}>{margin}% margin</span>}
                    {a.net_yield_per_mt != null && <span>${a.net_yield_per_mt}/MT net</span>}
                    {a.quantity_mt != null && <span>{a.quantity_mt} MT</span>}
                    <span className="ml-auto">{new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
                {onSave && (
                  <button onClick={() => handleSave(a)} disabled={saving === a.id}
                    className="shrink-0 p-2 rounded-lg text-gray-600 hover:text-blue-400 hover:bg-blue-500/10 transition-colors disabled:opacity-40"
                    title="Save this trade">
                    <BookmarkPlus size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!isPro && analyses.length >= 10 && (
        <div className="mt-6 text-center py-6 border border-dashed border-white/10 rounded-xl">
          <p className="text-sm text-gray-400 mb-3">Full history available on Pro</p>
          <a href="/pricing" className="text-xs bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-colors">Upgrade to Pro</a>
        </div>
      )}
    </div>
  );
}
