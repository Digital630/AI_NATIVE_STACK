import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { BarChart3, PlusCircle, Bookmark, BookmarkCheck, Trash2 } from "lucide-react";
import { useAnalysesStorage } from "@/hooks/useAnalysesStorage";
import { toast } from "sonner";

const SIGNAL_COLORS: Record<string, string> = {
  Proceed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  "Proceed with Caution": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  "Investigate Further": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "High Risk": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  Reject: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function MyAnalyses() {
  const navigate = useNavigate();
  const { analyses, isLoading, error, toggleSaved, deleteAnalysis } = useAnalysesStorage();

  return (
    <>
      <Helmet><title>My Analyses — AGRISMES</title></Helmet>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-foreground">My Analyses</h1>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> New Analysis
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading analyses…</div>
        )}

        {error && (
          <div className="text-center py-20 text-muted-foreground text-sm">
            Unable to load data. Please try again.
          </div>
        )}

        {!isLoading && !error && analyses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h2 className="text-lg font-medium text-foreground mb-2">No analyses yet</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Start evaluating trade deals to build your analysis history.
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Start New Analysis
            </button>
          </div>
        )}

        {!isLoading && !error && analyses.length > 0 && (
          <div className="space-y-2">
            {analyses.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-border bg-background hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer group"
                onClick={() => navigate(`/analysis/${a.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {a.commodity && (
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-primary/70">{a.commodity}</span>
                    )}
                    {a.decision_signal && (
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${SIGNAL_COLORS[a.decision_signal] || "bg-muted text-muted-foreground"}`}>
                        {a.decision_signal}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground truncate">{a.query}</p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                    <span>{new Date(a.created_at).toLocaleDateString()}</span>
                    {a.origin && a.destination && <span>{a.origin} → {a.destination}</span>}
                    {a.risk_level && <span>Risk: {a.risk_level}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => { toggleSaved(a.id, !a.is_saved); toast.success(a.is_saved ? "Removed from saved" : "Saved"); }}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                    title={a.is_saved ? "Remove from saved" : "Save"}
                  >
                    {a.is_saved ? <BookmarkCheck className="w-4 h-4 text-primary" /> : <Bookmark className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => { deleteAnalysis(a.id); toast.success("Analysis deleted"); }}
                    className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
