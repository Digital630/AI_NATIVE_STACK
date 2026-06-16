interface ConfidenceRiskBadgeProps {
  snapshot: {
    confidence?: string | null;
    risk_level?: string | null;
  };
}

export function ConfidenceRiskBadge({ snapshot }: ConfidenceRiskBadgeProps) {
  if (!snapshot?.confidence && !snapshot?.risk_level) return null;

  const confidenceColor: Record<string, string> = {
    High: "text-emerald-600 bg-emerald-500/10",
    Medium: "text-amber-600 bg-amber-500/10",
    Low: "text-red-600 bg-red-500/10",
  };

  const riskColor: Record<string, string> = {
    Low: "text-emerald-600 bg-emerald-500/10",
    Medium: "text-amber-600 bg-amber-500/10",
    High: "text-red-600 bg-red-500/10",
  };

  return (
    <div className="flex items-center gap-3 mb-1">
      {snapshot.confidence && (
        <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${confidenceColor[snapshot.confidence] || "text-muted-foreground bg-secondary"}`}>
          Confidence: {snapshot.confidence}
        </span>
      )}
      {snapshot.risk_level && (
        <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${riskColor[snapshot.risk_level] || "text-muted-foreground bg-secondary"}`}>
          Risk: {snapshot.risk_level}
        </span>
      )}
    </div>
  );
}
