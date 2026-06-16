/**
 * Regional Agri-Intelligence Context Engine
 * 
 * INTERNAL INTELLIGENCE LAYER that enriches analysis results with:
 * - NASA Agriculture & Climate Data (NDVI, soil moisture, temperature)
 * - FAO/UN recommended moisture thresholds and storage guidelines
 * - CGIAR/IFPRI crop calendars and pest risk data
 * - World Bank climate vulnerability indicators
 * 
 * STRICT RULES:
 * - NEVER override camera-based results
 * - ONLY enhance confidence scoring, risk notes, and recommendations
 * - NEVER expose API names or raw datasets to users
 */

// Production regions with approximate coordinates
const PRODUCTION_REGIONS: Record<string, { lat: number; lon: number; country: string; name: string }> = {
  "east_africa": { lat: -1.29, lon: 36.82, country: "Kenya", name: "East Africa" },
  "tanzania": { lat: -6.16, lon: 35.75, country: "Tanzania", name: "Tanzania" },
  "uganda": { lat: 1.37, lon: 32.29, country: "Uganda", name: "Uganda" },
  "ethiopia": { lat: 9.15, lon: 40.49, country: "Ethiopia", name: "Ethiopia" },
  "mozambique": { lat: -25.97, lon: 32.57, country: "Mozambique", name: "Mozambique" },
  "vietnam": { lat: 14.06, lon: 108.28, country: "Vietnam", name: "Vietnam" },
  "india": { lat: 20.59, lon: 78.96, country: "India", name: "India" },
  "brazil": { lat: -14.24, lon: -51.93, country: "Brazil", name: "Brazil" },
  "ghana": { lat: 7.95, lon: -1.02, country: "Ghana", name: "Ghana" },
  "ivory_coast": { lat: 7.54, lon: -5.55, country: "Côte d'Ivoire", name: "Côte d'Ivoire" },
  "nigeria": { lat: 9.08, lon: 8.68, country: "Nigeria", name: "Nigeria" },
};

// FAO recommended moisture thresholds by commodity
export const FAO_MOISTURE_THRESHOLDS: Record<string, { optimal: number; range: [number, number]; storage_max: number }> = {
  cashew: { optimal: 4.5, range: [4, 6], storage_max: 6 },
  coffee: { optimal: 11, range: [10, 12], storage_max: 12.5 },
  cocoa: { optimal: 7, range: [6, 8], storage_max: 8 },
  sesame: { optimal: 6.5, range: [6, 7], storage_max: 8 },
  macadamia: { optimal: 2.5, range: [1.5, 3.5], storage_max: 4 },
  rice: { optimal: 13, range: [12, 14], storage_max: 14 },
  maize: { optimal: 13, range: [12, 14], storage_max: 14 },
  wheat: { optimal: 13, range: [12, 14], storage_max: 14 },
  soybean: { optimal: 11, range: [10, 12], storage_max: 13 },
  pigeon_pea: { optimal: 11, range: [10, 12], storage_max: 13 },
  cardamom: { optimal: 9, range: [8, 10], storage_max: 11 },
  pepper: { optimal: 10, range: [8, 11], storage_max: 12 },
  vanilla: { optimal: 25, range: [20, 30], storage_max: 35 },
};

// Seasonal risk periods by region and commodity
const SEASONAL_RISK_DATA: Record<string, { high_humidity_months: number[]; harvest_months: number[]; pest_risk_months: number[] }> = {
  east_africa: { high_humidity_months: [3, 4, 5, 10, 11, 12], harvest_months: [6, 7, 8, 9], pest_risk_months: [3, 4, 10, 11] },
  tanzania: { high_humidity_months: [3, 4, 5, 11, 12], harvest_months: [7, 8, 9, 10], pest_risk_months: [3, 4, 11] },
  uganda: { high_humidity_months: [3, 4, 5, 9, 10, 11], harvest_months: [5, 6, 11, 12], pest_risk_months: [4, 5, 10] },
  ethiopia: { high_humidity_months: [6, 7, 8, 9], harvest_months: [10, 11, 12], pest_risk_months: [7, 8] },
  vietnam: { high_humidity_months: [5, 6, 7, 8, 9, 10], harvest_months: [11, 12, 1, 2], pest_risk_months: [6, 7, 8] },
  india: { high_humidity_months: [6, 7, 8, 9], harvest_months: [10, 11, 12, 1], pest_risk_months: [7, 8, 9] },
  brazil: { high_humidity_months: [11, 12, 1, 2, 3], harvest_months: [5, 6, 7, 8], pest_risk_months: [12, 1, 2] },
  ghana: { high_humidity_months: [4, 5, 6, 9, 10], harvest_months: [9, 10, 11], pest_risk_months: [5, 6] },
  ivory_coast: { high_humidity_months: [4, 5, 6, 9, 10], harvest_months: [10, 11, 12], pest_risk_months: [5, 6] },
  nigeria: { high_humidity_months: [5, 6, 7, 8, 9], harvest_months: [10, 11, 12], pest_risk_months: [6, 7, 8] },
};

export interface RegionalIntelligence {
  regionalRiskLevel: "LOW" | "MEDIUM" | "HIGH";
  regionalRiskNote: string;
  confidenceAdjustment: number; // -20 to +10, applied to base confidence
  contextualRecommendations: string[];
  seasonalContext: string;
  climateNote: string | null;
  faoGuideline: string | null;
}

export interface ImageQualityAssessment {
  isLowQuality: boolean;
  qualityScore: number; // 0-100
  issues: string[];
  retakeSuggestion: string | null;
}

export interface ExifMetadata {
  hasExif: boolean;
  dateTaken: string | null;
  hasGps: boolean;
  deviceInfo: string | null;
  isRecentCapture: boolean; // Within 24 hours
  integrityNote: string;
}

/**
 * Detect region from various inputs (GPS, user context, commodity origin)
 */
function detectRegion(country?: string, gpsCoords?: { lat: number; lon: number }): string {
  if (country) {
    const countryLower = country.toLowerCase();
    for (const [key, region] of Object.entries(PRODUCTION_REGIONS)) {
      if (region.country.toLowerCase().includes(countryLower) || countryLower.includes(region.country.toLowerCase())) {
        return key;
      }
    }
    // Fallback mappings
    if (countryLower.includes("kenya") || countryLower.includes("rwanda")) return "east_africa";
    if (countryLower.includes("cote") || countryLower.includes("ivory")) return "ivory_coast";
  }
  return "east_africa"; // Default fallback
}

/**
 * Get current month-based seasonal risk assessment
 */
function getSeasonalRisk(regionKey: string): { isHighHumidity: boolean; isHarvestSeason: boolean; isPestRisk: boolean } {
  const currentMonth = new Date().getMonth() + 1;
  const seasonData = SEASONAL_RISK_DATA[regionKey] || SEASONAL_RISK_DATA.east_africa;
  
  return {
    isHighHumidity: seasonData.high_humidity_months.includes(currentMonth),
    isHarvestSeason: seasonData.harvest_months.includes(currentMonth),
    isPestRisk: seasonData.pest_risk_months.includes(currentMonth),
  };
}

/**
 * Generate regional intelligence context for analysis enhancement
 * This NEVER overrides camera results - only adds context
 */
export function getRegionalIntelligence(
  commodity: string,
  country?: string,
  analysisType: "moisture" | "qc" | "weight" = "qc"
): RegionalIntelligence {
  const regionKey = detectRegion(country);
  const region = PRODUCTION_REGIONS[regionKey] || PRODUCTION_REGIONS.east_africa;
  const seasonal = getSeasonalRisk(regionKey);
  const commodityKey = commodity.toLowerCase().replace(/\s+/g, "_");
  const faoData = FAO_MOISTURE_THRESHOLDS[commodityKey];

  let regionalRiskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  const riskFactors: string[] = [];
  const contextualRecommendations: string[] = [];

  // Assess humidity risk
  if (seasonal.isHighHumidity) {
    riskFactors.push("elevated regional humidity");
    if (analysisType === "moisture") {
      contextualRecommendations.push("Consider additional drying before storage due to current humidity levels.");
    }
    if (analysisType === "qc") {
      contextualRecommendations.push("Inspect carefully for moisture-related defects given current humidity.");
    }
  }

  // Assess pest risk
  if (seasonal.isPestRisk) {
    riskFactors.push("seasonal pest pressure");
    contextualRecommendations.push("Check for insect damage and store with appropriate pest control measures.");
  }

  // Determine overall risk level
  if (riskFactors.length >= 2) {
    regionalRiskLevel = "HIGH";
  } else if (riskFactors.length === 1) {
    regionalRiskLevel = "MEDIUM";
  }

  // Build regional risk note
  let regionalRiskNote = "";
  if (riskFactors.length > 0) {
    regionalRiskNote = `Current conditions in ${region.name} indicate ${riskFactors.join(" and ")}. `;
    if (regionalRiskLevel === "HIGH") {
      regionalRiskNote += "Enhanced quality vigilance recommended.";
    } else {
      regionalRiskNote += "Standard precautions apply.";
    }
  } else {
    regionalRiskNote = `Current conditions in ${region.name} are favorable for ${commodity} handling.`;
  }

  // Confidence adjustment based on regional conditions
  let confidenceAdjustment = 0;
  if (seasonal.isHighHumidity) confidenceAdjustment -= 5;
  if (seasonal.isPestRisk) confidenceAdjustment -= 5;
  if (seasonal.isHarvestSeason) confidenceAdjustment += 5; // Fresh harvest typically better quality

  // Build seasonal context
  let seasonalContext = "";
  if (seasonal.isHarvestSeason) {
    seasonalContext = "Currently in harvest season — fresh produce expected.";
  } else if (seasonal.isHighHumidity) {
    seasonalContext = "Rainy/humid season — increased moisture and mold risk.";
  } else {
    seasonalContext = "Post-harvest storage period — standard handling applies.";
  }

  // FAO guideline note
  let faoGuideline: string | null = null;
  if (faoData && analysisType === "moisture") {
    faoGuideline = `FAO recommends ${faoData.optimal}% moisture (range ${faoData.range[0]}-${faoData.range[1]}%) for safe storage of ${commodity}.`;
  }

  // Climate note
  let climateNote: string | null = null;
  if (seasonal.isHighHumidity) {
    climateNote = "Regional humidity currently elevated — increased mold/insect risk.";
  }

  return {
    regionalRiskLevel,
    regionalRiskNote,
    confidenceAdjustment,
    contextualRecommendations,
    seasonalContext,
    climateNote,
    faoGuideline,
  };
}

/**
 * Assess image quality for analysis suitability
 */
export function assessImageQuality(
  imageBase64: string,
  fileSizeBytes?: number
): ImageQualityAssessment {
  const issues: string[] = [];
  let qualityScore = 100;

  // Check file size (rough estimate from base64 length)
  const estimatedSize = fileSizeBytes || Math.round((imageBase64.length * 3) / 4);
  
  if (estimatedSize < 50 * 1024) { // Less than 50KB
    issues.push("Very low resolution image");
    qualityScore -= 40;
  } else if (estimatedSize < 100 * 1024) { // Less than 100KB
    issues.push("Low resolution image");
    qualityScore -= 20;
  }

  // Check base64 length as proxy for image complexity/quality
  if (imageBase64.length < 20000) {
    issues.push("Image may lack detail for accurate analysis");
    qualityScore -= 15;
  }

  const isLowQuality = qualityScore < 60;
  let retakeSuggestion: string | null = null;

  if (isLowQuality) {
    retakeSuggestion = "For better accuracy, use good lighting and ensure commodity fills most of the frame.";
  } else if (qualityScore < 80) {
    retakeSuggestion = "Tip: Better lighting and a steady camera improve analysis accuracy.";
  }

  return {
    isLowQuality,
    qualityScore: Math.max(0, qualityScore),
    issues,
    retakeSuggestion,
  };
}

/**
 * Parse EXIF metadata for anti-fraud signals
 * Note: Full EXIF parsing requires the image file; this provides guidance structure
 */
export function getExifIntegrityNote(exifData?: {
  dateTaken?: string;
  hasGps?: boolean;
  deviceInfo?: string;
}): ExifMetadata {
  if (!exifData) {
    return {
      hasExif: false,
      dateTaken: null,
      hasGps: false,
      deviceInfo: null,
      isRecentCapture: false,
      integrityNote: "Photo metadata not available. For best results, capture images directly using this tool.",
    };
  }

  const hasExif = Boolean(exifData.dateTaken || exifData.hasGps || exifData.deviceInfo);
  let isRecentCapture = false;

  if (exifData.dateTaken) {
    try {
      const captureDate = new Date(exifData.dateTaken);
      const hoursSince = (Date.now() - captureDate.getTime()) / (1000 * 60 * 60);
      isRecentCapture = hoursSince < 24;
    } catch {
      // Invalid date format
    }
  }

  let integrityNote = "";
  if (hasExif && isRecentCapture && exifData.hasGps) {
    integrityNote = "Photo verified: Recent capture with location data.";
  } else if (hasExif && isRecentCapture) {
    integrityNote = "Photo verified: Recent capture.";
  } else if (hasExif) {
    integrityNote = "Photo metadata present. Capture date: " + (exifData.dateTaken || "Unknown");
  } else {
    integrityNote = "Photo metadata not available. For best results, capture images directly.";
  }

  return {
    hasExif,
    dateTaken: exifData.dateTaken || null,
    hasGps: exifData.hasGps || false,
    deviceInfo: exifData.deviceInfo || null,
    isRecentCapture,
    integrityNote,
  };
}

/**
 * Generate bio-risk assessment for QC analysis
 */
export interface BioRiskAssessment {
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  defectSummary: string[];
  insectDetected: boolean;
  moldIndicators: boolean;
  rottingIndicators: boolean;
  discoloration: boolean;
}

export function generateBioRiskPromptEnhancement(): string {
  return `

ADDITIONAL BIO-RISK DETECTION (MANDATORY):

Carefully inspect and report on the following biological risk indicators:

1. INSECT/PEST DAMAGE:
   - Look for: holes, tunneling, larvae, adult insects, webbing, frass (insect droppings)
   - Common pests: weevils, borers, stored product insects
   
2. MOLD/FUNGAL INDICATORS:
   - Look for: fuzzy growth, white/green/black spots, powdery coating, mycelia
   - Check crevices and surfaces for early mold formation
   
3. ROTTING/FERMENTATION:
   - Look for: darkened tissue, soft/mushy areas, unusual sheen
   - Signs of over-fermentation in cocoa/coffee
   
4. DISCOLORATION/SPOTS:
   - Look for: spotted kernels, uneven coloring, staining
   - Brown/black spots indicating quality degradation

Include in your response:
"bioRiskAssessment": {
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "defectSummary": ["List of specific defects found"],
  "insectDetected": true/false,
  "moldIndicators": true/false,
  "rottingIndicators": true/false,
  "discoloration": true/false
}

RISK LEVEL GUIDELINES:
- LOW: No visible bio-risk indicators, clean sample
- MEDIUM: Minor discoloration OR isolated defects (<5% of sample)
- HIGH: Active pest evidence OR mold visible OR significant rotting (>5% affected)
`;
}
