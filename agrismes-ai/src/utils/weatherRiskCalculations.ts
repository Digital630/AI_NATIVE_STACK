// Weather Risk Calculations for Commodity-Specific Mold & Drying Risk
// ADDITIVE ONLY - Does not modify existing moisture/QC logic

export type CommodityType = "cashew" | "coffee" | "cocoa";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface WeatherConditions {
  humidity: number;
  rainProbability: number;
  wetHours?: number;
  hasFog?: boolean;
  overnightHumidity?: number;
}

export interface MoldDryingRisk {
  level: RiskLevel;
  commodity: CommodityType;
  factors: string[];
  recommendation: string;
}

// Commodity-specific risk thresholds
const RISK_THRESHOLDS = {
  cashew: {
    high: { humidity: 70, rain: 30, wetHours: 12 },
    medium: { humidityMin: 60, humidityMax: 69, rainMin: 20, rainMax: 29 },
  },
  coffee: {
    high: { humidity: 75, rain: 35, fogRisk: true },
    medium: { humidityMin: 65, humidityMax: 74 },
  },
  cocoa: {
    high: { humidity: 80, rain: 40, wetHours: 24 },
    medium: { humidityMin: 70, humidityMax: 79 },
  },
};

// Post-harvest recommendations per commodity and risk level
const RECOMMENDATIONS = {
  cashew: {
    LOW: "Normal drying with adequate airflow. Standard handling practices apply.",
    MEDIUM: "Spread in thin layers with frequent turning. Monitor moisture levels closely.",
    HIGH: "Delay outdoor drying. Consider covered or mechanical drying solutions.",
  },
  coffee: {
    LOW: "Standard raised-bed drying is appropriate. Monitor as usual.",
    MEDIUM: "Protect beans overnight. Increase airflow during day hours.",
    HIGH: "Suspend sun drying temporarily. Inspect twice daily for early mold signs.",
  },
  cocoa: {
    LOW: "Standard fermentation and drying procedures are suitable.",
    MEDIUM: "Use controlled fermentation. Extend drying monitoring periods.",
    HIGH: "Pause outdoor drying if rain persists. Consider alternative drying methods.",
  },
};

export function calculateMoldDryingRisk(
  commodity: CommodityType,
  conditions: WeatherConditions
): MoldDryingRisk {
  const { humidity, rainProbability, wetHours = 0, hasFog = false, overnightHumidity = humidity } = conditions;
  const factors: string[] = [];
  let level: RiskLevel = "LOW";

  switch (commodity) {
    case "cashew": {
      const thresholds = RISK_THRESHOLDS.cashew;
      if (
        (humidity >= thresholds.high.humidity && rainProbability >= thresholds.high.rain) ||
        wetHours >= thresholds.high.wetHours
      ) {
        level = "HIGH";
        if (humidity >= thresholds.high.humidity) factors.push(`Humidity ${humidity}% (≥${thresholds.high.humidity}%)`);
        if (rainProbability >= thresholds.high.rain) factors.push(`Rain probability ${rainProbability}%`);
        if (wetHours >= thresholds.high.wetHours) factors.push(`${wetHours} wet hours forecast`);
      } else if (
        (humidity >= thresholds.medium.humidityMin && humidity <= thresholds.medium.humidityMax) ||
        (rainProbability >= thresholds.medium.rainMin && rainProbability <= thresholds.medium.rainMax)
      ) {
        level = "MEDIUM";
        factors.push(`Humidity ${humidity}%`, `Rain probability ${rainProbability}%`);
      } else {
        factors.push("Conditions favorable for drying");
      }
      break;
    }

    case "coffee": {
      const thresholds = RISK_THRESHOLDS.coffee;
      if (
        (humidity >= thresholds.high.humidity && rainProbability >= thresholds.high.rain) ||
        hasFog ||
        overnightHumidity >= 80
      ) {
        level = "HIGH";
        if (humidity >= thresholds.high.humidity) factors.push(`Humidity ${humidity}%`);
        if (hasFog) factors.push("Fog detected");
        if (overnightHumidity >= 80) factors.push(`High overnight humidity ${overnightHumidity}%`);
      } else if (humidity >= thresholds.medium.humidityMin && humidity <= thresholds.medium.humidityMax) {
        level = "MEDIUM";
        factors.push(`Moderate humidity ${humidity}%`);
      } else {
        factors.push("Conditions favorable for drying");
      }
      break;
    }

    case "cocoa": {
      const thresholds = RISK_THRESHOLDS.cocoa;
      if (
        (humidity >= thresholds.high.humidity && rainProbability >= thresholds.high.rain) ||
        wetHours >= thresholds.high.wetHours
      ) {
        level = "HIGH";
        if (humidity >= thresholds.high.humidity) factors.push(`Humidity ${humidity}%`);
        if (wetHours >= thresholds.high.wetHours) factors.push(`${wetHours} wet hours forecast`);
      } else if (humidity >= thresholds.medium.humidityMin && humidity <= thresholds.medium.humidityMax) {
        level = "MEDIUM";
        factors.push(`Elevated humidity ${humidity}%`);
      } else {
        factors.push("Conditions favorable for drying");
      }
      break;
    }
  }

  return {
    level,
    commodity,
    factors,
    recommendation: RECOMMENDATIONS[commodity][level],
  };
}

// Warehouse ventilation recommendations based on risk level
export function getVentilationRecommendation(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case "LOW":
      return "Standard ventilation is sufficient.";
    case "MEDIUM":
      return "Increase cross-ventilation. Open additional vents if available.";
    case "HIGH":
      return "Continuous ventilation required. Avoid sealing storage areas.";
  }
}

// Export shipment delay advisory logic
export function shouldShowShipmentAdvisory(
  riskLevel: RiskLevel,
  rainForecast48h: number,
  userMessage: string
): boolean {
  const exportKeywords = ["export", "shipment", "port", "container", "shipping", "vessel"];
  const mentionsExport = exportKeywords.some((kw) => userMessage.toLowerCase().includes(kw));
  
  if (!mentionsExport) return false;
  
  return riskLevel === "HIGH" || rainForecast48h >= 48;
}

// Moisture interpretation layers (ADDITIVE - supplements existing moisture logic)
export interface MoistureInterpretationContext {
  measurementMethod?: "oven-dry" | "dielectric" | "optical";
  commodityForm?: string;
  processingStage?: "raw" | "fermented" | "dried" | "export-ready";
  storageTime?: "immediate" | "short-term" | "medium" | "long-term";
  destinationClimate?: "humid" | "hot" | "temperate";
  transitDuration?: "short" | "long";
  ambientTemperature?: number;
  ambientHumidity?: number;
}

export interface MoistureInterpretationNotes {
  methodNote?: string;
  formNote?: string;
  storageNote?: string;
  climateNote?: string;
  temperatureNote?: string;
  confidenceLevel: "HIGH" | "MEDIUM" | "LOW";
  confidenceReason?: string;
}

export function generateMoistureInterpretation(
  context: MoistureInterpretationContext
): MoistureInterpretationNotes {
  const notes: MoistureInterpretationNotes = {
    confidenceLevel: "HIGH",
  };

  // Method differentiation
  if (context.measurementMethod) {
    switch (context.measurementMethod) {
      case "oven-dry":
        notes.methodNote = "Reference method. Most accurate for calibration.";
        break;
      case "dielectric":
        notes.methodNote = "Typical variance ±0.5–1.0% compared to oven-dry method.";
        break;
      case "optical":
        notes.methodNote = "AI-based estimation. Typical variance ±1.5–2.5% compared to reference methods.";
        notes.confidenceLevel = "MEDIUM";
        notes.confidenceReason = "Optical/AI estimation method";
        break;
    }
  }

  // Storage time sensitivity
  if (context.storageTime) {
    switch (context.storageTime) {
      case "immediate":
        notes.storageNote = "Short-term handling. Current moisture acceptable for immediate processing.";
        break;
      case "short-term":
        notes.storageNote = "For storage up to 24 hours. Monitor conditions.";
        break;
      case "medium":
        notes.storageNote = "1-7 day storage. Storage risk increases over time at current levels.";
        break;
      case "long-term":
        notes.storageNote = "Extended storage (>7 days). Target lower end of acceptable range.";
        notes.confidenceLevel = notes.confidenceLevel === "LOW" ? "LOW" : "MEDIUM";
        if (!notes.confidenceReason) notes.confidenceReason = "Long-term storage increases uncertainty";
        break;
    }
  }

  // Climate/destination context
  if (context.destinationClimate) {
    switch (context.destinationClimate) {
      case "humid":
        notes.climateNote = "Humid destination. Consider targeting lower moisture range to prevent reabsorption.";
        break;
      case "hot":
        notes.climateNote = "Hot climate destination. Lower moisture reduces transit degradation risk.";
        break;
      case "temperate":
        notes.climateNote = "Temperate destination. Standard moisture ranges typically suitable.";
        break;
    }
  }

  // Temperature interaction
  if (context.ambientTemperature !== undefined) {
    if (context.ambientTemperature >= 35) {
      notes.temperatureNote = `High ambient temperature (${context.ambientTemperature}°C) increases moisture migration and mold risk.`;
      notes.confidenceLevel = notes.confidenceLevel === "HIGH" ? "MEDIUM" : notes.confidenceLevel;
    } else if (context.ambientTemperature < 20) {
      notes.temperatureNote = `Lower temperature (${context.ambientTemperature}°C) reduces immediate mold risk.`;
    }
  }

  // Adjust confidence if missing key data
  if (!context.measurementMethod && !context.ambientTemperature && !context.ambientHumidity) {
    notes.confidenceLevel = "LOW";
    notes.confidenceReason = "Missing ambient conditions and measurement method context";
  }

  return notes;
}

// Storage context for analysis tools
export interface StorageContext {
  storageType: "warehouse" | "room" | "store" | "container-sealed" | "container-ventilated" | "outdoor";
  timeInStorage: "hours" | "days" | "weeks";
  packagingType: "jute-bags" | "polypropylene" | "hermetic" | "bulk" | "other";
  ventilationQuality: "poor" | "moderate" | "good";
  ambientTemperature?: number;
  ambientHumidity?: number;
  hotContainer?: boolean;
}

export interface StorageInterpretationNotes {
  moistureNote?: string;
  qcNote?: string;
  weightNote?: string;
}

export function generateStorageInterpretation(storage: StorageContext): StorageInterpretationNotes {
  const notes: StorageInterpretationNotes = {};

  // Moisture-specific notes
  if (storage.hotContainer) {
    notes.moistureNote = "Hot container conditions may cause surface moisture and condensation. Re-absorption risk elevated.";
  } else if (storage.storageType === "outdoor") {
    notes.moistureNote = "Outdoor storage increases moisture variability. Surface moisture may differ from core.";
  } else if (storage.ambientHumidity && storage.ambientHumidity >= 70) {
    notes.moistureNote = `High ambient humidity (${storage.ambientHumidity}%) increases re-absorption risk.`;
  }

  // QC-specific notes
  if (storage.ventilationQuality === "poor") {
    notes.qcNote = "Poor ventilation increases mold and pest risk. Inspect for early signs.";
  }
  if (storage.timeInStorage === "weeks") {
    notes.qcNote = (notes.qcNote || "") + " Extended storage duration may elevate quality degradation markers.";
  }

  // Weight-specific notes
  if (storage.ambientHumidity && storage.ambientHumidity >= 65) {
    notes.weightNote = "Elevated humidity may cause weight fluctuation due to moisture absorption.";
  }
  if (storage.hotContainer) {
    notes.weightNote = (notes.weightNote || "") + " Heat stress in sealed containers may affect measured weight.";
  }

  return notes;
}

// Audit trail structure (internal logging)
export interface AnalysisAuditEntry {
  timestamp: Date;
  analysisType: "moisture" | "qc" | "weight" | "weather" | "fx";
  weatherSnapshot?: {
    temperature: number;
    humidity: number;
    rainfall: number;
    source: "live" | "cached";
  };
  fxRateUsed?: {
    rate: number;
    pair: string;
    source: "live" | "cached";
  };
  storageContext?: StorageContext;
  commodityRulesApplied?: string[];
  confidenceLevel: "HIGH" | "MEDIUM" | "LOW";
}

// Create audit entry (for internal logging)
export function createAuditEntry(
  analysisType: AnalysisAuditEntry["analysisType"],
  data: Partial<AnalysisAuditEntry>
): AnalysisAuditEntry {
  return {
    timestamp: new Date(),
    analysisType,
    confidenceLevel: "MEDIUM",
    ...data,
  };
}
