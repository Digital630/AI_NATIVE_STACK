import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { visitorId, deviceFingerprint } = await req.json();

    if (!visitorId) {
      return new Response(
        JSON.stringify({ locked: false, canShowIcon: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const identifier = visitorId || deviceFingerprint || "unknown";

    // Check current lockout state
    const { data: lockoutData } = await supabase
      .from("admin_lockout_state")
      .select("locked_until, lockout_cycle")
      .eq("identifier", identifier)
      .maybeSingle();

    const now = new Date();

    if (lockoutData?.locked_until) {
      const lockedUntil = new Date(lockoutData.locked_until);
      if (lockedUntil > now) {
        const remainingMinutes = Math.ceil((lockedUntil.getTime() - now.getTime()) / 60000);
        return new Response(
          JSON.stringify({
            locked: true,
            canShowIcon: false,
            lockedUntil: lockoutData.locked_until,
            remainingMinutes,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Not locked - can show icon
    return new Response(
      JSON.stringify({ locked: false, canShowIcon: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[admin-lockout-check] Error:", error);
    // On error, default to showing the icon (fail open for UX, verification still protected)
    return new Response(
      JSON.stringify({ locked: false, canShowIcon: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
