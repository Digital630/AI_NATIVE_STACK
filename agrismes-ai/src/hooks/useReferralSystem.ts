import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  generateReferralUTMLink, 
  trackReferralArrival, 
  trackReferralConversion 
} from "@/utils/googleAnalytics";

interface ReferralData {
  referralCode: string;
  referralLink: string;
  referralsCount: number;
  pendingReferrals: number;
  convertedReferrals: number;
  pointsEarned: number;
}

const REFERRAL_POINTS = 250; // Points awarded per successful referral

export function useReferralSystem() {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get or create visitor ID
  const getVisitorId = useCallback(() => {
    let visitorId = localStorage.getItem("agrismes_visitor_id");
    if (!visitorId) {
      visitorId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem("agrismes_visitor_id", visitorId);
    }
    return visitorId;
  }, []);

  // Generate unique referral code
  const generateReferralCode = useCallback(() => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "AG-";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }, []);

  // Create or fetch referral code for current visitor
  const initializeReferralCode = useCallback(async () => {
    const visitorId = getVisitorId();
    setIsLoading(true);

    try {
      // Check if user already has a referral code
      const { data: existing } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_visitor_id", visitorId)
        .limit(1);

      let referralCode: string;

      if (existing && existing.length > 0) {
        referralCode = existing[0].referral_code;
      } else {
        // Generate new referral code
        referralCode = generateReferralCode();
        
        // Insert new referral record
        await supabase.from("referrals").insert({
          referrer_visitor_id: visitorId,
          referral_code: referralCode,
          status: "active",
          source: "chat",
        });
      }

      // Fetch referral statistics
      const { data: stats } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_visitor_id", visitorId);

      const pendingReferrals = stats?.filter((r) => r.status === "pending").length || 0;
      const convertedReferrals = stats?.filter((r) => r.status === "converted").length || 0;
      const pointsEarned = convertedReferrals * REFERRAL_POINTS;

      // Generate UTM-tracked referral link
      const referralLink = generateReferralUTMLink(referralCode);

      setReferralData({
        referralCode,
        referralLink,
        referralsCount: stats?.length || 0,
        pendingReferrals,
        convertedReferrals,
        pointsEarned,
      });
    } catch (error) {
      console.error("Error initializing referral:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getVisitorId, generateReferralCode]);

  // Track when someone uses a referral link
  const trackReferral = useCallback(async (referralCode: string) => {
    const visitorId = getVisitorId();

    // Track arrival in Google Analytics
    trackReferralArrival(referralCode);

    try {
      // Check if this visitor was already referred
      const { data: existingReferred } = await supabase
        .from("referrals")
        .select("*")
        .eq("referred_visitor_id", visitorId)
        .limit(1);

      if (existingReferred && existingReferred.length > 0) {
        return { success: false, message: "Already referred" };
      }

      // Find the referral record
      const { data: referralRecord } = await supabase
        .from("referrals")
        .select("*")
        .eq("referral_code", referralCode)
        .limit(1);

      if (!referralRecord || referralRecord.length === 0) {
        return { success: false, message: "Invalid referral code" };
      }

      // Don't allow self-referral
      if (referralRecord[0].referrer_visitor_id === visitorId) {
        return { success: false, message: "Cannot refer yourself" };
      }

      // Create pending referral entry for the referred user
      await supabase.from("referrals").insert({
        referrer_visitor_id: referralRecord[0].referrer_visitor_id,
        referred_visitor_id: visitorId,
        referral_code: `${referralCode}-${Date.now()}`,
        status: "pending",
        source: "referral_link",
      });

      // Store in session for later conversion
      sessionStorage.setItem("agrismes_referral_code", referralCode);

      return { success: true, message: "Referral tracked" };
    } catch (error) {
      console.error("Error tracking referral:", error);
      return { success: false, message: "Error tracking referral" };
    }
  }, [getVisitorId]);

  // Convert a referral (called when referred user takes meaningful action)
  const convertReferral = useCallback(async () => {
    const referralCode = sessionStorage.getItem("agrismes_referral_code");
    const visitorId = getVisitorId();

    if (!referralCode) return { success: false, message: "No referral to convert" };

    try {
      // Find pending referral for this visitor
      const { data: pending } = await supabase
        .from("referrals")
        .select("*")
        .eq("referred_visitor_id", visitorId)
        .eq("status", "pending")
        .limit(1);

      if (!pending || pending.length === 0) {
        return { success: false, message: "No pending referral found" };
      }

      // Update to converted
      await supabase
        .from("referrals")
        .update({
          status: "converted",
          converted_at: new Date().toISOString(),
          points_awarded: REFERRAL_POINTS,
        })
        .eq("id", pending[0].id);

      // Award points to referrer
      const referrerId = pending[0].referrer_visitor_id;
      await supabase.from("reward_points_history").insert({
        visitor_id: referrerId,
        action_type: "referral_bonus",
        points_awarded: REFERRAL_POINTS,
        description: `Referral converted from visitor`,
      });

      // Update referrer's total points
      const { data: referrerPoints } = await supabase
        .from("reward_points")
        .select("*")
        .eq("visitor_id", referrerId)
        .limit(1);

      if (referrerPoints && referrerPoints.length > 0) {
        await supabase
          .from("reward_points")
          .update({
            total_points: referrerPoints[0].total_points + REFERRAL_POINTS,
          })
          .eq("id", referrerPoints[0].id);
      }

      // Clear session referral
      sessionStorage.removeItem("agrismes_referral_code");

      return { success: true, message: "Referral converted", points: REFERRAL_POINTS };
    } catch (error) {
      console.error("Error converting referral:", error);
      return { success: false, message: "Error converting referral" };
    }
  }, [getVisitorId]);

  // Check for referral code in URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get("ref");
    
    if (refCode) {
      trackReferral(refCode).then((result) => {
        if (result.success) {
          // Remove ref param from URL without reload
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      });
    }
  }, [trackReferral]);

  // Get referral message for Alex to use
  const getReferralMessage = useCallback(() => {
    if (!referralData) return null;

    return {
      intro: `You can share AgriSMES with your network and earn RewardFlow points!`,
      code: referralData.referralCode,
      link: referralData.referralLink,
      reward: `${REFERRAL_POINTS} points for each person who engages through your link`,
      stats: {
        total: referralData.referralsCount,
        pending: referralData.pendingReferrals,
        converted: referralData.convertedReferrals,
        earned: referralData.pointsEarned,
      },
    };
  }, [referralData]);

  return {
    referralData,
    isLoading,
    initializeReferralCode,
    trackReferral,
    convertReferral,
    getReferralMessage,
    REFERRAL_POINTS,
  };
}
