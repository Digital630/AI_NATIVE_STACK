import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2 } from "lucide-react";

const BuyersImportersSection = () => {
  return (
    <section id="buyers-importers" className="py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-card border border-border rounded-lg p-8 md:p-10 shadow-sm text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4">
            Importer Sourcing
          </h2>
          <p className="text-muted-foreground text-sm md:text-base mb-8 max-w-lg mx-auto">
            Import requirements vary by commodity, volume, and destination market. Start a structured sourcing dialogue with Alex.
          </p>
          <Button asChild className="px-6">
            <Link to="/buyers-importers">
              Start Sourcing Dialogue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BuyersImportersSection;
