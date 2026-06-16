import React, { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AlexChatCTA } from "@/components/AlexChatCTA";
import { ArrowRight, CheckCircle, FileText, Target, BarChart3 } from "lucide-react";

const ReadinessScorePage = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <>
      <Helmet>
        <title>Readiness Score | AgriSMES Platform Intelligence</title>
        <meta name="description" content="Understand how AgriSMES's Readiness Score assesses trade preparation for agribusiness SMEs. Learn about documentation, compliance, and market access readiness." />
        <meta name="keywords" content="trade readiness score, export readiness, SME assessment, agribusiness preparation, AgriSMES" />
        <link rel="canonical" href="https://agrismes.com/insights/platform-intelligence/readiness-score" />
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
                  Understanding the Readiness Score
                </h1>
                <p className="text-lg text-muted-foreground">
                  How AgriSMES evaluates and supports trade preparation for agribusiness SMEs seeking structured market access.
                </p>
              </div>
            </div>
          </section>

          {/* Content Section */}
          <section className="py-12 md:py-16">
            <div className="container-institutional px-6">
              <div className="max-w-3xl mx-auto prose prose-slate">
                
                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Target className="h-6 w-6 text-primary" />
                  What Is the Readiness Score?
                </h2>
                <p className="text-muted-foreground mb-6">
                  The Readiness Score is a structured assessment framework that evaluates an SME's preparation level for engaging with institutional buyers, financial institutions, and international markets. Unlike informal trade assessments, this score provides a consistent, transparent measure of trade preparation across multiple dimensions.
                </p>
                <p className="text-muted-foreground mb-6">
                  The assessment does not guarantee any outcomes, financing, or market access. It serves as a diagnostic tool to identify gaps and guide improvement efforts.
                </p>

                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2 mb-4 mt-10">
                  <FileText className="h-6 w-6 text-primary" />
                  Assessment Dimensions
                </h2>
                <p className="text-muted-foreground mb-4">
                  The Readiness Score evaluates preparation across four core areas:
                </p>
                
                <div className="space-y-4 mb-6">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h3 className="font-medium text-foreground mb-2">Documentation Readiness</h3>
                    <p className="text-sm text-muted-foreground">
                      Completeness and accuracy of trade documentation, including business registration, phytosanitary certificates, certificates of origin, and quality certifications. Proper documentation is essential for bank engagement and international trade compliance.
                    </p>
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h3 className="font-medium text-foreground mb-2">Quality Assurance</h3>
                    <p className="text-sm text-muted-foreground">
                      Product quality controls, grading capabilities, moisture content management, and alignment with destination market requirements. Quality consistency is a key factor in buyer confidence and repeat business.
                    </p>
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h3 className="font-medium text-foreground mb-2">Operational Capacity</h3>
                    <p className="text-sm text-muted-foreground">
                      Storage facilities, processing capabilities, volume consistency, and supply chain reliability. Operational capacity determines an SME's ability to fulfill contracted commitments.
                    </p>
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h3 className="font-medium text-foreground mb-2">Financial Structure</h3>
                    <p className="text-sm text-muted-foreground">
                      Financial record-keeping, payment term understanding, working capital management, and familiarity with trade financing instruments such as Letters of Credit.
                    </p>
                  </div>
                </div>

                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2 mb-4 mt-10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                  How the Score Is Used
                </h2>
                <p className="text-muted-foreground mb-4">
                  The Readiness Score serves multiple purposes within the AgriSMES platform:
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Identifying specific areas requiring improvement before market engagement</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Guiding conversations with AgriSMES's AI assistant, Alex, toward relevant topics</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Providing a baseline for tracking progress over time</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Supporting structured engagement with financial institutions</span>
                  </li>
                </ul>

                <h2 className="text-2xl font-semibold text-foreground mb-4 mt-10">
                  Getting Started
                </h2>
                <p className="text-muted-foreground mb-6">
                  SMEs can begin their readiness assessment through the Exporter Readiness Check tool. This initial conversation with Alex helps establish a baseline understanding of current preparation levels and identifies priority areas for development.
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
                      Start your Exporter Readiness Check
                    </Link>
                    <Link 
                      to="/insights/platform-intelligence/quality-control" 
                      className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Learn about Quality Control tools
                    </Link>
                    <Link 
                      to="/insights/platform-intelligence/export-readiness" 
                      className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Understanding Export Readiness
                    </Link>
                    <Link 
                      to="/digital-agri-process" 
                      className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Explore Digital Agri-Process Tools
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

export default ReadinessScorePage;
