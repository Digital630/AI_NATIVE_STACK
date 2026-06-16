import { useState, useEffect } from "react";
import { CheckCircle, Clock, X, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface ListingApprovalBannerProps {
  visitorId: string;
}

interface ApprovedListing {
  id: string;
  commodity_name: string;
  admin_review_status: string;
}

export function ListingApprovalBanner({ visitorId }: ListingApprovalBannerProps) {
  const [approvedListings, setApprovedListings] = useState<ApprovedListing[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchApprovedListings();
  }, [visitorId]);

  const fetchApprovedListings = async () => {
    try {
      // Get dismissed IDs from localStorage
      const dismissed = JSON.parse(localStorage.getItem("dismissed_approval_banners") || "[]");
      setDismissedIds(dismissed);

      const { data, error } = await supabase
        .from("commodity_listings")
        .select("id, commodity_name, admin_review_status")
        .eq("visitor_id", visitorId)
        .eq("admin_review_status", "approved");

      if (error) throw error;
      
      // Filter out already dismissed ones
      const notDismissed = (data || []).filter(l => !dismissed.includes(l.id));
      setApprovedListings(notDismissed);
    } catch (error) {
      console.error("Error fetching approved listings:", error);
    }
  };

  const handleDismiss = (id: string) => {
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    localStorage.setItem("dismissed_approval_banners", JSON.stringify(newDismissed));
    setApprovedListings(prev => prev.filter(l => l.id !== id));
  };

  if (approvedListings.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {approvedListings.map((listing) => (
        <div 
          key={listing.id}
          className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 rounded-lg"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/20 rounded-full">
                <PartyPopper className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Congratulations! Your listing is approved
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-medium text-foreground">{listing.commodity_name}</span> has been 
                  approved and is now visible on the marketplace. We're working on connecting you with potential 
                  partners.
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Waiting for next step - Our team will reach out soon
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 shrink-0"
              onClick={() => handleDismiss(listing.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
