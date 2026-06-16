import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { 
  ArrowLeft, Package, MapPin, Clock, AlertCircle, 
  Loader2, Lock, Mail, Phone, Building2, User, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { AdminCodeEntry } from "@/components/AdminCodeEntry";

interface ListingDetails {
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
  preferred_regions: string[] | null;
  // Contact details - only shown to owner/admin
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  contact_company?: string | null;
  visitor_id?: string;
}

export default function ListingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [listing, setListing] = useState<ListingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem("agrismes_admin_access") === "true";
  });

  useEffect(() => {
    if (id) {
      fetchListing();
    }
  }, [id]);

  const fetchListing = async () => {
    try {
      // Check if user is admin or owner
      const visitorId = localStorage.getItem("agrismes_visitor_id");
      const adminAccess = localStorage.getItem("agrismes_admin_access") === "true";

      // First try to get from public view
      const { data: publicData, error: publicError } = await supabase
        .from("commodity_listings_public")
        .select("*")
        .eq("id", id)
        .single();

      if (publicError) throw publicError;

      // Check if user is the owner or admin
      const ownerMatch = publicData.visitor_id === visitorId;
      
      if (ownerMatch || adminAccess) {
        // Owner or Admin - fetch full details from main table
        const { data: fullData, error: fullError } = await supabase
          .from("commodity_listings")
          .select("*")
          .eq("id", id)
          .single();

        if (!fullError && fullData) {
          setListing(fullData);
          setIsOwner(ownerMatch);
          setIsAdmin(adminAccess);
        } else {
          setListing(publicData);
        }
      } else {
        setListing(publicData);
      }
    } catch (error) {
      console.error("Error fetching listing:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      month: "long", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12">
          <Card className="max-w-md mx-4 text-center">
            <CardContent className="pt-8 pb-6">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">
                Listing Not Found
              </h2>
              <p className="text-muted-foreground mb-6">
                This listing may have been removed or is no longer available.
              </p>
              <Button onClick={() => navigate("/explore-listings")}>
                Back to Listings
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{listing.commodity_name} - {listing.listing_type === "sell" ? "For Sale" : "Wanted"} | AgriSMES</title>
        <meta 
          name="description" 
          content={`${listing.commodity_name} ${listing.listing_type === "sell" ? "available for sale" : "wanted"} - ${listing.quantity || ""} ${listing.quantity_unit || ""}. View details on AgriSMES marketplace.`} 
        />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        
        <main className="flex-1 py-8 md:py-12">
          <div className="container-institutional px-4 md:px-6">
            <div className="max-w-3xl mx-auto">
              {/* Back button */}
              <Button 
                variant="ghost" 
                className="mb-4"
                onClick={() => navigate("/explore-listings")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Listings
              </Button>

              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-start gap-2 mb-2">
                    <CardTitle className="text-2xl">{listing.commodity_name}</CardTitle>
                    {listing.is_urgent && (
                      <Badge variant="destructive">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Urgent
                      </Badge>
                    )}
                    <Badge variant="outline" className="capitalize">
                      {listing.listing_type === "sell" ? "For Sale" : "Wanted"}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Listed on {formatDate(listing.created_at)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Details Grid */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {listing.quantity && (
                      <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                        <Package className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Quantity</p>
                          <p className="text-sm text-muted-foreground">
                            {listing.quantity} {listing.quantity_unit || "MT"}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {(listing.origin_country || listing.destination_country) && (
                      <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                        <MapPin className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {listing.listing_type === "sell" ? "Origin" : "Destination"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {listing.listing_type === "sell" 
                              ? listing.origin_country 
                              : listing.destination_country
                            }
                            {listing.region_of_origin && `, ${listing.region_of_origin}`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {listing.description && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-medium text-foreground mb-2">Description</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {listing.description}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Preferred Regions */}
                  {listing.preferred_regions && listing.preferred_regions.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-medium text-foreground mb-2">Preferred Regions</h3>
                        <div className="flex flex-wrap gap-2">
                          {listing.preferred_regions.map((region, index) => (
                            <Badge key={index} variant="secondary">{region}</Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Contact Details - For owner or admin */}
                  {(isOwner || isAdmin) && (listing.contact_name || listing.contact_email || listing.contact_phone) && (
                    <>
                      <Separator />
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="font-medium text-foreground">
                            {isOwner ? "Your Contact Details" : "Contact Details"}
                          </h3>
                          {isAdmin && !isOwner && (
                            <Badge variant="secondary" className="text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              Admin View
                            </Badge>
                          )}
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          {listing.contact_name && (
                            <div className="flex items-center gap-2 text-sm">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span>{listing.contact_name}</span>
                            </div>
                          )}
                          {listing.contact_company && (
                            <div className="flex items-center gap-2 text-sm">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <span>{listing.contact_company}</span>
                            </div>
                          )}
                          {listing.contact_email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <span>{listing.contact_email}</span>
                            </div>
                          )}
                          {listing.contact_phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span>{listing.contact_phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Hidden Contact Notice - For non-owners and non-admins */}
                  {!isOwner && !isAdmin && (
                    <>
                      <Separator />
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <h3 className="font-medium text-foreground mb-1">
                          Contact Details Hidden
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          To protect trader privacy, contact details are managed by AgriSMES. 
                          Create an account to connect with this trader.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          {!isAuthenticated && (
                            <Button onClick={() => navigate("/create-account")}>
                              Create Free Account
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            onClick={() => setIsAdminModalOpen(true)}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Admin Access
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <Footer />

        {/* Admin Code Entry Modal */}
        <AdminCodeEntry
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          onAdminVerified={() => {
            setIsAdmin(true);
            // Refetch listing to get full details
            if (id) fetchListing();
          }}
        />
      </div>
    </>
  );
}
