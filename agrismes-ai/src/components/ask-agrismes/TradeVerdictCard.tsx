interface TradeVerdict {
  signal: string;
  score: number | null;
  execution_risk: string;
  margin_window: string;
  conclusion: string;
}

interface TradeVerdictCardProps {
  verdict: TradeVerdict;
}

function getSignalStyle(signal: string) {
  const s = signal.toUpperCase();
  if (s === "PROCEED") return { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", dot: "bg-emerald-500" };
  if (s.includes("CONDITION")) return { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", dot: "bg-amber-500" };
  return { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", dot: "bg-red-500" };
}

function getRiskStyle(risk: string) {
  const r = risk.toLowerCase();
  if (r === "low") return "text-emerald-700";
  if (r === "medium") return "text-amber-700";
  return "text-red-700";
}

export function TradeVerdictCard({ verdict }: TradeVerdictCardProps) {
  const style = getSignalStyle(verdict.signal);

  return (
    <div className={`rounded-xl border ${style.border} ${style.bg} p-5 space-y-4`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${style.dot} shrink-0 mt-0.5`} />
          <div>
            <p className={`text-lg font-semibold ${style.text} leading-tight`}>{verdict.signal}</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-lg">{verdict.conclusion}</p>
          </div>
        </div>
        {verdict.score !== null && (
          <div className="text-right shrink-0">
            <p className="text-3xl font-bold text-foreground leading-none">{verdict.score}</p>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">Score</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6 pt-2 border-t border-border/40">
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Risk</p>
          <p className={`text-sm font-medium ${getRiskStyle(verdict.execution_risk)}`}>{verdict.execution_risk}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Margin</p>
          <p className="text-sm font-medium text-foreground">{verdict.margin_window}</p>
        </div>
      </div>
    </div>
  );
}
