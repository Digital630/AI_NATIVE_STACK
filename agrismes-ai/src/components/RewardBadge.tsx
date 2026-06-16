/**
 * RewardFlow Badge Component
 * Circular badge with level-specific styling
 * Supports all levels: Basic, Silver, Gold, Premium, Platinum
 */

import { motion, AnimatePresence } from "framer-motion";
import { LevelName, LEVELS } from "@/hooks/useRewardPoints";
import rewardflowIcon from "@/assets/rewardflow-r-icon.png";

interface RewardBadgeProps {
  level: LevelName;
  points: number;
  showPoints?: boolean;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
  circular?: boolean;
}

// Level-based color filters for the R icon (black icon base)
const getLevelIconFilter = (level: LevelName): React.CSSProperties => {
  switch (level) {
    case "Basic":
      return { filter: "invert(1) sepia(1) saturate(5) hue-rotate(90deg)" }; // Green
    case "Silver":
      return { filter: "invert(1) brightness(0.8)" }; // Silver/gray
    case "Gold":
      return { filter: "invert(1) sepia(1) saturate(3) hue-rotate(15deg) brightness(1.1)" }; // Gold
    case "Premium":
      return { filter: "invert(1) sepia(1) saturate(4) hue-rotate(70deg) brightness(0.9)" }; // Deep green
    case "Platinum":
      return { filter: "invert(1) brightness(0.95)" }; // Platinum/white
    default:
      return { filter: "invert(1)" }; // White
  }
};

// Circular badge gradient configs
const CIRCULAR_GRADIENTS: Record<string, { gradient: string; shadow: string }> = {
  Gold: {
    gradient: "linear-gradient(145deg, #FBBF24 0%, #F59E0B 50%, #D97706 100%)",
    shadow: "0 4px 20px rgba(251, 191, 36, 0.4)"
  },
  Premium: {
    gradient: "linear-gradient(145deg, #10B981 0%, #059669 50%, #047857 100%)",
    shadow: "0 4px 20px rgba(16, 185, 129, 0.4)"
  },
  Platinum: {
    gradient: "linear-gradient(145deg, #F1F5F9 0%, #CBD5E1 50%, #94A3B8 100%)",
    shadow: "0 4px 20px rgba(148, 163, 184, 0.4)"
  },
};

export function RewardBadge({ 
  level, 
  points, 
  showPoints = true, 
  size = "md",
  animate = false,
  circular = false
}: RewardBadgeProps) {
  const levelInfo = LEVELS.find(l => l.name === level) || LEVELS[0];
  const iconFilter = getLevelIconFilter(level);

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5 gap-1",
    md: "text-sm px-2 py-1 gap-1.5",
    lg: "text-base px-3 py-1.5 gap-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const circularSizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-20 h-20",
  };

  const circularIconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10",
  };

  if (level === "none") {
    return (
      <div className={`inline-flex items-center rounded-full ${levelInfo.color} ${levelInfo.textColor} ${sizeClasses[size]} font-medium`}>
        <img src={rewardflowIcon} alt="R" style={iconFilter} className={iconSizes[size]} />
        {showPoints && <span>{points} pts</span>}
      </div>
    );
  }

  // Circular badge for celebration levels (Gold, Premium, Platinum)
  if (circular && CIRCULAR_GRADIENTS[level]) {
    const gradientConfig = CIRCULAR_GRADIENTS[level];
    return (
      <motion.div
        initial={animate ? { scale: 0.8, opacity: 0 } : false}
        animate={animate ? { scale: 1, opacity: 1 } : false}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`relative ${circularSizes[size]} rounded-full flex items-center justify-center`}
        style={{
          background: gradientConfig.gradient,
          boxShadow: gradientConfig.shadow
        }}
      >
        {/* AgriSMES green accent ring */}
        <div 
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: "hsl(var(--primary))" }}
        />
        {/* Inner white glow */}
        <div 
          className="absolute inset-1 rounded-full bg-white/20"
        />
        <img src={rewardflowIcon} alt="R" style={{ filter: level === "Platinum" ? "brightness(0.4)" : "invert(1)" }} className={`${circularIconSizes[size]} drop-shadow-md`} />
      </motion.div>
    );
  }

  // Standard pill badge
  const badge = (
    <div 
      className={`inline-flex items-center rounded-full border ${levelInfo.color} ${levelInfo.textColor} ${levelInfo.borderColor} ${sizeClasses[size]} font-medium ${
        level === "Gold" ? "ring-1 ring-primary/30" : 
        level === "Premium" ? "ring-1 ring-emerald-300" :
        level === "Platinum" ? "ring-1 ring-slate-400" : ""
      }`}
    >
      <img src={rewardflowIcon} alt="R" style={iconFilter} className={iconSizes[size]} />
      <span>{level}</span>
      {showPoints && <span className="opacity-70">• {points}</span>}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {badge}
      </motion.div>
    );
  }

  return badge;
}

interface LevelUpNotificationProps {
  level: LevelName;
  onDismiss: () => void;
}

export function LevelUpNotification({ level, onDismiss }: LevelUpNotificationProps) {
  const levelInfo = LEVELS.find(l => l.name === level) || LEVELS[0];
  const iconFilter = getLevelIconFilter(level);

  // Only show notification for Basic and Silver (Gold/Premium/Platinum use celebration)
  if (level !== "Basic" && level !== "Silver") {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`p-3 rounded-lg border-2 ${levelInfo.color} ${levelInfo.borderColor} ${levelInfo.textColor} shadow-lg`}
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <img src={rewardflowIcon} alt="R" style={iconFilter} className="w-8 h-8" />
          </motion.div>
          <div className="flex-1">
            <p className="font-bold text-sm">
              Level Up!
            </p>
            <p className="text-xs opacity-80">
              {levelInfo.message || `You've unlocked ${level} Level`}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="text-xs opacity-60 hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
