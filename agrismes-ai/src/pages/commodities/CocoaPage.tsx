import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { MessageCircle, ArrowRight, Globe, Calendar, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { TrustAnchor, HumanOversightBadge } from "@/components/TrustAnchor";

const CocoaPage = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const openChatWithContext = () => {
    sessionStorage.setItem("agrismes_chat_source_page", "cocoa_commodity");
    sessionStorage.setItem("chatPrefillTopic", "cocoa");
    window.dispatchEvent(new CustomEvent("openChatWidget"));
  };

  return (
    <>
      <Helmet>
        <title>Cocoa Export: Source Fine Flavour Cocoa Beans | AgriSMES</title>
        <meta name="description" content="Export premium cocoa beans with AgriSMES. Fine flavour cocoa sourcing, fermentation quality standards, and trade finance pathways for chocolate manufacturers." />
        <meta name="keywords" content="cocoa export, cocoa beans, fine flavour cocoa, cocoa trade finance, cocoa sourcing, chocolate manufacturing, cocoa fermentation, cocoa commodity trading" />
        <link rel="canonical" href="https://agrismes.com/commodities/cocoa" />
        <meta property="og:title" content="Cocoa Export: Source Fine Flavour Cocoa Beans | AgriSMES" />
        <meta property="og:description" content="Export premium cocoa with structured trade support and financing guidance for agribusiness." />
        <meta property="og:url" content="https://agrismes.com/commodities/cocoa" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pt-20">
          {/* Hero Section */}
          <section className="py-16 md:py-24 bg-gradient-to-b from-muted/50 to-background">
            <div className="container mx-auto px-4 max-w-4xl">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                  <span className="text-3xl">🍫</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Cocoa Export
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Fine flavour cocoa beans with structured export and trade finance support
                </p>
              </div>
            </div>
          </section>

          {/* Content Sections */}
          <section className="py-12 md:py-16">
            <div className="container mx-auto px-4 max-w-4xl">
              {/* Overview */}
              <div className="bg-card border border-border rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Commodity Overview</h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Africa produces approximately 70% of the world's cocoa, with Tanzania contributing specialty 
                  fine flavour beans from the Morogoro and Mbeya regions. The country's cocoa is prized for its 
                  unique flavour profile, making it attractive to craft chocolate makers and premium confectionery brands.
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Globe className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Major Origins</p>
                    <p className="text-xs text-muted-foreground">Morogoro, Mbeya, Kyela</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Calendar className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Harvest Season</p>
                    <p className="text-xs text-muted-foreground">September – January</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Award className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Key Grades</p>
                    <p className="text-xs text-muted-foreground">Grade I, Grade II, FAQ</p>
                  </div>
                </div>
              </div>

              {/* Market Demand */}
              <div className="bg-card border border-border rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Global Market Demand</h2>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  The global chocolate industry continues to grow, with increasing demand for traceable, 
                  sustainably sourced cocoa. Craft chocolate makers and premium brands seek fine flavour 
                  beans with distinctive origin characteristics.
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-1 text-primary shrink-0" />
                    <span><strong>European Union:</strong> Netherlands and Belgium lead cocoa processing and chocolate manufacturing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-1 text-primary shrink-0" />
                    <span><strong>United States:</strong> Growing bean-to-bar craft chocolate market</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-1 text-primary shrink-0" />
                    <span><strong>Asia:</strong> Expanding chocolate consumption in China, Japan, and Southeast Asia</span>
                  </li>
                </ul>
              </div>

              {/* Trade Considerations */}
              <div className="bg-card border border-border rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Trade Considerations</h2>
                <div className="space-y-4 text-muted-foreground">
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Fermentation Quality</h3>
                    <p className="text-sm">Well-fermented beans (minimum 5-7 days) with proper drying (moisture 6-8%) are essential for flavour development and buyer acceptance.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Quality Parameters</h3>
                    <p className="text-sm">Bean count per 100g, percentage of mouldy/slaty/germinated beans, fat content, and cut test results for fermentation assessment.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Certifications</h3>
                    <p className="text-sm">Organic, Fair Trade, Rainforest Alliance, and EU Deforestation Regulation (EUDR) compliance increasingly required for market access.</p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-8 text-center">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Ready to Source Cocoa?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Chat with Alex to discuss your cocoa sourcing requirements, quality specifications, 
                  and trade readiness pathway.
                </p>
                <Button onClick={openChatWithContext} size="lg" className="gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Chat with Alex About Cocoa
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  Earn RewardFlow points through engagement
                </p>
              </div>

              {/* Trust Anchors */}
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

export default CocoaPage;
