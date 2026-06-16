// User type definitions and labels
export const USER_TYPES = {
  buyer: {
    label: "Buyer / Importer",
    description: "Looking to purchase agricultural commodities"
  },
  seller: {
    label: "Seller / Exporter",
    description: "Looking to sell or export agricultural commodities"
  },
  clearance_agent: {
    label: "Clearance Agent",
    description: "Customs clearance and documentation services"
  },
  freight_forwarder: {
    label: "Freight Forwarder",
    description: "Logistics and shipping coordination services"
  },
  stuffing_agent: {
    label: "Stuffing Agent",
    description: "Container loading and stuffing services"
  },
  insurance_company: {
    label: "Insurance Company",
    description: "Cargo and trade insurance services"
  },
  inspection_company: {
    label: "Inspection Company",
    description: "Quality inspection and certification services"
  },
  transportation_company: {
    label: "Transportation Company",
    description: "Local and regional transportation services"
  },
  other: {
    label: "Other",
    description: "Other trade-related services"
  }
} as const;

export type UserType = keyof typeof USER_TYPES;

// Get user type label for display
export function getUserTypeLabel(type: string | null | undefined): string {
  if (!type) return "User";
  const userType = USER_TYPES[type as UserType];
  return userType ? userType.label : type;
}

// Check if user type is a service provider (not buyer/seller)
export function isServiceProvider(type: string | null | undefined): boolean {
  if (!type) return false;
  return !["buyer", "seller"].includes(type);
}

// Get relevant listing options based on user type
export function getListingOptionsForUserType(type: string | null | undefined): {
  canBuy: boolean;
  canSell: boolean;
  canOfferServices: boolean;
} {
  if (!type) {
    return { canBuy: true, canSell: true, canOfferServices: false };
  }

  switch (type) {
    case "buyer":
      return { canBuy: true, canSell: false, canOfferServices: false };
    case "seller":
      return { canBuy: false, canSell: true, canOfferServices: false };
    case "clearance_agent":
    case "freight_forwarder":
    case "stuffing_agent":
    case "insurance_company":
    case "inspection_company":
    case "transportation_company":
      return { canBuy: false, canSell: false, canOfferServices: true };
    default:
      return { canBuy: true, canSell: true, canOfferServices: true };
  }
}
