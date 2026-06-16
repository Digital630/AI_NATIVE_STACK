import React from "react";
import { Info, AlertTriangle } from "lucide-react";

interface AnalysisDisclaimerProps {
  type: "moisture" | "weight" | "qc";
  variant?: "inline" | "card";
}

const DISCLAIMERS = {
  moisture: {
    title: "Estimation Notice",
    text: "This is a visual-based moisture estimate for decision-support only. It is not equivalent to physical meter (e.g., Super Point, dielectric) or oven-dry reference methods. For trade-critical decisions, verify with certified equipment.",
    method: "Visual + AI Context Analysis",
  },
  weight: {
    title: "Estimation Notice", 
    text: "This is a visual weight estimate for guidance only. Actual weight may vary based on bag fullness, moisture content, and packaging. Always verify with a certified scale before trade.",
    method: "Visual Package Detection",
  },
  qc: {
    title: "Assessment Notice",
    text: "This is a visual quality assessment for decision-support only. It does not replace laboratory testing, professional grading, or certified inspection. Results should be used alongside other quality verification methods.",
    method: "Visual Defect Analysis",
  },
};

export function AnalysisDisclaimer({ type, variant = "card" }: AnalysisDisclaimerProps) {
  const config = DISCLAIMERS[type];

  if (variant === "inline") {
    return (
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
        <span>{config.text}</span>
      </div>
    );
  }

  return (
    <div className="bg-amber-50/50 border border-amber-200/50 rounded-lg p-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-medium text-amber-800 mb-1">{config.title}</p>
          <p className="text-xs text-amber-700">{config.text}</p>
          <p className="text-[10px] text-amber-600 mt-1">Method: {config.method}</p>
        </div>
      </div>
    </div>
  );
}

// Method explanation component
interface MethodExplanationProps {
  showDetails?: boolean;
}

export function MethodExplanation({ showDetails = false }: MethodExplanationProps) {
  if (!showDetails) return null;

  return (
    <div className="bg-blue-50/50 border border-blue-200/50 rounded-lg p-3 text-xs">
      <p className="font-medium text-blue-800 mb-2">Measurement Method Comparison</p>
      <div className="space-y-2 text-blue-700">
        <div>
          <span className="font-medium">Oven-dry (Reference):</span>
          <span className="ml-1">Most accurate. Laboratory standard.</span>
        </div>
        <div>
          <span className="font-medium">Dielectric meter (e.g., Super Point):</span>
          <span className="ml-1">Typical variance ±0.5–1.0% vs oven-dry.</span>
        </div>
        <div>
          <span className="font-medium">Visual/AI estimation (this tool):</span>
          <span className="ml-1">Typical variance ±1.5–2.5% vs reference.</span>
        </div>
      </div>
      <p className="text-[10px] text-blue-600 mt-2 italic">
        Different methods read differently. None are "wrong"—they measure different moisture indicators.
      </p>
    </div>
  );
}

// Reference range display
interface ReferenceRangeProps {
  commodity: string;
  targetMin: number;
  targetMax: number;
  maxAcceptable: number;
}

export function ReferenceRangeDisplay({ commodity, targetMin, targetMax, maxAcceptable }: ReferenceRangeProps) {
  return (
    <div className="bg-muted/30 rounded-lg p-3 text-xs">
      <p className="font-medium text-foreground mb-2">Reference Range ({commodity})</p>
      <div className="flex items-center gap-4">
        <div>
          <span className="text-muted-foreground">Target:</span>
          <span className="ml-1 font-medium text-primary">{targetMin}–{targetMax}%</span>
        </div>
        <div>
          <span className="text-muted-foreground">Upper limit:</span>
          <span className="ml-1 font-medium">≤{maxAcceptable}%</span>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1 italic">
        Based on Codex Alimentarius / ISO / industry standards (reference guidance only)
      </p>
    </div>
  );
}
