import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { MessageCircle, ArrowRight, Globe, Calendar, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { TrustAnchor, HumanOversightBadge } from "@/components/TrustAnchor";

const CashewPage = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const openChatWithContext = () => {
    sessionStorage.setItem("agrismes_chat_source_page", "cashew_commodity");
    sessionStorage.setItem("chatPrefillTopic", "cashew");
    window.dispatchEvent(new CustomEvent("openChatWidget"));
  };

  return (
    <>
      <Helmet>
        <title>Export Cashew Nuts from Tanzania: W180, W240, W320 Grades | AgriSMES</title>
        <meta name="description" content="Source premium Tanzanian cashew kernels W180, W240, W320 grades. Learn export documentation, quality standards, and trade finance pathways with AgriSMES." />
        <meta name="keywords" content="cashew export Tanzania, cashew nuts, W180 cashew, W240 cashew kernels, W320 cashew, raw cashew nuts RCN, cashew trade finance, cashew sourcing" />
        <link rel="canonical" href="https://agrismes.com/commodities/cashew" />
        <meta property="og:title" content="Export Cashew Nuts from Tanzania: W180, W240, W320 Grades | AgriSMES" />
        <meta property="og:description" content="Source premium Tanzanian cashew kernels with structured trade readiness support and financing guidance." />
        <meta property="og:url" content="https://agrismes.com/commodities/cashew" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pt-20">
          {/* Hero Section */}
          <section className="py-16 md:py-24 bg-gradient-to-b from-muted/50 to-background">
            <div className="container mx-auto px-4 max-w-4xl">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                  <span className="text-3xl">🥜</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Export Cashew Nuts from Tanzania
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Premium W180, W240, and W320 grade kernels with structured export support
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
                  Tanzania is a significant player in the global cashew market, producing over 200,000 metric tonnes 
                  of raw cashew nuts (RCN) annually. The southern regions of Mtwara and Lindi account for approximately 
                  80% of production, with kernels graded according to AFI (Association of Food Industries) standards.
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Globe className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Major Origins</p>
                    <p className="text-xs text-muted-foreground">Mtwara, Lindi, Pwani</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Calendar className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Harvest Season</p>
                    <p className="text-xs text-muted-foreground">October – January</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Award className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Key Grades</p>
                    <p className="text-xs text-muted-foreground">W180, W240, W320, W450</p>
                  </div>
                </div>
              </div>

              {/* Market Demand */}
              <div className="bg-card border border-border rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Global Market Demand</h2>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Cashew kernels are in consistent global demand for snack foods, confectionery, and plant-based 
                  alternatives. W240 and W320 grades dominate commercial trade, while W180 commands premium prices 
                  for whole-kernel retail applications.
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-1 text-primary shrink-0" />
                    <span><strong>India & Vietnam:</strong> Major processing hubs importing RCN for kernel production</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-1 text-primary shrink-0" />
                    <span><strong>United States:</strong> Largest consumer market for finished kernels</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-1 text-primary shrink-0" />
                    <span><strong>European Union:</strong> Growing demand for traceable, sustainably sourced kernels</span>
                  </li>
                </ul>
              </div>

              {/* Trade Considerations */}
              <div className="bg-card border border-border rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Trade Considerations</h2>
                <div className="space-y-4 text-muted-foreground">
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Grading Standards</h3>
                    <p className="text-sm">Kernels graded by size (pieces per pound) with W180 being largest (180 kernels/lb) and W500 being smallest. Broken grades (splits, butts, pieces) also traded.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Quality Parameters</h3>
                    <p className="text-sm">Moisture content maximum 5%, uniform colour (scorched, light ivory, white wholes), minimal defects, and aflatoxin compliance for EU markets.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Documentation</h3>
                    <p className="text-sm">Phytosanitary certificate, fumigation certificate, certificate of origin, quality inspection report, and export permits from Tanzania Cashewnut Board.</p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-8 text-center">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Ready to Source Tanzanian Cashews?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Chat with Alex to discuss your cashew sourcing requirements, grade specifications, 
                  and trade readiness pathway.
                </p>
                <Button onClick={openChatWithContext} size="lg" className="gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Chat with Alex About Cashew
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

export default CashewPage;
