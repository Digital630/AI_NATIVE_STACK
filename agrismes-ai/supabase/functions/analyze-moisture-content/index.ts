import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BatchContext {
  commodity: string;
  form: string;
  dryingMethod: string;
  storageCondition: string;
  timeSinceHarvest: string;
  weatherExposure: string;
  sensoryCondition: string;
  textureCondition: string;
  packagingType: string;
}

interface AnalyzeRequest {
  imageBase64: string;
  mimeType: string;
  sessionId?: string;
  visitorId?: string;
  retryAttempt?: number;
  batchContext?: BatchContext;
}

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const MAX_RETRIES = 2;

// COMMODITY SAFE RANGES - Tightly controlled
const COMMODITY_RANGES: Record<string, {
  safeMin: number;
  safeMax: number;
  idealTarget: number;
  label: string;
  standard: string;
}> = {
  cashew: { safeMin: 4.0, safeMax: 6.0, idealTarget: 5.0, label: "Cashew Nuts", standard: "Trade-safe dry product" },
  coffee: { safeMin: 8.0, safeMax: 10.0, idealTarget: 9.0, label: "Coffee (Green)", standard: "Trade-ready dry coffee" },
  cocoa:  { safeMin: 5.5, safeMax: 7.5, idealTarget: 6.5, label: "Cocoa Beans", standard: "ICCO standard" },
  sesame: { safeMin: 5.0, safeMax: 7.0, idealTarget: 6.0, label: "Sesame Seeds", standard: "Export standard" },
};

function getCommodityKey(commodity: string): string {
  const lower = commodity.toLowerCase();
  if (lower.includes("cashew")) return "cashew";
  if (lower.includes("coffee") || lower.includes("arabica") || lower.includes("robusta")) return "coffee";
  if (lower.includes("cocoa")) return "cocoa";
  if (lower.includes("sesame")) return "sesame";
  return "default";
}

// Estimate moisture position within safe range based on batch context signals
function estimateMoistureFromContext(batchContext: BatchContext, commodityKey: string): {
  estimate: number | null;
  confidence: "High" | "Medium" | "Low";
  isAbnormal: boolean;
  abnormalDirection?: "too_wet" | "too_dry";
  abnormalReasons: string[];
} {
  const range = COMMODITY_RANGES[commodityKey];
  if (!range) {
    return { estimate: null, confidence: "Low", isAbnormal: false, abnormalReasons: [] };
  }

  const { safeMin, safeMax, idealTarget } = range;
  const span = safeMax - safeMin;
  let offset = 0; // offset from ideal: negative = drier, positive = wetter
  let signalCount = 0;
  let abnormalFlags: string[] = [];
  let isAbnormal = false;

  // Drying method
  if (batchContext.dryingMethod) {
    signalCount++;
    const d = batchContext.dryingMethod.toLowerCase();
    if (d.includes("mechanical") || d.includes("machine")) offset -= 0.3;
    else if (d.includes("sun") && d.includes("covered")) offset -= 0.1;
    else if (d.includes("sun")) offset += 0.0;
    else if (d.includes("shade")) offset += 0.15;
    else if (d.includes("none") || d.includes("not dried") || d.includes("undried")) {
      isAbnormal = true;
      abnormalFlags.push("Product not dried");
    }
  }

  // Storage condition
  if (batchContext.storageCondition) {
    signalCount++;
    const s = batchContext.storageCondition.toLowerCase();
    if (s.includes("climate") || s.includes("controlled") || s.includes("sealed")) offset -= 0.2;
    else if (s.includes("warehouse") || s.includes("indoor")) offset -= 0.05;
    else if (s.includes("open") || s.includes("outdoor")) offset += 0.25;
    else if (s.includes("damp") || s.includes("humid") || s.includes("wet")) {
      isAbnormal = true;
      abnormalFlags.push("Damp/humid storage");
    }
  }

  // Time since harvest
  if (batchContext.timeSinceHarvest) {
    signalCount++;
    const t = batchContext.timeSinceHarvest.toLowerCase();
    if (t.includes("week") || t.includes("recent") || t.includes("fresh")) offset += 0.2;
    else if (t.includes("month")) offset += 0.0;
    else if (t.includes("year") || t.includes("long")) offset -= 0.15;
  }

  // Weather exposure
  if (batchContext.weatherExposure) {
    signalCount++;
    const w = batchContext.weatherExposure.toLowerCase();
    if (w.includes("rain") || w.includes("flood") || w.includes("monsoon")) {
      isAbnormal = true;
      abnormalFlags.push("Rain/flood exposure");
    } else if (w.includes("humid")) offset += 0.2;
    else if (w.includes("dry") || w.includes("arid")) offset -= 0.2;
  }

  // Sensory condition (smell/mold/heat)
  if (batchContext.sensoryCondition) {
    signalCount++;
    const c = batchContext.sensoryCondition.toLowerCase();
    if (c.includes("mold") || c.includes("mould") || c.includes("musty") || c.includes("rotten")) {
      isAbnormal = true;
      abnormalFlags.push("Mold/musty smell detected");
    } else if (c.includes("heat") || c.includes("hot") || c.includes("ferment")) {
      offset += 0.2;
      abnormalFlags.push("Heat/fermentation signs");
    } else if (c.includes("clean") || c.includes("normal") || c.includes("good")) {
      offset -= 0.05;
    }
  }

  // Texture condition
  if (batchContext.textureCondition) {
    signalCount++;
    const tx = batchContext.textureCondition.toLowerCase();
    if (tx.includes("soft") || tx.includes("spongy") || tx.includes("flexible")) {
      offset += 0.3;
      if (commodityKey === "cashew") {
        isAbnormal = true;
        abnormalFlags.push("Soft/spongy texture (cashew should be brittle)");
      }
    } else if (tx.includes("brittle") || tx.includes("hard") || tx.includes("crisp")) {
      offset -= 0.2;
    }
  }

  // Packaging type
  if (batchContext.packagingType) {
    signalCount++;
    const p = batchContext.packagingType.toLowerCase();
    if (p.includes("hermetic") || p.includes("vacuum") || p.includes("sealed")) offset -= 0.1;
    else if (p.includes("jute") || p.includes("sisal")) offset += 0.1;
    else if (p.includes("open") || p.includes("none")) offset += 0.2;
  }

  if (isAbnormal) {
    return {
      estimate: null,
      confidence: "Low",
      isAbnormal: true,
      abnormalDirection: "too_wet",
      abnormalReasons: abnormalFlags,
    };
  }

  // Calculate estimate within safe range
  const confidence: "High" | "Medium" | "Low" = signalCount >= 5 ? "High" : signalCount >= 3 ? "Medium" : "Low";
  
  // Clamp offset and map to range
  const clampedOffset = Math.max(-1, Math.min(1, offset));
  const estimate = idealTarget + clampedOffset * (span / 2);
  const clampedEstimate = Math.round(Math.max(safeMin, Math.min(safeMax, estimate)) * 10) / 10;

  return { estimate: clampedEstimate, confidence, isAbnormal: false, abnormalReasons: [] };
}

// System prompt for image-based moisture analysis with STRICT range enforcement
function buildMoisturePrompt(batchContext?: BatchContext): string {
  const contextSection = batchContext ? `
BATCH CONTEXT PROVIDED BY USER:
- Commodity: ${batchContext.commodity}
- Form: ${batchContext.form}
- Drying method: ${batchContext.dryingMethod}
- Storage condition: ${batchContext.storageCondition}
- Time since harvest: ${batchContext.timeSinceHarvest}
- Weather exposure: ${batchContext.weatherExposure}
- Sensory (smell/mold/heat): ${batchContext.sensoryCondition}
- Texture: ${batchContext.textureCondition}
- Packaging: ${batchContext.packagingType}

Use this context to refine your visual assessment. The context is PRIMARY evidence; the image is SECONDARY confirmation.
` : '';

  return `You are an expert agricultural moisture analyst. Analyze the uploaded image alongside any batch context.

CRITICAL RULES:
1. ONLY analyze images of agricultural commodities. If not agri-commodity, set "rejected": true.
2. You MUST identify the commodity type first.
3. Your moisture estimate MUST fall within the commodity's safe range for normal, trade-ready product:
   - Cashew Nuts: 4.0% – 6.0% (target: 5.0%)
   - Coffee (Green): 8.0% – 10.0% (target: 9.0%)
   - Cocoa Beans: 5.5% – 7.5% (target: 6.5%)
   - Sesame Seeds: 5.0% – 7.0% (target: 6.0%)
4. Do NOT generate values outside these ranges unless you detect CLEAR abnormal indicators.
5. If abnormal (mold, dampness, poor drying, rain damage), set "isAbnormal": true and explain why.
6. Be CONSERVATIVE. When uncertain, estimate closer to the ideal target.
7. NEVER invent precision you don't have. If image quality is poor, say confidence is Low.
${contextSection}
VISUAL INDICATORS TO ASSESS:
- Surface: dry/matte = lower moisture; sheen/wet = higher moisture
- Color: lighter = proper drying; dark/mottled = higher moisture risk
- Texture: firm = good; soft/spongy = high moisture risk
- Defects: mold, discoloration, clumping = abnormal

Return ONLY valid JSON:
{
  "rejected": false,
  "commodity": "Detected commodity name",
  "commodityGrade": "Grade if identifiable or null",
  "commodityType": "Variety/type or null",
  "moisturePercentage": 5.0,
  "confidenceLevel": "High / Medium / Low",
  "isAbnormal": false,
  "abnormalDirection": null,
  "abnormalReasons": [],
  "quality": "Export-grade / Good / Fair / Poor",
  "visualIndicators": {
    "surfaceAppearance": "dry/matte/sheen/wet",
    "colorAnalysis": "light/moderate/dark",
    "textureAssessment": "firm/brittle/soft"
  },
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "imageMetadata": {
    "estimatedLocation": "Based on visual context or null",
    "capturedAt": "Recent / Within days / Unable to determine",
    "isOnlineSourced": false,
    "sourceWarning": null
  }
}

If abnormal conditions detected:
{
  "rejected": false,
  "commodity": "Commodity name",
  "moisturePercentage": null,
  "confidenceLevel": "Low",
  "isAbnormal": true,
  "abnormalDirection": "too_wet",
  "abnormalReasons": ["Visible mold", "Damp storage signs"],
  "quality": "Poor",
  "recommendations": ["Re-test with digital moisture meter", "Do not bag until verified"],
  "visualIndicators": { ... },
  "imageMetadata": { ... }
}

If NOT an agri-commodity:
{
  "rejected": true,
  "rejectionReason": "Please upload images of agricultural commodities (coffee, cashew, cocoa, sesame) for moisture analysis."
}`;
}

function createResponse(data: Record<string, unknown>, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...headers },
  });
}

function createErrorResponse(message: string, status: number, errorCode?: string, retryable = false): Response {
  console.error(`[analyze-moisture-content] Error (${status}): ${message}`);
  return createResponse({ success: false, error: message, errorCode: errorCode || `ERR_${status}`, retryable }, status);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders, status: 204 });
  if (req.method !== "POST") return createErrorResponse("Method not allowed. Use POST.", 405, "ERR_METHOD_NOT_ALLOWED");

  try {
    if (!LOVABLE_API_KEY) {
      return createErrorResponse("Service configuration error. Please contact support.", 500, "ERR_CONFIG");
    }

    let requestBody: AnalyzeRequest;
    try {
      requestBody = await req.json();
    } catch {
      return createErrorResponse("Invalid request format. Expected JSON body.", 400, "ERR_INVALID_JSON");
    }

    const { imageBase64, mimeType, sessionId, visitorId, retryAttempt = 0, batchContext } = requestBody;

    if (!imageBase64) return createErrorResponse("Image data is required.", 400, "ERR_MISSING_IMAGE");
    if (!mimeType) return createErrorResponse("Image type is required.", 400, "ERR_MISSING_MIME");

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(mimeType.toLowerCase())) {
      return createErrorResponse("Invalid image format. Please upload JPG or PNG.", 400, "ERR_INVALID_FORMAT");
    }

    const estimatedSize = (imageBase64.length * 3) / 4;
    if (estimatedSize > 10 * 1024 * 1024) {
      return createErrorResponse("Image too large. Please use an image under 10MB.", 400, "ERR_IMAGE_TOO_LARGE");
    }

    const isLowQuality = estimatedSize < 50 * 1024;

    console.log(`[analyze-moisture-content] Processing visitor: ${visitorId || "unknown"}, attempt: ${retryAttempt + 1}, hasContext: ${!!batchContext}`);

    // If we have batch context, compute structured estimate first
    let contextEstimate: ReturnType<typeof estimateMoistureFromContext> | null = null;
    let commodityKey = "default";
    if (batchContext?.commodity) {
      commodityKey = getCommodityKey(batchContext.commodity);
      contextEstimate = estimateMoistureFromContext(batchContext, commodityKey);
    }

    // Call AI for image analysis
    const prompt = buildMoisturePrompt(batchContext);
    let response: Response;
    try {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: prompt },
            {
              role: "user",
              content: [
                { type: "text", text: "Analyze this agricultural product image for moisture content. Apply the commodity-specific safe range strictly." },
                { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
              ],
            },
          ],
          temperature: 0.1,
          max_tokens: 1200,
        }),
      });
    } catch (fetchError) {
      console.error("[analyze-moisture-content] Network error:", fetchError);
      return createErrorResponse("Network error. Please try again.", 503, "ERR_NETWORK", true);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[analyze-moisture-content] AI gateway error: ${response.status}`, errorText);
      switch (response.status) {
        case 429: return createErrorResponse("Service is busy. Please wait and try again.", 429, "ERR_RATE_LIMIT", true);
        case 402: return createErrorResponse("Service temporarily unavailable.", 503, "ERR_SERVICE_UNAVAILABLE", true);
        case 503: case 504: return createErrorResponse("Analysis service temporarily unavailable.", 503, "ERR_SERVICE_UNAVAILABLE", true);
        case 500:
          if (retryAttempt < MAX_RETRIES) return createErrorResponse("Temporary issue. Please try again.", 503, "ERR_TEMPORARY", true);
          return createErrorResponse("Unable to analyze image.", 500, "ERR_AI_GATEWAY");
        case 400: return createErrorResponse("Unable to process this image.", 400, "ERR_BAD_REQUEST");
        default: return createErrorResponse("Unable to analyze image.", 500, "ERR_UNKNOWN");
      }
    }

    let aiResponse;
    try { aiResponse = await response.json(); } catch {
      return createErrorResponse("Invalid response from analysis service.", 500, "ERR_PARSE_RESPONSE");
    }

    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) return createErrorResponse("Analysis could not be completed.", 500, "ERR_NO_CONTENT");

    let analysis;
    try {
      let jsonContent = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonContent = jsonMatch[1].trim();
      const jsonStart = jsonContent.indexOf("{");
      const jsonEnd = jsonContent.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1) jsonContent = jsonContent.substring(jsonStart, jsonEnd + 1);
      analysis = JSON.parse(jsonContent);
    } catch {
      console.error("[analyze-moisture-content] Failed to parse AI response:", content);
      return createErrorResponse("Analysis could not be completed.", 500, "ERR_PARSE_AI_RESPONSE");
    }

    if (analysis.rejected) {
      return createResponse({ success: false, rejected: true, rejectionReason: analysis.rejectionReason || "Please upload an agricultural commodity image." }, 200);
    }

    // Determine commodity key from AI if not from context
    const detectedCommodity = analysis.commodity || batchContext?.commodity || "Unknown";
    if (commodityKey === "default") commodityKey = getCommodityKey(detectedCommodity);
    const range = COMMODITY_RANGES[commodityKey];

    // Check for abnormal conditions
    const aiAbnormal = analysis.isAbnormal === true;
    const contextAbnormal = contextEstimate?.isAbnormal === true;
    const isAbnormal = aiAbnormal || contextAbnormal;

    if (isAbnormal) {
      const abnormalReasons = [
        ...(contextEstimate?.abnormalReasons || []),
        ...(analysis.abnormalReasons || []),
      ].filter((v, i, a) => a.indexOf(v) === i);

      const recommendations = [
        "⚠️ Estimated condition: Likely out of safe range",
        "Requires physical moisture meter confirmation before trade decisions",
        ...(analysis.recommendations || []),
      ];

      return createResponse({
        success: true,
        analysis: {
          commodity: detectedCommodity,
          commodityGrade: analysis.commodityGrade || null,
          commodityType: analysis.commodityType || null,
          moisturePercentage: null,
          safeRange: range ? `${range.safeMin}–${range.safeMax}%` : "Unknown",
          quality: analysis.quality || "Poor",
          recommendations,
          confidenceLevel: "Low",
          isAbnormal: true,
          abnormalDirection: contextEstimate?.abnormalDirection || analysis.abnormalDirection || "too_wet",
          abnormalReasons,
          visualIndicators: analysis.visualIndicators || null,
          imageMetadata: analysis.imageMetadata || null,
          method: "AI Moisture Assessment",
        },
        imageQuality: isLowQuality ? "low" : "good",
      }, 200);
    }

    // ENFORCE SAFE RANGE for normal assessment
    let finalMoisture: number;
    if (range) {
      // Prefer context-based estimate if available, use AI as secondary
      const aiMoisture = typeof analysis.moisturePercentage === "number" ? analysis.moisturePercentage : null;
      const ctxMoisture = contextEstimate?.estimate;

      if (ctxMoisture !== null && ctxMoisture !== undefined) {
        // Context estimate takes priority; blend with AI if AI is also in range
        if (aiMoisture !== null && aiMoisture >= range.safeMin && aiMoisture <= range.safeMax) {
          finalMoisture = Math.round(((ctxMoisture * 0.6) + (aiMoisture * 0.4)) * 10) / 10;
        } else {
          finalMoisture = ctxMoisture;
        }
      } else if (aiMoisture !== null) {
        // Clamp AI moisture to safe range
        finalMoisture = Math.round(Math.max(range.safeMin, Math.min(range.safeMax, aiMoisture)) * 10) / 10;
      } else {
        finalMoisture = range.idealTarget;
      }

      // Final clamp
      finalMoisture = Math.round(Math.max(range.safeMin, Math.min(range.safeMax, finalMoisture)) * 10) / 10;
    } else {
      // No known range - use AI estimate directly but flag low confidence
      finalMoisture = typeof analysis.moisturePercentage === "number" ? analysis.moisturePercentage : 0;
    }

    // Determine confidence
    let confidence = contextEstimate?.confidence || analysis.confidenceLevel || "Medium";
    if (isLowQuality && confidence === "High") confidence = "Medium";
    if (!batchContext && isLowQuality) confidence = "Low";

    const recommendations = analysis.recommendations || [];
    if (isLowQuality) {
      recommendations.unshift("💡 Low resolution image. Use better lighting for more accurate results.");
    }
    if (!batchContext) {
      recommendations.push("📋 Provide batch details (drying method, storage, etc.) for higher confidence.");
    }

    // Always add the standard disclaimer recommendation
    recommendations.push("🔬 Confirm with a calibrated moisture meter before export or long-term storage.");

    console.log(`[analyze-moisture-content] SUCCESS - Commodity: ${detectedCommodity}, Moisture: ${finalMoisture}%, Confidence: ${confidence}`);

    return createResponse({
      success: true,
      analysis: {
        commodity: detectedCommodity,
        commodityGrade: analysis.commodityGrade || null,
        commodityType: analysis.commodityType || null,
        moisturePercentage: finalMoisture,
        safeRange: range ? `${range.safeMin}–${range.safeMax}%` : null,
        quality: analysis.quality || "Unknown",
        recommendations,
        confidenceLevel: confidence,
        isAbnormal: false,
        abnormalDirection: null,
        abnormalReasons: [],
        visualIndicators: analysis.visualIndicators || null,
        imageMetadata: analysis.imageMetadata || null,
        method: "AI Moisture Assessment",
        calibrationNote: range
          ? `Result constrained to ${range.label} safe range: ${range.safeMin}–${range.safeMax}% (${range.standard}).`
          : "General assessment — no commodity-specific range applied.",
      },
      imageQuality: isLowQuality ? "low" : "good",
      lowQualityWarning: isLowQuality,
    }, 200);
  } catch (error) {
    console.error("[analyze-moisture-content] Unexpected error:", error);
    return createErrorResponse(
      error instanceof Error ? `Analysis failed: ${error.message}` : "Failed to analyze moisture content.",
      500, "ERR_UNEXPECTED"
    );
  }
});
