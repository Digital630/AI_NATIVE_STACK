/**
 * Google Analytics 4 utility for AgriSMES
 * Provides typed event tracking and goal measurement
 */

// Extend window interface for gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
    trackAgriSMESEvent: (eventName: string, eventParams?: Record<string, any>) => void;
  }
}

/**
 * Track a custom event to Google Analytics
 */
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
): void => {
  if (typeof window === "undefined") return;
  
  try {
    // Use the global tracking function if available
    if (window.trackAgriSMESEvent) {
      window.trackAgriSMESEvent(eventName, eventParams);
    } else if (window.gtag) {
      window.gtag("event", eventName, eventParams);
    } else {
      console.debug(`[GA] Event: ${eventName}`, eventParams);
    }
  } catch (e) {
    console.debug(`[GA] Failed to track event: ${eventName}`, e);
  }
};

// ============================================
// CHAT ENGAGEMENT EVENTS
// ============================================

export const trackChatOpen = (): void => {
  trackEvent("chat_open", {
    event_category: "engagement",
    event_label: "Alex AI Chat",
  });
};

export const trackChatMessageSent = (messageNumber: number, language: string): void => {
  trackEvent("chat_message_sent", {
    event_category: "engagement",
    event_label: "User Message",
    message_number: messageNumber,
    language,
  });
};

export const trackChatFirstMessage = (language: string): void => {
  trackEvent("chat_first_message", {
    event_category: "engagement",
    event_label: "First User Message",
    language,
  });
};

// ============================================
// REWARDFLOW EVENTS
// ============================================

export const trackRewardFlowClick = (level: string, points: number): void => {
  trackEvent("rewardflow_click", {
    event_category: "rewards",
    event_label: "RewardFlow Icon Click",
    level,
    points,
  });
};

export const trackPointsEarned = (
  action: string,
  points: number,
  totalPoints: number
): void => {
  trackEvent("points_earned", {
    event_category: "rewards",
    event_label: action,
    points_earned: points,
    total_points: totalPoints,
  });
};

// ============================================
// REFERRAL EVENTS
// ============================================

export const trackReferralLinkCopied = (referralCode: string): void => {
  trackEvent("referral_link_copied", {
    event_category: "referral",
    event_label: "Link Copied",
    referral_code: referralCode,
  });
};

export const trackReferralLinkShared = (referralCode: string, method: string): void => {
  trackEvent("referral_link_shared", {
    event_category: "referral",
    event_label: method,
    referral_code: referralCode,
  });
};

export const trackReferralArrival = (referralCode: string): void => {
  trackEvent("referral_arrival", {
    event_category: "referral",
    event_label: "Referred Visit",
    referral_code: referralCode,
  });
};

export const trackReferralConversion = (referralCode: string, pointsAwarded: number): void => {
  trackEvent("referral_conversion", {
    event_category: "referral",
    event_label: "Referral Converted",
    referral_code: referralCode,
    points_awarded: pointsAwarded,
  });
};

// ============================================
// LISTING & FORM EVENTS
// ============================================

export const trackListingSubmitted = (commodityName: string, listingType: string): void => {
  trackEvent("listing_submitted", {
    event_category: "conversion",
    event_label: `${listingType} - ${commodityName}`,
    commodity_name: commodityName,
    listing_type: listingType,
  });
};

export const trackFormSubmitted = (formName: string): void => {
  trackEvent("form_submitted", {
    event_category: "conversion",
    event_label: formName,
  });
};

// ============================================
// SERVICE REDEMPTION EVENTS
// ============================================

export const trackServiceRedeemed = (serviceType: string, pointsSpent: number): void => {
  trackEvent("service_redeemed", {
    event_category: "conversion",
    event_label: serviceType,
    points_spent: pointsSpent,
  });
};

export const trackUnlockServicesClick = (): void => {
  trackEvent("unlock_services_click", {
    event_category: "engagement",
    event_label: "Unlock Exclusive Services Button",
  });
};

// ============================================
// PAGE VIEW EVENTS
// ============================================

export const trackPageView = (pagePath: string, pageTitle: string): void => {
  if (typeof window === "undefined") return;
  
  try {
    if (window.gtag) {
      window.gtag("config", "G-32T8MWC1CV", {
        page_path: pagePath,
        page_title: pageTitle,
      });
    }
  } catch (e) {
    console.debug(`[GA] Failed to track page view: ${pagePath}`, e);
  }
};

// ============================================
// LISTINGS EVENTS (Signal-compressed for AgriSMES)
// ============================================

export const trackListingFormOpen = (): void => {
  trackEvent("listing_form_open", {
    event_category: "engagement",
    event_label: "Submit Listing Form Opened",
  });
};

export const trackListingCategorySelected = (category: string): void => {
  trackEvent("listing_category_selected", {
    event_category: "engagement",
    event_label: category,
    listing_category: category,
  });
};

export const trackExploreListingsClick = (): void => {
  trackEvent("click", {
    event_category: "CTA",
    event_label: "explore_listings",
  });
};

export const trackListingSearch = (query: string, filterType: string): void => {
  trackEvent("listing_search", {
    event_category: "engagement",
    event_label: "Search Listings",
    search_query: query,
    filter_type: filterType,
  });
};

export const trackUrgentListingSubmit = (commodityName: string): void => {
  trackEvent("urgent_listing_submitted", {
    event_category: "conversion",
    event_label: "Urgent Listing",
    commodity_name: commodityName,
  });
};

// ============================================
// UTM LINK GENERATION
// ============================================

/**
 * Generate UTM-tracked URL for referral and marketing purposes
 */
export const generateUTMLink = (
  baseUrl: string,
  params: {
    source: string;
    medium: string;
    campaign: string;
    term?: string;
    content?: string;
    referralCode?: string;
  }
): string => {
  const url = new URL(baseUrl);
  
  url.searchParams.set("utm_source", params.source);
  url.searchParams.set("utm_medium", params.medium);
  url.searchParams.set("utm_campaign", params.campaign);
  
  if (params.term) {
    url.searchParams.set("utm_term", params.term);
  }
  if (params.content) {
    url.searchParams.set("utm_content", params.content);
  }
  if (params.referralCode) {
    url.searchParams.set("ref", params.referralCode);
  }
  
  return url.toString();
};

/**
 * Generate referral link with UTM tracking
 */
export const generateReferralUTMLink = (referralCode: string): string => {
  const baseUrl = window.location.origin || "https://agrismes.com";
  
  return generateUTMLink(baseUrl, {
    source: "referral",
    medium: "share",
    campaign: "rewardflow_referral",
    content: "chat_share",
    referralCode,
  });
};

/**
 * Generate chat-based share link with UTM
 */
export const generateChatShareLink = (
  path: string = "/",
  campaign: string = "alex_chat"
): string => {
  const baseUrl = window.location.origin || "https://agrismes.com";
  const url = new URL(path, baseUrl);
  
  url.searchParams.set("utm_source", "chat");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", campaign);
  
  return url.toString();
};

// ============================================
// PARSE UTM PARAMETERS
// ============================================

export interface UTMParams {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  term: string | null;
  content: string | null;
  referralCode: string | null;
}

/**
 * Parse UTM parameters from current URL
 */
export const parseUTMParams = (): UTMParams => {
  if (typeof window === "undefined") {
    return {
      source: null,
      medium: null,
      campaign: null,
      term: null,
      content: null,
      referralCode: null,
    };
  }
  
  const params = new URLSearchParams(window.location.search);
  
  return {
    source: params.get("utm_source"),
    medium: params.get("utm_medium"),
    campaign: params.get("utm_campaign"),
    term: params.get("utm_term"),
    content: params.get("utm_content"),
    referralCode: params.get("ref"),
  };
};

/**
 * Track UTM arrival if present
 */
export const trackUTMArrival = (): void => {
  const utm = parseUTMParams();
  
  if (utm.source || utm.medium || utm.campaign) {
    trackEvent("utm_arrival", {
      event_category: "acquisition",
      utm_source: utm.source,
      utm_medium: utm.medium,
      utm_campaign: utm.campaign,
      utm_term: utm.term,
      utm_content: utm.content,
      referral_code: utm.referralCode,
    });
  }
};
