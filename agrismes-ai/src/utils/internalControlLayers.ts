// Internal Control Layers for AgriSMES Analysis System
// ADDITIVE ONLY - Silent internal systems with no UI

import { supabase } from "@/integrations/supabase/client";
import type { StorageContext } from "@/utils/weatherRiskCalculations";

// ============================================
// 1. CALIBRATION LAYER
// ============================================

interface CalibrationDelta {
  commodity: string;
  region?: string;
  storageType?: string;
  measurementMethod: "optical" | "dielectric" | "reference";
  appValue: number;
  referenceValue: number;
  delta: number;
  timestamp: Date;
}

// In-memory calibration history (would persist to Supabase in production)
const calibrationHistory: CalibrationDelta[] = [];

export function recordCalibrationDelta(
  commodity: string,
  appValue: number,
  referenceValue: number,
  context?: {
    region?: string;
    storageType?: string;
    measurementMethod?: "optical" | "dielectric" | "reference";
  }
): void {
  const delta: CalibrationDelta = {
    commodity,
    region: context?.region,
    storageType: context?.storageType,
    measurementMethod: context?.measurementMethod || "optical",
    appValue,
    referenceValue,
    delta: appValue - referenceValue,
    timestamp: new Date(),
  };
  
  calibrationHistory.push(delta);
  
  // Keep last 100 entries
  if (calibrationHistory.length > 100) {
    calibrationHistory.shift();
  }
  
  // Log to console for development
  console.log("[Calibration] Recorded delta:", delta);
}

export function getAverageCalibrationDelta(commodity: string): number | null {
  const relevantDeltas = calibrationHistory.filter((d) => d.commodity.toLowerCase() === commodity.toLowerCase());
  if (relevantDeltas.length === 0) return null;
  
  const avgDelta = relevantDeltas.reduce((sum, d) => sum + d.delta, 0) / relevantDeltas.length;
  return avgDelta;
}

// ============================================
// 2. CONFIDENCE SCORING
// ============================================

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export interface ConfidenceScore {
  level: ConfidenceLevel;
  factors: string[];
  numericScore: number; // 0-100
}

export interface ConfidenceFactors {
  measurementMethod?: "optical" | "dielectric" | "reference";
  hasStorageContext?: boolean;
  hasTemperature?: boolean;
  hasHumidity?: boolean;
  dataRecency?: "fresh" | "cached" | "stale";
  imageQuality?: "high" | "medium" | "low";
  commodity?: string;
}

export function calculateConfidenceScore(factors: ConfidenceFactors): ConfidenceScore {
  let score = 70; // Base score
  const reasons: string[] = [];

  // Measurement method impact
  if (factors.measurementMethod === "reference") {
    score += 20;
    reasons.push("Reference method used");
  } else if (factors.measurementMethod === "dielectric") {
    score += 10;
    reasons.push("Dielectric meter used");
  } else if (factors.measurementMethod === "optical") {
    score -= 5;
    reasons.push("Optical/AI estimation");
  }

  // Context completeness
  if (factors.hasStorageContext) {
    score += 5;
  } else {
    score -= 5;
    reasons.push("Missing storage context");
  }

  if (factors.hasTemperature) {
    score += 5;
  } else {
    score -= 5;
    reasons.push("Missing ambient temperature");
  }

  if (factors.hasHumidity) {
    score += 5;
  } else {
    score -= 3;
    reasons.push("Missing ambient humidity");
  }

  // Data recency
  if (factors.dataRecency === "stale") {
    score -= 10;
    reasons.push("Using stale data");
  } else if (factors.dataRecency === "cached") {
    score -= 3;
    reasons.push("Using cached data");
  }

  // Image quality
  if (factors.imageQuality === "low") {
    score -= 15;
    reasons.push("Low image quality");
  } else if (factors.imageQuality === "medium") {
    score -= 5;
    reasons.push("Medium image quality");
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine level
  let level: ConfidenceLevel;
  if (score >= 75) {
    level = "HIGH";
  } else if (score >= 50) {
    level = "MEDIUM";
  } else {
    level = "LOW";
  }

  return {
    level,
    factors: reasons,
    numericScore: score,
  };
}

// ============================================
// 3. AUDIT TRAIL
// ============================================

export interface AuditEntry {
  id: string;
  timestamp: Date;
  analysisType: "moisture" | "qc" | "weight" | "weather" | "fx";
  sessionId?: string;
  visitorId?: string;
  weatherSnapshot?: {
    temperature: number;
    humidity: number;
    rainfall: number;
    source: "live" | "cached";
    location?: string;
  };
  fxRateUsed?: {
    rate: number;
    pair: string;
    source: "live" | "cached" | "fallback";
  };
  storageContext?: StorageContext;
  commodityRulesApplied?: string[];
  confidenceScore: ConfidenceScore;
  result?: Record<string, unknown>;
}

// In-memory audit trail (last 50 entries)
const auditTrail: AuditEntry[] = [];

export function createAuditEntry(
  analysisType: AuditEntry["analysisType"],
  data: Partial<Omit<AuditEntry, "id" | "timestamp" | "analysisType">>
): AuditEntry {
  const entry: AuditEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    analysisType,
    confidenceScore: data.confidenceScore || {
      level: "MEDIUM",
      factors: [],
      numericScore: 70,
    },
    ...data,
  };

  auditTrail.push(entry);

  // Keep last 50 entries
  while (auditTrail.length > 50) {
    auditTrail.shift();
  }

  // Log to console for development
  console.log("[Audit] Entry created:", entry.id, entry.analysisType);

  return entry;
}

export function getRecentAuditEntries(limit = 10): AuditEntry[] {
  return auditTrail.slice(-limit);
}

// ============================================
// 4. FAILURE & FALLBACK RULES
// ============================================

export interface FallbackState {
  weatherFallback: boolean;
  fxFallback: boolean;
  lastWeatherUpdate?: Date;
  lastFxUpdate?: Date;
  retryCount: number;
}

const fallbackState: FallbackState = {
  weatherFallback: false,
  fxFallback: false,
  retryCount: 0,
};

export function setWeatherFallback(isFallback: boolean, lastUpdate?: Date): void {
  fallbackState.weatherFallback = isFallback;
  fallbackState.lastWeatherUpdate = lastUpdate;
  
  if (isFallback) {
    console.warn("[Fallback] Weather data using cached fallback");
  }
}

export function setFxFallback(isFallback: boolean, lastUpdate?: Date): void {
  fallbackState.fxFallback = isFallback;
  fallbackState.lastFxUpdate = lastUpdate;
  
  if (isFallback) {
    console.warn("[Fallback] FX rate using frozen fallback");
  }
}

export function incrementRetryCount(): number {
  fallbackState.retryCount++;
  return fallbackState.retryCount;
}

export function resetRetryCount(): void {
  fallbackState.retryCount = 0;
}

export function getFallbackState(): FallbackState {
  return { ...fallbackState };
}

// ============================================
// 5. METHODOLOGY AWARENESS
// ============================================

export interface MethodologyExplanation {
  analysisType: string;
  description: string;
  dataSource: string;
  thresholds?: Record<string, { optimal: number; range: [number, number] }>;
  limitations: string[];
}

export const METHODOLOGY_EXPLANATIONS: Record<string, MethodologyExplanation> = {
  moisture: {
    analysisType: "Moisture Content Analysis",
    description:
      "AI-based visual moisture estimation using image analysis calibrated against FAO commodity standards and handheld dielectric meters.",
    dataSource: "Visual image analysis via Gemini AI, calibrated to industry benchmarks",
    thresholds: {
      coffee: { optimal: 11, range: [10, 12] },
      cashew: { optimal: 4.5, range: [4, 6] },
      cocoa: { optimal: 7, range: [6, 8] },
      sesame: { optimal: 6.5, range: [6, 7] },
    },
    limitations: [
      "Visual estimation has typical variance of ±1.5–2.5% compared to reference methods",
      "Surface moisture may differ from core moisture",
      "Results are advisory and should be verified with physical meters for trade decisions",
    ],
  },
  qc: {
    analysisType: "Quality Control Analysis",
    description:
      "AI-based visual quality grading assessing defects, mold indicators, discoloration, and bio-risk factors.",
    dataSource: "Visual image analysis via Gemini AI with commodity-specific grading criteria",
    limitations: [
      "Visual assessment cannot detect internal defects",
      "Subtle mold or contamination may not be visible in photos",
      "Results are advisory and should supplement physical inspection",
    ],
  },
  weight: {
    analysisType: "Weight Estimation",
    description:
      "AI-based visual weight estimation using package dimensions and standard commodity bag sizes.",
    dataSource: "Visual image analysis with calibration for common packaging types",
    limitations: [
      "Estimates based on visible package dimensions only",
      "Bag fullness and packing density affect accuracy",
      "Results should be verified with physical weighing for trade purposes",
    ],
  },
  weather: {
    analysisType: "Weather & Risk Assessment",
    description:
      "Current weather conditions and commodity-specific mold/drying risk calculations based on humidity, temperature, and precipitation forecasts.",
    dataSource: "Open-Meteo API with 10-15 minute caching",
    limitations: [
      "Weather data has inherent forecast uncertainty",
      "Microclimate conditions may vary from regional data",
      "Risk thresholds are guidance based on general commodity science",
    ],
  },
  fx: {
    analysisType: "Currency Exchange",
    description: "Live and cached exchange rates for agricultural trade currencies.",
    dataSource: "Alpha Vantage API with fallback to open exchange rate services",
    limitations: [
      "Rates are indicative reference rates, not for settlement",
      "May have 1-5 minute delay from real-time market",
      "Bank rates will differ for actual transactions",
    ],
  },
};

export function getMethodologyExplanation(analysisType: string): MethodologyExplanation | null {
  return METHODOLOGY_EXPLANATIONS[analysisType] || null;
}

// Alex can reference this when asked "how does this work?"
export function generateMethodologyResponse(analysisType: string): string {
  const methodology = getMethodologyExplanation(analysisType);
  if (!methodology) {
    return "I can explain our analysis methodology when you specify which tool you're asking about (moisture, quality control, weight, weather, or FX).";
  }

  let response = `**${methodology.analysisType}**\n\n`;
  response += `${methodology.description}\n\n`;
  response += `**Data Source:** ${methodology.dataSource}\n\n`;
  
  if (methodology.thresholds) {
    response += "**Reference Thresholds:**\n";
    for (const [commodity, vals] of Object.entries(methodology.thresholds)) {
      response += `- ${commodity.charAt(0).toUpperCase() + commodity.slice(1)}: ${vals.range[0]}–${vals.range[1]}% (optimal: ${vals.optimal}%)\n`;
    }
    response += "\n";
  }

  response += "**Limitations:**\n";
  methodology.limitations.forEach((lim) => {
    response += `- ${lim}\n`;
  });

  return response;
}
