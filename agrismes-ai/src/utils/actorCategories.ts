// Actor/Category definitions for listing submission
export const ACTOR_CATEGORIES = {
  seller: {
    label: "Seller / Exporter / Processor",
    description: "Selling or exporting agricultural commodities",
    listingType: "sell",
  },
  buyer: {
    label: "Buyer / Importer",
    description: "Purchasing or importing agricultural commodities",
    listingType: "buy",
  },
  agent: {
    label: "Agent / Broker",
    description: "Trade facilitation and brokerage services",
    listingType: "service_agent",
  },
  logistics: {
    label: "Logistics / Freight Forwarder",
    description: "Shipping and freight forwarding services",
    listingType: "service_logistics",
  },
  warehouse: {
    label: "Warehouse / Storage",
    description: "Storage and warehousing facilities",
    listingType: "service_warehouse",
  },
  quality_control: {
    label: "Quality Control / Inspection",
    description: "Quality inspection and certification services",
    listingType: "service_qc",
  },
  finance: {
    label: "Finance / Trade Finance",
    description: "Trade financing and banking services",
    listingType: "service_finance",
  },
  certification: {
    label: "Certification / Compliance",
    description: "Certification and compliance services",
    listingType: "service_certification",
  },
  other_service: {
    label: "Other Service Provider",
    description: "Other trade-related services",
    listingType: "service_other",
  },
} as const;

export type ActorCategory = keyof typeof ACTOR_CATEGORIES;

// Check if category is a commodity trader (buyer/seller)
export function isCommodityTrader(category: ActorCategory | string | null | undefined): boolean {
  if (!category) return true; // Default to commodity trader
  return category === "seller" || category === "buyer";
}

// Get the listing type for a category
export function getListingTypeForCategory(category: ActorCategory | string | null | undefined): string {
  if (!category) return "sell";
  const cat = ACTOR_CATEGORIES[category as ActorCategory];
  return cat?.listingType || "sell";
}

// Get category label for display
export function getCategoryLabel(category: ActorCategory | string | null | undefined): string {
  if (!category) return "Seller / Exporter / Processor";
  const cat = ACTOR_CATEGORIES[category as ActorCategory];
  return cat?.label || category;
}
