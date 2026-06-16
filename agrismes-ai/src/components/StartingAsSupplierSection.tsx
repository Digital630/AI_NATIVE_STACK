import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const StartingAsSupplierSection = () => {
  return (
    <section id="starting-as-supplier" className="py-16 md:py-20 bg-muted/30">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-card border border-border rounded-lg p-8 md:p-10 shadow-sm text-center">
          <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4">
            Pathway to Agribusiness
          </h2>
          <p className="text-muted-foreground text-sm md:text-base mb-8 max-w-lg mx-auto">
            New to structured trade? This pathway is a calm, guided starting point—powered through live dialogue with Alex.
          </p>
          <Button asChild className="px-6">
            <Link to="/starting-as-supplier-agent">
              Explore the Pathway
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default StartingAsSupplierSection;
