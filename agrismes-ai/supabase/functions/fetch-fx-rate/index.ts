import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cache for FX rates
const rateCache: Record<string, { rate: number; timestamp: number }> = {};
const CACHE_DURATION = 60000; // 60 seconds

// Fallback rates (approximate, updated periodically)
const FALLBACK_RATES: Record<string, number> = {
  USD_TZS: 2500,
  USD_KES: 130,
  USD_NGN: 1550,
  USD_ZAR: 18.5,
  USD_EUR: 0.92,
  USD_GBP: 0.79,
  USD_CAD: 1.36,
  USD_AED: 3.67,
  EUR_USD: 1.09,
  GBP_USD: 1.27,
  CAD_USD: 0.74,
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { from, to } = await req.json();

    if (!from || !to) {
      return new Response(
        JSON.stringify({ error: "Missing 'from' and 'to' currency codes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pair = `${from}_${to}`;
    const now = Date.now();

    // Check cache first
    if (rateCache[pair] && now - rateCache[pair].timestamp < CACHE_DURATION) {
      return new Response(
        JSON.stringify({ 
          rate: rateCache[pair].rate, 
          pair, 
          source: "cached",
          timestamp: new Date(rateCache[pair].timestamp).toISOString()
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try Alpha Vantage
    const apiKey = Deno.env.get("ALPHA_VANTAGE_API_KEY");
    
    if (apiKey) {
      try {
        const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data["Realtime Currency Exchange Rate"]) {
          const rate = parseFloat(data["Realtime Currency Exchange Rate"]["5. Exchange Rate"]);
          
          // Cache the rate
          rateCache[pair] = { rate, timestamp: now };

          return new Response(
            JSON.stringify({ 
              rate, 
              pair, 
              source: "alpha_vantage",
              timestamp: new Date().toISOString()
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check for rate limit or error
        if (data["Note"] || data["Error Message"]) {
          console.warn("Alpha Vantage rate limit or error:", data);
        }
      } catch (err) {
        console.error("Alpha Vantage error:", err);
      }
    }

    // Fallback: Use Open Exchange Rates alternative or static rates
    // Try exchangerate-api.com free tier
    try {
      const exchangeUrl = `https://api.exchangerate-api.com/v4/latest/${from}`;
      const response = await fetch(exchangeUrl);
      
      if (response.ok) {
        const data = await response.json();
        if (data.rates && data.rates[to]) {
          const rate = data.rates[to];
          
          // Cache the rate
          rateCache[pair] = { rate, timestamp: now };

          return new Response(
            JSON.stringify({ 
              rate, 
              pair, 
              source: "exchangerate_api",
              timestamp: new Date().toISOString()
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    } catch (err) {
      console.error("Exchangerate API error:", err);
    }

    // Final fallback: Use static rates
    const fallbackKey = `${from}_${to}`;
    const reverseKey = `${to}_${from}`;
    
    let rate: number | null = null;

    if (from === to) {
      rate = 1;
    } else if (FALLBACK_RATES[fallbackKey]) {
      rate = FALLBACK_RATES[fallbackKey];
    } else if (FALLBACK_RATES[reverseKey]) {
      rate = 1 / FALLBACK_RATES[reverseKey];
    } else if (from !== "USD" && to !== "USD") {
      // Cross rate via USD
      const fromUsd = FALLBACK_RATES[`USD_${from}`] ? 1 / FALLBACK_RATES[`USD_${from}`] : null;
      const toUsd = FALLBACK_RATES[`USD_${to}`];
      
      if (fromUsd && toUsd) {
        rate = fromUsd * toUsd;
      }
    }

    if (rate !== null) {
      // Cache the fallback rate
      rateCache[pair] = { rate, timestamp: now };

      return new Response(
        JSON.stringify({ 
          rate, 
          pair, 
          source: "fallback",
          timestamp: new Date().toISOString(),
          warning: "Using fallback rates - may not reflect current market"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unable to fetch exchange rate" }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("FX rate error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
