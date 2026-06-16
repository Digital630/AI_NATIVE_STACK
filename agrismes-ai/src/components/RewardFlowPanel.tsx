/**
 * RewardFlow Panel Component
 * Neuro-marketing focused display: status, emotion, engagement
 * Supports Gold, Premium, and Platinum celebrations
 */

import { motion, AnimatePresence } from "framer-motion";
import { Gift, ChevronDown, ChevronUp, TrendingUp, Sparkles, Crown, Gem } from "lucide-react";
import { useState, useEffect } from "react";
import { RewardBadge, LevelUpNotification } from "./RewardBadge";
import { LevelCelebration } from "./LevelCelebration";
import { LevelName, LEVELS, CELEBRATION_LEVELS } from "@/hooks/useRewardPoints";

interface RewardFlowPanelProps {
  points: number;
  level: LevelName;
  messagesSent: number;
  nextLevel: { name: string; pointsNeeded: number; threshold: number } | null;
  lastLevelUp: LevelName | null;
  onClearLevelUp: () => void;
  isLoaded: boolean;
  personalizedMessage?: string;
  detectedSkill?: string;
  onLevelCelebrated?: (level: LevelName) => void;
  hasLevelBeenCelebrated?: (level: LevelName) => boolean;
  shouldCelebrate?: (level: LevelName) => boolean;
}

// Level-specific messaging configurations
const LEVEL_MESSAGES: Record<string, { primary: string[]; secondary: string; closing: string }> = {
  Gold: {
    primary: ["Your engagement drives growth. Together, we're building bridges in agribusiness trade."],
    secondary: "Keep going. Momentum compounds.",
    closing: "You're building clarity through action. This confidence is earned."
  },
  Premium: {
    primary: [
      "You're building real momentum. Your progress is visible.",
      "Your discipline is paying off. You're operating with purpose."
    ],
    secondary: "Consistency creates leverage.",
    closing: "You're getting sharper with every step."
  },
  Platinum: {
    primary: [
      "Exceptional consistency. You're operating at an elite level.",
      "Platinum status reflects rare focus and long-term execution."
    ],
    secondary: "This is what mastery looks like.",
    closing: "You've earned deep trust and credibility."
  }
};

// AI unlock messages per level
const AI_UNLOCK_MESSAGES: Record<string, string> = {
  Gold: "🌟 Gold Status Unlocked — 100 RewardFlow points. Click your badge anytime to review your RewardFlow.",
  Premium: "✨ Premium Status Unlocked — 200 RewardFlow points. Click your badge to view your progress and next targets.",
  Platinum: "💎 Platinum Status Unlocked — 5000 RewardFlow points. This reflects elite consistency. Click your badge to view your RewardFlow."
};

export function RewardFlowPanel({
  points,
  level,
  messagesSent,
  nextLevel,
  lastLevelUp,
  onClearLevelUp,
  isLoaded,
  personalizedMessage,
  detectedSkill,
  onLevelCelebrated,
  hasLevelBeenCelebrated,
  shouldCelebrate,
}: RewardFlowPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebratingLevel, setCelebratingLevel] = useState<LevelName | null>(null);
  const [aiUnlockMessage, setAiUnlockMessage] = useState<string | null>(null);

  // Check for celebration trigger
  useEffect(() => {
    if (lastLevelUp && CELEBRATION_LEVELS.includes(lastLevelUp)) {
      const shouldShow = shouldCelebrate ? shouldCelebrate(lastLevelUp) : true;
      if (shouldShow) {
        setCelebratingLevel(lastLevelUp);
        setShowCelebration(true);
        setIsExpanded(true);
        // Show AI unlock message
        setAiUnlockMessage(AI_UNLOCK_MESSAGES[lastLevelUp] || null);
      }
    }
  }, [lastLevelUp, shouldCelebrate]);

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    if (celebratingLevel && onLevelCelebrated) {
      onLevelCelebrated(celebratingLevel);
    }
    setCelebratingLevel(null);
  };

  const dismissAiMessage = () => {
    setAiUnlockMessage(null);
  };

  if (!isLoaded) {
    return null;
  }

  const progressPercentage = nextLevel
    ? Math.min(100, ((points - (LEVELS.find(l => l.name === level)?.threshold || 0)) / 
        (nextLevel.threshold - (LEVELS.find(l => l.name === level)?.threshold || 0))) * 100)
    : 100;

  const levelMessages = LEVEL_MESSAGES[level];
  const primaryMessage = levelMessages?.primary[Math.floor(Math.random() * levelMessages.primary.length)] || "";

  // Helper to render level-specific panel content
  const renderLevelPanel = () => {
    if (!CELEBRATION_LEVELS.includes(level)) {
      if (level === "Basic") {
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <RewardBadge level="Basic" points={points} size="md" animate />
            <p className="text-green-700 text-xs mt-2">
              Basic Status Unlocked. You've started engaging with purpose.
            </p>
          </div>
        );
      }
      if (level === "Silver") {
        return (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
            <RewardBadge level="Silver" points={points} size="md" animate />
            <p className="text-slate-600 text-xs mt-2">
              Silver Status Reached. Your questions are becoming clearer and more focused.
            </p>
          </div>
        );
      }
      return null;
    }

    // Celebration levels: Gold, Premium, Platinum
    const levelConfig = {
      Gold: {
        bgGradient: "from-amber-50 to-yellow-50",
        border: "border-amber-300",
        textColor: "text-amber-800",
        textColorSecondary: "text-amber-700",
        icon: Crown,
        skillBg: "bg-amber-200/60",
        skillText: "text-amber-800"
      },
      Premium: {
        bgGradient: "from-emerald-50 to-teal-50",
        border: "border-emerald-300",
        textColor: "text-emerald-800",
        textColorSecondary: "text-emerald-700",
        icon: Gem,
        skillBg: "bg-emerald-200/60",
        skillText: "text-emerald-800"
      },
      Platinum: {
        bgGradient: "from-slate-50 to-gray-50",
        border: "border-slate-400",
        textColor: "text-slate-800",
        textColorSecondary: "text-slate-700",
        icon: Sparkles,
        skillBg: "bg-slate-200/60",
        skillText: "text-slate-800"
      }
    };

    const config = levelConfig[level as keyof typeof levelConfig];
    if (!config) return null;

    const LevelIcon = config.icon;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-gradient-to-r ${config.bgGradient} border ${config.border} rounded-lg p-4 text-center`}
      >
        {/* Circular Badge with AgriSMES green accent */}
        <div className="flex justify-center mb-3">
          <RewardBadge level={level} points={points} size="lg" circular animate />
        </div>
        
        <p className={`${config.textColor} font-bold text-sm`}>RewardFlow – {level} Status</p>
        
        {/* Points display */}
        <p className={`${config.textColorSecondary} text-xs mt-1`}>{points} Points</p>
        
        {/* Personalized Skill Badge */}
        {detectedSkill && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`inline-flex items-center gap-1 ${config.skillBg} ${config.skillText} px-2 py-0.5 rounded-full text-[10px] font-medium mt-2`}
          >
            <Sparkles className="w-3 h-3" />
            {detectedSkill}
          </motion.div>
        )}
        
        {/* Primary Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-3 space-y-2"
        >
          <p className={`${config.textColorSecondary} text-sm font-medium`}>
            {personalizedMessage || primaryMessage}
          </p>
          {/* Secondary Reinforcement */}
          <p className={`${config.textColorSecondary} text-sm font-semibold`}>
            {levelMessages?.secondary}
          </p>
        </motion.div>

        {/* Closing Affirmation */}
        <p className={`${config.textColorSecondary} text-sm mt-3 font-medium`}>
          {levelMessages?.closing}
        </p>
      </motion.div>
    );
  };

  return (
    <div className="space-y-2">
      {/* Level Celebration Effect - One time only per level */}
      {celebratingLevel && (
        <LevelCelebration 
          isActive={showCelebration} 
          level={celebratingLevel}
          onComplete={handleCelebrationComplete} 
        />
      )}

      {/* AI Unlock Message */}
      <AnimatePresence>
        {aiUnlockMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-sm text-foreground"
          >
            <div className="flex items-start gap-2">
              <div className="flex-1">{aiUnlockMessage}</div>
              <button
                onClick={dismissAiMessage}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Up Notification - only for Basic/Silver */}
      <AnimatePresence>
        {lastLevelUp && !CELEBRATION_LEVELS.includes(lastLevelUp) && (
          <LevelUpNotification level={lastLevelUp} onDismiss={onClearLevelUp} />
        )}
      </AnimatePresence>

      {/* Celebration Level Special Notification */}
      <AnimatePresence>
        {lastLevelUp && CELEBRATION_LEVELS.includes(lastLevelUp) && shouldCelebrate && !shouldCelebrate(lastLevelUp) === false && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`rounded-lg p-4 shadow-lg ${
              lastLevelUp === "Gold" ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-400" :
              lastLevelUp === "Premium" ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400" :
              "bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-400"
            }`}
          >
            <div className="flex items-start gap-3">
              <motion.div
                animate={{ rotate: [0, -5, 5, -5, 5, 0] }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                {lastLevelUp === "Gold" && <Crown className="w-8 h-8 text-amber-500" />}
                {lastLevelUp === "Premium" && <Gem className="w-8 h-8 text-emerald-500" />}
                {lastLevelUp === "Platinum" && <Sparkles className="w-8 h-8 text-slate-500" />}
              </motion.div>
              <div className="flex-1">
                <p className={`font-bold ${
                  lastLevelUp === "Gold" ? "text-amber-800" :
                  lastLevelUp === "Premium" ? "text-emerald-800" :
                  "text-slate-800"
                }`}>
                  {lastLevelUp === "Gold" && "🌟 Gold Status Unlocked"}
                  {lastLevelUp === "Premium" && "✨ Premium Status Unlocked"}
                  {lastLevelUp === "Platinum" && "💎 Platinum Status Unlocked"}
                </p>
                <p className={`text-sm mt-1 ${
                  lastLevelUp === "Gold" ? "text-amber-700" :
                  lastLevelUp === "Premium" ? "text-emerald-700" :
                  "text-slate-700"
                }`}>
                  You've reached {LEVELS.find(l => l.name === lastLevelUp)?.threshold} RewardFlow points.
                </p>
                <p className={`text-xs mt-2 ${
                  lastLevelUp === "Gold" ? "text-amber-600" :
                  lastLevelUp === "Premium" ? "text-emerald-600" :
                  "text-slate-600"
                }`}>
                  👉 Click your badge anytime to review your RewardFlow.
                </p>
              </div>
              <button
                onClick={onClearLevelUp}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg overflow-hidden"
      >
        {/* Header - Always Visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-2 hover:bg-primary/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-foreground">RewardFlow</span>
            <RewardBadge level={level} points={points} size="sm" />
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 pt-1 space-y-3">
                {/* Level Achievement Panel */}
                {renderLevelPanel()}

                {/* Progress Bar - Only show if not at max level */}
                {nextLevel && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Progress to {nextLevel.name}</span>
                      <span>{nextLevel.pointsNeeded} pts to go</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={`h-full rounded-full ${
                          level === "Gold" ? "bg-amber-400" : 
                          level === "Silver" ? "bg-slate-400" : 
                          level === "Premium" ? "bg-emerald-400" :
                          level === "Platinum" ? "bg-slate-500" :
                          "bg-primary"
                        }`}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center">
                      Current: {points} pts • Next: {nextLevel.name} ({nextLevel.threshold} pts) • Progress: {Math.round(progressPercentage)}%
                    </p>
                  </div>
                )}

                {/* Stats */}
                <div className="flex justify-between text-[10px]">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <TrendingUp className="w-3 h-3" />
                    <span>{messagesSent} messages</span>
                  </div>
                  <div className="text-muted-foreground">
                    {points} total points
                  </div>
                </div>

                {/* Level Badges Preview */}
                <div className="flex gap-1 flex-wrap justify-center">
                  {LEVELS.filter(l => l.name !== "none").map((lvl) => (
                    <div
                      key={lvl.name}
                      className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                        points >= lvl.threshold
                          ? `${lvl.color} ${lvl.textColor} ${lvl.borderColor} border`
                          : "bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      {lvl.name}
                    </div>
                  ))}
                </div>

                {/* Soft CTA */}
                {CELEBRATION_LEVELS.includes(level) && (
                  <p className="text-[10px] text-center text-muted-foreground pt-1 border-t border-border">
                    Continue exploring with AgriSMES
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

interface PointsEarnedToastProps {
  points: number;
  action: string;
}

export function PointsEarnedToast({ points, action }: PointsEarnedToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium"
    >
      <Gift className="w-3 h-3" />
      <span>+{points} pts</span>
    </motion.div>
  );
}
