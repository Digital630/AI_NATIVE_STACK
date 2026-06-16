import React, { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AlexChatCTA } from "@/components/AlexChatCTA";
import { ArrowRight, CheckCircle, Handshake, Layers, TrendingUp, Users } from "lucide-react";

const TradeEnablementPage = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <>
      <Helmet>
        <title>Trade Enablement | AgriSMES Platform Intelligence</title>
        <meta name="description" content="Discover how AgriSMES enables trade connections between agribusiness SMEs, buyers, and financial institutions through structured market access." />
        <meta name="keywords" content="trade enablement, agribusiness connections, buyer-seller matching, trade facilitation, AgriSMES" />
        <link rel="canonical" href="https://agrismes.com/insights/platform-intelligence/trade-enablement" />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1">
          {/* Hero Section */}
          <section className="py-12 md:py-16 bg-gradient-to-b from-primary/5 to-background">
            <div className="container-institutional px-6">
              <div className="max-w-3xl">
                <p className="text-sm text-primary font-medium mb-2">Platform Intelligence</p>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Trade Enablement Approach
                </h1>
                <p className="text-lg text-muted-foreground">
                  How AgriSMES facilitates structured connections between agribusiness SMEs and market opportunities.
                </p>
              </div>
            </div>
          </section>

          {/* Content Section */}
          <section className="py-12 md:py-16">
            <div className="container-institutional px-6">
              <div className="max-w-3xl mx-auto prose prose-slate">
                
                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Layers className="h-6 w-6 text-primary" />
                  The Trade Enablement Model
                </h2>
                <p className="text-muted-foreground mb-6">
                  Trade enablement describes the systematic approach of connecting prepared SMEs with market opportunities. Unlike simple buyer-seller matching, trade enablement encompasses preparation, verification, and structured engagement processes that reduce transaction risk for all parties.
                </p>
                <p className="text-muted-foreground mb-6">
                  AgriSMES operates as a facilitation layer—the platform does not buy, sell, or guarantee transactions. Instead, it provides tools, intelligence, and structured pathways that help SMEs become trade-ready and connect with appropriate market participants.
                </p>

                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2 mb-4 mt-10">
                  <Users className="h-6 w-6 text-primary" />
                  Stakeholder Perspectives
                </h2>
                <p className="text-muted-foreground mb-4">
                  Trade enablement serves multiple stakeholder groups with aligned interests:
                </p>
                
                <div className="space-y-4 mb-6">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h3 className="font-medium text-foreground mb-2">For Exporters and Suppliers</h3>
                    <p className="text-sm text-muted-foreground">
                      SMEs gain access to structured preparation pathways, quality assessment tools, and potential connections with verified buyers. The platform helps translate informal capacity into formal, documentable trade readiness.
                    </p>
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h3 className="font-medium text-foreground mb-2">For Importers and Buyers</h3>
                    <p className="text-sm text-muted-foreground">
                      Buyers access a pipeline of pre-assessed suppliers with documented quality indicators and demonstrated preparation. This reduces sourcing risk and due diligence burden.
                    </p>
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h3 className="font-medium text-foreground mb-2">For Financial Institutions</h3>
                    <p className="text-sm text-muted-foreground">
                      Banks and trade financiers benefit from structured SME data, documented preparation levels, and reduced information asymmetry when evaluating trade finance applications.
                    </p>
                  </div>
                </div>

                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2 mb-4 mt-10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  The Enablement Process
                </h2>
                <p className="text-muted-foreground mb-4">
                  AgriSMES's trade enablement follows a structured progression:
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span><strong>Discovery:</strong> Understanding the SME's commodity focus, current capacity, and market objectives through AI-guided conversation</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span><strong>Assessment:</strong> Evaluating trade readiness across documentation, quality, operations, and financial dimensions</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span><strong>Preparation:</strong> Addressing identified gaps through guidance, tools, and structured improvement pathways</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span><strong>Connection:</strong> Facilitating introductions to verified buyers, suppliers, or financial institutions when readiness thresholds are met</span>
                  </li>
                </ul>

                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2 mb-4 mt-10">
                  <Handshake className="h-6 w-6 text-primary" />
                  Commodity Focus
                </h2>
                <p className="text-muted-foreground mb-6">
                  Trade enablement on AgriSMES centers on agricultural commodities with established international demand. Current focus areas include coffee (Arabica and Robusta), cashew (RCN and kernels), cocoa, sesame, avocado, macadamia, and select spices. The platform's tools and intelligence are calibrated for these commodity categories.
                </p>
                <p className="text-muted-foreground mb-6">
                  Country focus currently emphasizes East African origins (Tanzania, Kenya, Uganda, Ethiopia) and West African production areas (Ivory Coast, Benin), with primary destination markets in Europe, Middle East, and Asia.
                </p>

                <h2 className="text-2xl font-semibold text-foreground mb-4 mt-10">
                  Accessing Trade Enablement Services
                </h2>
                <p className="text-muted-foreground mb-6">
                  SMEs can begin their trade enablement journey through the platform's AI assistant, Alex. Continued engagement earns RewardFlow points that unlock access to premium services including Buyer-Seller Matchmaking, Trade Assessment, and Market Reports through the Exclusive Services section.
                </p>

                {/* Internal Links */}
                <div className="bg-primary/5 rounded-lg p-6 mt-8">
                  <h3 className="font-semibold text-foreground mb-4">Related Resources</h3>
                  <div className="space-y-3">
                    <Link 
                      to="/commodities-supported" 
                      className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                    >
                      <ArrowRight className="h-4 w-4" />
                      View supported commodities
                    </Link>
                    <Link 
                      to="/buyers-importers" 
                      className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Importer Sourcing information
                    </Link>
                    <Link 
                      to="/unlock-services" 
                      className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Unlock Exclusive Services
                    </Link>
                    <Link 
                      to="/insights/platform-intelligence/readiness-score" 
                      className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Understanding the Readiness Score
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <AlexChatCTA />
        </main>

        <Footer />
      </div>
    </>
  );
};

export default TradeEnablementPage;
