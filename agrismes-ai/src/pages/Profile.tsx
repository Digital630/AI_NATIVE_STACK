import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { 
  Loader2, User, Building2, Phone, Mail, MapPin, Save, LogOut, 
  Package, FileText, Edit2, CheckCircle, Plus, Send, MessageSquare,
  BadgeCheck, Clock, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { ProfileImageUpload } from "@/components/ProfileImageUpload";
import { ProfileInquiryForm } from "@/components/ProfileInquiryForm";
import { ListingApprovalBanner } from "@/components/ListingApprovalBanner";
import { getUserTypeLabel } from "@/utils/userTypes";
import { getCategoryLabel } from "@/utils/actorCategories";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  company_address: string | null;
  phone_whatsapp: string | null;
  user_type: string | null;
  country: string | null;
  region: string | null;
  profile_image_url: string | null;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isAuthenticated, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/sign-in");
      return;
    }

    if (user) {
      fetchProfile();
      fetchListings();
    }
  }, [user, authLoading, isAuthenticated, navigate]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // SINGLE SOURCE OF TRUTH: Fetch user's listings from commodity_listings table
  // This ensures consistency with Explore Listings and Admin views
  const fetchListings = async () => {
    try {
      // Get visitor_id from localStorage to match listings
      const visitorId = localStorage.getItem("agrismes_visitor_id");
      if (!visitorId) {
        console.log("[Profile] No visitor_id found, skipping listings fetch");
        return;
      }

      // Fetch directly from commodity_listings - single source of truth
      const { data, error } = await supabase
        .from("commodity_listings")
        .select("*")
        .eq("visitor_id", visitorId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[Profile] Fetch listings error:", error);
        throw error;
      }
      
      console.log(`[Profile] Fetched ${data?.length || 0} listings for visitor ${visitorId}`);
      setListings(data || []);
    } catch (error) {
      console.error("[Profile] Error fetching listings:", error);
      setListings([]);
    }
  };

  const handleEditListing = (listingId: string) => {
    navigate(`/submit-listing?edit=${listingId}`);
  };

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          company_name: profile.company_name,
          company_address: profile.company_address,
          phone_whatsapp: profile.phone_whatsapp,
          country: profile.country,
          region: profile.region,
        })
        .eq("id", profile.id);

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Profile | AgriSMES</title>
        <meta name="description" content="Manage your AgriSMES profile, listings, and account settings." />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        
        <main className="flex-1 py-8 md:py-12">
          <div className="container-institutional px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    My Profile
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Manage your account and listings
                  </p>
                </div>
                <Button variant="outline" onClick={handleSignOut} className="min-h-[44px]">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
              {/* Approval Notifications */}
              {(() => {
                const visitorId = localStorage.getItem("agrismes_visitor_id");
                return visitorId ? <ListingApprovalBanner visitorId={visitorId} /> : null;
              })()}

              <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-grid">
                  <TabsTrigger value="profile" className="min-h-[44px]">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="listings" className="min-h-[44px]">
                    <Package className="mr-2 h-4 w-4" />
                    Listings
                  </TabsTrigger>
                  <TabsTrigger value="inquiries" className="min-h-[44px]">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Inquiry
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>
                        Update your personal and company details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {/* Profile Image Upload */}
                      {profile && (
                        <div className="flex justify-center pb-4 border-b border-border">
                          <ProfileImageUpload
                            currentImageUrl={profile.profile_image_url}
                            userId={profile.id}
                            userName={profile.full_name || undefined}
                            onImageUpdate={(url) => setProfile(prev => prev ? { ...prev, profile_image_url: url } : null)}
                          />
                        </div>
                      )}
                      {/* Email (read-only) */}
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            value={profile?.email || user?.email || ""}
                            className="pl-10 bg-muted"
                            disabled
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                      </div>

                      {/* Full Name */}
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="fullName"
                            type="text"
                            placeholder="Your full name"
                            value={profile?.full_name || ""}
                            onChange={(e) => setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      {/* Company Name */}
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="companyName"
                            type="text"
                            placeholder="Your company or organization"
                            value={profile?.company_name || ""}
                            onChange={(e) => setProfile(prev => prev ? { ...prev, company_name: e.target.value } : null)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      {/* Country (Origin) - Required */}
                      <div className="space-y-2">
                        <Label htmlFor="country">Country (Origin) *</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="country"
                            type="text"
                            placeholder="Your country"
                            value={profile?.country || ""}
                            onChange={(e) => setProfile(prev => prev ? { ...prev, country: e.target.value } : null)}
                            className="pl-10"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          This will be used as the origin country for your listings
                        </p>
                      </div>

                      {/* Company Address */}
                      <div className="space-y-2">
                        <Label htmlFor="companyAddress">Company Address</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Textarea
                            id="companyAddress"
                            placeholder="Street address, city"
                            value={profile?.company_address || ""}
                            onChange={(e) => setProfile(prev => prev ? { ...prev, company_address: e.target.value } : null)}
                            className="pl-10 min-h-[80px]"
                          />
                        </div>
                      </div>

                      {/* WhatsApp/Phone */}
                      <div className="space-y-2">
                        <Label htmlFor="phoneWhatsapp">WhatsApp / Phone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phoneWhatsapp"
                            type="tel"
                            placeholder="+255 XXX XXX XXX"
                            value={profile?.phone_whatsapp || ""}
                            onChange={(e) => setProfile(prev => prev ? { ...prev, phone_whatsapp: e.target.value } : null)}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      {/* User Type Badge */}
                      {profile?.user_type && (
                        <div className="flex items-center gap-2">
                          <Label>Account Type:</Label>
                          <Badge variant="secondary" className="capitalize">
                            {getUserTypeLabel(profile.user_type)}
                          </Badge>
                        </div>
                      )}

                      {/* Save Button */}
                      <Button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="w-full sm:w-auto min-h-[48px]"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="listings">
                  <Card>
                    <CardHeader>
                      <CardTitle>My Listings</CardTitle>
                      <CardDescription>
                        View and manage your commodity listings
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {listings.length === 0 ? (
                        <div className="text-center py-8">
                          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground mb-4">
                            You haven't created any listings yet
                          </p>
                          <Button onClick={() => navigate("/submit-listing")}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Your First Listing
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {listings.map((listing) => (
                            <div 
                              key={listing.id}
                              className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-medium text-foreground">
                                      {listing.commodity_name}
                                    </h3>
                                    {/* Status Badge */}
                                    {listing.admin_review_status === "approved" ? (
                                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1 text-xs">
                                        <BadgeCheck className="w-3 h-3" />
                                        Verified
                                      </Badge>
                                    ) : listing.admin_review_status === "rejected" ? (
                                      <Badge variant="destructive" className="gap-1 text-xs">
                                        <XCircle className="w-3 h-3" />
                                        Rejected
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="gap-1 text-xs">
                                        <Clock className="w-3 h-3" />
                                        Pending
                                      </Badge>
                                    )}
                                    {listing.is_urgent && (
                                      <Badge variant="destructive" className="text-xs">
                                        Urgent
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-xs capitalize">
                                      {listing.listing_type?.startsWith("service_") 
                                        ? "Service" 
                                        : listing.listing_type === "buy" ? "Buyer" : "Seller"}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {listing.quantity && `${listing.quantity} ${listing.quantity_unit || "MT"} • `}
                                    {listing.origin_country || listing.destination_country || "Location TBD"}
                                  </p>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleEditListing(listing.id)}
                                  title="Edit listing"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="inquiries">
                  <ProfileInquiryForm profile={profile} userEmail={user?.email} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
