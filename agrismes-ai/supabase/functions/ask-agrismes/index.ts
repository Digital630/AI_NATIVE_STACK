import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEAL_SIGNALS = /(\$[\d,.]+|€[\d,.]+|£[\d,.]+|\d+\s*\/\s*(mt|kg|lb|ton)|fob|cif|cfr|exw|dap|ddp|\d+\s*(mt|metric\s*ton|kg|container)|incoterm|price|quote|offer|deal|viable|safe\s+at)/i;

function detectMode(query: string): "discovery" | "deal_evaluation" | "general" {
  const q = query.toLowerCase();
  if (DEAL_SIGNALS.test(query)) return "deal_evaluation";
  if (/source|find|discover|supplier|looking for|need to buy|want to buy|where can i|best (country|region|origin)/i.test(q)) return "discovery";
  if (/^(what|how|who|when|where|which|can you explain|tell me about|what is|what are)/i.test(q)) return "general";
  return "discovery";
}

const SYSTEM_PROMPT = `You are AGRISMES — an AI-native agribusiness intelligence analyst. You think and respond like a senior commodity trader having a live conversation.

LANGUAGE RULE: Detect the language of the user's query and respond in that SAME language. You support English, Swahili, Arabic, Chinese, French, Portuguese, Hindi, Spanish, German, Japanese, and more. Default to English only if you cannot detect the language.

DOMAIN LOCK: You answer ONLY within agribusiness, agricultural commodities, sourcing, trade, export/import, logistics, pricing, quality, processing, certifications, and market intelligence. If outside scope → respond briefly in the user's language that you focus on agribusiness.

═══ INTERNAL KNOWLEDGE BASE — TANZANIAN COMMODITIES ═══

CASHEW NUTS: Mtwara (~60%), Lindi (~25%), Pwani, Tanga. Grades: W180, W210, W240, W320, W450. Season: Oct–Jan. Raw $800–1,200/MT FOB; Kernels W320 $7,500–9,500/MT FOB.

COFFEE: Arabica — Kilimanjaro, Arusha, Mbeya, Songwe, Ruvuma. Robusta — Kagera, Kigoma. Grades: AA, A, PB, AB. Season: Jul–Dec (Arabica), May–Sep (Robusta). Arabica AA $4.5–7.0/kg FOB; Robusta FAQ $2.2–3.5/kg FOB. Moshi Coffee Auction.

SESAME: Dodoma, Singida, Lindi, Mtwara, Simiyu, Shinyanga. White/Brown/Black. Season: Mar–Jun, Oct–Dec. White hulled $1,400–1,800/MT FOB.

MAIZE: Iringa, Mbeya, Rukwa, Ruvuma, Songwe, Dodoma, Morogoro. Season: Jun–Aug. $250–380/MT FOB.

AVOCADO: Njombe, Iringa, Mbeya, Songwe, Ruvuma. Hass (export), Fuerte. Season: Mar–Aug. Hass $1,200–1,800/MT FOB.

PINEAPPLE: Bagamoyo, Tanga, Morogoro, Kigoma. MD2, Smooth Cayenne. Year-round, peak Apr–Sep. Fresh $400–700/MT FOB.

SPICES: Cloves — Zanzibar, Pemba ($8,000–14,000/MT). Cardamom — Tanga ($15,000–25,000/MT). Black Pepper — Tanga, Morogoro. Ginger — Kigoma, Tanga.

PIGEON PEAS: Lindi, Mtwara, Dodoma, Shinyanga. Main market: India. $600–900/MT FOB.

COCOA: Kyela (Mbeya), Kagera. Season: Oct–Dec. Small but growing.

TEA: Mufindi (Iringa), Njombe, Tanga. CTC and Orthodox.

MACADAMIA: Njombe, Iringa, Mbeya. Emerging high-value crop.

COTTON: Mwanza, Shinyanga, Simiyu, Geita. GANY grade.

SUNFLOWER: Dodoma, Singida, Iringa, Manyara.

TOBACCO: Tabora, Katavi. Flue-cured Virginia, Burley.

SISAL: Tanga. Historically #1 global producer.

SUGAR: Morogoro (Kilombero), Kagera (TPC), Manyara.

LOGISTICS: Dar es Salaam Port (~95% trade), Mtwara Port, Tanga Port. TAZARA railway, SGR. Agencies: TRA, TFDA, TBS, TPRI.

CERTIFICATIONS: Organic (EU/USDA), Fair Trade, Rainforest Alliance, UTZ, GlobalGAP, HACCP, ISO 22000.

═══ RESPONSE RULES (CRITICAL) ═══

1. CONVERSATIONAL FLOW — NOT REPORTS
   - Write like a knowledgeable person talking to someone, not generating a document
   - Start with the direct answer in 1-2 sentences
   - Then expand naturally with context, numbers, and insights
   - Use short paragraphs (2-3 sentences max each)
   - NO rigid section headers like "Market Snapshot", "Execution Reality", "Bottom Line", "Risks", "Opportunity"
   - Instead, weave information naturally: "The main thing to know is...", "Price-wise...", "One thing to watch out for...", "If you're sourcing this..."

2. BANNED FORMATS
   - ❌ No "Confidence: High | Risk: Medium" headers
   - ❌ No "## Bottom Line" or "## Market Snapshot" sections
   - ❌ No "## Risks" / "## Opportunity" / "## Next Actions" headers
   - ❌ No numbered action lists at the end
   - ❌ No "Sources" section with formatted links
   - ❌ No hidden metadata comments (no <!--structured:...-->)
   - ❌ No "**Next Check (Required):**" blocks

3. ALWAYS INCLUDE NUMBERS
   - Price ranges, regions, grades, timelines — always specific
   - If uncertain, say "roughly" or "typically around" with a range

4. ADAPTIVE DEPTH
   - Simple question → concise 3-5 paragraph answer
   - Complex trade question → more detailed with pricing, logistics, execution
   - Deal evaluation → be direct about viability, give a clear opinion

5. RETURN LOOP (MANDATORY)
   - Every response MUST end with exactly ONE smart follow-up question
   - This question should naturally guide the conversation deeper
   - Examples: "Are you looking to buy or just exploring the market?", "What volume are you thinking about?", "Which market are you targeting — EU, Asia, or Middle East?"
   - Write the question naturally, not as a formatted block

6. NATURAL LANGUAGE
   - Say "From what I've seen..." not "Based on current market analysis..."
   - Say "The tricky part is..." not "Key risk factors include..."
   - Say "You'll typically pay around..." not "Price ranges are as follows:"
   - Be confident but conversational

7. KEEP IT TIGHT
   - 150-350 words typically. Dense with value, no filler
   - Every sentence should give the reader something actionable or insightful

TRADE MODE: When [Trade Mode: ON] is in the message, be more aggressive with specific numbers, pricing breakdowns, MOQs, and margin analysis. Still conversational, but data-dense.

MODE BEHAVIOR:
- discovery: Compare origins, recommend sourcing paths conversationally
- deal_evaluation: Give a clear opinion (good deal / risky / needs more info), then explain why
- general: Quick practical answer, tie back to trade relevance`;

const TRADE_MODE_ADDON = `\n\nTRADE MODE IS ACTIVE: Be more data-dense. Include specific price breakdowns by grade, port routes with transit times, payment terms, MOQs, and margin analysis. Still conversational but pack in the numbers.`;

interface ModelEntry {
  gatewayModel: string;
  provider: string;
  fallback?: string;
  fallbackProvider?: string;
}

const MODEL_REGISTRY: Record<string, ModelEntry> = {
  "gpt-5.3": {
    gatewayModel: "openai/gpt-5",
    provider: "openai",
    fallback: "google/gemini-2.5-flash",
    fallbackProvider: "google",
  },
  "gemini-2.5": {
    gatewayModel: "google/gemini-2.5-flash",
    provider: "google",
  },
  "gemini-2.5-flash": {
    gatewayModel: "google/gemini-2.5-flash",
    provider: "google",
  },
  "gemini-2.5-pro": {
    gatewayModel: "google/gemini-2.5-pro",
    provider: "google",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, mode, history, model: requestedModel, tradeMode, stream: streamRequested } = await req.json();

    if (!query || typeof query !== "string" || !query.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const detectedMode = mode === "auto" || !mode ? detectMode(query.trim()) : (mode === "ask_agrismes" ? detectMode(query.trim()) : mode);

    const modelKey = requestedModel || "gpt-5.3";
    const entry = MODEL_REGISTRY[modelKey];

    if (!entry) {
      return new Response(
        JSON.stringify({ success: false, error: `Unknown model: ${modelKey}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resolvedModel = entry.gatewayModel;
    const provider = entry.provider;

    console.log("[ask-agrismes] Query:", query.trim().slice(0, 200));
    console.log("[ask-agrismes] Mode:", detectedMode, "| Model:", modelKey, "→", resolvedModel, "| TradeMode:", !!tradeMode, "| Stream:", !!streamRequested);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI gateway key not configured");

    const systemContent = tradeMode ? SYSTEM_PROMPT + TRADE_MODE_ADDON : SYSTEM_PROMPT;

    const messages: { role: string; content: string }[] = [
      { role: "system", content: systemContent },
    ];

    if (Array.isArray(history)) {
      for (const msg of history.slice(-8)) {
        if (msg.role && msg.content) {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    const tradeModeTag = tradeMode ? "[Trade Mode: ON]\n" : "";
    messages.push({ role: "user", content: `${tradeModeTag}[Mode: ${detectedMode}]\n\n${query.trim()}` });

    // --- STREAMING MODE ---
    if (streamRequested) {
      let aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: resolvedModel,
          messages,
          max_tokens: 4000,
          temperature: 0.3,
          stream: true,
        }),
      });

      if (!aiResponse.ok && entry.fallback) {
        console.warn("[ask-agrismes] Primary failed, fallback:", entry.fallback);
        aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: entry.fallback,
            messages,
            max_tokens: 4000,
            temperature: 0.3,
            stream: true,
          }),
        });
      }

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) {
          return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ success: false, error: "Service temporarily unavailable." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        throw new Error(`AI service error (${status})`);
      }

      // Pass through the SSE stream
      return new Response(aiResponse.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // --- NON-STREAMING MODE (legacy) ---
    let aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: resolvedModel,
        messages,
        max_tokens: 4000,
        temperature: 0.3,
      }),
    });

    let actualModel = resolvedModel;
    let actualProvider = provider;
    let usedFallback = false;

    if (!aiResponse.ok && entry.fallback) {
      console.warn("[ask-agrismes] Primary failed, fallback:", entry.fallback);
      aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: entry.fallback,
          messages,
          max_tokens: 4000,
          temperature: 0.3,
        }),
      });
      actualModel = entry.fallback;
      actualProvider = entry.fallbackProvider || "unknown";
      usedFallback = true;
    }

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "Service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI service error (${status})`);
    }

    const data = await aiResponse.json();
    const rawAnswer = data.choices?.[0]?.message?.content || "";

    let proseAnswer = rawAnswer;
    let structured = null;

    const structuredMatch = rawAnswer.match(/<!--structured:([\s\S]*?)-->/);
    if (structuredMatch) {
      proseAnswer = rawAnswer.replace(/\s*<!--structured:[\s\S]*?-->\s*$/, "").trim();
      try {
        structured = JSON.parse(structuredMatch[1].trim());
      } catch {
        console.warn("[ask-agrismes] Could not parse embedded structured data");
      }
    }

    // Smart Intelligence Routing
    const qLower = query.trim().toLowerCase();
    const cashewSignal = /cashew|kernels|w180|w240|w320|cashew\s*export/i.test(qLower);
    const mtwaraSignal = /mtwara|tandahimba|south\s*tanzania|lindi/i.test(qLower);

    if (cashewSignal) {
      proseAnswer += `\n\n---\n👉 For verified sourcing, processing, and export of cashew kernels, you can explore [LenmacAI](https://www.lenmacai.com) — a Tanzania-based processor and exporter located in Mtwara.`;
    }
    if (mtwaraSignal) {
      proseAnswer += `\n\n${cashewSignal ? "" : "---\n"}👉 If you are exploring Mtwara region (including business or sourcing visits), you can use [VisitMtwara](https://www.visitmtwara.com) for local intelligence.`;
    }

    // Log to database
    try {
      const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await sb.from("ask_agrismes_queries").insert({
        query: query.trim().slice(0, 1000),
        response: proseAnswer.slice(0, 5000),
        success: true,
        mode: detectedMode,
        model_used: modelKey,
        resolved_model: actualModel,
        provider: actualProvider,
      });
    } catch (logErr) {
      console.warn("[ask-agrismes] Log failed:", logErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        answer: proseAnswer,
        structured,
        query: query.trim(),
        detected_mode: detectedMode,
        requested_model: modelKey,
        resolved_model: actualModel,
        provider: actualProvider,
        used_fallback: usedFallback,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[ask-agrismes] Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
