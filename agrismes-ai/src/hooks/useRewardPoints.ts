/**
 * RewardFlow Points System
 * Tracks user engagement and awards points based on actions
 * Neuro-marketing focused: status, emotion, and engagement - not monetary rewards
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Points configuration - quality over quantity
export const POINTS_CONFIG = {
  // Chat engagement
  chatOpen: 2,
  simpleMessage: 5,
  meaningfulMessage: 15, // Business-related questions
  imageGenerated: 20,
  imageAnalyzed: 25, // Product image analysis
  formSubmission: 50,
  detailedInquiry: 30, // Messages > 100 chars with commodity/country context
  // Time-based
  minuteEngaged: 1,
  // Bonuses
  firstMessage: 10,
};

// Level thresholds - Basic, Silver, Gold, Premium, Platinum
export const LEVELS = [
  { 
    name: "none", 
    threshold: 0, 
    color: "bg-muted", 
    textColor: "text-muted-foreground", 
    borderColor: "border-muted",
    gradientFrom: "#6B7280",
    gradientTo: "#9CA3AF",
    message: "" 
  },
  { 
    name: "Basic", 
    threshold: 20, 
    color: "bg-green-100", 
    textColor: "text-green-700", 
    borderColor: "border-green-300",
    gradientFrom: "#22C55E",
    gradientTo: "#4ADE80",
    message: "Basic Status Unlocked. You've started engaging with purpose."
  },
  { 
    name: "Silver", 
    threshold: 50, 
    color: "bg-slate-200", 
    textColor: "text-slate-700", 
    borderColor: "border-slate-400",
    gradientFrom: "#94A3B8",
    gradientTo: "#CBD5E1",
    message: "Silver Status Reached. Your questions are becoming clearer and more focused."
  },
  { 
    name: "Gold", 
    threshold: 100, 
    color: "bg-amber-100", 
    textColor: "text-amber-700", 
    borderColor: "border-amber-400",
    gradientFrom: "#FBBF24",
    gradientTo: "#FDE68A",
    message: "Gold Status Unlocked. This reflects real market understanding and focus."
  },
  { 
    name: "Premium", 
    threshold: 200, 
    color: "bg-emerald-100", 
    textColor: "text-emerald-700", 
    borderColor: "border-emerald-400",
    gradientFrom: "#10B981",
    gradientTo: "#34D399",
    message: "Premium Status Unlocked. Your discipline is paying off. You're operating with purpose."
  },
  { 
    name: "Platinum", 
    threshold: 500, 
    color: "bg-slate-100", 
    textColor: "text-slate-800", 
    borderColor: "border-slate-500",
    gradientFrom: "#E2E8F0",
    gradientTo: "#F8FAFC",
    message: "Platinum Status Unlocked. Exceptional consistency. You're operating at an elite level."
  },
] as const;

export type LevelName = typeof LEVELS[number]["name"];

// Celebration levels (Gold, Premium, Platinum trigger fireworks)
export const CELEBRATION_LEVELS: LevelName[] = ["Gold", "Premium", "Platinum"];

export interface RewardPointsState {
  totalPoints: number;
  currentLevel: LevelName;
  messagesSent: number;
  formsSubmitted: number;
  imagesGenerated: number;
  isLoaded: boolean;
  lastLevelUp: LevelName | null;
  celebratedLevels: Record<string, boolean>; // Track which levels have been celebrated
}

// Session keys
const REWARD_CACHE_KEY = "agrismes_reward_cache";
const LAST_REMINDER_KEY = "agrismes_last_reward_reminder";
const CELEBRATED_LEVELS_KEY = "agrismes_celebrated_levels";

export function useRewardPoints(visitorId: string) {
  const [state, setState] = useState<RewardPointsState>({
    totalPoints: 0,
    currentLevel: "none",
    messagesSent: 0,
    formsSubmitted: 0,
    imagesGenerated: 0,
    isLoaded: false,
    lastLevelUp: null,
    celebratedLevels: {},
  });

  const [sessionId, setSessionId] = useState<string>("");

  // Get level from points
  const getLevel = useCallback((points: number): LevelName => {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (points >= LEVELS[i].threshold) {
        return LEVELS[i].name;
      }
    }
    return "none";
  }, []);

  // Get level info
  const getLevelInfo = useCallback((levelName: LevelName) => {
    return LEVELS.find(l => l.name === levelName) || LEVELS[0];
  }, []);

  // Get next level info
  const getNextLevel = useCallback((currentPoints: number) => {
    for (const level of LEVELS) {
      if (currentPoints < level.threshold) {
        return {
          name: level.name,
          pointsNeeded: level.threshold - currentPoints,
          threshold: level.threshold,
        };
      }
    }
    return null; // Max level reached
  }, []);

  // Check if a level has been celebrated
  const hasLevelBeenCelebrated = useCallback((levelName: LevelName): boolean => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(CELEBRATED_LEVELS_KEY);
        if (stored) {
          const celebrated = JSON.parse(stored);
          return celebrated[levelName] === true;
        }
      } catch {
        // Ignore parse errors
      }
    }
    return state.celebratedLevels[levelName] === true;
  }, [state.celebratedLevels]);

  // Mark a level as celebrated
  const markLevelCelebrated = useCallback((levelName: LevelName) => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(CELEBRATED_LEVELS_KEY);
        const celebrated = stored ? JSON.parse(stored) : {};
        celebrated[levelName] = true;
        celebrated[`${levelName}_timestamp`] = new Date().toISOString();
        localStorage.setItem(CELEBRATED_LEVELS_KEY, JSON.stringify(celebrated));
      } catch {
        // Ignore errors
      }
    }
    setState(prev => ({
      ...prev,
      celebratedLevels: { ...prev.celebratedLevels, [levelName]: true }
    }));
  }, []);

  // Check if celebration should fire for a level
  const shouldCelebrate = useCallback((levelName: LevelName): boolean => {
    return CELEBRATION_LEVELS.includes(levelName) && !hasLevelBeenCelebrated(levelName);
  }, [hasLevelBeenCelebrated]);

  // Load celebrated levels from storage
  const loadCelebratedLevels = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(CELEBRATED_LEVELS_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch {
        // Ignore parse errors
      }
    }
    return {};
  }, []);

  // Initialize session ID
  useEffect(() => {
    if (typeof window !== "undefined") {
      const id = sessionStorage.getItem("agrismes_chat_session_id") || "";
      setSessionId(id);
      
      // Load celebrated levels
      const celebrated = loadCelebratedLevels();
      setState(prev => ({ ...prev, celebratedLevels: celebrated }));
    }
  }, [loadCelebratedLevels]);

  // Load points from database or cache
  useEffect(() => {
    if (!visitorId) return;

    const loadPoints = async () => {
      const celebratedLevels = loadCelebratedLevels();
      
      // Try cache first
      try {
        const cached = sessionStorage.getItem(REWARD_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.visitorId === visitorId) {
            setState({
              totalPoints: parsed.totalPoints || 0,
              currentLevel: getLevel(parsed.totalPoints || 0),
              messagesSent: parsed.messagesSent || 0,
              formsSubmitted: parsed.formsSubmitted || 0,
              imagesGenerated: parsed.imagesGenerated || 0,
              isLoaded: true,
              lastLevelUp: null,
              celebratedLevels,
            });
          }
        }
      } catch (e) {
        console.debug("[RewardPoints] Cache read failed:", e);
      }

      // Fetch from database
      try {
        const { data, error } = await supabase
          .from("reward_points")
          .select("*")
          .eq("visitor_id", visitorId)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.error("[RewardPoints] Fetch error:", error);
          return;
        }

        if (data) {
          const level = getLevel(data.total_points);
          setState({
            totalPoints: data.total_points,
            currentLevel: level,
            messagesSent: data.messages_sent,
            formsSubmitted: data.forms_submitted,
            imagesGenerated: data.images_generated,
            isLoaded: true,
            lastLevelUp: null,
            celebratedLevels,
          });

          // Update cache
          sessionStorage.setItem(REWARD_CACHE_KEY, JSON.stringify({
            visitorId,
            totalPoints: data.total_points,
            messagesSent: data.messages_sent,
            formsSubmitted: data.forms_submitted,
            imagesGenerated: data.images_generated,
          }));
        } else {
          // No record yet, create one
          const { error: insertError } = await supabase
            .from("reward_points")
            .insert({
              visitor_id: visitorId,
              session_id: sessionId || visitorId,
              total_points: 0,
              current_level: "none",
              messages_sent: 0,
              forms_submitted: 0,
              images_generated: 0,
            });

          if (insertError) {
            console.error("[RewardPoints] Insert error:", insertError);
          }

          setState(prev => ({ ...prev, isLoaded: true }));
        }
      } catch (e) {
        console.error("[RewardPoints] Load error:", e);
        setState(prev => ({ ...prev, isLoaded: true }));
      }
    };

    loadPoints();
  }, [visitorId, sessionId, getLevel, loadCelebratedLevels]);

  // Award points and update database
  const awardPoints = useCallback(async (
    action: keyof typeof POINTS_CONFIG,
    multiplier: number = 1,
    description?: string
  ) => {
    if (!visitorId) return;

    const points = POINTS_CONFIG[action] * multiplier;
    const previousLevel = state.currentLevel;

    // Optimistic update
    setState(prev => {
      const newTotal = prev.totalPoints + points;
      const newLevel = getLevel(newTotal);
      const leveledUp = newLevel !== prev.currentLevel && newLevel !== "none";

      return {
        ...prev,
        totalPoints: newTotal,
        currentLevel: newLevel,
        messagesSent: action === "simpleMessage" || action === "meaningfulMessage" || action === "detailedInquiry"
          ? prev.messagesSent + 1
          : prev.messagesSent,
        formsSubmitted: action === "formSubmission" ? prev.formsSubmitted + 1 : prev.formsSubmitted,
        imagesGenerated: action === "imageGenerated" ? prev.imagesGenerated + 1 : prev.imagesGenerated,
        lastLevelUp: leveledUp ? newLevel : null,
      };
    });

    // Update cache immediately
    sessionStorage.setItem(REWARD_CACHE_KEY, JSON.stringify({
      visitorId,
      totalPoints: state.totalPoints + points,
      messagesSent: state.messagesSent + (action.includes("Message") || action === "detailedInquiry" ? 1 : 0),
      formsSubmitted: state.formsSubmitted + (action === "formSubmission" ? 1 : 0),
      imagesGenerated: state.imagesGenerated + (action === "imageGenerated" ? 1 : 0),
    }));

    // Update database
    try {
      const newTotal = state.totalPoints + points;
      const newLevel = getLevel(newTotal);

      // Upsert points
      const { error: upsertError } = await supabase
        .from("reward_points")
        .upsert({
          visitor_id: visitorId,
          session_id: sessionId || visitorId,
          total_points: newTotal,
          current_level: newLevel,
          messages_sent: state.messagesSent + (action.includes("Message") || action === "detailedInquiry" ? 1 : 0),
          forms_submitted: state.formsSubmitted + (action === "formSubmission" ? 1 : 0),
          images_generated: state.imagesGenerated + (action === "imageGenerated" ? 1 : 0),
          last_activity_at: new Date().toISOString(),
        }, { onConflict: "visitor_id" });

      if (upsertError) {
        console.error("[RewardPoints] Upsert error:", upsertError);
      }

      // Log to history
      await supabase
        .from("reward_points_history")
        .insert({
          visitor_id: visitorId,
          action_type: action,
          points_awarded: points,
          description: description || `Earned ${points} points for ${action}`,
        });

    } catch (e) {
      console.error("[RewardPoints] Award error:", e);
    }
  }, [visitorId, sessionId, state, getLevel]);

  // Clear level up notification
  const clearLevelUp = useCallback(() => {
    setState(prev => ({ ...prev, lastLevelUp: null }));
  }, []);

  // Check if should show reminder (every 5 minutes)
  const shouldShowReminder = useCallback(() => {
    try {
      const lastReminder = sessionStorage.getItem(LAST_REMINDER_KEY);
      if (!lastReminder) return true;
      
      const elapsed = Date.now() - parseInt(lastReminder);
      return elapsed > 5 * 60 * 1000; // 5 minutes
    } catch {
      return true;
    }
  }, []);

  // Mark reminder shown
  const markReminderShown = useCallback(() => {
    sessionStorage.setItem(LAST_REMINDER_KEY, Date.now().toString());
  }, []);

  // Calculate message complexity for points
  const getMessagePoints = useCallback((message: string, hasContext: boolean): keyof typeof POINTS_CONFIG => {
    const length = message.trim().length;
    const hasCommodityKeywords = /\b(cashew|cocoa|coffee|sesame|avocado|cardamom|macadamia|pineapple|pigeon|spice|export|import|shipping|trade|buyer|supplier|certificate)\b/i.test(message);
    
    if (length > 100 && (hasCommodityKeywords || hasContext)) {
      return "detailedInquiry";
    }
    if (hasCommodityKeywords || hasContext) {
      return "meaningfulMessage";
    }
    return "simpleMessage";
  }, []);

  return {
    ...state,
    awardPoints,
    clearLevelUp,
    getLevelInfo,
    getNextLevel,
    getMessagePoints,
    shouldShowReminder,
    markReminderShown,
    markLevelCelebrated,
    hasLevelBeenCelebrated,
    shouldCelebrate,
  };
}
