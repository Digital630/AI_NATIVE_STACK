/**
 * Gold Level Celebration Component
 * One-time 2-3 second elegant gold sparkle/starburst effect
 * Professional, not playful - gold + white only
 */

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface GoldCelebrationProps {
  isActive: boolean;
  onComplete: () => void;
}

export function GoldCelebration({ isActive, onComplete }: GoldCelebrationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; size: number }>>([]);

  useEffect(() => {
    if (isActive) {
      // Generate elegant sparkle particles
      const newParticles = Array.from({ length: 24 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 0.5,
        size: Math.random() * 8 + 4,
      }));
      setParticles(newParticles);

      // Auto-complete after 2.5 seconds
      const timer = setTimeout(() => {
        onComplete();
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

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
              className="w-64 h-64 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, rgba(251, 191, 36, 0.2) 30%, transparent 70%)"
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
                  fill={particle.id % 3 === 0 ? "#FBBF24" : particle.id % 3 === 1 ? "#FDE68A" : "#FFFFFF"}
                />
              </svg>
            </motion.div>
          ))}

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
              background: "radial-gradient(circle, rgba(251, 191, 36, 0.6) 0%, rgba(253, 230, 138, 0.3) 50%, transparent 70%)",
              boxShadow: "0 0 60px 30px rgba(251, 191, 36, 0.3)"
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
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-amber-400"
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
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-amber-300"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
