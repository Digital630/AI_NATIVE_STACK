import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { MessageCircle, ArrowRight, Globe, Calendar, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { TrustAnchor, HumanOversightBadge } from "@/components/TrustAnchor";

const SpicesPage = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const openChatWithContext = () => {
    sessionStorage.setItem("agrismes_chat_source_page", "spices_commodity");
    sessionStorage.setItem("chatPrefillTopic", "spices");
    window.dispatchEvent(new CustomEvent("openChatWidget"));
  };

  return (
    <>
      <Helmet>
        <title>Spices Export: Cloves, Pepper, Vanilla Sourcing | AgriSMES</title>
        <meta name="description" content="Export premium spices with AgriSMES. Zanzibar cloves, black pepper, vanilla, and specialty spices with trade finance and export support." />
        <meta name="keywords" content="spices export, Zanzibar cloves, black pepper, vanilla Madagascar, spice trade, cloves sourcing, spice commodity, Tanzania spices" />
        <link rel="canonical" href="https://agrismes.com/commodities/spices" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pt-20">
          <section className="py-16 md:py-24 bg-gradient-to-b from-muted/50 to-background">
            <div className="container mx-auto px-4 max-w-4xl">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                  <span className="text-3xl">🫚</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Spices Export
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Premium cloves, pepper, vanilla, and specialty spices from East Africa
                </p>
              </div>
            </div>
          </section>

          <section className="py-12 md:py-16">
            <div className="container mx-auto px-4 max-w-4xl">
              <div className="bg-card border border-border rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Commodity Overview</h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  East Africa, particularly Zanzibar and the Spice Islands, has a centuries-old tradition of 
                  spice production. The region produces world-class cloves, black pepper, cinnamon, ginger, 
                  and other specialty spices highly valued in global markets.
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Globe className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Major Origins</p>
                    <p className="text-xs text-muted-foreground">Zanzibar, Pemba, Madagascar</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Calendar className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Harvest Season</p>
                    <p className="text-xs text-muted-foreground">Varies by spice</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Award className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Key Products</p>
                    <p className="text-xs text-muted-foreground">Cloves, Pepper, Vanilla</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Global Market Demand</h2>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-1 text-primary shrink-0" />
                    <span><strong>Indonesia & India:</strong> Major clove consumers for kretek cigarettes and culinary use</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-1 text-primary shrink-0" />
                    <span><strong>European Union:</strong> Food processing, essential oils, and pharmaceutical applications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-1 text-primary shrink-0" />
                    <span><strong>United States:</strong> Growing demand for organic and traceable spices</span>
                  </li>
                </ul>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-8 text-center">
                <h2 className="text-xl font-semibold text-foreground mb-4">Ready to Source Spices?</h2>
                <Button onClick={openChatWithContext} size="lg" className="gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Chat with Alex About Spices
                </Button>
              </div>

              <div className="mt-8 space-y-4">
                <TrustAnchor variant="review" />
                <HumanOversightBadge className="justify-center" />
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default SpicesPage;
