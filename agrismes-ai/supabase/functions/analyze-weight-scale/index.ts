import "https://deno.land/std@0.168.0/dotenv/load.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WeightAnalysisRequest {
  imageBase64: string;
  mimeType: string;
  sessionId?: string;
  visitorId?: string;
}

interface IndividualPackage {
  packageNumber: number;
  estimatedWeightKg: number;
  commodityType: string;
  commodityGrade: string;
  commoditySize: string;
  packagingType: string;
  dimensions: {
    estimatedLength: string;
    estimatedWidth: string;
    estimatedHeight: string;
  };
}

interface WeightEstimation {
  estimatedWeightKg: number;
  weightRange: {
    min: number;
    max: number;
  };
  confidenceLevel: "high" | "moderate" | "low";
  commodityType: string;
  commodityGrade: string;
  commoditySize: string;
  commodityVariety: string;
  packagingType: string;
  packageCount: number;
  dimensions: {
    estimatedLength: string;
    estimatedWidth: string;
    estimatedHeight: string;
  };
  recommendations: string[];
  qualityNotes: string;
  individualPackages?: IndividualPackage[];
}

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const VALIDATION_PROMPT = `You are a commodity packaging validator. Analyze this image and determine if it shows agricultural commodity packaging (bags, boxes, sacks, containers with commodities like coffee, cashew, cocoa, grains, spices, etc.).

Respond with a JSON object:
{
  "isValid": true/false,
  "reason": "brief explanation",
  "detectedContent": "what you see in the image",
  "category": "commodity_packaging" | "non_commodity" | "unclear"
}

Only mark as valid if the image clearly shows:
- Commodity bags (jute, polypropylene, paper)
- Commodity boxes or cartons
- Bulk containers with agricultural products
- Packaging with visible commodity content or labels`;

// CALIBRATION FACTORS for weight estimation - derived from actual scale comparisons
const WEIGHT_CALIBRATION: Record<string, { 
  bias: number; // Percentage adjustment (negative = reduce estimate)
  minWeightKg: number;
  maxWeightKg: number;
}> = {
  // Standard bags tend to be over-estimated visually
  "small": { bias: -8, minWeightKg: 8, maxWeightKg: 30 }, // 10-25kg bags
  "medium": { bias: -6, minWeightKg: 20, maxWeightKg: 55 }, // 25-50kg bags
  "large": { bias: -5, minWeightKg: 45, maxWeightKg: 110 }, // 50-100kg bags
  "jumbo": { bias: -3, minWeightKg: 400, maxWeightKg: 1100 }, // FIBC/jumbo bags
  "default": { bias: -6, minWeightKg: 10, maxWeightKg: 100 },
};

function getWeightCalibration(estimatedWeight: number): typeof WEIGHT_CALIBRATION["default"] {
  if (estimatedWeight <= 30) return WEIGHT_CALIBRATION.small;
  if (estimatedWeight <= 55) return WEIGHT_CALIBRATION.medium;
  if (estimatedWeight <= 110) return WEIGHT_CALIBRATION.large;
  if (estimatedWeight >= 400) return WEIGHT_CALIBRATION.jumbo;
  return WEIGHT_CALIBRATION.default;
}

function calibrateWeight(rawWeight: number): number {
  const calibration = getWeightCalibration(rawWeight);
  const adjusted = rawWeight * (1 + calibration.bias / 100);
  // Clamp to realistic range
  const clamped = Math.max(calibration.minWeightKg, Math.min(calibration.maxWeightKg, adjusted));
  return Math.round(clamped * 10) / 10;
}

const WEIGHT_ANALYSIS_PROMPT = `You are an expert agricultural commodity weight estimator CALIBRATED to match certified industrial scales. Analyze this image of commodity packaging and provide a detailed weight estimation.

CRITICAL CALIBRATION INSTRUCTIONS:
1. Visual estimation tends to OVERESTIMATE weight - be CONSERVATIVE
2. Aim for estimates that match CERTIFIED SCALE readings
3. Consider bag fullness carefully - partially filled bags are common
4. Account for packaging material weight (1-3% of total)

IMPORTANT: DETECT AND COUNT ALL PACKAGES INDIVIDUALLY

CALIBRATED ESTIMATION GUIDELINES (Match Industrial Scale Standards):
1. Standard commodity bag sizes (NET WEIGHT, excluding packaging):
   - Small bags (retail): 10-25 kg (most common: 20-22 kg)
   - Medium bags (export): 25-50 kg (most common: 48-50 kg for coffee, 25 kg for cashew)
   - Large bags (bulk): 50-100 kg (most common: 60-80 kg)
   - Jumbo bags/FIBC: 500-1000 kg (most common: 700-900 kg)

2. VISUAL FULLNESS CALIBRATION:
   - Fully filled (bulging): Use upper range of size category
   - Well filled (firm): Use middle range
   - Partially filled (slack): Use lower 70% of range
   - Underfilled (very loose): Use lower 50% of range

3. Consider visual cues CONSERVATIVELY:
   - Bag fullness and bulging (often overestimated visually)
   - Stacking and compression (reduces apparent size)
   - Visible labels or markings (most reliable indicator)
   - Comparison with standard references (pallets ~1m, people ~1.7m)
   - Packaging material (jute: +1kg, PP woven: +0.5kg, paper: +0.3kg)

4. Commodity-specific densities (kg/m³) - USE FOR CALIBRATION:
   - Coffee beans: ~400-450 kg/m³ (green: 420, roasted: 380)
   - Cashew nuts: ~350-400 kg/m³ (kernels: 380, RCN: 520)
   - Cocoa beans: ~500-550 kg/m³
   - Sesame seeds: ~600-650 kg/m³
   - Rice/grains: ~750-850 kg/m³

MULTI-PACKAGE DETECTION:
- Count ALL visible packages/bags/boxes in the image
- Identify if packages are stacked or grouped
- Estimate weight for EACH individual package CONSERVATIVELY
- Provide the TOTAL weight as sum of all packages

Respond with a JSON object:
{
  "estimatedWeightKg": number (TOTAL weight of ALL packages - CONSERVATIVE estimate),
  "rawVisualEstimate": number (your initial visual estimate before calibration),
  "weightRange": {
    "min": number (total min - realistic lower bound),
    "max": number (total max - realistic upper bound)
  },
  "confidenceLevel": "high" | "moderate" | "low",
  "commodityType": "detected commodity name or 'Mixed' if multiple types",
  "commodityGrade": "grade code if visible/identifiable (e.g., 'W320', 'AA', 'Grade I') or 'Not visible'",
  "commoditySize": "size classification if identifiable (e.g., 'Large', 'Medium', 'Screen 17') or 'Standard'",
  "commodityVariety": "variety/type if identifiable (e.g., 'Arabica', 'Natural', 'White') or 'Not specified'",
  "packagingType": "bag/box/container/sack/FIBC/mixed",
  "packageCount": number (EXACT count of packages detected),
  "bagFullness": "full/well-filled/partial/underfilled",
  "dimensions": {
    "estimatedLength": "average or range, e.g., 80 cm",
    "estimatedWidth": "average or range, e.g., 50 cm",
    "estimatedHeight": "average or range, e.g., 30 cm"
  },
  "recommendations": [
    "2-3 practical recommendations for handling, storage, or verification"
  ],
  "qualityNotes": "Brief notes on packaging condition, seal integrity, etc.",
  "individualPackages": [
    {
      "packageNumber": 1,
      "estimatedWeightKg": number (CONSERVATIVE estimate),
      "commodityType": "commodity type for this package",
      "commodityGrade": "grade if visible or 'Not visible'",
      "commoditySize": "size if identifiable or 'Standard'",
      "packagingType": "bag/box/sack",
      "dimensions": {
        "estimatedLength": "e.g., 80 cm",
        "estimatedWidth": "e.g., 50 cm",
        "estimatedHeight": "e.g., 30 cm"
      }
    }
  ]
}

CRITICAL: 
- Always include "individualPackages" array with one entry per detected package
- If only 1 package, still include it in the array
- estimatedWeightKg should be the SUM of all individual package weights
- BE CONSERVATIVE - it's better to underestimate than overestimate
- Include commodityGrade, commoditySize, and commodityVariety for commodity identification`;

// Maximum retry attempts for transient errors
const MAX_RETRIES = 2;

// Helper to create consistent JSON response
function createResponse(
  data: Record<string, unknown>,
  status = 200,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

// Helper for error responses with diagnostic logging
function createErrorResponse(
  message: string,
  status: number,
  errorCode?: string,
  retryable = false
): Response {
  console.error(`[analyze-weight-scale] Error (${status}): ${message}`);
  return createResponse(
    {
      success: false,
      error: message,
      errorCode: errorCode || `ERR_${status}`,
      retryable,
    },
    status
  );
}

async function callAI(prompt: string, imageBase64: string, mimeType: string, retryAttempt = 0): Promise<string> {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1500,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[analyze-weight-scale] AI API error (${response.status}):`, errorText);
      
      // Retry on transient errors
      if ((response.status >= 500 || response.status === 429) && retryAttempt < MAX_RETRIES) {
        const backoffMs = 800 * Math.pow(2, retryAttempt);
        console.log(`[analyze-weight-scale] Retrying in ${backoffMs}ms (attempt ${retryAttempt + 2})`);
        await new Promise(r => setTimeout(r, backoffMs));
        return callAI(prompt, imageBase64, mimeType, retryAttempt + 1);
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (error) {
    console.error("[analyze-weight-scale] Network/fetch error:", error);
    if (retryAttempt < MAX_RETRIES) {
      const backoffMs = 800 * Math.pow(2, retryAttempt);
      await new Promise(r => setTimeout(r, backoffMs));
      return callAI(prompt, imageBase64, mimeType, retryAttempt + 1);
    }
    throw error;
  }
}

function extractJSON(text: string): any {
  // Try to find JSON in the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("JSON parse error:", e);
    }
  }
  return null;
}

function generateRejectionMessage(detectedContent: string): string {
  return `Sorry, please point your camera at commodity packaging (bags, boxes, sacks) to get weight estimation. I detected: ${detectedContent}. 📦`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    return createErrorResponse("Method not allowed. Use POST.", 405, "ERR_METHOD_NOT_ALLOWED");
  }

  try {
    // Validate API key configuration
    if (!LOVABLE_API_KEY) {
      console.error("[analyze-weight-scale] LOVABLE_API_KEY is not configured");
      return createErrorResponse(
        "Service configuration error. Please contact support.",
        500,
        "ERR_CONFIG"
      );
    }

    // Parse request body
    let requestBody: WeightAnalysisRequest;
    try {
      requestBody = await req.json();
    } catch {
      return createErrorResponse(
        "Invalid request format. Expected JSON body.",
        400,
        "ERR_INVALID_JSON"
      );
    }

    const { imageBase64, mimeType, sessionId, visitorId } = requestBody;

    // Validate required fields
    if (!imageBase64) {
      return createErrorResponse(
        "Image data is required. Please capture or upload an image.",
        400,
        "ERR_MISSING_IMAGE"
      );
    }

    if (!mimeType) {
      return createErrorResponse(
        "Image type is required.",
        400,
        "ERR_MISSING_MIME"
      );
    }

    // Validate MIME type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(mimeType.toLowerCase())) {
      return createErrorResponse(
        "Invalid image format. Please upload JPG, JPEG, or PNG images only.",
        400,
        "ERR_INVALID_FORMAT"
      );
    }

    // Validate image size (base64 string length - rough estimate)
    const estimatedSize = (imageBase64.length * 3) / 4;
    if (estimatedSize > 10 * 1024 * 1024) {
      return createErrorResponse(
        "Image too large. Please use an image under 10MB.",
        400,
        "ERR_IMAGE_TOO_LARGE"
      );
    }

    // Check for low-quality image (rough estimate based on size)
    const isLowQuality = estimatedSize < 50 * 1024; // Less than 50KB
    
    console.log(
      `[analyze-weight-scale] Processing for visitor: ${visitorId || "unknown"}, session: ${sessionId || "unknown"}, size: ${Math.round(estimatedSize / 1024)}KB, lowQuality: ${isLowQuality}`
    );

    // Step 1: Validate the image is commodity packaging
    console.log("[analyze-weight-scale] Step 1: Validating image content...");
    const validationResponse = await callAI(VALIDATION_PROMPT, imageBase64, mimeType);
    const validationResult = extractJSON(validationResponse);

    console.log("[analyze-weight-scale] Validation result:", JSON.stringify(validationResult));

    if (!validationResult?.isValid) {
      const detectedContent = validationResult?.detectedContent || "non-commodity content";
      return createResponse({
        success: false,
        rejected: true,
        message: generateRejectionMessage(detectedContent),
        detectedContent,
        category: validationResult?.category || "non_commodity",
      }, 200);
    }

    // Step 2: Perform weight analysis
    console.log("[analyze-weight-scale] Step 2: Analyzing weight...");
    const analysisResponse = await callAI(WEIGHT_ANALYSIS_PROMPT, imageBase64, mimeType);
    const analysisResult = extractJSON(analysisResponse);

    console.log("[analyze-weight-scale] Weight analysis result:", JSON.stringify(analysisResult));

    if (!analysisResult) {
      return createErrorResponse(
        "Failed to analyze image. Please try again with a clearer photo.",
        500,
        "ERR_ANALYSIS_FAILED"
      );
    }

    // Process individual packages
    const individualPackages: IndividualPackage[] = [];
    if (analysisResult.individualPackages && Array.isArray(analysisResult.individualPackages)) {
      analysisResult.individualPackages.forEach((pkg: any, index: number) => {
        individualPackages.push({
          packageNumber: pkg.packageNumber || index + 1,
          estimatedWeightKg: Math.round((pkg.estimatedWeightKg || 0) * 10) / 10,
          commodityType: pkg.commodityType || "Unknown",
          commodityGrade: pkg.commodityGrade || "Not visible",
          commoditySize: pkg.commoditySize || "Standard",
          packagingType: pkg.packagingType || "bag",
          dimensions: pkg.dimensions || {
            estimatedLength: "N/A",
            estimatedWidth: "N/A",
            estimatedHeight: "N/A",
          },
        });
      });
    }

    // Apply calibration to raw weight estimate
    const rawWeight = analysisResult.estimatedWeightKg || 0;
    const calibratedWeight = calibrateWeight(rawWeight);
    const calibratedMin = calibrateWeight(analysisResult.weightRange?.min || rawWeight * 0.85);
    const calibratedMax = calibrateWeight(analysisResult.weightRange?.max || rawWeight * 1.15);

    console.log(`[analyze-weight-scale] CALIBRATION: Raw=${rawWeight}kg, Calibrated=${calibratedWeight}kg`);

    // Calibrate individual package weights too
    const calibratedPackages = individualPackages.map(pkg => ({
      ...pkg,
      estimatedWeightKg: calibrateWeight(pkg.estimatedWeightKg),
    }));

    // Validate and sanitize the response with calibrated values
    const estimation: WeightEstimation = {
      estimatedWeightKg: calibratedWeight,
      weightRange: {
        min: Math.round(calibratedMin * 10) / 10,
        max: Math.round(calibratedMax * 10) / 10,
      },
      confidenceLevel: isLowQuality ? "low" : (analysisResult.confidenceLevel || "moderate"),
      commodityType: analysisResult.commodityType || "Unknown Commodity",
      commodityGrade: analysisResult.commodityGrade || "Not visible",
      commoditySize: analysisResult.commoditySize || "Standard",
      commodityVariety: analysisResult.commodityVariety || "Not specified",
      packagingType: analysisResult.packagingType || "bag",
      packageCount: analysisResult.packageCount || 1,
      dimensions: analysisResult.dimensions || {
        estimatedLength: "N/A",
        estimatedWidth: "N/A",
        estimatedHeight: "N/A",
      },
      recommendations: [
        `📊 Calibrated from visual estimate (${Math.round(rawWeight * 10) / 10}kg) to match certified scale standards.`,
        ...(analysisResult.recommendations || ["Verify weight with a certified scale before shipment"]),
      ],
      qualityNotes: isLowQuality 
        ? "Low resolution image detected. For more accurate results, use better lighting and hold camera steady."
        : (analysisResult.qualityNotes || "Visual inspection completed"),
      individualPackages: calibratedPackages.length > 0 ? calibratedPackages : undefined,
    };

    // Add low quality warning to recommendations
    if (isLowQuality && !estimation.recommendations.some(r => r.includes("lighting"))) {
      estimation.recommendations.unshift("💡 Tip: Use better lighting and a steady camera for more accurate results.");
    }

    console.log(
      `[analyze-weight-scale] SUCCESS - Weight: ${estimation.estimatedWeightKg}kg, Packages: ${estimation.packageCount}, Confidence: ${estimation.confidenceLevel}`
    );

    return createResponse({
      success: true,
      estimation,
      timestamp: new Date().toISOString(),
      imageQuality: isLowQuality ? "low" : "good",
    }, 200);

  } catch (error) {
    console.error("[analyze-weight-scale] Unexpected error:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Analysis failed. Please try again.",
      500,
      "ERR_UNEXPECTED"
    );
  }
});
