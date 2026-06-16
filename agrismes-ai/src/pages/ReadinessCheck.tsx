import { useEffect } from "react";
import { MessageCircle, CheckSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { TrustAnchor, HumanOversightBadge } from "@/components/TrustAnchor";

const ReadinessCheck = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const openChatWithContext = () => {
    // Store context for Alex to use
    sessionStorage.setItem("agrismes_chat_source_page", "exporter_readiness");
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
                <CheckSquare className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
                Exporter Readiness Check
              </h1>
              <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                Readiness is contextual—it varies by commodity, market, and operational capacity.
              </p>
            </div>

            {/* Content Card */}
            <div className="bg-card border border-border rounded-lg p-8 md:p-10 shadow-sm mb-8">
              <div className="space-y-6 text-muted-foreground">
                <p className="text-base leading-relaxed">
                  Rather than a static form, AgriSMES uses live interaction to understand your current position 
                  and assess alignment with structured buyer and institutional requirements.
                </p>

                <div className="bg-muted/50 rounded-lg p-6">
                  <h3 className="text-foreground font-medium mb-3">What Alex Will Help You Understand:</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span>Your current supply and operational capacity</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span>Documentation and compliance preparedness</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span>Alignment with structured buyer expectations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span>Areas for improvement before engaging institutions</span>
                    </li>
                  </ul>
                </div>

                <p className="text-sm italic">
                  This is not an approval or rejection tool. It is a guided conversation to help clarify your readiness.
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
                  Chat with Alex to Assess Export Readiness
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Earn RewardFlow points through meaningful engagement
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

export default ReadinessCheck;
