import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Bookmark, BookmarkX, PlusCircle } from "lucide-react";
import { useAnalysesStorage } from "@/hooks/useAnalysesStorage";
import { toast } from "sonner";

const SIGNAL_COLORS: Record<string, string> = {
  Proceed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  "Proceed with Caution": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  "Investigate Further": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "High Risk": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  Reject: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function SavedItems() {
  const navigate = useNavigate();
  const { savedAnalyses, isLoading, error, toggleSaved } = useAnalysesStorage();

  return (
    <>
      <Helmet><title>Saved Items — AGRISMES</title></Helmet>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-xl font-semibold text-foreground mb-6">Saved Items</h1>

        {isLoading && <div className="text-center py-20 text-muted-foreground text-sm">Loading…</div>}
        {error && <div className="text-center py-20 text-muted-foreground text-sm">Unable to load data. Please try again.</div>}

        {!isLoading && !error && savedAnalyses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bookmark className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h2 className="text-lg font-medium text-foreground mb-2">No saved deals yet</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">Bookmark analyses from your history to quickly access them later.</p>
            <button onClick={() => navigate("/analysis/history")} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              View My Analyses
            </button>
          </div>
        )}

        {!isLoading && !error && savedAnalyses.length > 0 && (
          <div className="space-y-2">
            {savedAnalyses.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-border bg-background hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer group"
                onClick={() => navigate(`/analysis/${a.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {a.commodity && <span className="text-[11px] font-semibold uppercase tracking-wider text-primary/70">{a.commodity}</span>}
                    {a.decision_signal && (
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${SIGNAL_COLORS[a.decision_signal] || "bg-muted text-muted-foreground"}`}>
                        {a.decision_signal}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground truncate">{a.query}</p>
                  <span className="text-[11px] text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSaved(a.id, false); toast.success("Removed from saved"); }}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
                  title="Remove from saved"
                >
                  <BookmarkX className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
