import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import { CommodityPriceTicker } from "@/components/CommodityPriceTicker";
import ProofStrip from "@/components/ProofStrip";
import CommodityMarketDashboard from "@/components/CommodityMarketDashboard";
import ProcessFlow from "@/components/ProcessFlow";
import IntentionSection from "@/components/IntentionSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import FieldPresenceSection from "@/components/FieldPresenceSection";
import TradeInfrastructureSection from "@/components/TradeInfrastructureSection";
import DataImpactSection from "@/components/DataImpactSection";
import ExploreListingsCTA from "@/components/ExploreListingsCTA";

import ForSMEsSection from "@/components/ForSMEsSection";
import ForBanksSection from "@/components/ForBanksSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import StructuredData from "@/components/StructuredData";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData />
      <Header />
      <main>
        {/* Live commodity prices - positioned between header and hero for immediate value */}
        <CommodityPriceTicker />
        <HeroSection />
        <ProofStrip />
        <CommodityMarketDashboard />
        <ProcessFlow />
        <IntentionSection />
        <HowItWorksSection />
        <FieldPresenceSection />
        <TradeInfrastructureSection />
        <DataImpactSection />
        <ExploreListingsCTA />
        
        <ForSMEsSection />
        <ForBanksSection />
        
        {/* Internal linking for crawl optimization */}
        <section className="py-12 bg-muted/20">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-xl font-semibold text-foreground mb-6 text-center">Explore More</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <a href="/risk-management" className="text-primary hover:underline text-center py-2">Risk Management</a>
              <a href="/the-gap" className="text-primary hover:underline text-center py-2">The Gap We Address</a>
              <a href="/insights/platform-intelligence/export-readiness" className="text-primary hover:underline text-center py-2">Export Readiness</a>
              <a href="/insights/platform-intelligence/quality-control" className="text-primary hover:underline text-center py-2">Quality Control</a>
              <a href="/commodities-supported" className="text-primary hover:underline text-center py-2">Commodities Supported</a>
              <a href="/market-intelligence" className="text-primary hover:underline text-center py-2">Market Intelligence</a>
              <a href="/readiness-check" className="text-primary hover:underline text-center py-2">Readiness Check</a>
              <a href="/download" className="text-primary hover:underline text-center py-2">Download App</a>
            </div>
          </div>
        </section>

        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
