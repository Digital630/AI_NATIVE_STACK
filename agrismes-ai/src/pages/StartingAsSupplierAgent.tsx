import { useEffect } from "react";
import { MessageCircle, UserPlus, ArrowRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { TrustAnchor, HumanOversightBadge } from "@/components/TrustAnchor";

const StartingAsSupplierAgent = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const openChatWithContext = () => {
    // Store context for Alex to use
    sessionStorage.setItem("agrismes_chat_source_page", "pathway_agribusiness");
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
                <UserPlus className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
                Pathway to Agribusiness
              </h1>
              <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                AgriSMES supports new entrants through guided interaction—no forms required to start learning.
              </p>
            </div>

            {/* Content Card */}
            <div className="bg-card border border-border rounded-lg p-8 md:p-10 shadow-sm mb-8">
              <div className="space-y-6 text-muted-foreground">
                <p className="text-base leading-relaxed">
                  Entering structured agricultural trade can seem complex. Whether you're an individual with 
                  commodity access, someone interested in becoming an aggregator, or exploring the agent pathway, 
                  Alex can guide you through understanding what's involved.
                </p>

                <div className="bg-muted/50 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    <h3 className="text-foreground font-medium">What You'll Learn:</h3>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span>How structured supply differs from informal trading</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span>Starting small and building capacity over time</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span>Working as an agent or coordinator before trading directly</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span>Documentation and quality basics for commodity trade</span>
                    </li>
                  </ul>
                </div>

                <p className="text-sm italic">
                  Many successful suppliers started with limited experience or capital. The key is structured guidance and gradual progression.
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
                  Chat with Alex to Explore Agribusiness
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Earn RewardFlow points through learning and engagement
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

export default StartingAsSupplierAgent;
