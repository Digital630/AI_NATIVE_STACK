import React from "react";
import { AlertTriangle, CheckCircle, Info, Clock, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type ConfidenceLevel = "High" | "Moderate" | "Low";

interface MoistureRangeDisplayProps {
  moistureMin: number;
  moistureMax: number;
  centerValue: number;
  confidence: ConfidenceLevel;
  method?: string;
  timestamp: string;
  commodity?: string;
  showReferenceRange?: boolean;
  referenceMin?: number;
  referenceMax?: number;
}

interface WeightRangeDisplayProps {
  weightKg: number;
  stabilityMin: number;
  stabilityMax: number;
  confidence: ConfidenceLevel;
  storageCondition?: "stable" | "variable" | "humid";
  timestamp: string;
}

interface QCConfidenceDisplayProps {
  grade: string;
  gradeDescription: string;
  confidence: ConfidenceLevel;
  timestamp: string;
}

// Calculate range based on confidence level
export function calculateMoistureRange(
  centerValue: number,
  confidence: ConfidenceLevel
): { min: number; max: number } {
  let halfWidth: number;
  switch (confidence) {
    case "High":
      halfWidth = 0.3; // ±0.3%
      break;
    case "Moderate":
      halfWidth = 0.7; // ±0.7%
      break;
    case "Low":
    default:
      halfWidth = 1.5; // ±1.5%
      break;
  }
  return {
    min: Math.round((centerValue - halfWidth) * 10) / 10,
    max: Math.round((centerValue + halfWidth) * 10) / 10,
  };
}

// Calculate weight stability range based on confidence and conditions
export function calculateWeightStabilityRange(
  weightKg: number,
  confidence: ConfidenceLevel,
  storageCondition: "stable" | "variable" | "humid" = "stable"
): { min: number; max: number } {
  // Base variance percentage
  let variancePercent: number;
  switch (confidence) {
    case "High":
      variancePercent = 2; // ±2%
      break;
    case "Moderate":
      variancePercent = 5; // ±5%
      break;
    case "Low":
    default:
      variancePercent = 8; // ±8%
      break;
  }

  // Adjust for storage conditions
  if (storageCondition === "humid") {
    variancePercent *= 1.5;
  } else if (storageCondition === "variable") {
    variancePercent *= 1.25;
  }

  const variance = (weightKg * variancePercent) / 100;
  return {
    min: Math.round((weightKg - variance) * 10) / 10,
    max: Math.round((weightKg + variance) * 10) / 10,
  };
}

const ConfidenceIcon = ({ level }: { level: ConfidenceLevel }) => {
  switch (level) {
    case "High":
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case "Moderate":
      return <Info className="w-4 h-4 text-yellow-600" />;
    case "Low":
    default:
      return <AlertTriangle className="w-4 h-4 text-orange-600" />;
  }
};

const getConfidenceBadgeClass = (level: ConfidenceLevel) => {
  switch (level) {
    case "High":
      return "bg-green-100 text-green-800 border-green-200";
    case "Moderate":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Low":
    default:
      return "bg-orange-100 text-orange-800 border-orange-200";
  }
};

export function MoistureRangeDisplay({
  moistureMin,
  moistureMax,
  centerValue,
  confidence,
  method = "Visual + Context",
  timestamp,
  commodity,
  showReferenceRange = false,
  referenceMin,
  referenceMax,
}: MoistureRangeDisplayProps) {
  const formattedTime = new Date(timestamp).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const formattedDate = new Date(timestamp).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });

  return (
    <div className="bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-xl p-4 space-y-3">
      {/* Main Range Display */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          Estimated Moisture Range
        </p>
        <div className="flex items-center justify-center gap-1">
          <span className="text-3xl font-bold text-primary">{moistureMin}</span>
          <span className="text-2xl text-muted-foreground">–</span>
          <span className="text-3xl font-bold text-primary">{moistureMax}</span>
          <span className="text-xl text-muted-foreground ml-1">%</span>
        </div>
        {commodity && (
          <p className="text-sm text-muted-foreground mt-1">{commodity}</p>
        )}
      </div>

      {/* Reference Range (if applicable) */}
      {showReferenceRange && referenceMin !== undefined && referenceMax !== undefined && (
        <div className="text-center text-xs text-muted-foreground">
          <span>Reference range: {referenceMin}–{referenceMax}%</span>
        </div>
      )}

      {/* Confidence + Method Row */}
      <div className="flex items-center justify-between pt-2 border-t border-green-100">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`${getConfidenceBadgeClass(confidence)} flex items-center gap-1`}
          >
            <ConfidenceIcon level={confidence} />
            <span>{confidence}</span>
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Activity className="w-3 h-3" />
          <span>{method}</span>
        </div>
      </div>

      {/* Timestamp */}
      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
        <Clock className="w-3 h-3" />
        <span>{formattedDate} at {formattedTime}</span>
      </div>
    </div>
  );
}

export function WeightRangeDisplay({
  weightKg,
  stabilityMin,
  stabilityMax,
  confidence,
  storageCondition = "stable",
  timestamp,
}: WeightRangeDisplayProps) {
  const formattedTime = new Date(timestamp).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const formattedDate = new Date(timestamp).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });

  const conditionLabel = {
    stable: "Stable conditions",
    variable: "Variable conditions",
    humid: "High humidity",
  }[storageCondition];

  return (
    <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl p-4 space-y-3">
      {/* Main Weight Display */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          Estimated Weight
        </p>
        <div className="flex items-center justify-center gap-1">
          <span className="text-4xl font-bold text-blue-700">{weightKg}</span>
          <span className="text-xl text-muted-foreground ml-1">kg</span>
        </div>
      </div>

      {/* Stability Range */}
      <div className="text-center bg-blue-50/50 rounded-lg py-2">
        <p className="text-xs text-muted-foreground mb-1">Weight Stability Range</p>
        <div className="flex items-center justify-center gap-1 text-sm">
          <span className="font-medium text-blue-700">{stabilityMin}</span>
          <span className="text-muted-foreground">–</span>
          <span className="font-medium text-blue-700">{stabilityMax}</span>
          <span className="text-muted-foreground ml-1">kg</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">{conditionLabel}</p>
      </div>

      {/* Confidence Row */}
      <div className="flex items-center justify-between pt-2 border-t border-blue-100">
        <Badge
          variant="outline"
          className={`${getConfidenceBadgeClass(confidence)} flex items-center gap-1`}
        >
          <ConfidenceIcon level={confidence} />
          <span>{confidence}</span>
        </Badge>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{formattedDate} at {formattedTime}</span>
        </div>
      </div>
    </div>
  );
}

export function QCConfidenceDisplay({
  grade,
  gradeDescription,
  confidence,
  timestamp,
}: QCConfidenceDisplayProps) {
  const formattedTime = new Date(timestamp).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const formattedDate = new Date(timestamp).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });

  return (
    <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-xl p-4 space-y-3">
      {/* Grade Display */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          Quality Grade
        </p>
        <p className="text-2xl font-bold text-amber-700">{grade}</p>
        <p className="text-sm text-muted-foreground mt-1">{gradeDescription}</p>
      </div>

      {/* Confidence Row */}
      <div className="flex items-center justify-between pt-2 border-t border-amber-100">
        <Badge
          variant="outline"
          className={`${getConfidenceBadgeClass(confidence)} flex items-center gap-1`}
        >
          <ConfidenceIcon level={confidence} />
          <span>{confidence}</span>
        </Badge>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{formattedDate} at {formattedTime}</span>
        </div>
      </div>
    </div>
  );
}
