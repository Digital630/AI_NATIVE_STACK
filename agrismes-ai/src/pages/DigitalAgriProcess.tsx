import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { Droplets, Scale, ClipboardCheck, MessageCircle, ArrowRight, CheckCircle2, Target, TrendingUp, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const DigitalAgriProcess = () => {
  const openChat = () => {
    const chatButton = document.querySelector('[aria-label="Open chat"], [aria-label="Close chat"], .chat-widget-trigger') as HTMLElement;
    if (chatButton) chatButton.click();
  };

  const tools = [
    {
      icon: Droplets,
      title: "Moisture Content Analysis",
      shortName: "Moisture",
      description: "Instant AI-powered moisture level detection for agricultural commodities. Essential for quality control, storage decisions, and export compliance.",
      features: [
        "Commodity-specific thresholds (Cashew 4-6%, Coffee 10-12%, Cocoa 6-8%)",
        "Instant visual analysis from product images",
        "Institutional-grade PDF certificate generation",
        "Professional recommendations for drying and storage"
      ],
      importance: "Moisture content directly impacts shelf life, quality, and export pricing. Incorrect moisture levels can lead to mold, weight loss, and rejected shipments.",
      stakeholders: ["Farmers", "Exporters", "Warehouse Managers", "Quality Inspectors"]
    },
    {
      icon: Scale,
      title: "Weight Estimation (KGs)",
      shortName: "KGs",
      description: "Visual AI-powered weight estimation for bags, boxes, and commodity packages. Get accurate weight estimates without physical scales.",
      features: [
        "Multi-package detection and counting",
        "Individual and total weight estimation",
        "Support for various packaging types (bags, boxes, crates)",
        "Downloadable weight estimation certificate"
      ],
      importance: "Accurate weight estimation is critical for logistics planning, container loading, pricing calculations, and trade documentation.",
      stakeholders: ["Logistics Managers", "Exporters", "Importers", "Warehouse Staff"]
    },
    {
      icon: ClipboardCheck,
      title: "Quality Control (QC)",
      shortName: "QC",
      description: "Comprehensive AI-powered quality assessment including mold detection, color grading, and commodity-specific grading standards.",
      features: [
        "Mold and defect detection",
        "Color sorting and grading",
        "Commodity-specific grades (Cashew W180/W240/W320, Coffee Arabica/Robusta)",
        "Multi-commodity support (Cashew, Coffee, Cocoa, Sesame, Pigeon Pea)"
      ],
      importance: "Quality grading determines market value and buyer acceptance. Proper QC prevents rejections, disputes, and financial losses in international trade.",
      stakeholders: ["Quality Managers", "Exporters", "Buyers", "Third-Party Inspectors"]
    }
  ];

  const benefits = [
    {
      icon: Target,
      title: "Institutional-Grade Accuracy",
      description: "AI models trained on real agricultural data with commodity-specific calibration"
    },
    {
      icon: TrendingUp,
      title: "Improved Trade Readiness",
      description: "Professional documentation that meets export and import standards"
    },
    {
      icon: Shield,
      title: "Risk Reduction",
      description: "Early detection of quality issues prevents costly rejections and disputes"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Digital Agri-Process Tools | AgriSMES</title>
        <meta name="description" content="AI-powered digital tools for moisture analysis, weight estimation, and quality control in agricultural commodity trade." />
      </Helmet>
      
      <Header />
      
      <main className="py-16 md:py-24">
        <div className="container-institutional px-6 md:px-8">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Digital Agri-Process Tools
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Institutional-grade AI tools for moisture content analysis, weight estimation, and quality control — accessible directly from the AgriSMES chat.
            </p>
            <Button onClick={openChat} size="lg" className="gap-2">
              <MessageCircle className="h-5 w-5" />
              Chat with Alex to Try These Tools
            </Button>
          </div>

          {/* Tools Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {tools.map((tool, index) => (
              <Card key={index} className="border-border hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-full bg-primary/10">
                      <tool.icon className="h-6 w-6 text-primary" />
                    </div>
                    <span className="px-2 py-1 text-xs font-semibold bg-muted rounded-full">
                      {tool.shortName}
                    </span>
                  </div>
                  <CardTitle className="text-xl">{tool.title}</CardTitle>
                  <CardDescription className="text-base">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-foreground mb-2">Key Features:</h4>
                    <ul className="space-y-1.5">
                      {tool.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="pt-4 border-t border-border">
                    <h4 className="font-semibold text-sm text-foreground mb-2">Why It Matters:</h4>
                    <p className="text-sm text-muted-foreground">{tool.importance}</p>
                  </div>
                  
                  <div className="pt-4 border-t border-border">
                    <h4 className="font-semibold text-sm text-foreground mb-2">Who Benefits:</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {tool.stakeholders.map((stakeholder, idx) => (
                        <span key={idx} className="px-2 py-0.5 text-xs bg-muted rounded-full text-muted-foreground">
                          {stakeholder}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Benefits Section */}
          <div className="bg-muted/30 rounded-2xl p-8 md:p-12 mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              Why Use Digital Agri-Process Tools?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                    <benefit.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* How to Access */}
          <div className="bg-primary/5 rounded-2xl p-8 md:p-12 mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">
              How to Access These Tools
            </h2>
            <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
              All Digital Agri-Process tools are available directly in the AgriSMES chat interface. Simply click the corresponding button in the chat toolbar.
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-lg border border-border">
                <Droplets className="h-5 w-5 text-primary" />
                <span className="font-medium">Moisture Button</span>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground hidden md:block" />
              <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-lg border border-border">
                <span className="font-bold text-primary text-sm">KGs</span>
                <span className="font-medium">Weight Button</span>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground hidden md:block" />
              <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-lg border border-border">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                <span className="font-medium">QC Button</span>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Chat with Alex to learn more about these tools, get guidance on which tool to use, or try them out directly in the conversation.
            </p>
            <Button onClick={openChat} size="lg" className="gap-2">
              <MessageCircle className="h-5 w-5" />
              Chat with Alex
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default DigitalAgriProcess;
