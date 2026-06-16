/**
 * Visitor Profile Hook
 * Manages user personalization, session tracking, and behavioral data
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Session keys
const VISITOR_ID_KEY = "agrismes_visitor_id";
const VISITOR_PROFILE_CACHE_KEY = "agrismes_visitor_profile";
const LAST_VISIT_KEY = "agrismes_last_visit";
const RETURNING_USER_BONUS_KEY = "agrismes_returning_bonus_awarded";

export interface VisitorProfile {
  id?: string;
  visitor_id: string;
  email?: string;
  display_name?: string;
  preferred_language: string;
  first_visit_at: string;
  last_visit_at: string;
  total_visits: number;
  total_session_duration_seconds: number;
  pages_visited: string[];
  commodities_interested: string[];
  services_accessed: string[];
  search_queries: string[];
  messages_sent: number;
  forms_submitted: number;
  documents_uploaded: number;
  moisture_tests_completed: number;
  preferred_commodities: string[];
  preferred_regions: string[];
  user_role?: string;
  business_type?: string;
  is_returning_user: boolean;
  welcome_back_shown: boolean;
  onboarding_completed: boolean;
  last_commodity_viewed?: string;
  last_service_accessed?: string;
  last_chat_topic?: string;
  source_referrer?: string;
  utm_source?: string;
  utm_campaign?: string;
  device_type?: string;
}

export interface PersonalizedGreeting {
  message: string;
  showWelcomeBack: boolean;
  pointsEarned?: number;
  newFeatures?: string[];
  suggestedActions?: string[];
}

// Helper to determine if user is returning (visited more than 24 hours ago)
const isReturningUser = (lastVisit: string | null): boolean => {
  if (!lastVisit) return false;
  const lastVisitDate = new Date(lastVisit);
  const now = new Date();
  const hoursDiff = (now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60);
  return hoursDiff >= 24;
};

// Helper to get device type
const getDeviceType = (): string => {
  if (typeof window === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod/.test(ua)) return "mobile";
  if (/tablet|ipad/.test(ua)) return "tablet";
  return "desktop";
};

// Get UTM parameters from URL
const getUTMParams = (): { utm_source?: string; utm_campaign?: string } => {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || undefined,
    utm_campaign: params.get("utm_campaign") || undefined,
  };
};

export function useVisitorProfile(visitorId: string) {
  const [profile, setProfile] = useState<VisitorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReturning, setIsReturning] = useState(false);
  const [daysSinceLastVisit, setDaysSinceLastVisit] = useState(0);
  const [shouldShowWelcomeBack, setShouldShowWelcomeBack] = useState(false);

  // Load or create visitor profile
  useEffect(() => {
    if (!visitorId) return;

    const loadProfile = async () => {
      setIsLoading(true);

      try {
        // Check cache first
        const cachedProfile = sessionStorage.getItem(VISITOR_PROFILE_CACHE_KEY);
        if (cachedProfile) {
          const parsed = JSON.parse(cachedProfile);
          if (parsed.visitor_id === visitorId) {
            setProfile(parsed);
            setIsReturning(parsed.is_returning_user);
          }
        }

        // Check last visit
        const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
        const returning = isReturningUser(lastVisit);
        setIsReturning(returning);

        if (lastVisit) {
          const days = Math.floor(
            (new Date().getTime() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24)
          );
          setDaysSinceLastVisit(days);
        }

        // Fetch from database
        const { data: existingProfile, error: fetchError } = await supabase
          .from("visitor_profiles")
          .select("*")
          .eq("visitor_id", visitorId)
          .maybeSingle();

        if (fetchError && fetchError.code !== "PGRST116") {
          console.error("[VisitorProfile] Fetch error:", fetchError);
        }

        if (existingProfile) {
          // Update existing profile
          const updatedProfile: VisitorProfile = {
            ...existingProfile,
            total_visits: (existingProfile.total_visits || 0) + 1,
            last_visit_at: new Date().toISOString(),
            is_returning_user: returning,
            device_type: getDeviceType(),
          };

          setProfile(updatedProfile);
          setShouldShowWelcomeBack(returning && !existingProfile.welcome_back_shown);

          // Update in database
          await supabase
            .from("visitor_profiles")
            .update({
              total_visits: updatedProfile.total_visits,
              last_visit_at: updatedProfile.last_visit_at,
              is_returning_user: returning,
              device_type: getDeviceType(),
            })
            .eq("visitor_id", visitorId);

          // Cache
          sessionStorage.setItem(VISITOR_PROFILE_CACHE_KEY, JSON.stringify(updatedProfile));
        } else {
          // Create new profile
          const utmParams = getUTMParams();
          const newProfile: Partial<VisitorProfile> = {
            visitor_id: visitorId,
            preferred_language: "en",
            first_visit_at: new Date().toISOString(),
            last_visit_at: new Date().toISOString(),
            total_visits: 1,
            total_session_duration_seconds: 0,
            pages_visited: [window.location.pathname],
            commodities_interested: [],
            services_accessed: [],
            search_queries: [],
            messages_sent: 0,
            forms_submitted: 0,
            documents_uploaded: 0,
            moisture_tests_completed: 0,
            preferred_commodities: [],
            preferred_regions: [],
            is_returning_user: false,
            welcome_back_shown: false,
            onboarding_completed: false,
            source_referrer: document.referrer || undefined,
            device_type: getDeviceType(),
            ...utmParams,
          };

          const { error: insertError } = await supabase
            .from("visitor_profiles")
            .insert([newProfile as any]);

          if (insertError) {
            console.error("[VisitorProfile] Insert error:", insertError);
          }

          setProfile(newProfile as VisitorProfile);
          sessionStorage.setItem(VISITOR_PROFILE_CACHE_KEY, JSON.stringify(newProfile));
        }

        // Update last visit timestamp
        localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
      } catch (error) {
        console.error("[VisitorProfile] Load error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [visitorId]);

  // Track page visit
  const trackPageVisit = useCallback(
    async (pagePath: string, pageTitle?: string) => {
      if (!visitorId || !profile) return;

      // Add to local profile
      const updatedPages = [...new Set([...(profile.pages_visited || []), pagePath])];
      setProfile((prev) => (prev ? { ...prev, pages_visited: updatedPages } : null));

      // Log page visit
      try {
        await supabase.from("page_visit_logs").insert({
          visitor_id: visitorId,
          page_path: pagePath,
          page_title: pageTitle,
          referrer_path: document.referrer || null,
        });

        // Update profile
        await supabase
          .from("visitor_profiles")
          .update({ pages_visited: updatedPages })
          .eq("visitor_id", visitorId);
      } catch (error) {
        console.debug("[VisitorProfile] Page track error:", error);
      }
    },
    [visitorId, profile]
  );

  // Track commodity interest
  const trackCommodityInterest = useCallback(
    async (commodity: string) => {
      if (!visitorId || !profile) return;

      const normalizedCommodity = commodity.toLowerCase().trim();
      const updatedCommodities = [
        ...new Set([...(profile.commodities_interested || []), normalizedCommodity]),
      ];

      setProfile((prev) =>
        prev ? { ...prev, commodities_interested: updatedCommodities, last_commodity_viewed: normalizedCommodity } : null
      );

      try {
        await supabase
          .from("visitor_profiles")
          .update({
            commodities_interested: updatedCommodities,
            last_commodity_viewed: normalizedCommodity,
          })
          .eq("visitor_id", visitorId);
      } catch (error) {
        console.debug("[VisitorProfile] Commodity track error:", error);
      }
    },
    [visitorId, profile]
  );

  // Track service access
  const trackServiceAccess = useCallback(
    async (service: string) => {
      if (!visitorId || !profile) return;

      const updatedServices = [...new Set([...(profile.services_accessed || []), service])];

      setProfile((prev) =>
        prev ? { ...prev, services_accessed: updatedServices, last_service_accessed: service } : null
      );

      try {
        await supabase
          .from("visitor_profiles")
          .update({
            services_accessed: updatedServices,
            last_service_accessed: service,
          })
          .eq("visitor_id", visitorId);
      } catch (error) {
        console.debug("[VisitorProfile] Service track error:", error);
      }
    },
    [visitorId, profile]
  );

  // Update preferred language
  const updateLanguage = useCallback(
    async (language: string) => {
      if (!visitorId) return;

      setProfile((prev) => (prev ? { ...prev, preferred_language: language } : null));

      try {
        await supabase
          .from("visitor_profiles")
          .update({ preferred_language: language })
          .eq("visitor_id", visitorId);
      } catch (error) {
        console.debug("[VisitorProfile] Language update error:", error);
      }
    },
    [visitorId]
  );

  // Update user role
  const updateUserRole = useCallback(
    async (role: string) => {
      if (!visitorId) return;

      setProfile((prev) => (prev ? { ...prev, user_role: role } : null));

      try {
        await supabase
          .from("visitor_profiles")
          .update({ user_role: role })
          .eq("visitor_id", visitorId);
      } catch (error) {
        console.debug("[VisitorProfile] Role update error:", error);
      }
    },
    [visitorId]
  );

  // Mark welcome back as shown
  const markWelcomeBackShown = useCallback(async () => {
    if (!visitorId) return;

    setShouldShowWelcomeBack(false);
    setProfile((prev) => (prev ? { ...prev, welcome_back_shown: true } : null));

    try {
      await supabase
        .from("visitor_profiles")
        .update({ welcome_back_shown: true })
        .eq("visitor_id", visitorId);
    } catch (error) {
      console.debug("[VisitorProfile] Welcome back update error:", error);
    }
  }, [visitorId]);

  // Generate personalized greeting
  const getPersonalizedGreeting = useCallback(
    (displayName?: string, currentPoints?: number): PersonalizedGreeting => {
      const name = displayName || profile?.display_name;
      const commodities = profile?.commodities_interested || [];
      const lastCommodity = profile?.last_commodity_viewed;

      if (isReturning && shouldShowWelcomeBack) {
        // Returning user greeting
        const greetings: string[] = [];
        
        if (name) {
          greetings.push(`Welcome back, ${name}! 👋`);
        } else {
          greetings.push("Welcome back! 👋");
        }

        if (daysSinceLastVisit > 0 && currentPoints && currentPoints > 0) {
          greetings.push(`You've earned ${currentPoints} points since your last visit.`);
        }

        const suggestedActions: string[] = [];
        if (lastCommodity) {
          suggestedActions.push(`Check latest ${lastCommodity} market updates`);
        }
        if (commodities.length > 0) {
          suggestedActions.push("Review your saved interests");
        }

        return {
          message: greetings.join(" "),
          showWelcomeBack: true,
          pointsEarned: currentPoints,
          suggestedActions,
        };
      }

      // First-time visitor
      return {
        message: name
          ? `Hello ${name}! Welcome to AgriSMES. I can help guide you through our trade readiness services.`
          : "Welcome to AgriSMES! I can help guide you through our trade readiness services.",
        showWelcomeBack: false,
      };
    },
    [profile, isReturning, shouldShowWelcomeBack, daysSinceLastVisit]
  );

  // Get content recommendations based on behavior
  const getRecommendations = useCallback(() => {
    if (!profile) return [];

    const recommendations: Array<{
      type: string;
      title: string;
      description: string;
      url?: string;
      priority: number;
    }> = [];

    const commodities = profile.commodities_interested || [];
    const services = profile.services_accessed || [];

    // Commodity-based recommendations
    if (commodities.includes("cashew") && !services.includes("moisture_test")) {
      recommendations.push({
        type: "service",
        title: "Cashew Moisture Analysis",
        description: "Test your cashew kernels for export-grade moisture content",
        url: "/",
        priority: 1,
      });
    }

    if (commodities.includes("coffee") && !services.includes("market_report")) {
      recommendations.push({
        type: "article",
        title: "Coffee Market Trends",
        description: "Latest global coffee price movements and demand signals",
        url: "/commodities/coffee",
        priority: 2,
      });
    }

    // Journey-based recommendations
    if (profile.messages_sent >= 5 && profile.forms_submitted === 0) {
      recommendations.push({
        type: "action",
        title: "Submit Your Inquiry",
        description: "Ready to take the next step? Submit your details for personalized guidance.",
        priority: 1,
      });
    }

    if (profile.moisture_tests_completed > 0 && !services.includes("listing")) {
      recommendations.push({
        type: "service",
        title: "List Your Commodity",
        description: "Your products are tested. Consider listing them for potential buyers.",
        url: "/unlock-services",
        priority: 1,
      });
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
  }, [profile]);

  // Check if returning user bonus should be awarded
  const shouldAwardReturningBonus = useCallback((): boolean => {
    if (!isReturning) return false;
    const bonusAwarded = localStorage.getItem(RETURNING_USER_BONUS_KEY);
    if (bonusAwarded) {
      const lastAwarded = new Date(bonusAwarded);
      const now = new Date();
      const daysDiff = (now.getTime() - lastAwarded.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff >= 1; // Award once per day max
    }
    return true;
  }, [isReturning]);

  // Mark returning bonus as awarded
  const markReturningBonusAwarded = useCallback(() => {
    localStorage.setItem(RETURNING_USER_BONUS_KEY, new Date().toISOString());
  }, []);

  return {
    profile,
    isLoading,
    isReturning,
    daysSinceLastVisit,
    shouldShowWelcomeBack,
    trackPageVisit,
    trackCommodityInterest,
    trackServiceAccess,
    updateLanguage,
    updateUserRole,
    markWelcomeBackShown,
    getPersonalizedGreeting,
    getRecommendations,
    shouldAwardReturningBonus,
    markReturningBonusAwarded,
  };
}
