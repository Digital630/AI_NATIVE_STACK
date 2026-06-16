import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Listing {
  id: string;
  commodity_name: string;
  listing_type: string;
  quantity: string | null;
  quantity_unit: string | null;
  origin_country: string | null;
  destination_country: string | null;
  region_of_origin: string | null;
  is_urgent: boolean;
  status: string;
  created_at: string;
  description: string | null;
  admin_review_status: string | null;
  preferred_regions?: string[] | null;
  visitor_id?: string | null;
}

// Internal confirmation logging (non-feature, for debugging)
function logAdminAction(action: string, listingId: string | string[], result: "success" | "failure", details?: string) {
  console.log(`[ADMIN_ACTION] ${new Date().toISOString()} | action=${action} | listing_id=${Array.isArray(listingId) ? listingId.join(",") : listingId} | result=${result}${details ? ` | ${details}` : ""}`);
}

export function useListingsAdmin() {
  const [isApproving, setIsApproving] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isClearingAll, setIsClearingAll] = useState(false);

  // Check if admin is verified via localStorage
  const isAdminVerified = useCallback(() => {
    return localStorage.getItem("agrismes_admin_access") === "true";
  }, []);

  // Fetch listings from the SINGLE SOURCE OF TRUTH: commodity_listings table
  // Using the public view for consistent display but querying for all visible + statuses
  const fetchListings = useCallback(async (): Promise<Listing[]> => {
    try {
      // Fetch directly from commodity_listings for full data access
      // This is the SINGLE SOURCE OF TRUTH for all views
      const { data, error } = await supabase
        .from("commodity_listings")
        .select("id, commodity_name, listing_type, quantity, quantity_unit, origin_country, destination_country, region_of_origin, is_urgent, status, created_at, description, admin_review_status, preferred_regions, visitor_id")
        .eq("is_visible", true)
        .in("admin_review_status", ["approved", "pending", "conditional"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Listing[];
    } catch (error) {
      console.error("[useListingsAdmin] Error fetching listings:", error);
      return [];
    }
  }, []);

  // Call the edge function for admin actions (bypasses RLS with service role)
  const callAdminAction = useCallback(async (
    action: "approve" | "reject" | "delete" | "clear_all",
    listingId?: string,
    listingIds?: string[]
  ): Promise<{ success: boolean; error?: string; affectedCount?: number }> => {
    try {
      const response = await supabase.functions.invoke("admin-listings", {
        body: {
          action,
          listingId,
          listingIds,
          adminToken: isAdminVerified() ? "verified" : "invalid",
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Edge function call failed");
      }

      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.error || "Action failed");
      }

      return {
        success: true,
        affectedCount: result.result?.affectedCount || 0,
      };
    } catch (error: any) {
      console.error(`[useListingsAdmin] ${action} error:`, error);
      return {
        success: false,
        error: error.message || "Operation failed",
      };
    }
  }, [isAdminVerified]);

  const approveListing = useCallback(async (listingId: string, onSuccess: () => Promise<void>) => {
    if (!isAdminVerified()) {
      toast.error("Admin access required");
      return;
    }

    setIsApproving(listingId);
    try {
      const result = await callAdminAction("approve", listingId);

      if (!result.success) {
        logAdminAction("approve", listingId, "failure", result.error);
        throw new Error(result.error || "Approval failed");
      }

      if (result.affectedCount === 0) {
        logAdminAction("approve", listingId, "failure", "No rows affected");
        throw new Error("No rows affected. Listing may not exist.");
      }

      logAdminAction("approve", listingId, "success", `affectedCount=${result.affectedCount}`);
      toast.success("Listing approved successfully!");
      
      // Force immediate re-fetch to sync UI - this is critical
      await onSuccess();
    } catch (err: any) {
      console.error("[useListingsAdmin] Approve error:", err);
      toast.error(err.message || "Action failed. Please retry.");
    } finally {
      setIsApproving(null);
    }
  }, [callAdminAction, isAdminVerified]);

  const rejectListing = useCallback(async (listingId: string, onSuccess: () => Promise<void>) => {
    if (!isAdminVerified()) {
      toast.error("Admin access required");
      return;
    }

    setIsRejecting(listingId);
    try {
      const result = await callAdminAction("reject", listingId);

      if (!result.success) {
        logAdminAction("reject", listingId, "failure", result.error);
        throw new Error(result.error || "Rejection failed");
      }

      if (result.affectedCount === 0) {
        logAdminAction("reject", listingId, "failure", "No rows affected");
        throw new Error("No rows affected. Listing may not exist.");
      }

      logAdminAction("reject", listingId, "success", `affectedCount=${result.affectedCount}`);
      toast.success("Listing rejected");
      
      // Force immediate re-fetch
      await onSuccess();
    } catch (err: any) {
      console.error("[useListingsAdmin] Reject error:", err);
      toast.error(err.message || "Action failed. Please retry.");
    } finally {
      setIsRejecting(null);
    }
  }, [callAdminAction, isAdminVerified]);

  const deleteListing = useCallback(async (listingId: string, onSuccess: () => Promise<void>) => {
    if (!isAdminVerified()) {
      toast.error("Admin access required");
      return;
    }

    setIsDeleting(listingId);
    try {
      const result = await callAdminAction("delete", listingId);

      if (!result.success) {
        logAdminAction("delete", listingId, "failure", result.error);
        throw new Error(result.error || "Deletion failed");
      }

      if (result.affectedCount === 0) {
        logAdminAction("delete", listingId, "failure", "No rows affected");
        throw new Error("No rows affected. Listing may not exist.");
      }

      logAdminAction("delete", listingId, "success", `affectedCount=${result.affectedCount}`);
      toast.success("Listing deleted successfully!");
      
      // Force immediate re-fetch
      await onSuccess();
    } catch (err: any) {
      console.error("[useListingsAdmin] Delete error:", err);
      toast.error(err.message || "Action failed. Please retry.");
    } finally {
      setIsDeleting(null);
    }
  }, [callAdminAction, isAdminVerified]);

  const clearAllListings = useCallback(async (listingIds: string[], onSuccess: () => Promise<void>) => {
    if (!isAdminVerified()) {
      toast.error("Admin access required");
      return;
    }

    if (listingIds.length === 0) {
      toast.info("No listings to clear");
      return;
    }

    setIsClearingAll(true);
    try {
      const result = await callAdminAction("clear_all", undefined, listingIds);

      if (!result.success) {
        logAdminAction("clear_all", listingIds, "failure", result.error);
        throw new Error(result.error || "Clear all failed");
      }

      logAdminAction("clear_all", listingIds, "success", `affectedCount=${result.affectedCount}`);
      toast.success(`Cleared ${result.affectedCount || 0} listings successfully!`);
      
      // Force immediate re-fetch
      await onSuccess();
    } catch (err: any) {
      console.error("[useListingsAdmin] Clear all error:", err);
      toast.error(err.message || "Action failed. Please retry.");
    } finally {
      setIsClearingAll(false);
    }
  }, [callAdminAction, isAdminVerified]);

  return {
    isApproving,
    isRejecting,
    isDeleting,
    isClearingAll,
    fetchListings,
    approveListing,
    rejectListing,
    deleteListing,
    clearAllListings,
    isAdminVerified,
  };
}
