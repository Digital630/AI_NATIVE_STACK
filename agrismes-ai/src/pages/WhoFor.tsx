import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, UserPlus, Building2, Landmark } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const pathways = [
  {
    icon: Users,
    title: "Exporters",
    description: "For existing exporters seeking structured buyer engagement.",
    linkTo: "/readiness-check",
    linkLabel: "Exporter Readiness Check",
  },
  {
    icon: UserPlus,
    title: "Pathway to Agribusiness",
    description: "For individuals interested in entering structured agricultural trade.",
    linkTo: "/starting-as-supplier-agent",
    linkLabel: "Pathway to Agribusiness",
  },
  {
    icon: Building2,
    title: "Importers",
    description: "For importers seeking structured sourcing discussions.",
    linkTo: "/buyers-importers",
    linkLabel: "Importer Sourcing",
  },
  {
    icon: Landmark,
    title: "Banks / Institutions",
    description: "For institutions evaluating SME readiness and engagement frameworks.",
    linkTo: "/the-gap",
    linkLabel: "Insights / Market Context",
  },
];

const WhoFor = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-12">
              <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
                Who AgriSMES Is For
              </h1>
              <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
                Select the pathway that best describes your interest. Each leads to relevant information and next steps.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {pathways.map((pathway) => {
                const IconComponent = pathway.icon;
                return (
                  <div
                    key={pathway.title}
                    className="bg-card border border-border rounded-lg p-6 shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h2 className="text-lg font-medium text-foreground mb-2">
                          {pathway.title}
                        </h2>
                        <p className="text-sm text-muted-foreground mb-4">
                          {pathway.description}
                        </p>
                        <Button asChild variant="outline" size="sm">
                          <Link to={pathway.linkTo}>
                            {pathway.linkLabel}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default WhoFor;
