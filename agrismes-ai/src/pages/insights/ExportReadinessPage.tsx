import React, { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AlexChatCTA } from "@/components/AlexChatCTA";
import { ArrowRight, CheckCircle, FileCheck, Globe, Package, Ship } from "lucide-react";

const ExportReadinessPage = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <>
      <Helmet>
        <title>Export Readiness | AgriSMES Platform Intelligence</title>
        <meta name="description" content="Learn about export readiness requirements for agribusiness SMEs. Understand documentation, compliance, logistics, and market access preparation." />
        <meta name="keywords" content="export readiness, agribusiness export, trade documentation, SME export preparation, AgriSMES" />
        <link rel="canonical" href="https://agrismes.com/insights/platform-intelligence/export-readiness" />
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
                  Export Readiness Framework
                </h1>
                <p className="text-lg text-muted-foreground">
                  A structured approach to preparing agribusiness SMEs for international market engagement.
                </p>
              </div>
            </div>
          </section>

          {/* Content Section */}
          <section className="py-12 md:py-16">
            <div className="container-institutional px-6">
              <div className="max-w-3xl mx-auto prose prose-slate">
                
                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Globe className="h-6 w-6 text-primary" />
                  What Export Readiness Means
                </h2>
                <p className="text-muted-foreground mb-6">
                  Export readiness describes an SME's preparedness to engage in international commodity trade. This encompasses more than having products available for sale—it requires alignment across documentation, quality standards, logistics capabilities, and financial structures that meet buyer and regulatory expectations.
                </p>
                <p className="text-muted-foreground mb-6">
                  Many agribusiness SMEs possess quality products but face barriers in formal market access due to gaps in these supporting structures. AgriSMES's approach focuses on identifying and addressing these gaps systematically.
                </p>

                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2 mb-4 mt-10">
                  <FileCheck className="h-6 w-6 text-primary" />
                  Documentation Requirements
                </h2>
                <p className="text-muted-foreground mb-4">
                  International commodity trade requires comprehensive documentation. Key documents include:
                </p>
                
                <div className="space-y-4 mb-6">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h3 className="font-medium text-foreground mb-2">Business Registration and Licensing</h3>
                    <p className="text-sm text-muted-foreground">
                      Valid business registration, export licenses where required, and industry-specific authorizations. These establish the legal foundation for trade activities.
                    </p>
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h3 className="font-medium text-foreground mb-2">Phytosanitary and Health Certificates</h3>
                    <p className="text-sm text-muted-foreground">
                      Certificates confirming plant health and freedom from pests and diseases. Required by most destination countries and issued by national plant protection authorities.
                    </p>
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h3 className="font-medium text-foreground mb-2">Certificate of Origin</h3>
                    <p className="text-sm text-muted-foreground">
                      Documents confirming the country of origin for customs purposes and potential preferential trade treatment under trade agreements.
                    </p>
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h3 className="font-medium text-foreground mb-2">Quality and Grade Certificates</h3>
                    <p className="text-sm text-muted-foreground">
                      Third-party verification of product quality, grading, and conformity to agreed specifications. Essential for buyer confidence and dispute prevention.
                    </p>
                  </div>
                </div>

                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2 mb-4 mt-10">
                  <Package className="h-6 w-6 text-primary" />
                  Quality and Compliance Standards
                </h2>
                <p className="text-muted-foreground mb-4">
                  Different markets have varying quality and compliance requirements:
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>European Union: TRACES system registration, EU Deforestation Regulation compliance, maximum residue limits</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>United States: FDA prior notice requirements, FSMA compliance, APHIS regulations</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Middle East: Halal certification where applicable, regional import regulations</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Asia: Country-specific phytosanitary requirements, quality grading preferences</span>
                  </li>
                </ul>

                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2 mb-4 mt-10">
                  <Ship className="h-6 w-6 text-primary" />
                  Logistics and Financial Preparedness
                </h2>
                <p className="text-muted-foreground mb-6">
                  Export-ready SMEs must demonstrate capability in logistics coordination and financial transaction management. This includes understanding of Incoterms (FOB, CIF, etc.), familiarity with Letters of Credit and payment mechanisms, and established relationships with freight forwarders and shipping lines.
                </p>
                <p className="text-muted-foreground mb-6">
                  Working capital management is equally critical—the gap between production costs and payment receipt can span several months in commodity trade, requiring appropriate financial planning or access to trade financing.
                </p>

                <h2 className="text-2xl font-semibold text-foreground mb-4 mt-10">
                  Building Export Readiness
                </h2>
                <p className="text-muted-foreground mb-6">
                  AgriSMES supports SMEs in developing export readiness through AI-guided assessment, practical tool access, and structured preparation pathways. The Exporter Readiness Check provides an initial diagnostic, while ongoing engagement with Alex helps address specific gaps and questions.
                </p>

                {/* Internal Links */}
                <div className="bg-primary/5 rounded-lg p-6 mt-8">
                  <h3 className="font-semibold text-foreground mb-4">Related Resources</h3>
                  <div className="space-y-3">
                    <Link 
                      to="/readiness-check" 
                      className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Start the Exporter Readiness Check
                    </Link>
                    <Link 
                      to="/insights/platform-intelligence/trade-enablement" 
                      className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Understanding Trade Enablement
                    </Link>
                    <Link 
                      to="/insights/platform-intelligence/quality-control" 
                      className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Quality Control tools
                    </Link>
                    <Link 
                      to="/starting-as-supplier-agent" 
                      className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Pathway to Agribusiness
                    </Link>
                    <Link 
                      to="/risk-management" 
                      className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Risk Management
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

export default ExportReadinessPage;
