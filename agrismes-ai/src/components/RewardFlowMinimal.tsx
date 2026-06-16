/**
 * RewardFlow Minimal Component
 * Non-annoying, calm UX - header indicator + click-to-open panel
 * Never competes with conversation, invisible when inactive
 * 
 * Discovery Layers (Icon-Led, No Text):
 * Layer 1: Passive presence (icon always visible, no animation on load)
 * Layer 2: Subtle "breathing" animation (scale 98%→100%→98%, 2-3 pulses max)
 * Layer 3: REMOVED - No textual prompts
 * Layer 4: Celebration unlocks (Gold/Premium/Platinum sparkle animation)
 * 
 * Panel Behavior:
 * Desktop: Side panel anchored right, doesn't cover chat input
 * Mobile: Bottom sheet slides up (60-80% height), swipe to dismiss
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X, TrendingUp, FileText, Gift, QrCode } from "lucide-react";
import { RewardBadge } from "./RewardBadge";
import { LevelCelebration } from "./LevelCelebration";
import { LevelName, LEVELS, CELEBRATION_LEVELS } from "@/hooks/useRewardPoints";
import { useIsMobile } from "@/hooks/use-mobile";
import { ConversationSummaryViewer } from "@/components/ConversationSummaryViewer";
import { QRCodeGenerator } from "@/components/QRCodeGenerator";
import rewardflowIcon from "@/assets/rewardflow-r-icon.png";

// Session keys for tracking
const MICRO_SIGNAL_SHOWN_KEY = "agrismes_micro_signal_shown";

// Conversation message interface
interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface RewardFlowMinimalProps {
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
  conversationStartTime?: number;
  messageCount?: number;
  isPanelOpen?: boolean;
  onPanelOpenChange?: (open: boolean) => void;
  // Conversation messages for PDF export
  conversationMessages?: ConversationMessage[];
  // Visitor ID for QR code generation
  visitorId?: string;
}

export function RewardFlowMinimal({
  points,
  level,
  messagesSent,
  nextLevel,
  lastLevelUp,
  onClearLevelUp,
  isLoaded,
  detectedSkill,
  onLevelCelebrated,
  shouldCelebrate,
  isPanelOpen: externalPanelOpen,
  onPanelOpenChange,
  conversationMessages = [],
  visitorId = "",
}: RewardFlowMinimalProps) {
  const [internalPanelOpen, setInternalPanelOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebratingLevel, setCelebratingLevel] = useState<LevelName | null>(null);
  const [summaryViewerOpen, setSummaryViewerOpen] = useState(false);
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const isMobile = useIsMobile();
  
  // Use external state if provided, otherwise internal
  const isPanelOpen = externalPanelOpen !== undefined ? externalPanelOpen : internalPanelOpen;
  const setPanelOpen = onPanelOpenChange || setInternalPanelOpen;
  
  // Calculate complete exchanges (user message + assistant response = 1 exchange)
  const getCompleteExchangeCount = (): number => {
    let exchanges = 0;
    for (let i = 0; i < conversationMessages.length - 1; i++) {
      if (conversationMessages[i].role === "user" && conversationMessages[i + 1]?.role === "assistant") {
        exchanges++;
        i++; // Skip the assistant message we just counted
      }
    }
    return exchanges;
  };
  
  const completeExchanges = getCompleteExchangeCount();
  const MINIMUM_EXCHANGES = 3;
  
  // Pre-render validation - check all required data exists
  const canShowConversationSummary = (): boolean => {
    // Rule 3.1: Minimum 3 complete exchanges
    if (completeExchanges < MINIMUM_EXCHANGES) return false;
    // Rule 4.1: Chat history must exist
    if (!conversationMessages || conversationMessages.length === 0) return false;
    // Rule 4.2: Level must exist
    if (!level) return false;
    return true;
  };
  
  // Handle opening Conversation Summary viewer - strict validation before opening
  const handleViewConversationSummary = () => {
    // Rule 7.1: Pre-render validation - suppress action if any check fails
    if (!canShowConversationSummary()) return;

    setSummaryViewerOpen(true);
  };

  // Failsafe: never render an empty view (close silently if required data disappears)
  useEffect(() => {
    if (summaryViewerOpen && !canShowConversationSummary()) {
      setSummaryViewerOpen(false);
    }
  }, [summaryViewerOpen, completeExchanges, conversationMessages.length, level]);

  // Check for celebration trigger
  useEffect(() => {
    if (lastLevelUp && CELEBRATION_LEVELS.includes(lastLevelUp)) {
      const shouldShow = shouldCelebrate ? shouldCelebrate(lastLevelUp) : true;
      if (shouldShow) {
        setCelebratingLevel(lastLevelUp);
        setShowCelebration(true);
        // Auto-open panel on level unlock
        setPanelOpen(true);
      }
    }
  }, [lastLevelUp, shouldCelebrate]);

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    if (celebratingLevel && onLevelCelebrated) {
      onLevelCelebrated(celebratingLevel);
    }
    setCelebratingLevel(null);
    onClearLevelUp();
  };

  // Handle swipe down to close on mobile
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.velocity.y > 100 || info.offset.y > 100) {
      setPanelOpen(false);
    }
  };

  // Handle click outside to close
  const handleBackdropClick = () => {
    setPanelOpen(false);
  };

  if (!isLoaded) return null;

  const progressPercentage = nextLevel
    ? Math.min(100, ((points - (LEVELS.find(l => l.name === level)?.threshold || 0)) / 
        (nextLevel.threshold - (LEVELS.find(l => l.name === level)?.threshold || 0))) * 100)
    : 100;

  // Get level-specific accent color
  const getLevelAccent = () => {
    switch (level) {
      case "Gold": return "bg-amber-400";
      case "Silver": return "bg-slate-400";
      case "Premium": return "bg-emerald-400";
      case "Platinum": return "bg-slate-500";
      default: return "bg-primary";
    }
  };

  return (
    <>
      {/* Level Celebration Effect - One time only per level */}
      {celebratingLevel && (
        <LevelCelebration 
          isActive={showCelebration} 
          level={celebratingLevel}
          onComplete={handleCelebrationComplete} 
        />
      )}

      {/* Panel - Responsive Desktop/Mobile */}
      <AnimatePresence>
        {isPanelOpen && (
          <>
            {/* Backdrop - Mobile only, click to close */}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleBackdropClick}
                className="fixed inset-0 bg-black/30 z-40"
              />
            )}

            {/* Desktop: Side Panel */}
            {!isMobile && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute right-0 top-14 w-64 z-50 bg-card border border-border rounded-lg shadow-lg overflow-hidden"
              >
                {/* Panel Header */}
                <div className="bg-muted/50 border-b border-border p-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">RewardFlow</span>
                  <button
                    onClick={() => setPanelOpen(false)}
                    className="p-1 hover:bg-muted rounded transition-colors"
                    aria-label="Close panel"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Panel Content - Desktop */}
                <div className="p-4 space-y-4">
                  {/* User Badge / Level */}
                  <div className="flex justify-center">
                    <RewardBadge level={level} points={points} size="lg" circular animate />
                  </div>

                  {/* Points Earned */}
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{points}</p>
                    <p className="text-xs text-muted-foreground">Points earned</p>
                  </div>

                  {/* Progress to Next Level */}
                  {nextLevel && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{level}</span>
                        <span>{nextLevel.name}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercentage}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className={`h-full rounded-full ${getLevelAccent()}`}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        {nextLevel.pointsNeeded} points to {nextLevel.name}
                      </p>
                    </div>
                  )}

                  {/* Stats - minimal */}
                  <div className="flex justify-center text-xs text-muted-foreground pt-2 border-t border-border">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>{messagesSent} messages</span>
                    </div>
                  </div>
                  
                  {/* View Conversation Summary - Only shown after 3+ complete exchanges */}
                  {canShowConversationSummary() && (
                    <button
                      onClick={handleViewConversationSummary}
                      className="w-full flex items-center justify-center gap-2 text-xs text-primary hover:text-primary/80 py-2 border-t border-border transition-colors font-medium"
                    >
                      <FileText className="w-3 h-3" />
                      <span>View Conversation Summary</span>
                    </button>
                  )}
                  
                  {/* Redeem Points Button - Show when 100+ points */}
                  {points >= 100 && visitorId && (
                    <button
                      onClick={() => setShowQRGenerator(true)}
                      className="w-full flex items-center justify-center gap-2 text-xs text-primary hover:text-primary/80 py-2 border-t border-border transition-colors font-medium"
                    >
                      <Gift className="w-3 h-3" />
                      <span>Redeem Points</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Mobile: Bottom Sheet */}
            {isMobile && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                drag="y"
                dragConstraints={{ top: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-2xl shadow-2xl"
                style={{ maxHeight: "70vh" }}
              >
                {/* Drag Handle */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
                </div>

                {/* Panel Header */}
                <div className="flex items-center justify-between px-4 pb-2">
                  <span className="text-sm font-medium text-primary">RewardFlow</span>
                  <button
                    onClick={() => setPanelOpen(false)}
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                    aria-label="Close panel"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                {/* Panel Content - Mobile */}
                <div className="px-6 pb-8 space-y-5">
                  {/* User Badge / Level */}
                  <div className="flex justify-center">
                    <RewardBadge level={level} points={points} size="lg" circular animate />
                  </div>

                  {/* Points Earned */}
                  <div className="text-center">
                    <p className="text-3xl font-bold text-foreground">{points}</p>
                    <p className="text-sm text-muted-foreground">Points earned</p>
                  </div>

                  {/* Progress to Next Level */}
                  {nextLevel && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{level}</span>
                        <span>{nextLevel.name}</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercentage}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className={`h-full rounded-full ${getLevelAccent()}`}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        {nextLevel.pointsNeeded} points to {nextLevel.name}
                      </p>
                    </div>
                  )}

                  {/* Stats - minimal */}
                  <div className="flex justify-center text-sm text-muted-foreground pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4" />
                      <span>{messagesSent} messages sent</span>
                    </div>
                  </div>
                  
                  {/* View Conversation Summary - Only shown after 3+ complete exchanges */}
                   {canShowConversationSummary() && (
                     <button
                       onClick={handleViewConversationSummary}
                       className="w-full flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 py-3 border-t border-border transition-colors font-medium"
                     >
                       <FileText className="w-4 h-4" />
                       <span>View Conversation Summary</span>
                     </button>
                   )}
                   
                   {/* Redeem Points Button - Show when 100+ points */}
                   {points >= 100 && visitorId && (
                     <button
                       onClick={() => setShowQRGenerator(true)}
                       className="w-full flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 py-3 border-t border-border transition-colors font-medium"
                     >
                       <Gift className="w-4 h-4" />
                       <span>Redeem Points</span>
                     </button>
                   )}
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
      
       {/* Conversation Summary Viewer (VIEW-ONLY, PDF-style, no download) */}
       <AnimatePresence>
         {summaryViewerOpen && canShowConversationSummary() && (
           <>
             {/* Backdrop */}
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setSummaryViewerOpen(false)}
               className="fixed inset-0 bg-black/60 z-[60]"
             />

             {/* Viewer */}
             <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="fixed inset-4 md:inset-8 lg:inset-16 z-[61] bg-card rounded-lg shadow-2xl overflow-hidden flex flex-col"
               role="dialog"
               aria-modal="true"
               aria-label="Conversation Summary"
             >
               {/* Header */}
               <div className="bg-muted/50 border-b border-border p-3 flex items-center justify-between">
                 <span className="text-sm font-medium text-foreground">Conversation Summary</span>
                 <button
                   onClick={() => setSummaryViewerOpen(false)}
                   className="p-1.5 hover:bg-muted rounded transition-colors"
                   aria-label="Close viewer"
                 >
                   <X className="w-4 h-4 text-muted-foreground" />
                 </button>
               </div>

               {/* Document (rendered in-app; no PDF download) */}
               <div className="flex-1 bg-muted/30 overflow-auto p-4">
                 <ConversationSummaryViewer
                   messages={conversationMessages}
                   level={level}
                   points={points}
                   detectedSkill={detectedSkill}
                   visitorId={visitorId}
                 />
               </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        
        {/* QR Code Generator Modal */}
        <AnimatePresence>
          {showQRGenerator && visitorId && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowQRGenerator(false)}
                className="fixed inset-0 bg-black/60 z-[60]"
              />

              {/* QR Generator Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md z-[61] bg-card rounded-xl shadow-2xl overflow-hidden"
                role="dialog"
                aria-modal="true"
                aria-label="Redeem Points"
              >
                {/* Header */}
                <div className="bg-muted/50 border-b border-border p-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground flex items-center gap-2">
                    <QrCode className="w-4 h-4" />
                    Redeem Points
                  </span>
                  <button
                    onClick={() => setShowQRGenerator(false)}
                    className="p-1.5 hover:bg-muted rounded transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* QR Generator Content */}
                <div className="p-4 max-h-[70vh] overflow-auto">
                  <QRCodeGenerator
                    visitorId={visitorId}
                    points={points}
                    level={level}
                    onQRGenerated={() => {}}
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
    </>
  );
}

/**
 * Minimal header indicator for RewardFlow
 * R-in-circle icon, level-based colors, tooltip
 * Includes Layer 2 micro-signal support
 */

interface RewardFlowHeaderIndicatorProps {
  level: LevelName;
  onClick: () => void;
  isLoaded: boolean;
  showCelebration?: boolean;
  messageCount?: number;
  conversationStartTime?: number;
}

// Level color mapping for the icon - uses CSS filter to colorize
// The icon is black by default, we invert to white for dark backgrounds, then apply color
const getLevelIconStyle = (level: LevelName): React.CSSProperties => {
  // Base: invert black to white for visibility on dark (primary) background
  const baseFilter = "invert(1)";
  
  switch (level) {
    case "Basic":
      // AgriSMES green - hue-rotate to green
      return { filter: `${baseFilter} sepia(1) saturate(5) hue-rotate(90deg)` };
    case "Silver":
      // Silver/gray - just brightness adjustment
      return { filter: `${baseFilter} brightness(0.8)` };
    case "Gold":
      // Gold color
      return { filter: `${baseFilter} sepia(1) saturate(3) hue-rotate(15deg) brightness(1.1)` };
    case "Premium":
      // Deep green-gold
      return { filter: `${baseFilter} sepia(1) saturate(4) hue-rotate(70deg) brightness(0.9)` };
    case "Platinum":
      // Platinum/silver-white - mostly white
      return { filter: `${baseFilter} brightness(0.95)` };
    default:
      // Default: white (inverted from black)
      return { filter: baseFilter };
  }
};

/**
 * Inline RewardFlow Icon - Compact version for use in feedback panels and thank-you messages
 * Clickable, opens the RewardFlow panel when clicked
 */
interface InlineRewardFlowIconProps {
  level: LevelName | "none";
  onClick: () => void;
  size?: "sm" | "md"; // sm = 16px, md = 20px
  className?: string;
}

export function InlineRewardFlowIcon({
  level,
  onClick,
  size = "sm",
  className = ""
}: InlineRewardFlowIconProps) {
  const displayLevel = level === "none" ? "none" : level;
  const iconStyle = getLevelIconStyle(displayLevel);
  const sizeClass = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  return (
    <button
      onClick={onClick}
      className={`relative p-0.5 hover:bg-primary/10 rounded-full transition-colors group ${className}`}
      aria-label="View your RewardFlow status"
      title="View your RewardFlow status"
    >
      <img 
        src={rewardflowIcon}
        alt="RewardFlow"
        style={iconStyle}
        className={sizeClass}
      />
    </button>
  );
}

export function RewardFlowHeaderIndicator({ 
  level, 
  onClick, 
  isLoaded,
  showCelebration = false,
  messageCount = 0,
  conversationStartTime = 0
}: RewardFlowHeaderIndicatorProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showMicroSignal, setShowMicroSignal] = useState(false);

  // Trigger animation on level celebration (Layer 4)
  useEffect(() => {
    if (showCelebration && (level === "Gold" || level === "Premium" || level === "Platinum")) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [showCelebration, level]);

  // Layer 2: Subtle "breathing" micro-signal after engagement
  // Very subtle scale pulse (98% → 100% → 98%), max 2-3 pulses, then stop
  const [breathingPulseCount, setBreathingPulseCount] = useState(0);
  const MAX_BREATHING_PULSES = 3;
  
  useEffect(() => {
    if (typeof window === "undefined" || !isLoaded) return;
    
    // Check if micro-signal was already shown this session
    const alreadyShown = sessionStorage.getItem(MICRO_SIGNAL_SHOWN_KEY) === "true";
    if (alreadyShown) return;
    
    const now = Date.now();
    const timeEngaged = conversationStartTime > 0 ? (now - conversationStartTime) / 1000 : 0;
    
    // Trigger conditions: 3+ questions OR 2+ minutes engaged OR Basic level reached
    const hasEnoughQuestions = messageCount >= 3;
    const hasEnoughTime = timeEngaged >= 120;
    const hasReachedBasic = level !== "none";
    
    if (hasEnoughQuestions || hasEnoughTime || hasReachedBasic) {
      // Start subtle breathing animation
      setShowMicroSignal(true);
      sessionStorage.setItem(MICRO_SIGNAL_SHOWN_KEY, "true");
    }
  }, [isLoaded, messageCount, conversationStartTime, level]);
  
  // Handle breathing pulse completion
  useEffect(() => {
    if (!showMicroSignal) return;
    
    // Stop after max pulses
    if (breathingPulseCount >= MAX_BREATHING_PULSES) {
      setShowMicroSignal(false);
      return;
    }
    
    // Each pulse is ~2 seconds
    const timer = setTimeout(() => {
      setBreathingPulseCount(prev => prev + 1);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [showMicroSignal, breathingPulseCount]);

  // Always show icon to allow discovery - even before loaded
  // Use "none" styling for new/loading users, level-based styling for engaged users
  const displayLevel = (!isLoaded || level === "none") ? "none" : level;
  const iconStyle = getLevelIconStyle(displayLevel);

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className="relative p-1 hover:bg-primary-foreground/10 rounded-full transition-colors"
        aria-label="RewardFlow status"
      >
        {/* R-in-circle icon with subtle breathing animation */}
        <motion.img 
          src={rewardflowIcon}
          alt="RewardFlow"
          style={iconStyle}
          className="w-5 h-5"
          animate={
            isAnimating 
              ? { scale: [1, 1.1, 1] } // Level celebration pulse
              : showMicroSignal && breathingPulseCount < MAX_BREATHING_PULSES
                ? { 
                    scale: [0.98, 1, 0.98], // Subtle breathing: 98% → 100% → 98%
                    opacity: [0.9, 1, 0.9]  // Very subtle opacity pulse
                  }
                : { scale: 1, opacity: 1 }
          }
          transition={
            isAnimating
              ? { duration: 0.5, repeat: 4 }
              : showMicroSignal
                ? { 
                    duration: 2, // 2 seconds per pulse
                    ease: "easeInOut",
                    repeat: 0 // Single animation, count handled by state
                  }
                : { duration: 0.2 }
          }
        />
        
        
        {/* Subtle glow animation on level unlock (Layer 4) */}
        {isAnimating && (
          <span 
            className={`absolute inset-0 rounded-full animate-ping opacity-50 ${
              level === "Gold" ? "bg-amber-400" :
              level === "Premium" ? "bg-emerald-400" :
              level === "Platinum" ? "bg-slate-300" :
              "bg-primary"
            }`}
          />
        )}
      </button>
      
      {/* Tooltip on hover */}
      <div className="absolute right-0 top-full mt-1 px-2 py-1 bg-foreground text-background text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        RewardFlow status
      </div>
    </div>
  );
}
