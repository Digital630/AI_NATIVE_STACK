import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { MessageCircle, Coffee, ArrowRight, Globe, Calendar, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { TrustAnchor, HumanOversightBadge } from "@/components/TrustAnchor";

const CoffeePage = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const openChatWithContext = () => {
    sessionStorage.setItem("agrismes_chat_source_page", "coffee_commodity");
    sessionStorage.setItem("chatPrefillTopic", "coffee");
    window.dispatchEvent(new CustomEvent("openChatWidget"));
  };

  return (
    <>
      <Helmet>
        <title>Tanzania Coffee Export: Source Premium Arabica & Robusta | AgriSMES</title>
        <meta name="description" content="Export high-quality Tanzanian coffee with AgriSMES. Learn sourcing strategies for Arabica and Robusta beans, commodity grades, trade documentation, and bank-ready financing pathways." />
        <meta name="keywords" content="Tanzania coffee export, African coffee beans, Arabica coffee sourcing, Robusta coffee Tanzania, coffee trade finance, export coffee Africa, specialty coffee sourcing, coffee commodity trading" />
        <link rel="canonical" href="https://agrismes.com/commodities/coffee" />
        <meta property="og:title" content="Tanzania Coffee Export: Source Premium Arabica & Robusta | AgriSMES" />
        <meta property="og:description" content="Export high-quality Tanzanian coffee with structured trade support. Arabica and Robusta sourcing, grading, and financing guidance." />
        <meta property="og:url" content="https://agrismes.com/commodities/coffee" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pt-20">
          {/* Hero Section */}
          <section className="py-16 md:py-24 bg-gradient-to-b from-muted/50 to-background">
            <div className="container mx-auto px-4 max-w-4xl">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                  <Coffee className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Tanzania Coffee Export
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Source premium Arabica and Robusta beans with structured trade readiness support
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
                  Tanzania is one of the leading coffee producers in its region, renowned for high-quality Arabica from the 
                  Kilimanjaro and Mbeya regions, and Robusta from the Lake Victoria basin. The country produces 
                  approximately 50,000-60,000 metric tonnes annually, with growing specialty segments commanding 
                  premium prices in international markets.
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Globe className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Major Origins</p>
                    <p className="text-xs text-muted-foreground">Kilimanjaro, Mbeya, Kagera</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Calendar className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Harvest Season</p>
                    <p className="text-xs text-muted-foreground">July – December</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Award className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Key Grades</p>
                    <p className="text-xs text-muted-foreground">AA, A, PB, FAQ</p>
                  </div>
                </div>
              </div>

              {/* Market Demand */}
              <div className="bg-card border border-border rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Global Market Demand</h2>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Tanzanian coffee enjoys strong demand from specialty roasters in Europe, North America, and Asia. 
                  The distinct bright acidity and complex flavour profiles of Kilimanjaro Arabica make it particularly 
                  sought after for single-origin and blend applications.
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-1 text-primary shrink-0" />
                    <span><strong>European Union:</strong> Germany, Belgium, and Italy lead imports for specialty and commercial blends</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-1 text-primary shrink-0" />
                    <span><strong>Japan:</strong> High demand for washed Arabica with clean cup profiles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-1 text-primary shrink-0" />
                    <span><strong>United States:</strong> Growing specialty market for certified and traceable origins</span>
                  </li>
                </ul>
              </div>

              {/* Trade Considerations */}
              <div className="bg-card border border-border rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Trade Considerations</h2>
                <div className="space-y-4 text-muted-foreground">
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Documentation Requirements</h3>
                    <p className="text-sm">Export permits, phytosanitary certificates, quality certificates from Tanzania Coffee Board, certificate of origin, and fumigation certificates where required.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Quality Specifications</h3>
                    <p className="text-sm">Moisture content typically 10-12%, defect counts per grade, cup quality scoring for specialty lots, and proper storage protocols to maintain quality.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Certifications</h3>
                    <p className="text-sm">Organic, Fair Trade, Rainforest Alliance, and UTZ certifications available for differentiated market access and premium positioning.</p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-8 text-center">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Ready to Source Tanzanian Coffee?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Chat with Alex to discuss your coffee sourcing requirements, quality specifications, 
                  and trade readiness pathway.
                </p>
                <Button onClick={openChatWithContext} size="lg" className="gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Chat with Alex About Coffee
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

export default CoffeePage;
