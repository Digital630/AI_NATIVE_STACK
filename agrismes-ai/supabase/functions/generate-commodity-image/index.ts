import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ImageRequest {
  commodity?: string;
  context?: string;
  prompt?: string;
  imageBase64?: string;
  style?: string;
}

// Curated prompts for professional agri commodity images
const COMMODITY_PROMPTS: Record<string, string> = {
  cashew: "Professional photograph of premium cashew nuts, W240 grade, golden color, arranged in a clean pile on natural burlap cloth. Warm natural lighting, high resolution agricultural product photography. Ultra high resolution.",
  cocoa: "Professional photograph of premium cocoa beans, sun-dried, rich brown color, arranged in wooden crate. West African origin style. Warm natural lighting, high resolution agricultural product photography. Ultra high resolution.",
  coffee: "Professional photograph of premium Arabica coffee beans, medium roast, rich brown color, arranged artistically. Some green coffee cherries visible. Natural lighting, high resolution agricultural product photography. Ultra high resolution.",
  macadamia: "Professional photograph of premium macadamia nuts, both shelled and in-shell, creamy white color, arranged on natural wood surface. Warm natural lighting, high resolution agricultural product photography. Ultra high resolution.",
  avocado: "Professional photograph of premium Hass avocados, ripe, dark green skin, some cut open showing creamy flesh. Fresh and export-ready quality. Natural lighting, high resolution agricultural product photography. Ultra high resolution.",
  pineapple: "Professional photograph of premium fresh pineapples, golden yellow, tropical fruit for export. Arranged in wooden crate. Natural lighting, high resolution agricultural product photography. Ultra high resolution.",
  sesame: "Professional photograph of premium sesame seeds, white variety, 99.9% purity grade, arranged in natural pile on burlap. Natural lighting, high resolution agricultural product photography. Ultra high resolution.",
  cardamom: "Professional photograph of premium green cardamom pods, aromatic spice, arranged in small pile on natural surface. Close-up detail. Natural lighting, high resolution agricultural product photography. Ultra high resolution.",
  spices: "Professional photograph of various African spices including cardamom, cloves, and dried chilies arranged artistically on wooden board. Rich colors. Natural lighting, high resolution agricultural product photography. Ultra high resolution.",
  "pigeon pea": "Professional photograph of premium pigeon peas, dried pulses, arranged in natural pile on burlap cloth. Neutral earth tones. Natural lighting, high resolution agricultural product photography. Ultra high resolution.",
};

// Shipping/logistics context prompts
const SHIPPING_PROMPTS: Record<string, string> = {
  container: "Professional photograph of a 20ft shipping container at an African port, being loaded with agricultural export goods. Blue sky, industrial setting. High resolution. Ultra high resolution.",
  warehouse: "Professional photograph of a clean agricultural warehouse in East Africa, organized bags of commodities stacked neatly. Professional lighting. High resolution. Ultra high resolution.",
  port: "Professional aerial photograph of Mombasa port or similar African port, showing cargo ships and containers. Clear day, professional quality. Ultra high resolution.",
  transport: "Professional photograph of trucks transporting agricultural goods on African roads, dust and greenery visible. Documentary style. High resolution. Ultra high resolution.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { commodity, context, prompt: customPrompt, imageBase64, style }: ImageRequest = await req.json();

    // Handle cartoon/fun style image transformation
    if (style === "cartoon" && imageBase64) {
      console.log("Generating cartoon version of uploaded image");
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: customPrompt || "Create a fun, friendly cartoon illustration inspired by this agricultural product image. Make it colorful, playful, and appealing with a happy, cheerful style. Keep the essence of the original product but make it look like a cute cartoon character or illustration."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Cartoon generation error:", response.status, errorText);
        
        // Fallback: Generate a new cartoon image based on description
        return await generateFallbackCartoon(LOVABLE_API_KEY, commodity || "agricultural product", corsHeaders);
      }

      const data = await response.json();
      const description = data.choices?.[0]?.message?.content || "";
      
      // Since we can't directly transform the image, generate a new cartoon based on the description
      return await generateFallbackCartoon(LOVABLE_API_KEY, commodity || "agricultural product", corsHeaders, description);
    }

    // Standard commodity image generation
    if (!commodity && !customPrompt) {
      return new Response(
        JSON.stringify({ error: "Commodity name or prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize commodity name
    const normalizedCommodity = commodity?.toLowerCase().trim() || "";
    
    // Determine the appropriate prompt
    let prompt: string;
    
    if (customPrompt) {
      prompt = customPrompt;
    } else if (context === "shipping" || context === "logistics") {
      const shippingType = context === "shipping" ? "container" : "warehouse";
      prompt = SHIPPING_PROMPTS[shippingType] || SHIPPING_PROMPTS.container;
    } else {
      prompt = COMMODITY_PROMPTS[normalizedCommodity] || 
        `Professional photograph of premium ${commodity}, high quality agricultural product for export. Natural lighting, clean presentation on natural surface. High resolution agricultural product photography. Ultra high resolution.`;
    }

    console.log(`Generating image for: ${commodity}, context: ${context || "product"}`);
    console.log(`Using prompt: ${prompt}`);

    // Call Lovable AI Gateway for image generation
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Image generation service is busy. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Image generation service unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate image");
    }

    const data = await response.json();
    
    // Extract the image URL from the response
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textContent = data.choices?.[0]?.message?.content || "";

    if (!imageData) {
      console.error("No image in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ 
          error: "Image generation failed. Please try again.",
          textContent,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: imageData,
        commodity: normalizedCommodity,
        context: context || "product",
        description: textContent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Image generation error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to generate image" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Fallback: Generate a cartoon-style image from prompt
async function generateFallbackCartoon(
  apiKey: string, 
  commodity: string, 
  corsHeaders: Record<string, string>,
  description?: string
): Promise<Response> {
  const cartoonPrompt = `Create a cute, colorful cartoon illustration of ${commodity}. ${description ? `Based on: ${description}.` : ""} Style: friendly, playful, cheerful cartoon art with bright colors. Make it look like a fun mascot or character. No text or labels.`;
  
  console.log("Generating fallback cartoon with prompt:", cartoonPrompt);
  
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image-preview",
      messages: [
        {
          role: "user",
          content: cartoonPrompt,
        },
      ],
      modalities: ["image", "text"],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Fallback cartoon generation error:", response.status, errorText);
    return new Response(
      JSON.stringify({ error: "Unable to generate cartoon at this time. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const data = await response.json();
  const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

  if (!imageData) {
    return new Response(
      JSON.stringify({ error: "Cartoon generation failed. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      imageUrl: imageData,
      style: "cartoon",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
