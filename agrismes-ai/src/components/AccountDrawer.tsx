import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  User, Package, MessageSquare, Plus, LogOut, MapPin, 
  Building2, BadgeCheck, Clock, XCircle, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ProfileCompletionGate } from "./ProfileCompletionGate";
import { getCountryFlag } from "@/utils/countryFlags";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  country: string | null;
  profile_image_url: string | null;
  user_type: string | null;
}

interface Listing {
  id: string;
  commodity_name: string;
  admin_review_status: string | null;
  created_at: string;
}

export function AccountDrawer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [showProfileGate, setShowProfileGate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && isOpen) {
      fetchProfileAndListings();
    }
  }, [isAuthenticated, user, isOpen]);

  const fetchProfileAndListings = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name, company_name, country, profile_image_url, user_type")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("[AccountDrawer] Profile fetch error:", profileError);
      }

      setProfile(profileData || null);

      // Check if profile needs completion (no country)
      if (!profileData?.country) {
        setShowProfileGate(true);
      }

      // Fetch user listings
      const visitorId = localStorage.getItem("agrismes_visitor_id");
      if (visitorId) {
        const { data: listingsData, error: listingsError } = await supabase
          .from("commodity_listings")
          .select("id, commodity_name, admin_review_status, created_at")
          .eq("visitor_id", visitorId)
          .order("created_at", { ascending: false })
          .limit(5);

        if (listingsError) {
          console.error("[AccountDrawer] Listings fetch error:", listingsError);
        } else {
          setListings(listingsData || []);
        }
      }
    } catch (error) {
      console.error("[AccountDrawer] Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  const handleProfileComplete = () => {
    setShowProfileGate(false);
    fetchProfileAndListings();
  };

  const handleSubmitListing = () => {
    // Check if profile is complete before allowing listing submission
    if (!profile?.country) {
      setShowProfileGate(true);
      return;
    }
    handleNavigate("/submit-listing");
  };

  if (!isAuthenticated) {
    return null;
  }

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "approved":
        return <BadgeCheck className="w-3 h-3 text-green-600" />;
      case "rejected":
        return <XCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Clock className="w-3 h-3 text-muted-foreground" />;
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <button 
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
            aria-label="Open account menu"
          >
            {profile?.profile_image_url ? (
              <img 
                src={profile.profile_image_url} 
                alt={displayName}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-sm">
                {initials}
              </div>
            )}
            <span className="text-sm font-medium text-foreground hidden sm:block max-w-[100px] truncate">
              {displayName}
            </span>
          </button>
        </SheetTrigger>

        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-3">
              {profile?.profile_image_url ? (
                <img 
                  src={profile.profile_image_url} 
                  alt={displayName}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-lg">
                  {initials}
                </div>
              )}
              <div>
                <p className="text-lg font-semibold">{displayName}</p>
                <p className="text-sm text-muted-foreground font-normal">{user?.email}</p>
              </div>
            </SheetTitle>
            {profile?.country && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <MapPin className="h-4 w-4" />
                <span>{getCountryFlag(profile.country)} {profile.country}</span>
                {profile.company_name && (
                  <>
                    <span>•</span>
                    <Building2 className="h-4 w-4" />
                    <span>{profile.company_name}</span>
                  </>
                )}
              </div>
            )}
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Quick Actions */}
            <Button 
              className="w-full justify-start min-h-[48px]"
              onClick={handleSubmitListing}
            >
              <Plus className="mr-2 h-4 w-4" />
              Submit New Listing
            </Button>

            <Separator />

            {/* My Listings Preview */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  My Listings
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleNavigate("/profile")}
                >
                  View All
                </Button>
              </div>

              {listings.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3">
                  No listings yet. Submit your first listing to get started.
                </p>
              ) : (
                <div className="space-y-2">
                  {listings.map((listing) => (
                    <div 
                      key={listing.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        {getStatusIcon(listing.admin_review_status)}
                        <span className="text-sm font-medium">{listing.commodity_name}</span>
                      </div>
                      <Badge 
                        variant={listing.admin_review_status === "approved" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {listing.admin_review_status === "approved" ? "Verified" : 
                         listing.admin_review_status === "rejected" ? "Rejected" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Navigation Links */}
            <div className="space-y-1">
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => handleNavigate("/profile")}
              >
                <User className="mr-2 h-4 w-4" />
                My Profile
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => handleNavigate("/profile")}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                My Inquiries
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => handleNavigate("/explore-listings")}
              >
                <Package className="mr-2 h-4 w-4" />
                Explore Listings
              </Button>
            </div>

            <Separator />

            {/* Sign Out */}
            <Button 
              variant="outline" 
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Profile Completion Gate */}
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
