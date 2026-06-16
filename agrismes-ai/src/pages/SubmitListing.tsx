import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { 
  Loader2, Package, ArrowLeft, CheckCircle, Send, Save, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { CommodityListingFields } from "@/components/listing-forms/CommodityListingFields";
import { ServiceProviderFields } from "@/components/listing-forms/ServiceProviderFields";
import { ProfileCompletionGate } from "@/components/ProfileCompletionGate";
import { ACTOR_CATEGORIES, ActorCategory, isCommodityTrader, getListingTypeForCategory, getCategoryLabel } from "@/utils/actorCategories";

interface Profile {
  full_name: string | null;
  company_name: string | null;
  phone_whatsapp: string | null;
  email: string | null;
  user_type: string | null;
  country: string | null;
}

export default function SubmitListing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;
  
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoadingListing, setIsLoadingListing] = useState(false);
  const [showProfileGate, setShowProfileGate] = useState(false);
  
  // Actor/Category selection
  const [actorCategory, setActorCategory] = useState<ActorCategory>("seller");
  
  // Commodity form state (for buyers/sellers)
  const [commodityData, setCommodityData] = useState({
    commodityName: "",
    quantity: "",
    quantityUnit: "MT",
    originCountry: "",
    destinationCountry: "",
    portOfLoading: "",
    portOfDestination: "",
    incoterm: "",
    gradeType: "",
    description: "",
    isUrgent: false,
  });

  // Service provider form state
  const [serviceData, setServiceData] = useState({
    serviceName: "",
    serviceType: "",
    serviceDescription: "",
    primaryCountry: "",
    coverageRegions: "",
    experience: "",
    certifications: "",
    capacity: "",
    isUrgent: false,
  });

  const isCommodity = isCommodityTrader(actorCategory);
  const isBuyer = actorCategory === "buyer";

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/sign-in");
      return;
    }

    if (user) {
      fetchProfile();
      if (isEditMode && editId) {
        fetchExistingListing(editId);
      }
    }
  }, [user, authLoading, isAuthenticated, navigate, editId, isEditMode]);

  const fetchExistingListing = async (id: string) => {
    setIsLoadingListing(true);
    try {
      const visitorId = localStorage.getItem("agrismes_visitor_id");
      if (!visitorId) {
        toast.error("Unable to verify ownership");
        navigate("/profile");
        return;
      }

      const { data, error } = await supabase
        .from("commodity_listings")
        .select("*")
        .eq("id", id)
        .eq("visitor_id", visitorId)
        .single();

      if (error || !data) {
        toast.error("Listing not found or you don't have permission to edit it");
        navigate("/profile");
        return;
      }

      // Determine category from listing_type
      if (data.listing_type?.startsWith("service_")) {
        const categoryMap: Record<string, ActorCategory> = {
          service_agent: "agent",
          service_logistics: "logistics",
          service_warehouse: "warehouse",
          service_qc: "quality_control",
          service_finance: "finance",
          service_certification: "certification",
          service_other: "other_service",
        };
        setActorCategory(categoryMap[data.listing_type] || "other_service");
        
        setServiceData({
          serviceName: data.commodity_name || "",
          serviceType: data.commodity_grade || "",
          serviceDescription: data.description || "",
          primaryCountry: data.origin_country || "",
          coverageRegions: data.region_of_origin || "",
          experience: data.monthly_capacity || "",
          certifications: data.incoterms || "",
          capacity: data.quantity || "",
          isUrgent: data.is_urgent || false,
        });
      } else {
        setActorCategory(data.listing_type === "buy" ? "buyer" : "seller");
        
        setCommodityData({
          commodityName: data.commodity_name || "",
          quantity: data.quantity || "",
          quantityUnit: data.quantity_unit || "MT",
          originCountry: data.origin_country || "",
          destinationCountry: data.destination_country || "",
          portOfLoading: data.region_of_origin || "",
          portOfDestination: data.preferred_regions?.[0] || "",
          incoterm: data.incoterms || "",
          gradeType: data.commodity_grade || "",
          description: data.description || "",
          isUrgent: data.is_urgent || false,
        });
      }
    } catch (error) {
      console.error("Error fetching listing:", error);
      toast.error("Failed to load listing");
      navigate("/profile");
    } finally {
      setIsLoadingListing(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, company_name, phone_whatsapp, email, user_type, country")
        .eq("id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      
      // Check if profile needs completion (no country)
      if (!data?.country) {
        setShowProfileGate(true);
        return;
      }
      
      setProfile(data);
      
      // AUTO-FILL origin country from profile - NON-NEGOTIABLE
      // This ensures every listing correctly shows the origin country of the account holder
      if (data?.country) {
        setCommodityData(prev => ({
          ...prev,
          originCountry: data.country || "",
        }));
        setServiceData(prev => ({
          ...prev,
          primaryCountry: data.country || "",
        }));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };
  
  const handleProfileComplete = () => {
    setShowProfileGate(false);
    fetchProfile();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation based on form type
    if (isCommodity) {
      if (!commodityData.commodityName) {
        toast.error("Please select a commodity");
        return;
      }
      if (isBuyer && !commodityData.portOfDestination) {
        toast.error("Please enter port of destination");
        return;
      }
      if (isBuyer && !commodityData.description) {
        toast.error("Please add notes/requirements");
        return;
      }
    } else {
      if (!serviceData.serviceType) {
        toast.error("Please select a service type");
        return;
      }
      if (!serviceData.primaryCountry) {
        toast.error("Please select your country of operation");
        return;
      }
      if (!serviceData.serviceDescription) {
        toast.error("Please add a service description");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      let visitorId = localStorage.getItem("agrismes_visitor_id");
      if (!visitorId) {
        visitorId = crypto.randomUUID();
        localStorage.setItem("agrismes_visitor_id", visitorId);
      }

      const listingType = getListingTypeForCategory(actorCategory);
      
      let listingData;

      if (isCommodity) {
        // Commodity listing (buyer/seller)
        listingData = {
          listing_type: listingType,
          commodity_name: commodityData.commodityName,
          quantity: commodityData.quantity || null,
          quantity_unit: commodityData.quantityUnit,
          origin_country: commodityData.originCountry || null,
          destination_country: commodityData.destinationCountry || null,
          region_of_origin: commodityData.portOfLoading || null,
          preferred_regions: commodityData.portOfDestination ? [commodityData.portOfDestination] : null,
          incoterms: commodityData.incoterm || null,
          commodity_grade: commodityData.gradeType || null,
          description: commodityData.description || null,
          is_urgent: commodityData.isUrgent,
          contact_name: profile?.full_name,
          contact_company: profile?.company_name,
          contact_phone: profile?.phone_whatsapp,
          contact_email: profile?.email || user?.email,
        };
      } else {
        // Service provider listing
        listingData = {
          listing_type: listingType,
          commodity_name: serviceData.serviceName || serviceData.serviceType,
          commodity_grade: serviceData.serviceType,
          description: serviceData.serviceDescription,
          origin_country: serviceData.primaryCountry,
          region_of_origin: serviceData.coverageRegions || null,
          monthly_capacity: serviceData.experience || null,
          incoterms: serviceData.certifications || null,
          quantity: serviceData.capacity || null,
          is_urgent: serviceData.isUrgent,
          contact_name: profile?.full_name,
          contact_company: profile?.company_name,
          contact_phone: profile?.phone_whatsapp,
          contact_email: profile?.email || user?.email,
        };
      }

      if (isEditMode && editId) {
        const { error } = await supabase
          .from("commodity_listings")
          .update({
            ...listingData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editId)
          .eq("visitor_id", visitorId);

        if (error) throw error;

        toast.success("Listing updated successfully!");
        navigate("/profile");
      } else {
        // Insert new listing - returns the created record to confirm success
        const { data: insertedData, error } = await supabase
          .from("commodity_listings")
          .insert({
            ...listingData,
            visitor_id: visitorId,
            status: "pending",
            is_visible: true,
            admin_review_status: "pending",
            created_at: new Date().toISOString(),
          })
          .select();

        if (error) {
          console.error("[SubmitListing] Insert error:", error);
          throw error;
        }

        // Verify the insert was successful
        if (!insertedData || insertedData.length === 0) {
          console.error("[SubmitListing] Insert returned no data");
          throw new Error("Listing creation failed - no record returned");
        }

        console.log(`[SubmitListing] CREATE SUCCESS: listingId=${insertedData[0].id}`);
        setIsSuccess(true);
        toast.success("Listing submitted successfully!");
      }
    } catch (error: any) {
      console.error("Error submitting listing:", error);
      toast.error(error.message || "Failed to submit listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoadingListing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <>
        <Helmet>
          <title>Listing Submitted | AgriSMES</title>
        </Helmet>
        <div className="min-h-screen bg-background flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center py-12">
            <Card className="max-w-md mx-4 text-center">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Listing Submitted!
                </h2>
                <p className="text-muted-foreground mb-6">
                  Your listing is now pending review. Once approved by our team, it will be 
                  visible on the marketplace and display a "Verified" badge.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => navigate("/explore-listings")}>
                    View All Listings
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/profile")}>
                    Go to My Listings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  const formTitle = isEditMode ? "Edit Listing" : "Submit a Listing";
  const formDescription = isEditMode 
    ? "Update your listing details below" 
    : "Create a new listing to connect with buyers, sellers, or service providers";

  return (
    <>
      <Helmet>
        <title>{formTitle} | AgriSMES Marketplace</title>
        <meta 
          name="description" 
          content="Submit your agricultural commodity or service listing on AgriSMES. Connect with verified buyers, sellers, and service providers." 
        />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        
        <main className="flex-1 py-8 md:py-12">
          <div className="container-institutional px-4 md:px-6">
            <div className="max-w-2xl mx-auto">
              {/* Back button */}
              <Button 
                variant="ghost" 
                className="mb-4"
                onClick={() => navigate(isEditMode ? "/profile" : "/explore-listings")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {isEditMode ? "Back to Profile" : "Back to Listings"}
              </Button>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {formTitle}
                  </CardTitle>
                  <CardDescription>
                    {formDescription}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Actor/Category Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="actorCategory">I am a... *</Label>
                      <Select 
                        value={actorCategory} 
                        onValueChange={(v) => setActorCategory(v as ActorCategory)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ACTOR_CATEGORIES).map(([key, value]) => (
                            <SelectItem key={key} value={key}>
                              {value.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {ACTOR_CATEGORIES[actorCategory]?.description}
                      </p>
                    </div>

                    {/* Conditional Form Fields */}
                    {isCommodity ? (
                      <CommodityListingFields
                        isBuyer={isBuyer}
                        formData={commodityData}
                        onChange={(data) => setCommodityData(prev => ({ ...prev, ...data }))}
                      />
                    ) : (
                      <ServiceProviderFields
                        category={actorCategory}
                        formData={serviceData}
                        onChange={(data) => setServiceData(prev => ({ ...prev, ...data }))}
                      />
                    )}

                    {/* Contact Info Display */}
                    {profile && (
                      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <p className="text-sm font-medium text-foreground mb-2">
                          Your contact details (private, not shown publicly):
                        </p>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {profile.full_name && <p>Name: {profile.full_name}</p>}
                          {profile.company_name && <p>Company: {profile.company_name}</p>}
                          <p>Email: {profile.email || user?.email}</p>
                          {profile.phone_whatsapp && <p>WhatsApp: {profile.phone_whatsapp}</p>}
                        </div>
                        <Button 
                          type="button"
                          variant="link" 
                          className="p-0 h-auto mt-2"
                          onClick={() => navigate("/profile")}
                        >
                          Update contact details →
                        </Button>
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button 
                      type="submit" 
                      className="w-full min-h-[48px]"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {isEditMode ? "Saving..." : "Submitting..."}
                        </>
                      ) : (
                        <>
                          {isEditMode ? (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Submit Listing
                            </>
                          )}
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <Footer />
      </div>
      
      {/* Profile Completion Gate - Blocks submission until country is set */}
      {user && (
        <ProfileCompletionGate
          userId={user.id}
          userEmail={user.email || null}
          isOpen={showProfileGate}
          onComplete={handleProfileComplete}
        />
      )}
    </>
  );
}
