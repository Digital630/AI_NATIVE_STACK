import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { 
  Search, Filter, Package, MapPin, Clock, AlertCircle, 
  Plus, ArrowUpDown, Loader2, Eye, Shield, CheckCircle,
  Trash2, ThumbsUp, ThumbsDown, LogOut, MessageCircle,
  BadgeCheck, XCircle
} from "lucide-react";
import { getCountryFlag } from "@/utils/countryFlags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { AdminCodeEntry } from "@/components/AdminCodeEntry";
import { MiniMarketWidget } from "@/components/MiniMarketWidget";
import { ListingsFAQ } from "@/components/ListingsFAQ";
import { CommunitySection } from "@/components/CommunitySection";
import { toast } from "sonner";
import { useListingsAdmin } from "@/hooks/useListingsAdmin";

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
  admin_review_status: string | null;
}

export default function ExploreListings() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [listings, setListings] = useState<PublicListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem("agrismes_admin_access") === "true";
  });

  const {
    isApproving,
    isRejecting,
    isDeleting,
    isClearingAll,
    approveListing,
    rejectListing,
    deleteListing,
    clearAllListings,
  } = useListingsAdmin();

  // SINGLE SOURCE OF TRUTH: Fetch from commodity_listings table directly
  // This ensures Admin, Explore Listings, and Profile all see the same data
  const fetchListings = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch from commodity_listings - the single source of truth
      // Use cache-busting timestamp to ensure fresh data after mutations
      const { data, error } = await supabase
        .from("commodity_listings")
        .select("id, commodity_name, listing_type, quantity, quantity_unit, origin_country, destination_country, region_of_origin, is_urgent, status, created_at, description, admin_review_status, preferred_regions, visitor_id, is_visible")
        .eq("is_visible", true)
        .in("admin_review_status", ["approved", "pending", "conditional"])
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[ExploreListings] Fetch error:", error);
        throw error;
      }
      
      console.log(`[ExploreListings] Fetched ${data?.length || 0} listings`);
      setListings(data || []);
    } catch (error) {
      console.error("[ExploreListings] Error fetching listings:", error);
      // Show empty state notice on error
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleApproveListing = async (listingId: string) => {
    await approveListing(listingId, fetchListings);
  };

  const handleRejectListing = async (listingId: string) => {
    await rejectListing(listingId, fetchListings);
  };

  const handleDeleteListing = async (listingId: string) => {
    await deleteListing(listingId, fetchListings);
  };

  const handleClearAllListings = async () => {
    const listingIds = listings.map(l => l.id);
    await clearAllListings(listingIds, fetchListings);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("agrismes_admin_access");
    setIsAdmin(false);
    toast.success("Admin access deactivated");
  };

  const handleChatWithAlex = () => {
    window.dispatchEvent(new CustomEvent("openChatWidget"));
  };

  const filteredListings = listings
    .filter(listing => {
      const matchesSearch = 
        listing.commodity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.origin_country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.destination_country?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = filterType === "all" || listing.listing_type === filterType;
      
      const matchesStatus = filterStatus === "all" || listing.admin_review_status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === "urgent") {
        return (b.is_urgent ? 1 : 0) - (a.is_urgent ? 1 : 0);
      }
      return 0;
    });

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

  return (
    <>
      <Helmet>
        <title>Explore Listings | AgriSMES Agricultural Trade Platform</title>
        <meta 
          name="description" 
          content="Browse agricultural commodity listings from verified buyers and sellers. Find coffee, cocoa, cashews, sesame and more on the AgriSMES marketplace." 
        />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        
        <main className="flex-1 py-8 md:py-12">
          <div className="container-institutional px-4 md:px-6">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-1">
                    Explore Listings
                    {/* Hidden admin trigger */}
                    {!isAdmin && (
                      <button
                        onClick={() => setIsAdminModalOpen(true)}
                        className="text-[8px] text-muted-foreground/30 hover:text-muted-foreground/50 transition-colors ml-1 font-normal"
                        title=""
                        aria-label="Admin access"
                      >
                        A
                      </button>
                    )}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Browse agricultural commodities from verified traders
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Admin controls */}
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="flex items-center gap-1 h-9 px-3">
                        <Shield className="h-4 w-4 text-primary" />
                        Admin Active
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAdminLogout}
                        className="h-9"
                      >
                        <LogOut className="h-4 w-4 mr-1" />
                        Logout
                      </Button>
                    </div>
                  )}
                  {isAuthenticated ? (
                    <Button onClick={() => navigate("/submit-listing")} className="min-h-[44px]">
                      <Plus className="mr-2 h-4 w-4" />
                      Submit Listing
                    </Button>
                  ) : (
                    <Button onClick={() => navigate("/create-account")} className="min-h-[44px]">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Account to List
                    </Button>
                  )}
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by commodity or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="sell">Sellers</SelectItem>
                    <SelectItem value="buy">Buyers</SelectItem>
                  </SelectContent>
                </Select>
                {isAdmin && (
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="approved">Verified</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="conditional">Conditional</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="urgent">Urgent First</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Results count and Admin Clear All */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {filteredListings.length} listing{filteredListings.length !== 1 ? "s" : ""} found
                </p>
                
                {isAdmin && filteredListings.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={isClearingAll}>
                        {isClearingAll ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Clear All ({filteredListings.length})
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear All Listings</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to permanently delete all {filteredListings.length} listings? 
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleClearAllListings}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isClearingAll ? "Clearing..." : "Delete All"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Listings Column */}
                <div className="lg:col-span-3">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredListings.length === 0 ? (
                    <Card className="text-center py-12">
                      <CardContent>
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">
                          {searchQuery ? "No listings found" : "No listings yet"}
                        </h3>
                        <p className="text-muted-foreground mb-6">
                          {searchQuery 
                            ? "Try adjusting your search or filters"
                            : "Be the first to post a buyer inquiry or supplier offer."
                          }
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          {isAuthenticated ? (
                            <Button onClick={() => navigate("/submit-listing")}>
                              <Plus className="mr-2 h-4 w-4" />
                              Submit a Listing
                            </Button>
                          ) : (
                            <>
                              <Button onClick={() => navigate("/create-account")}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Account to List
                              </Button>
                              <Button variant="outline" onClick={() => navigate("/sign-in")}>
                                Sign In
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {filteredListings.map((listing) => (
                        <Card key={listing.id} className="hover:border-primary/50 transition-colors">
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
                                  {listing.admin_review_status === "pending" && (
                                    <Badge variant="secondary" className="gap-1 text-xs">
                                      <Clock className="w-3 h-3" />
                                      Pending Review
                                    </Badge>
                                  )}
                                  {listing.is_urgent ? (
                                    <Badge variant="destructive" className="text-xs">
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      Urgent
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs">
                                      Normal
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {listing.listing_type === "sell" ? "Seller" : "Buyer"}
                                  </Badge>
                                </div>
                                
                                {/* ORIGIN COUNTRY - ALWAYS DISPLAYED PROMINENTLY */}
                                {listing.origin_country && (
                                  <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                                    <MapPin className="w-4 h-4 text-primary" />
                                    <span>Origin:</span>
                                    <span className="text-lg" title={listing.origin_country}>
                                      {getCountryFlag(listing.origin_country)}
                                    </span>
                                    <span>{listing.origin_country}</span>
                                  </div>
                                )}

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3">
                                  {listing.quantity && (
                                    <span className="flex items-center gap-1">
                                      <Package className="w-4 h-4" />
                                      {listing.quantity} {listing.quantity_unit || "MT"}
                                    </span>
                                  )}
                                  {listing.destination_country && listing.destination_country !== listing.origin_country && (
                                    <span className="flex items-center gap-1">
                                      → {getCountryFlag(listing.destination_country)} {listing.destination_country}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {formatDate(listing.created_at)}
                                  </span>
                                </div>

                                {listing.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {listing.description}
                                  </p>
                                )}
                              </div>

                              <div className="flex flex-col gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="min-h-[44px]"
                                  onClick={() => navigate(`/listing/${listing.id}`)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Button>
                                
                                {/* Admin Controls */}
                                {isAdmin && (
                                  <div className="flex gap-2">
                                    {listing.admin_review_status !== "approved" && (
                                      <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700 text-white min-h-[36px]"
                                        onClick={() => handleApproveListing(listing.id)}
                                        disabled={isApproving === listing.id}
                                        title="Approve"
                                      >
                                        {isApproving === listing.id ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <ThumbsUp className="h-4 w-4" />
                                        )}
                                      </Button>
                                    )}
                                    
                                    {listing.admin_review_status !== "rejected" && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-amber-500 text-amber-600 hover:bg-amber-50 min-h-[36px]"
                                        onClick={() => handleRejectListing(listing.id)}
                                        disabled={isRejecting === listing.id}
                                        title="Reject"
                                      >
                                        {isRejecting === listing.id ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <ThumbsDown className="h-4 w-4" />
                                        )}
                                      </Button>
                                    )}
                                    
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          className="min-h-[36px]"
                                          disabled={isDeleting === listing.id}
                                          title="Delete"
                                        >
                                          {isDeleting === listing.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <Trash2 className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete "{listing.commodity_name}"? 
                                            This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction 
                                            onClick={() => handleDeleteListing(listing.id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* CTA for non-authenticated users */}
                  {!isAuthenticated && filteredListings.length > 0 && (
                    <Card className="mt-8 bg-primary/5 border-primary/20">
                      <CardContent className="p-6 text-center">
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Want to connect with traders?
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          Create an account to submit your own listings and access contact details.
                        </p>
                        <Button onClick={() => navigate("/create-account")}>
                          Create Free Account
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Sidebar Widgets */}
                <div className="space-y-4">
                  {/* Chat with Alex CTA */}
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4 text-center">
                      <MessageCircle className="h-8 w-8 text-primary mx-auto mb-2" />
                      <h4 className="font-semibold text-foreground mb-1">Need Help?</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Ask Alex AI about sourcing, trade terms, or readiness requirements
                      </p>
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={handleChatWithAlex}
                      >
                        Chat with Alex
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Live Market Widget */}
                  <MiniMarketWidget />

                  {/* FAQs */}
                  <ListingsFAQ compact />

                  {/* Community Section */}
                  <CommunitySection />
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />

        {/* Admin Code Entry Modal */}
        <AdminCodeEntry
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          onAdminVerified={() => setIsAdmin(true)}
        />
      </div>
    </>
  );
}
