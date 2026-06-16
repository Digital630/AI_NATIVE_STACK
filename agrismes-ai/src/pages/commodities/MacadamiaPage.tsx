import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { MessageCircle, ArrowRight, Globe, Calendar, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { TrustAnchor, HumanOversightBadge } from "@/components/TrustAnchor";

const MacadamiaPage = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const openChatWithContext = () => {
    sessionStorage.setItem("agrismes_chat_source_page", "macadamia_commodity");
    sessionStorage.setItem("chatPrefillTopic", "macadamia");
    window.dispatchEvent(new CustomEvent("openChatWidget"));
  };

  return (
    <>
      <Helmet>
        <title>Macadamia Nuts Export: Premium Kernel Sourcing | AgriSMES</title>
        <meta name="description" content="Source premium macadamia nuts with AgriSMES. High-quality kernel grades, trade documentation, and export finance pathways for the specialty nut market." />
        <meta name="keywords" content="macadamia export, macadamia nuts Kenya, Tanzania macadamia, macadamia kernel grades, specialty nuts trade, macadamia sourcing, nut in shell NIS" />
        <link rel="canonical" href="https://agrismes.com/commodities/macadamia" />
        <meta property="og:title" content="Macadamia Nuts Export: Premium Kernel Sourcing | AgriSMES" />
        <meta property="og:description" content="Export premium macadamia nuts with structured trade support and financing guidance." />
        <meta property="og:url" content="https://agrismes.com/commodities/macadamia" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pt-20">
          {/* Hero Section */}
          <section className="py-16 md:py-24 bg-gradient-to-b from-muted/50 to-background">
            <div className="container mx-auto px-4 max-w-4xl">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                  <span className="text-3xl">🌰</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Macadamia Nuts Export
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Premium macadamia kernels for specialty nut markets worldwide
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
                  Kenya and Tanzania are among the top global macadamia exporters. 
                  The high-altitude growing conditions produce nuts with excellent oil content and flavour profiles, 
                  commanding premium prices in international markets.
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Globe className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Major Origins</p>
                    <p className="text-xs text-muted-foreground">Kenya, Tanzania, Malawi</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Calendar className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Harvest Season</p>
                    <p className="text-xs text-muted-foreground">March – September</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Award className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Key Grades</p>
                    <p className="text-xs text-muted-foreground">Style 0-4, Halves, Pieces</p>
                  </div>
                </div>
              </div>

              {/* Market Demand */}
              <div className="bg-card border border-border rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Global Market Demand</h2>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Macadamia nuts command premium prices due to limited supply and strong demand from snack food, 
                  confectionery, and cosmetics industries. Whole kernels (Style 0-1) are particularly valued for 
                  retail and gift market applications.
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-1 text-primary shrink-0" />
                    <span><strong>United States:</strong> Largest consumer market, particularly Hawaii-style products</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-1 text-primary shrink-0" />
                    <span><strong>China:</strong> Rapidly growing demand for premium nuts as gifts and snacks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-1 text-primary shrink-0" />
                    <span><strong>European Union:</strong> Growing market for ingredient use in chocolate and bakery</span>
                  </li>
                </ul>
              </div>

              {/* Trade Considerations */}
              <div className="bg-card border border-border rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Trade Considerations</h2>
                <div className="space-y-4 text-muted-foreground">
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Kernel Grading</h3>
                    <p className="text-sm">Kernel styles graded by size and wholeness: Style 0 (whole, premium), Style 1 (whole, smaller), through to Style 4 (pieces and chips).</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Quality Parameters</h3>
                    <p className="text-sm">Kernel recovery rate (typically 20-25% from NIS), moisture content (maximum 1.5%), colour uniformity, and absence of rancidity.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Storage & Handling</h3>
                    <p className="text-sm">Vacuum packaging or nitrogen flushing to prevent oxidation. Cool, dry storage conditions essential for shelf life preservation.</p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-8 text-center">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Ready to Source Macadamia?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Chat with Alex to discuss your macadamia sourcing requirements, grade specifications, 
                  and trade readiness pathway.
                </p>
                <Button onClick={openChatWithContext} size="lg" className="gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Chat with Alex About Macadamia
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

export default MacadamiaPage;
