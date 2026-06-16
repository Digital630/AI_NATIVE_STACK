import React, { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AlexChatCTA } from "@/components/AlexChatCTA";
import { ArrowRight, CheckCircle, Droplets, Scale, Search, Shield } from "lucide-react";

const QualityControlPage = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <>
      <Helmet>
        <title>Quality Control | AgriSMES Platform Intelligence</title>
        <meta name="description" content="Learn how AgriSMES's quality control tools support agribusiness SMEs with moisture content analysis, weight estimation, and visual quality assessment." />
        <meta name="keywords" content="quality control, moisture content, agribusiness quality, commodity grading, AgriSMES" />
        <link rel="canonical" href="https://agrismes.com/insights/platform-intelligence/quality-control" />
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
                  Quality Control Intelligence
                </h1>
                <p className="text-lg text-muted-foreground">
                  Understanding how AgriSMES's digital tools support quality assessment for agricultural commodities.
                </p>
              </div>
            </div>
          </section>

          {/* Content Section */}
          <section className="py-12 md:py-16">
            <div className="container-institutional px-6">
              <div className="max-w-3xl mx-auto prose prose-slate">
                
                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                  The Role of Quality Control in Trade
                </h2>
                <p className="text-muted-foreground mb-6">
                  Quality control is fundamental to agricultural commodity trade. Buyers, processors, and financial institutions require consistent quality assurance before engaging in transactions. For many SMEs, access to quality testing infrastructure remains a significant barrier to formal market participation.
                </p>
                <p className="text-muted-foreground mb-6">
                  AgriSMES provides digital tools that support initial quality assessment, enabling SMEs to better understand their product positioning before engaging with buyers or seeking trade financing. These tools provide guidance and estimates—they do not replace laboratory testing or formal certification.
                </p>

                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2 mb-4 mt-10">
                  <Droplets className="h-6 w-6 text-primary" />
                  Digital Agri-Process Tools
                </h2>
                <p className="text-muted-foreground mb-4">
                  The platform offers three primary quality assessment tools:
                </p>
                
                <div className="space-y-4 mb-6">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h3 className="font-medium text-foreground mb-2">Moisture Content Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      Moisture levels directly impact commodity quality, storage stability, and market value. The moisture tool uses image-based analysis to provide estimated moisture content readings for commodities like coffee, cashew, and cocoa. Optimal moisture ranges vary by commodity—for example, coffee typically requires below 11% for safe storage and export.
                    </p>
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h3 className="font-medium text-foreground mb-2">Weight Estimation (KGs)</h3>
                    <p className="text-sm text-muted-foreground">
                      Accurate weight assessment is critical for pricing, logistics planning, and contract fulfillment. The weight estimation tool provides approximate measurements based on visual analysis, helping SMEs plan shipments and quotations before formal weighing.
                    </p>
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h3 className="font-medium text-foreground mb-2">Visual Quality Control (QC)</h3>
                    <p className="text-sm text-muted-foreground">
                      The QC tool assesses visual quality indicators including color uniformity, size consistency, defect rates, and potential contamination. It provides preliminary grading guidance and identifies issues that may affect market acceptance.
                    </p>
                  </div>
                </div>

                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2 mb-4 mt-10">
                  <Search className="h-6 w-6 text-primary" />
                  How Quality Data Supports Trade
                </h2>
                <p className="text-muted-foreground mb-4">
                  Quality assessment data serves multiple purposes in the trade readiness process:
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Identifying quality issues before buyer engagement, reducing rejection risk</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Supporting realistic pricing based on quality grade</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Documenting quality for trade finance applications</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Guiding storage and handling decisions to preserve quality</span>
                  </li>
                </ul>

                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2 mb-4 mt-10">
                  <Scale className="h-6 w-6 text-primary" />
                  Limitations and Proper Use
                </h2>
                <p className="text-muted-foreground mb-6">
                  These digital tools provide estimates and guidance based on image analysis. They do not replace physical testing, laboratory analysis, or formal certification. Results should be used as preliminary indicators to guide decision-making, not as definitive quality certifications.
                </p>
                <p className="text-muted-foreground mb-6">
                  For formal trade transactions, SMEs should obtain appropriate certifications from recognized bodies such as phytosanitary authorities, quality control agencies, and industry-specific certification organizations.
                </p>

                {/* Internal Links */}
                <div className="bg-primary/5 rounded-lg p-6 mt-8">
                  <h3 className="font-semibold text-foreground mb-4">Related Resources</h3>
                  <div className="space-y-3">
                    <Link 
                      to="/digital-agri-process" 
                      className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Access Digital Agri-Process Tools
                    </Link>
                    <Link 
                      to="/insights/platform-intelligence/readiness-score" 
                      className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Understanding the Readiness Score
                    </Link>
                    <Link 
                      to="/insights/platform-intelligence/export-readiness" 
                      className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Export Readiness requirements
                    </Link>
                    <Link 
                      to="/commodities-supported" 
                      className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                    >
                      <ArrowRight className="h-4 w-4" />
                      View supported commodities
                    </Link>
                    <Link 
                      to="/download" 
                      className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Download AgriSMES App
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

export default QualityControlPage;
