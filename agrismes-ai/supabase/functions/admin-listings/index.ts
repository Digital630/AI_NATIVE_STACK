import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
};

// Admin code - loaded from environment secret (no longer hardcoded)
const ADMIN_CODE = Deno.env.get("ADMIN_CODE");

interface AdminListingRequest {
  action: "approve" | "reject" | "delete" | "clear_all";
  listingId?: string;
  listingIds?: string[];
  adminToken: string; // Session token from localStorage to verify admin access
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: AdminListingRequest = await req.json();
    const { action, listingId, listingIds, adminToken } = body;

    // Verify admin access token (must be true from localStorage, matches admin-verify flow)
    if (adminToken !== "verified") {
      console.error("[admin-listings] Invalid admin token");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized - Admin access required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[admin-listings] Action: ${action}, ListingID: ${listingId}, IDs count: ${listingIds?.length || 0}`);

    let result;
    let affectedCount = 0;

    switch (action) {
      case "approve": {
        if (!listingId) {
          return new Response(
            JSON.stringify({ success: false, error: "Missing listingId" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("commodity_listings")
          .update({
            admin_review_status: "approved",
            admin_tag: "approved",
            status: "approved",
            is_visible: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", listingId)
          .select();

        if (error) {
          console.error("[admin-listings] Approve error:", error);
          throw new Error(error.message);
        }

        affectedCount = data?.length || 0;
        result = { action: "approve", listingId, affectedCount };
        
        console.log(`[admin-listings] APPROVE SUCCESS: listingId=${listingId}, affectedRows=${affectedCount}`);
        break;
      }

      case "reject": {
        if (!listingId) {
          return new Response(
            JSON.stringify({ success: false, error: "Missing listingId" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("commodity_listings")
          .update({
            admin_review_status: "rejected",
            admin_tag: "rejected",
            status: "rejected",
            is_visible: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", listingId)
          .select();

        if (error) {
          console.error("[admin-listings] Reject error:", error);
          throw new Error(error.message);
        }

        affectedCount = data?.length || 0;
        result = { action: "reject", listingId, affectedCount };
        
        console.log(`[admin-listings] REJECT SUCCESS: listingId=${listingId}, affectedRows=${affectedCount}`);
        break;
      }

      case "delete": {
        if (!listingId) {
          return new Response(
            JSON.stringify({ success: false, error: "Missing listingId" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("commodity_listings")
          .delete()
          .eq("id", listingId)
          .select();

        if (error) {
          console.error("[admin-listings] Delete error:", error);
          throw new Error(error.message);
        }

        affectedCount = data?.length || 0;
        result = { action: "delete", listingId, affectedCount };
        
        console.log(`[admin-listings] DELETE SUCCESS: listingId=${listingId}, affectedRows=${affectedCount}`);
        break;
      }

      case "clear_all": {
        if (!listingIds || listingIds.length === 0) {
          return new Response(
            JSON.stringify({ success: false, error: "Missing listingIds" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("commodity_listings")
          .delete()
          .in("id", listingIds)
          .select();

        if (error) {
          console.error("[admin-listings] Clear all error:", error);
          throw new Error(error.message);
        }

        affectedCount = data?.length || 0;
        result = { action: "clear_all", listingIds, affectedCount };
        
        console.log(`[admin-listings] CLEAR_ALL SUCCESS: count=${affectedCount}`);
        break;
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Verify affected count
    if (affectedCount === 0) {
      console.warn(`[admin-listings] WARNING: No rows affected for action=${action}, listingId=${listingId}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: "No rows affected. Listing may not exist or was already processed.",
          result,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${action} completed successfully`,
        result,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Operation failed";
    console.error("[admin-listings] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
