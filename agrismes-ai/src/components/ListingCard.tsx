import { MapPin, Clock, AlertCircle, Package, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getCountryFlag } from "@/utils/countryFlags";

interface ListingCardProps {
  listing: {
    id: string;
    commodity_name: string;
    listing_type: string;
    quantity: string | null;
    quantity_unit: string | null;
    origin_country: string | null;
    destination_country: string | null;
    region_of_origin: string | null;
    is_urgent: boolean;
    created_at: string;
    description: string | null;
    admin_review_status: string | null;
  };
  onClick?: () => void;
  showAdminControls?: boolean;
  adminControls?: React.ReactNode;
}

export function ListingCard({ listing, onClick, showAdminControls, adminControls }: ListingCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1">
            <BadgeCheck className="w-3 h-3" />
            Verified
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="w-3 h-3" />
            Pending
          </Badge>
        );
      case "conditional":
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-300 gap-1">
            <AlertCircle className="w-3 h-3" />
            Conditional
          </Badge>
        );
      default:
        return null;
    }
  };

  const originCountry = listing.origin_country;
  const destinationCountry = listing.destination_country;

  return (
    <Card 
      className="hover:border-primary/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-start gap-2 flex-wrap mb-2">
              <h3 className="font-semibold text-lg text-foreground">
                {listing.commodity_name}
              </h3>
              {/* Verified tick for approved listings */}
              {listing.admin_review_status === "approved" && (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1">
                  <BadgeCheck className="w-3 h-3" />
                  Verified
                </Badge>
              )}
              {listing.is_urgent && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Urgent
                </Badge>
              )}
              <Badge 
                variant="outline" 
                className={listing.listing_type === "buy" ? "text-blue-600 border-blue-300" : "text-green-600 border-green-300"}
              >
                {listing.listing_type === "buy" ? "Buyer" : 
                 listing.listing_type?.startsWith("service_") ? "Service" : "Seller"}
              </Badge>
            </div>

            {/* Origin Country - ALWAYS DISPLAYED */}
            {originCountry && (
              <div className="flex items-center gap-2 text-sm text-foreground mb-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium">Origin:</span>
                <span>{getCountryFlag(originCountry)} {originCountry}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {listing.quantity && (
                <span className="flex items-center gap-1">
                  <Package className="h-3.5 w-3.5" />
                  {listing.quantity} {listing.quantity_unit || "MT"}
                </span>
              )}
              {destinationCountry && destinationCountry !== originCountry && (
                <span className="flex items-center gap-1">
                  → {getCountryFlag(destinationCountry)} {destinationCountry}
                </span>
              )}
              {listing.region_of_origin && (
                <span className="flex items-center gap-1">
                  Port: {listing.region_of_origin}
                </span>
              )}
            </div>

            {listing.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {listing.description}
              </p>
            )}

            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Posted {formatDate(listing.created_at)}</span>
            </div>
          </div>

          {/* Admin Controls */}
          {showAdminControls && adminControls && (
            <div className="flex md:flex-col gap-2">
              {adminControls}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
