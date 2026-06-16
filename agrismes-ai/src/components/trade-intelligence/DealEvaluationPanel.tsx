import { useState } from "react";
import type { DealEvaluation } from "@/types/trade";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SIGNAL_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  "Proceed": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  "Proceed with Caution": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  "Investigate Further": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  "High Risk": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  "Reject": { bg: "bg-red-100", text: "text-red-800", border: "border-red-300" },
};

const CONFIDENCE_DOT: Record<string, string> = {
  High: "bg-emerald-500",
  Medium: "bg-amber-500",
  Low: "bg-red-500",
};

const RISK_DOT: Record<string, string> = {
  Low: "bg-emerald-500",
  Medium: "bg-amber-500",
  High: "bg-red-500",
};

interface DealEvaluationPanelProps {
  evaluation: DealEvaluation;
}

function ExpandableCard({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary/30 transition-colors"
      >
        {title}
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 text-sm">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DealEvaluationPanel({ evaluation }: DealEvaluationPanelProps) {
  const style = SIGNAL_STYLES[evaluation.decision_signal] || SIGNAL_STYLES["Investigate Further"];

  return (
    <div className="space-y-4">
      {/* Hero decision signal */}
      <div className={`rounded-lg border-2 ${style.border} ${style.bg} p-4`}>
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <span className={`text-lg font-bold ${style.text}`}>
            {evaluation.decision_signal}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`w-2 h-2 rounded-full ${CONFIDENCE_DOT[evaluation.confidence_level] || "bg-muted"}`} />
            Confidence: {evaluation.confidence_level}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`w-2 h-2 rounded-full ${RISK_DOT[evaluation.risk_level] || "bg-muted"}`} />
            Risk: {evaluation.risk_level}
          </span>
        </div>
        {evaluation.summary && (
          <p className="text-sm text-foreground/80 leading-relaxed">{evaluation.summary}</p>
        )}
      </div>

      {/* Expandable detail cards */}
      <div className="space-y-2">
        {evaluation.key_flags?.length > 0 && (
          <ExpandableCard title={`Key Flags (${evaluation.key_flags.length})`} defaultOpen>
            <ul className="space-y-1 text-foreground">
              {evaluation.key_flags.map((f, i) => <li key={i}>· {f}</li>)}
            </ul>
          </ExpandableCard>
        )}

        {evaluation.strengths?.length > 0 && (
          <ExpandableCard title={`Strengths (${evaluation.strengths.length})`}>
            <ul className="space-y-1 text-foreground">
              {evaluation.strengths.map((s, i) => <li key={i}>· {s}</li>)}
            </ul>
          </ExpandableCard>
        )}

        {evaluation.missing_information?.length > 0 && (
          <ExpandableCard title={`Missing Information (${evaluation.missing_information.length})`}>
            <ul className="space-y-1 text-foreground">
              {evaluation.missing_information.map((m, i) => <li key={i}>· {m}</li>)}
            </ul>
          </ExpandableCard>
        )}

        {evaluation.recommended_next_checks?.length > 0 && (
          <ExpandableCard title={`Next Checks (${evaluation.recommended_next_checks.length})`}>
            <ul className="space-y-1 text-foreground">
              {evaluation.recommended_next_checks.map((c, i) => <li key={i}>· {c}</li>)}
            </ul>
          </ExpandableCard>
        )}
      </div>
    </div>
  );
}
