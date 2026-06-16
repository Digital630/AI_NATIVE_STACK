import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalyzeRequest {
  imageBase64: string;
  mimeType: string;
  sessionId?: string;
  visitorId?: string;
}

interface AnalysisResult {
  success: boolean;
  analysis?: {
    productQuality: {
      assessment: string;
      description: string;
    };
    moistureContent: {
      assessment: string;
      description: string;
    };
    harvestReadiness: {
      assessment: string;
      description: string;
    };
    heatStress: {
      assessment: string;
      description: string;
    };
    confidenceLevel: "High confidence" | "Moderate confidence" | "Low confidence";
    overallSummary: string;
    recommendations: string[];
    detectedCommodity?: string | null;
  };
  error?: string;
  lowQualityWarning?: boolean;
  rejected?: boolean;
  rejectionReason?: string;
}

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

// Agri-commodity scope validation prompt - STRICT VALIDATION
const CONTENT_VALIDATION_PROMPT = `You are a STRICT content validator for AgriSMES, an agri-business trade platform. You MUST determine if an image is within the agri-commodity scope.

CRITICAL: Be VERY STRICT. When in doubt, reject the image.

ACCEPTED CONTENT ONLY (isAgriCommodity: true):
- Raw agricultural products: coffee beans, cashew nuts (raw or processed), cocoa beans, avocados, macadamia nuts, sesame seeds, pineapples, spices, pigeon peas, cardamom, vanilla pods, tea leaves, grains, legumes, fruits, vegetables, nuts, seeds
- Processed agri-products: roasted coffee beans, shelled cashews, dried fruits, ground spices, packaged agricultural goods
- Agricultural trade imagery: warehouses CONTAINING agri-products, shipping containers WITH commodities visible, export packaging with product, quality inspection of crops/produce, agricultural fields, farms with crops
- Trade documents: export certificates, quality certificates, Certificates of Analysis, shipping manifests, trade contracts (MUST be clearly agriculture/commodity related)

REJECT ALL OF THE FOLLOWING (isAgriCommodity: false):
- ANY photos of people, faces, selfies, portraits - even if person is in a field
- ANY animals: fish, livestock, pets, wildlife, poultry, meat, seafood
- Non-food items: electronics, clothing, vehicles, furniture, machinery, buildings without agri context
- Prepared food: cooked meals, restaurant food, beverages in bottles/cans
- Random objects, memes, screenshots, artwork, landscapes without crops
- Documents NOT related to agri-trade (personal documents, IDs, receipts, etc.)
- Blurry or unclear images where content cannot be determined

IMPORTANT: If you see a PERSON as the main subject, you MUST return isAgriCommodity: false with category: rejected-person

Return ONLY this JSON format, nothing else:
{"isAgriCommodity":true,"detectedContent":"description","category":"agri-product"}
OR
{"isAgriCommodity":false,"detectedContent":"description","category":"rejected-person|rejected-animal|rejected-non-food|rejected-other"}`;

const ANALYSIS_SYSTEM_PROMPT = `You are an expert agricultural product quality analyst for AgriSMES. Analyze uploaded images of agricultural commodities (coffee beans, cashew nuts, cocoa, avocados, macadamia, sesame, pineapple, spices, etc.) and provide professional assessments.

ANALYSIS FRAMEWORK (MOISTURE CONTENT IS THE PRIMARY FOCUS):
1. MOISTURE CONTENT (PRIORITY): Carefully estimate moisture based on visual cues:
   - Surface appearance (sheen, dryness, dampness)
   - Color intensity and uniformity (darker often indicates higher moisture)
   - Texture appearance (wrinkled = dry, plump = higher moisture)
   - For coffee: optimal is 10-12%, above 13% is too high
   - For cashew: optimal is 5-8%, above 10% is too high
   - For cocoa: optimal is 6-8%, above 9% is too high
   
2. PRODUCT QUALITY: Assess visual quality indicators (color consistency, size uniformity, physical defects, foreign matter)
3. HARVEST READINESS: For raw products, assess maturity and harvest timing
4. HEAT STRESS: Look for signs of heat damage, discoloration, or stress patterns

CONFIDENCE LEVELS:
- "High confidence": Clear image, identifiable commodity, visible quality indicators
- "Moderate confidence": Some details unclear, but reasonable assessment possible
- "Low confidence": Poor image quality, unidentifiable product, or insufficient visible detail

IMPORTANT RULES:
- Be objective and factual
- Avoid promises or guarantees about trade outcomes
- If image quality is too low, say so clearly
- Provide actionable recommendations
- Never fabricate data or measurements

Respond ONLY with a valid JSON object in this exact format:
{
  "productQuality": {
    "assessment": "Good quality|Fair quality|Inconsistent quality detected|Unable to assess",
    "description": "Brief description of quality observations"
  },
  "moistureContent": {
    "assessment": "Optimal moisture content|Moisture appears acceptable|Moisture is too high|Moisture appears low|Unable to assess",
    "description": "Brief description of moisture observations"
  },
  "harvestReadiness": {
    "assessment": "Ready for harvest|Appears mature|Harvesting may be premature|Post-harvest product|Unable to assess",
    "description": "Brief description of maturity observations"
  },
  "heatStress": {
    "assessment": "Looks healthy|Minor stress indicators|Product affected by heat stress|Unable to assess",
    "description": "Brief description of stress observations"
  },
  "confidenceLevel": "High confidence|Moderate confidence|Low confidence",
  "overallSummary": "2-3 sentence summary of the product condition",
  "recommendations": ["List of 2-4 actionable recommendations"],
  "detectedCommodity": "Name of detected commodity or null if unknown"
}`;

// Generate polite rejection message based on detected content
function generateRejectionMessage(detectedContent: string, category: string): string {
  const contentLabel = detectedContent || "content";
  
  if (category === "rejected-person") {
    return `Sorry, the image you uploaded appears to be a photo of ${contentLabel}. This is outside the scope of AgriSMES, which focuses on agri-commodity imagery and shipping documents. Please upload an image of agricultural products like coffee beans, cashew nuts, or cocoa for analysis. 😊\n\nWould you like to know more about what types of images we can analyze, or do you have questions about a specific commodity?`;
  }
  
  if (category === "rejected-animal") {
    return `Sorry, the image you uploaded appears to show ${contentLabel}. This is outside the scope of AgriSMES, which focuses on agri-commodity imagery and trade documents. Please upload an image of agricultural products like coffee beans, cashew nuts, or cocoa for analysis. 😊\n\nAre you looking to source specific agricultural commodities? I can help guide you through the process!`;
  }
  
  if (category === "rejected-non-food") {
    return `Sorry, the image you uploaded appears to show ${contentLabel}. AgriSMES specializes in agri-business products and trade documentation. Please upload relevant images of agricultural commodities or shipping documents for your trade activities. 😊\n\nWould you like to explore our available commodities like coffee, cashews, or cocoa?`;
  }
  
  return `Sorry, the image you uploaded (${contentLabel}) is outside the scope of AgriSMES's agri-commodity focus. Please upload images of agricultural products like coffee, cashews, cocoa, or relevant trade documentation such as export certificates or quality reports. 😊\n\nIf you have questions about our services or available commodities, I'm happy to help!`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Service configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { imageBase64, mimeType, sessionId, visitorId }: AnalyzeRequest = await req.json();

    if (!imageBase64 || !mimeType) {
      return new Response(
        JSON.stringify({ success: false, error: "Image data and MIME type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate MIME type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(mimeType.toLowerCase())) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid image format. Please upload JPG, JPEG, or PNG." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check approximate file size (base64 is ~33% larger than binary)
    const approximateSizeBytes = (imageBase64.length * 3) / 4;
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (approximateSizeBytes > maxSizeBytes) {
      return new Response(
        JSON.stringify({ success: false, error: "Image size exceeds 5MB limit. Please upload a smaller image." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[analyze-product-image] Processing image for visitor: ${visitorId}, session: ${sessionId}`);

    // Step 1: Validate content is within agri-commodity scope
    console.log("[analyze-product-image] Step 1: Validating content scope...");
    
    const validationResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: CONTENT_VALIDATION_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this image and determine if it's within the agri-commodity scope for AgriSMES."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 300,
      }),
    });

    if (!validationResponse.ok) {
      console.error("Validation API error:", validationResponse.status);
      // If validation fails, return error - don't proceed with hallucinated analysis
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unable to validate image content. Please try again."
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const validationResult = await validationResponse.json();
    const validationContent = validationResult.choices?.[0]?.message?.content;
    
    if (!validationContent) {
      console.error("No validation content received");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unable to validate image content. Please try again."
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    let validation;
    try {
      let jsonContent = validationContent.trim();
      // Remove markdown code blocks if present
      const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
      }
      // Also handle cases where response starts with extra text
      const jsonStart = jsonContent.indexOf('{');
      const jsonEnd = jsonContent.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonContent = jsonContent.substring(jsonStart, jsonEnd + 1);
      }
      validation = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error("Failed to parse validation response:", validationContent);
      // If we can't parse, reject as a safety measure
      return new Response(
        JSON.stringify({
          success: false,
          rejected: true,
          rejectionReason: "Sorry, we couldn't properly analyze this image. Please upload a clear image of an agricultural product like coffee beans, cashew nuts, or cocoa. 😊",
          error: "Image validation failed"
        } as AnalysisResult),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`[analyze-product-image] Validation result: isAgriCommodity=${validation.isAgriCommodity}, category=${validation.category}, content=${validation.detectedContent}`);
    
    // STRICT: Reject non-agri-commodity content
    if (validation.isAgriCommodity !== true) {
      const rejectionMessage = generateRejectionMessage(validation.detectedContent, validation.category || "rejected-other");
      
      console.log(`[analyze-product-image] REJECTING content: ${validation.detectedContent}`);
      
      return new Response(
        JSON.stringify({
          success: false,
          rejected: true,
          rejectionReason: rejectionMessage,
          error: rejectionMessage
        } as AnalysisResult),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`[analyze-product-image] Content APPROVED: ${validation.detectedContent}`);

    // Step 2: Perform detailed agri-commodity analysis
    console.log("[analyze-product-image] Step 2: Performing detailed analysis...");
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this agricultural product image and provide a quality assessment. Focus on product quality, moisture content, harvest readiness, and heat stress indicators."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        temperature: 0.2,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Service temporarily busy. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "Service unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI analysis failed");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No analysis content received");
    }

    // Parse the JSON response from AI
    let analysis;
    try {
      // Extract JSON from potential markdown code blocks
      let jsonContent = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
      }
      analysis = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Return a low-confidence fallback
      return new Response(
        JSON.stringify({
          success: true,
          analysis: {
            productQuality: { assessment: "Unable to assess", description: "Image analysis could not be completed reliably." },
            moistureContent: { assessment: "Unable to assess", description: "Moisture content could not be determined from this image." },
            harvestReadiness: { assessment: "Unable to assess", description: "Harvest readiness could not be determined." },
            heatStress: { assessment: "Unable to assess", description: "Heat stress indicators could not be evaluated." },
            confidenceLevel: "Low confidence",
            overallSummary: "The image could not be analyzed reliably. Please upload a clearer, higher-quality image of the product.",
            recommendations: [
            "Upload a higher-quality image with better lighting",
              "Ensure the product is clearly visible and in focus",
              "Consider contacting AgriSMES for expert review"
            ],
            detectedCommodity: null
          },
          lowQualityWarning: true
        } as AnalysisResult),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if confidence is low and add warning
    const isLowConfidence = analysis.confidenceLevel === "Low confidence";
    
    console.log(`[analyze-product-image] Analysis complete. Confidence: ${analysis.confidenceLevel}, Commodity: ${analysis.detectedCommodity || 'unknown'}`);

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        lowQualityWarning: isLowConfidence
      } as AnalysisResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Image analysis error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Sorry, we couldn't analyze the uploaded image. Please upload a better-quality image." 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
