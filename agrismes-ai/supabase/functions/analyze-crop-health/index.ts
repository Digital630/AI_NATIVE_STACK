import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

interface AnalyzeRequest {
  imageBase64: string;
  mimeType: string;
  analysisType: string;
  prompt: string;
  sessionId?: string;
  visitorId?: string;
}

function createResponse(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function createErrorResponse(message: string, status: number): Response {
  return createResponse({ success: false, error: message }, status);
}

async function callAI(prompt: string, imageBase64: string, mimeType: string): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
      max_tokens: 2048,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[analyze-crop-health] AI Error:", errorText);
    throw new Error(`AI request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

function extractJSON(text: string): any {
  // Try parsing directly
  try {
    return JSON.parse(text);
  } catch (e) {}

  // Try extracting from markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch (e) {}
  }

  // Try finding JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {}
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return createErrorResponse("Method not allowed", 405);
  }

  if (!LOVABLE_API_KEY) {
    console.error("[analyze-crop-health] Missing LOVABLE_API_KEY");
    return createErrorResponse("Service configuration error", 500);
  }

  try {
    const body: AnalyzeRequest = await req.json();
    const { imageBase64, mimeType, analysisType, prompt } = body;

    if (!imageBase64 || !mimeType) {
      return createErrorResponse("Missing required fields", 400);
    }

    // Validate MIME type
    const validMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validMimes.includes(mimeType.toLowerCase())) {
      return createErrorResponse("Unsupported image format", 400);
    }

    // Size check (rough estimate)
    const estimatedSize = (imageBase64.length * 3) / 4;
    if (estimatedSize > 10 * 1024 * 1024) {
      return createErrorResponse("Image too large (max 10MB)", 400);
    }

    console.log(`[analyze-crop-health] Processing ${analysisType} analysis`);

    // Validation prompt
    const validationPrompt = `Analyze this image briefly. Is it:
1. An agricultural image (crops, plants, soil, produce)?
2. Clear enough for analysis?

Return JSON: {"isAgricultural": boolean, "isAnalyzable": boolean, "detectedContent": "string"}`;

    const validationResponse = await callAI(validationPrompt, imageBase64, mimeType);
    const validation = extractJSON(validationResponse);

    if (validation && !validation.isAgricultural) {
      return createResponse({
        success: false,
        rejected: true,
        rejectionReason: `This image appears to show ${validation.detectedContent || "non-agricultural content"}. Please upload an image of crops, plants, soil, or agricultural produce.`,
      });
    }

    // Main analysis
    const analysisResponse = await callAI(prompt, imageBase64, mimeType);
    const analysis = extractJSON(analysisResponse);

    if (!analysis) {
      console.error("[analyze-crop-health] Failed to parse AI response");
      return createErrorResponse("Analysis failed - could not parse results", 500);
    }

    console.log(`[analyze-crop-health] ${analysisType} analysis complete`);

    return createResponse({
      success: true,
      analysis,
      analysisType,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[analyze-crop-health] Error:", error);
    return createErrorResponse(error.message || "Analysis failed", 500);
  }
});
