import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { MessageCircle, ArrowRight, Globe, Calendar, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { TrustAnchor, HumanOversightBadge } from "@/components/TrustAnchor";

const AvocadoPage = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const openChatWithContext = () => {
    sessionStorage.setItem("agrismes_chat_source_page", "avocado_commodity");
    sessionStorage.setItem("chatPrefillTopic", "avocado");
    window.dispatchEvent(new CustomEvent("openChatWidget"));
  };

  return (
    <>
      <Helmet>
        <title>Avocado Export: Hass Avocado Sourcing | AgriSMES</title>
        <meta name="description" content="Export premium Hass avocados with AgriSMES. Learn sourcing strategies, cold chain logistics, phytosanitary requirements, and trade finance pathways." />
        <meta name="keywords" content="avocado export, Hass avocado sourcing, avocados, avocado trade finance, fresh fruit export, avocado cold chain, Tanzania avocado, Kenya avocado" />
        <link rel="canonical" href="https://agrismes.com/commodities/avocado" />
        <meta property="og:title" content="Avocado Export: Hass Avocado Sourcing | AgriSMES" />
        <meta property="og:description" content="Export premium Hass avocados with structured trade support and cold chain guidance." />
        <meta property="og:url" content="https://agrismes.com/commodities/avocado" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pt-20">
          {/* Hero Section */}
          <section className="py-16 md:py-24 bg-gradient-to-b from-muted/50 to-background">
            <div className="container mx-auto px-4 max-w-4xl">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                  <span className="text-3xl">🥑</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Avocado Export
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Premium Hass avocados with cold chain logistics and trade finance support
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
                  East Africa is emerging as a significant avocado exporter, with Kenya and Tanzania increasing 
                  production of export-grade Hass avocados. The region's diverse microclimates enable year-round 
                  production, offering counter-seasonal supply to European and Asian markets.
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Globe className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Major Origins</p>
                    <p className="text-xs text-muted-foreground">Kenya, Tanzania Highlands</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Calendar className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Harvest Season</p>
                    <p className="text-xs text-muted-foreground">March – October (varies)</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Award className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Key Varieties</p>
                    <p className="text-xs text-muted-foreground">Hass, Fuerte, Pinkerton</p>
                  </div>
                </div>
              </div>

              {/* Market Demand */}
              <div className="bg-card border border-border rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Global Market Demand</h2>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Global avocado consumption continues to grow rapidly, driven by health trends and culinary 
                  versatility. European markets particularly value African avocados for their quality and 
                  shorter transport times compared to Latin American origins.
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-1 text-primary shrink-0" />
                    <span><strong>European Union:</strong> Netherlands, France, and UK lead imports with strong retail demand</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-1 text-primary shrink-0" />
                    <span><strong>Middle East:</strong> UAE and Saudi Arabia growing markets for premium fresh produce</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 mt-1 text-primary shrink-0" />
                    <span><strong>Asia:</strong> China and Japan developing avocado consumption habits</span>
                  </li>
                </ul>
              </div>

              {/* Trade Considerations */}
              <div className="bg-card border border-border rounded-lg p-8 mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Trade Considerations</h2>
                <div className="space-y-4 text-muted-foreground">
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Cold Chain Requirements</h3>
                    <p className="text-sm">Temperature control (5-7°C) from packhouse to destination essential. Pre-cooling, reefer containers, and cold storage infrastructure critical for quality preservation.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Quality Standards</h3>
                    <p className="text-sm">Size grading (count per 4kg box), dry matter content (minimum 21-23% for Hass), absence of physical defects, and uniform ripeness stage.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Compliance</h3>
                    <p className="text-sm">GlobalGAP certification, phytosanitary certificates, maximum residue limits (MRL) compliance, and EU market access protocols.</p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-8 text-center">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Ready to Source Avocados?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Chat with Alex to discuss your avocado sourcing requirements, logistics planning, 
                  and trade readiness pathway.
                </p>
                <Button onClick={openChatWithContext} size="lg" className="gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Chat with Alex About Avocado
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

export default AvocadoPage;
