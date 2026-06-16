/**
 * Level Celebration Component
 * One-time 2-3 second elegant sparkle/starburst effect
 * Professional, not playful - level-specific colors
 * Supports Gold, Premium, Platinum
 */

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { LevelName } from "@/hooks/useRewardPoints";

interface LevelCelebrationProps {
  isActive: boolean;
  level: LevelName;
  onComplete: () => void;
}

// Color configurations per level
const LEVEL_COLORS: Record<string, { primary: string; secondary: string; tertiary: string }> = {
  Gold: {
    primary: "#FBBF24", // amber-400
    secondary: "#FDE68A", // amber-200
    tertiary: "#FFFFFF",
  },
  Premium: {
    primary: "#10B981", // emerald-500
    secondary: "#34D399", // emerald-400
    tertiary: "#FFFFFF",
  },
  Platinum: {
    primary: "#E2E8F0", // slate-200
    secondary: "#CBD5E1", // slate-300
    tertiary: "#FFFFFF",
  },
};

export function LevelCelebration({ isActive, level, onComplete }: LevelCelebrationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; size: number; colorIndex: number }>>([]);
  
  const colors = LEVEL_COLORS[level] || LEVEL_COLORS.Gold;

  useEffect(() => {
    if (isActive) {
      // Generate elegant sparkle particles
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 0.6,
        size: Math.random() * 10 + 4,
        colorIndex: i % 3,
      }));
      setParticles(newParticles);

      // Auto-complete after 2.5 seconds
      const timer = setTimeout(() => {
        onComplete();
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  const getParticleColor = (colorIndex: number) => {
    if (colorIndex === 0) return colors.primary;
    if (colorIndex === 1) return colors.secondary;
    return colors.tertiary;
  };

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[10000] pointer-events-none overflow-hidden"
        >
          {/* Central starburst */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1.5, 2],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: 2,
              ease: "easeOut"
            }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            {/* Radial gradient burst */}
            <div 
              className="w-72 h-72 rounded-full"
              style={{
                background: `radial-gradient(circle, ${colors.primary}66 0%, ${colors.primary}33 30%, transparent 70%)`
              }}
            />
          </motion.div>

          {/* Sparkle particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ 
                scale: 0, 
                opacity: 0,
                x: "50vw",
                y: "50vh"
              }}
              animate={{ 
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                x: `${particle.x}vw`,
                y: `${particle.y}vh`,
              }}
              transition={{ 
                duration: 2,
                delay: particle.delay,
                ease: "easeOut"
              }}
              className="absolute"
              style={{
                width: particle.size,
                height: particle.size,
              }}
            >
              {/* Four-pointed star */}
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                className="w-full h-full"
              >
                <path
                  d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z"
                  fill={getParticleColor(particle.colorIndex)}
                />
              </svg>
            </motion.div>
          ))}

          {/* Prism shimmer effect for Platinum */}
          {level === "Platinum" && (
            <>
              <motion.div
                initial={{ opacity: 0, rotate: 0 }}
                animate={{ 
                  opacity: [0, 0.3, 0],
                  rotate: [0, 180]
                }}
                transition={{ 
                  duration: 2.5,
                  ease: "easeOut"
                }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48"
                style={{
                  background: "conic-gradient(from 0deg, #FF6B6B22, #4ECDC422, #45B7D122, #96CEB422, #FECA5722, #FF6B6B22)",
                  borderRadius: "50%",
                  filter: "blur(20px)"
                }}
              />
            </>
          )}

          {/* Central glow pulse */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ 
              scale: [0.5, 1.2, 0.8],
              opacity: [0, 0.8, 0]
            }}
            transition={{ 
              duration: 2.5,
              ease: "easeOut"
            }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full"
            style={{
              background: `radial-gradient(circle, ${colors.primary}99 0%, ${colors.secondary}4D 50%, transparent 70%)`,
              boxShadow: `0 0 60px 30px ${colors.primary}4D`
            }}
          />

          {/* Elegant ring expansion */}
          <motion.div
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ 
              scale: [0, 3],
              opacity: [0.8, 0]
            }}
            transition={{ 
              duration: 2,
              ease: "easeOut"
            }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2"
            style={{ borderColor: colors.primary }}
          />

          {/* Second ring with delay */}
          <motion.div
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ 
              scale: [0, 2.5],
              opacity: [0.6, 0]
            }}
            transition={{ 
              duration: 2,
              delay: 0.3,
              ease: "easeOut"
            }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border"
            style={{ borderColor: colors.secondary }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
