import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting map: IP -> timestamps of recent requests
const rateLimiter = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

// Validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length >= 5 && email.length <= 254;
};

const validatePhone = (phone: string | null): boolean => {
  if (!phone) return true;
  return phone.length <= 30 && /^[+\d\s()-]*$/.test(phone);
};

const sanitizeString = (str: string | null | undefined): string | null => {
  if (!str) return null;
  // Remove any HTML tags and trim
  return str.replace(/<[^>]*>/g, "").trim();
};

const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const requests = rateLimiter.get(ip) || [];
  
  // Filter to only recent requests within window
  const recentRequests = requests.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimiter.set(ip, recentRequests);
  return true;
};

// Cleanup old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of rateLimiter.entries()) {
    const filtered = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (filtered.length === 0) {
      rateLimiter.delete(ip);
    } else {
      rateLimiter.set(ip, filtered);
    }
  }
}, 60000);

interface InquiryRequest {
  full_name: string;
  organization_name?: string;
  commodity_type: string;
  country_region?: string;
  email: string;
  phone_number?: string;
  short_message?: string;
  // Honeypot field - should be empty
  website?: string;
  // Timestamp check - form load time
  form_loaded_at?: number;
}

const SUPPORTED_COMMODITIES = [
  "Cashew Kernels",
  "Coffee",
  "Cocoa",
  "Sesame",
  "Avocado",
  "Pineapple",
  "Cardamom",
  "Zanzibar Spices",
  "Other",
];

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("cf-connecting-ip") || 
                     "unknown";
    
    // Check rate limit
    if (!checkRateLimit(clientIP)) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please wait a moment before trying again." }),
        { 
          status: 429, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const body: InquiryRequest = await req.json();
    
    // Honeypot check - if filled, likely a bot
    if (body.website && body.website.trim() !== "") {
      console.log(`Honeypot triggered from IP: ${clientIP}`);
      // Return success to not alert bots, but don't save
      return new Response(
        JSON.stringify({ success: true }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Timestamp check - form submitted too quickly (less than 2 seconds)
    if (body.form_loaded_at) {
      const submitTime = Date.now();
      const loadTime = body.form_loaded_at;
      if (submitTime - loadTime < 2000) {
        console.log(`Form submitted too quickly from IP: ${clientIP} (${submitTime - loadTime}ms)`);
        return new Response(
          JSON.stringify({ success: true }), // Silent fail for bots
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
    }

    // Server-side validation
    const errors: string[] = [];

    // Full name validation (required, 2-100 chars)
    const fullName = sanitizeString(body.full_name);
    if (!fullName || fullName.length < 2 || fullName.length > 100) {
      errors.push("Full name must be between 2 and 100 characters");
    }

    // Commodity type validation (required, must be valid)
    const commodityType = sanitizeString(body.commodity_type);
    if (!commodityType || !SUPPORTED_COMMODITIES.includes(commodityType)) {
      errors.push("Please select a valid commodity type");
    }

    // Email validation (required, valid format, 5-254 chars)
    const email = body.email?.toLowerCase().trim();
    if (!email || !validateEmail(email)) {
      errors.push("Please enter a valid email address");
    }

    // Phone validation (optional, max 30 chars, valid format)
    const phoneNumber = sanitizeString(body.phone_number);
    if (!validatePhone(phoneNumber)) {
      errors.push("Please enter a valid phone number");
    }

    // Message validation (optional, max 1000 chars)
    const shortMessage = sanitizeString(body.short_message);
    if (shortMessage && shortMessage.length > 1000) {
      errors.push("Message must be less than 1000 characters");
    }

    // Organization validation (optional, max 100 chars)
    const organizationName = sanitizeString(body.organization_name);
    if (organizationName && organizationName.length > 100) {
      errors.push("Organization name must be less than 100 characters");
    }

    // Country validation (optional, max 100 chars)
    const countryRegion = sanitizeString(body.country_region);
    if (countryRegion && countryRegion.length > 100) {
      errors.push("Country/Region must be less than 100 characters");
    }

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: errors[0] }), // Return first error
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Create Supabase client with service role for insert
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert into database
    const { error: insertError } = await supabase.from("inquires").insert({
      full_name: fullName,
      organization_name: organizationName,
      commodity_type: commodityType,
      country_region: countryRegion,
      email: email,
      phone_number: phoneNumber,
      short_message: shortMessage,
      source: "website",
      status: "new",
    });

    if (insertError) {
      console.error("Database insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Unable to submit your inquiry. Please try again later." }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log(`Inquiry submitted successfully from IP: ${clientIP}, email: ${email}`);

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error processing inquiry:", error);
    return new Response(
      JSON.stringify({ error: "Unable to process your request. Please try again later." }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
};

serve(handler);
