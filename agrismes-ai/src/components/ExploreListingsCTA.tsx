import { useNavigate } from "react-router-dom";
import { Search, Users, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ExploreListingsCTA() {
  const navigate = useNavigate();

  return (
    <section 
      id="explore-listings-cta" 
      className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30"
    >
      <div className="container-institutional px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
            <Search className="w-4 h-4" />
            Live Marketplace
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Explore Agricultural Listings
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Browse verified commodity listings from suppliers, buyers, and others. 
            Find coffee, cocoa, cashews, sesame, and more from trusted trade partners.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 p-4 bg-card rounded-lg border">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Verified Traders</span>
            </div>
            <div className="flex items-center justify-center gap-2 p-4 bg-card rounded-lg border">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Real-Time Prices</span>
            </div>
            <div className="flex items-center justify-center gap-2 p-4 bg-card rounded-lg border">
              <Search className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Filter & Search</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="min-h-[48px] px-8 text-base"
              onClick={() => navigate("/explore-listings")}
            >
              <Search className="mr-2 h-5 w-5" />
              Explore Listings
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="min-h-[48px] px-8 text-base"
              onClick={() => navigate("/create-account")}
            >
              Create Account for Personalized Access
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4">
            Create an account to submit your own listings and receive personalized trade inquiries
          </p>
        </div>
      </div>
    </section>
  );
}
