import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, Package, MapPin, Clock, AlertCircle, 
  Plus, Loader2, Eye, Users, TrendingUp, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

interface PublicListing {
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
}

interface ExploreListingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExploreListingsDrawer({ open, onOpenChange }: ExploreListingsDrawerProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const [listings, setListings] = useState<PublicListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (open) {
      fetchListings();
    }
  }, [open]);

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("commodity_listings_public")
        .select("*")
        .eq("is_visible", true)
        .eq("admin_review_status", "approved")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredListings = listings.filter(listing => {
    if (!searchQuery) return true;
    return (
      listing.commodity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.origin_country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.destination_country?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric"
    });
  };

  const handleViewDetails = (listingId: string) => {
    onOpenChange(false);
    navigate(`/listing/${listingId}`);
  };

  const handleViewAll = () => {
    onOpenChange(false);
    navigate("/explore-listings");
  };

  const handleCreateAccount = () => {
    onOpenChange(false);
    navigate("/create-account");
  };

  const content = (
    <div className="flex flex-col h-full">
      {/* Header info */}
      <div className="px-4 pb-4 border-b">
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Users className="w-4 h-4 text-primary" />
            Verified Traders
          </span>
          <span className="inline-flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-primary" />
            Real-Time Prices
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Search className="w-4 h-4 text-primary" />
            Filter & Search
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by commodity or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Listings */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No listings match your search" : "No listings available yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredListings.map((listing) => (
              <Card key={listing.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-medium text-sm text-foreground truncate">
                          {listing.commodity_name}
                        </h4>
                        {listing.is_urgent && (
                          <Badge variant="destructive" className="text-xs py-0">
                            <AlertCircle className="w-3 h-3 mr-0.5" />
                            Urgent
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs py-0 capitalize">
                          {listing.listing_type === "sell" ? "Seller" : "Buyer"}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        {listing.quantity && (
                          <span className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            {listing.quantity} {listing.quantity_unit || "MT"}
                          </span>
                        )}
                        {(listing.origin_country || listing.destination_country) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {listing.listing_type === "sell" 
                              ? listing.origin_country 
                              : listing.destination_country
                            }
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(listing.created_at)}
                        </span>
                      </div>
                    </div>

                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="shrink-0 h-8 px-2"
                      onClick={() => handleViewDetails(listing.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="border-t p-4 space-y-2">
        <Button 
          className="w-full" 
          onClick={handleViewAll}
        >
          <Search className="mr-2 h-4 w-4" />
          View All Listings
        </Button>
        {!isAuthenticated && (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleCreateAccount}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Account for Personalized Access
          </Button>
        )}
        {isAuthenticated && (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              onOpenChange(false);
              navigate("/submit-listing");
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Submit Your Listing
          </Button>
        )}
      </div>
    </div>
  );

  // Use Drawer on mobile, Dialog on desktop
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-center">Explore Listings</DrawerTitle>
            <DrawerDescription className="text-center text-sm">
              Browse verified commodity listings from suppliers and buyers
            </DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle>Explore Listings</DialogTitle>
          <DialogDescription className="text-sm">
            Browse verified commodity listings from suppliers and buyers
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
