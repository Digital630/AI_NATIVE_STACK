/**
 * TradeTermTooltip Component
 * Enhanced epistemic tooltips for trade terminology
 * Provides clarity on commonly misused concepts
 */

import { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";

// Extended trade terms with epistemic clarity
export const TRADE_TERMS: Record<string, {
  definition: string;
  clarification?: string;
  commonMisconception?: string;
  example?: string;
  icon?: "info" | "warning" | "check";
}> = {
  // Shipping & Incoterms
  "fob": {
    definition: "Free On Board - Seller delivers goods loaded onto the ship. Risk transfers to buyer once on board.",
    clarification: "Seller pays: inland transport, export customs, loading. Buyer pays: sea freight, insurance, import duties.",
    example: "FOB Dar es Salaam: Seller covers all costs until goods are on the ship in Dar es Salaam port.",
    icon: "info"
  },
  "cif": {
    definition: "Cost, Insurance & Freight - Seller pays for shipping and insurance to destination port.",
    clarification: "Seller covers more costs but buyer still bears risk once goods are on the ship.",
    commonMisconception: "Many assume CIF means seller bears all risk until delivery. Actually, risk transfers at loading.",
    example: "CIF Rotterdam: Seller pays shipping to Rotterdam, but if cargo is damaged at sea, buyer claims insurance.",
    icon: "warning"
  },
  "exw": {
    definition: "Ex Works - Buyer collects goods from seller's premises and handles all transport.",
    clarification: "Minimum seller obligation. Buyer bears all costs and risks from seller's door.",
    example: "EXW Moshi: Buyer arranges pickup from warehouse in Moshi and all subsequent logistics.",
    icon: "info"
  },
  "cfr": {
    definition: "Cost & Freight - Seller pays shipping to destination port, but buyer pays insurance.",
    clarification: "Similar to CIF but without seller-arranged insurance. Risk still transfers at loading.",
    icon: "info"
  },
  
  // MOQ & Volume
  "moq": {
    definition: "Minimum Order Quantity - The smallest amount a buyer will accept in a single order.",
    clarification: "MOQs exist for practical reasons: shipping economics, processing efficiency, and quality consistency.",
    commonMisconception: "MOQs aren't meant to exclude small suppliers. They reflect real costs of international trade.",
    example: "20 MT MOQ = one full container. Below this, per-unit shipping costs become prohibitive.",
    icon: "info"
  },
  
  // Quality & Certification
  "organic": {
    definition: "Produced without synthetic pesticides or fertilizers, following certified organic standards.",
    clarification: "True organic certification requires third-party verification (e.g., EU Organic, USDA Organic, or local equivalent).",
    commonMisconception: "'Organic practices' ≠ certified organic. Without certification, premium organic prices cannot be claimed.",
    example: "EU Organic certification requires annual inspections, documentation, and a 3-year transition period.",
    icon: "warning"
  },
  "ethical sourcing": {
    definition: "Procurement practices that consider social, environmental, and economic impacts on producer communities.",
    clarification: "True ethical sourcing involves audited supply chains, fair pricing, and documented labor practices.",
    commonMisconception: "Claiming 'ethical sourcing' without audits or certification may be seen as greenwashing.",
    example: "Rainforest Alliance and Fairtrade certifications provide verified ethical sourcing frameworks.",
    icon: "warning"
  },
  "fair trade": {
    definition: "A trading partnership seeking greater equity through better conditions and rights for producers.",
    clarification: "Fair Trade certification ensures minimum prices, premiums for community development, and labor standards.",
    example: "Fair Trade coffee guarantees $1.40/lb floor price plus $0.20/lb community premium.",
    icon: "check"
  },
  
  // Traceability
  "traceability": {
    definition: "The ability to track a product's journey from origin to destination.",
    clarification: "Full traceability = farm-level identification. Basic tracking = document trail showing major waypoints.",
    commonMisconception: "Having shipping documents doesn't mean full traceability. True traceability identifies specific farms/lots.",
    example: "QR-coded coffee bags linking to GPS coordinates of the farm = full traceability.",
    icon: "info"
  },
  "chain of custody": {
    definition: "Documentation proving product handling at each stage from producer to buyer.",
    clarification: "Essential for certified products (organic, fair trade) to prevent mixing with non-certified goods.",
    icon: "info"
  },
  
  // Payment Terms
  "letter of credit": {
    definition: "Bank-guaranteed payment that ensures seller gets paid when contract conditions are met.",
    clarification: "LC protects both parties: seller gets bank guarantee, buyer ensures delivery before payment releases.",
    example: "Irrevocable LC at sight = immediate payment when correct shipping documents are presented.",
    icon: "check"
  },
  "cad": {
    definition: "Cash Against Documents - Buyer pays when shipping documents are presented through banks.",
    clarification: "Less protection than LC. Buyer pays on document presentation, not on inspection of goods.",
    icon: "info"
  },
  "advance payment": {
    definition: "Payment made before goods are shipped, reducing seller risk.",
    clarification: "Common split: 30% advance (for harvest/processing), 70% on shipment or LC.",
    icon: "info"
  },
  
  // Quantities
  "mt": {
    definition: "Metric Ton = 1,000 kilograms. Standard unit for bulk commodity trade.",
    example: "1 x 20ft container holds approximately 18-21 MT of bagged coffee.",
    icon: "info"
  },
  "fcl": {
    definition: "Full Container Load - Exclusive use of a shipping container for your cargo.",
    clarification: "More cost-effective per MT for larger shipments. Minimum practical volume for most commodities.",
    example: "FCL 20ft = ~18-21 MT coffee; FCL 40ft = ~22-25 MT coffee.",
    icon: "info"
  },
  "lcl": {
    definition: "Less than Container Load - Your cargo shares container space with other shippers.",
    clarification: "Higher per-MT cost but enables smaller shipments. Good for samples or trial orders.",
    example: "LCL makes sense for shipments under 10-12 MT where FCL economics don't work.",
    icon: "info"
  }
};

interface TradeTermTooltipProps {
  term: keyof typeof TRADE_TERMS | string;
  children?: ReactNode;
  showIcon?: boolean;
  className?: string;
  uppercase?: boolean;
}

export function TradeTermTooltip({
  term,
  children,
  showIcon = true,
  className = "",
  uppercase = false
}: TradeTermTooltipProps) {
  const normalizedTerm = term.toLowerCase();
  const entry = TRADE_TERMS[normalizedTerm];

  if (!entry) {
    return <span className={className}>{children || term}</span>;
  }

  const IconComponent = {
    info: Info,
    warning: AlertTriangle,
    check: CheckCircle,
  }[entry.icon || "info"];

  const iconColor = {
    info: "text-primary",
    warning: "text-amber-500",
    check: "text-green-500",
  }[entry.icon || "info"];

  const displayTerm = uppercase ? (children || term.toUpperCase()) : (children || term);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center gap-1 cursor-help border-b border-dashed border-primary/40 hover:border-primary transition-colors ${className}`}
          >
            {displayTerm}
            {showIcon && (
              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-sm p-4 bg-card border shadow-lg z-50"
          sideOffset={5}
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <IconComponent className={`h-4 w-4 ${iconColor}`} />
              <p className="font-semibold text-sm uppercase text-foreground">
                {term}
              </p>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {entry.definition}
            </p>
            {entry.clarification && (
              <p className="text-xs text-muted-foreground border-l-2 border-primary/30 pl-2">
                {entry.clarification}
              </p>
            )}
            {entry.commonMisconception && (
              <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-xs">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-amber-700 dark:text-amber-300">
                  {entry.commonMisconception}
                </span>
              </div>
            )}
            {entry.example && (
              <p className="text-xs text-primary/80 italic">
                Example: {entry.example}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
