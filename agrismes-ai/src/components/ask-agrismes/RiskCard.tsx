import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface Risk {
  category: string;
  description: string;
  severity: string;
  impact: string;
}

interface RiskCardProps {
  risks: Risk[];
}

function getSeverityDot(severity: string) {
  const s = severity.toLowerCase();
  if (s === "low") return "bg-emerald-500";
  if (s === "medium") return "bg-amber-500";
  return "bg-red-500";
}

export function RiskCard({ risks }: RiskCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (!risks?.length) return null;

  const preview = risks.slice(0, 2);
  const rest = risks.slice(2);

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Critical Risks</p>
      <div className="space-y-2">
        {preview.map((risk, i) => (
          <RiskRow key={i} risk={risk} />
        ))}
        {rest.length > 0 && expanded && rest.map((risk, i) => (
          <RiskRow key={i + 2} risk={risk} />
        ))}
        {rest.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
            {expanded ? "Show less" : `+${rest.length} more`}
          </button>
        )}
      </div>
    </div>
  );
}

function RiskRow({ risk }: { risk: Risk }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border p-3">
      <div className={`w-2 h-2 rounded-full ${getSeverityDot(risk.severity)} shrink-0 mt-1.5`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{risk.category}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{risk.severity}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{risk.description}</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Impact: {risk.impact}</p>
      </div>
    </div>
  );
}
