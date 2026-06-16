import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Admin code - loaded from environment secret
const ADMIN_CODE = Deno.env.get("ADMIN_CODE");

interface RequestBody {
  action: "list" | "markRead" | "reply";
  adminCode: string;
  visitorId?: string;
  messageId?: string;
  replyText?: string;
  listingId?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: RequestBody = await req.json();
    const { action, adminCode, visitorId, messageId, replyText, listingId } = body;

    // Verify admin code
    if (adminCode !== ADMIN_CODE) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid admin code" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle different actions
    switch (action) {
      case "list": {
        // Fetch all admin messages
        const { data, error } = await supabase
          .from("admin_user_messages")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, messages: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "markRead": {
        if (!messageId) {
          return new Response(
            JSON.stringify({ success: false, error: "messageId required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("admin_user_messages")
          .update({ is_read: true })
          .eq("id", messageId);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "reply": {
        if (!visitorId || !replyText) {
          return new Response(
            JSON.stringify({ success: false, error: "visitorId and replyText required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("admin_user_messages")
          .insert({
            visitor_id: visitorId,
            listing_id: listingId || null,
            sender_type: "admin",
            message_text: replyText,
          });

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("[admin-messages] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Operation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
