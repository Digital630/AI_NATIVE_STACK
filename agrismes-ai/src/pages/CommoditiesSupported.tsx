import { useEffect } from "react";
import { MessageCircle, Wheat, ArrowRight, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { TrustAnchor, HumanOversightBadge } from "@/components/TrustAnchor";

const CommoditiesSupported = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const openChatWithContext = () => {
    // Store context for Alex to use
    sessionStorage.setItem("agrismes_chat_source_page", "commodities_supported");
    window.dispatchEvent(new CustomEvent("openChatWidget"));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-6">
                <Wheat className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
                Commodities Supported
              </h1>
              <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                AgriSMES supports structured agri-commodity sourcing. Requirements vary by origin, grade, 
                market conditions, and buyer specifications.
              </p>
            </div>

            {/* Content Card */}
            <div className="bg-card border border-border rounded-lg p-8 md:p-10 shadow-sm mb-8">
              <div className="space-y-6 text-muted-foreground">
                <p className="text-base leading-relaxed">
                  Rather than a static list, AgriSMES takes a dynamic approach to commodity coverage. 
                  What matters is the structure, documentation, and quality alignment—not just the commodity name.
                </p>

                <div className="bg-muted/50 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Leaf className="h-5 w-5 text-primary" />
                    <h3 className="text-foreground font-medium">What Alex Can Explain:</h3>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span>Which commodities are currently in active demand</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span>Quality grades and specifications by commodity</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span>Origin countries and seasonal availability</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span>Documentation and certification requirements</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span>How to position your commodity for structured engagement</span>
                    </li>
                  </ul>
                </div>

                <p className="text-sm italic">
                  Every commodity discussion is contextual. Alex provides guidance based on your specific interest and situation.
                </p>
              </div>

              {/* CTA */}
              <div className="mt-10 flex flex-col items-center">
                <Button
                  onClick={openChatWithContext}
                  size="lg"
                  className="gap-2 text-base px-8"
                >
                  <MessageCircle className="h-5 w-5" />
                  Chat with Alex to Explore Commodities
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Earn RewardFlow points through engagement
                </p>
              </div>
            </div>

            {/* Trust Anchors */}
            <div className="space-y-4">
              <TrustAnchor variant="review" />
              <HumanOversightBadge className="justify-center" />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CommoditiesSupported;
