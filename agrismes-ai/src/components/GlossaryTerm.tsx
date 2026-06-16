/**
 * GlossaryTerm Component
 * Provides hover/click definitions for agricultural terms
 * Part of Epistemic Clarity initiative
 */

import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

// Agricultural terms glossary - simple, accessible definitions
export const GLOSSARY: Record<string, { definition: string; example?: string }> = {
  // Quality & Grading
  "moisture content": {
    definition: "The amount of water in your crop, measured as a percentage. Lower moisture means longer storage life.",
    example: "Coffee beans should be 10-12% moisture for export."
  },
  "grade": {
    definition: "A quality rating that tells buyers what to expect. Higher grades often mean better prices.",
    example: "AA grade coffee has larger, more uniform beans."
  },
  "defect count": {
    definition: "The number of damaged or irregular items in a sample. Fewer defects = higher quality.",
    example: "Export coffee should have less than 5 defects per 300g sample."
  },
  "screen size": {
    definition: "The size category of beans or nuts, measured by the holes they pass through.",
    example: "Screen 18 coffee beans are larger and often premium-priced."
  },
  
  // Trade Terms
  "fob": {
    definition: "Free On Board - The seller covers costs until goods are loaded on the ship. Buyer pays shipping.",
    example: "FOB Mombasa means the price includes delivery to Mombasa port."
  },
  "cif": {
    definition: "Cost, Insurance, Freight - The seller pays for shipping and insurance to the destination.",
    example: "CIF Rotterdam includes all costs to deliver to Rotterdam."
  },
  "incoterms": {
    definition: "International trade rules that define who pays for shipping, insurance, and when ownership transfers.",
    example: "Common Incoterms include FOB, CIF, and EXW."
  },
  "exw": {
    definition: "Ex Works - Buyer collects goods from seller's location and pays all transport costs.",
    example: "EXW Arusha means you pick up from the warehouse in Arusha."
  },
  
  // Processing
  "rcn": {
    definition: "Raw Cashew Nuts - Unprocessed cashews still in their shells, as harvested.",
    example: "Tanzania exports over 200,000 MT of RCN annually."
  },
  "wfk": {
    definition: "White Fancies and Kernels - Processed, shelled cashew nuts ready for consumption.",
    example: "WFK W320 refers to white whole kernels with 320 nuts per pound."
  },
  "wet processing": {
    definition: "A method using water to remove fruit from coffee beans. Often produces cleaner, brighter flavors.",
    example: "Washed Ethiopian coffee is known for its bright, fruity taste."
  },
  "dry processing": {
    definition: "Drying coffee cherries in the sun before removing the fruit. Creates fuller, sweeter flavors.",
    example: "Natural processed coffee has a heavy, sweet body."
  },
  
  // Quantities & Logistics
  "mt": {
    definition: "Metric Ton - Equal to 1,000 kilograms. Standard unit for large commodity trades.",
    example: "A 20ft container holds about 18-20 MT of coffee."
  },
  "fcl": {
    definition: "Full Container Load - You rent an entire shipping container for your goods.",
    example: "FCL is cost-effective when shipping more than 15 MT."
  },
  "lcl": {
    definition: "Less than Container Load - Your goods share container space with other shippers.",
    example: "LCL works well for smaller shipments under 10 MT."
  },
  
  // Quality Standards
  "phytosanitary": {
    definition: "Health certificate confirming crops are free from pests and diseases.",
    example: "Phytosanitary certificates are required for all agricultural exports."
  },
  "fumigation": {
    definition: "Treatment to kill pests before export. Required by most importing countries.",
    example: "Cashews must be fumigated before shipment to the EU."
  },
  "traceability": {
    definition: "The ability to track a product from farm to buyer. Increasingly required by premium markets.",
    example: "Specialty coffee buyers want to know which farm grew their beans."
  },
  
  // Financial
  "lc": {
    definition: "Letter of Credit - A bank guarantee that ensures the seller gets paid when conditions are met.",
    example: "An LC protects both buyer and seller in international trade."
  },
  "advance payment": {
    definition: "Payment made before goods are delivered. Reduces risk for the seller.",
    example: "Some buyers offer 30% advance to help with harvest costs."
  },
  "cad": {
    definition: "Cash Against Documents - Payment is made when shipping documents are presented.",
    example: "CAD is common for established trading relationships."
  },
  
  // Market
  "spot price": {
    definition: "The current market price for immediate delivery of a commodity.",
    example: "Today's spot price for Robusta coffee is $4,200/MT."
  },
  "futures": {
    definition: "Contracts to buy or sell commodities at a fixed price on a future date.",
    example: "Coffee futures help predict prices 3-6 months ahead."
  },
  "premium": {
    definition: "Extra amount paid above the base market price for higher quality or special characteristics.",
    example: "Fair Trade coffee commands a $0.20/lb premium."
  },
  "differential": {
    definition: "The price difference between your product and a benchmark price.",
    example: "Tanzania Arabica trades at +$0.10 differential to ICE NY."
  }
};

interface GlossaryTermProps {
  term: string;
  children?: React.ReactNode;
  showIcon?: boolean;
  className?: string;
}

export function GlossaryTerm({ 
  term, 
  children, 
  showIcon = true,
  className = "" 
}: GlossaryTermProps) {
  const [open, setOpen] = useState(false);
  const normalizedTerm = term.toLowerCase();
  const entry = GLOSSARY[normalizedTerm];

  if (!entry) {
    // If term not in glossary, just render children or term
    return <span className={className}>{children || term}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <span 
            className={`inline-flex items-center gap-1 cursor-help border-b border-dashed border-primary/40 hover:border-primary transition-colors ${className}`}
            onClick={() => setOpen(!open)}
          >
            {children || term}
            {showIcon && (
              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs p-3 bg-card border shadow-lg z-50"
          sideOffset={5}
        >
          <div className="space-y-2">
            <p className="font-semibold text-sm capitalize text-foreground">
              {term}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {entry.definition}
            </p>
            {entry.example && (
              <p className="text-xs text-primary/80 italic border-l-2 border-primary/30 pl-2">
                {entry.example}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Utility to auto-wrap glossary terms in text
export function highlightGlossaryTerms(text: string): React.ReactNode {
  const terms = Object.keys(GLOSSARY);
  const regex = new RegExp(`\\b(${terms.join("|")})\\b`, "gi");
  
  const parts = text.split(regex);
  
  return parts.map((part, index) => {
    const isGlossaryTerm = terms.some(t => t.toLowerCase() === part.toLowerCase());
    if (isGlossaryTerm) {
      return <GlossaryTerm key={index} term={part}>{part}</GlossaryTerm>;
    }
    return part;
  });
}
