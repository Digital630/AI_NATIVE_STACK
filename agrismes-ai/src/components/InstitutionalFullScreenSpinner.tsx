import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, Scale, ClipboardCheck, Cloud, TrendingUp, Image, FileText } from "lucide-react";

type AnalysisType = "moisture" | "weight" | "quality" | "weather" | "fx" | "image" | "file";

interface InstitutionalFullScreenSpinnerProps {
  isVisible: boolean;
  type: AnalysisType;
  message?: string;
}

const TYPE_CONFIG = {
  moisture: {
    Icon: Droplets,
    title: "Analyzing Moisture Content",
    subtitle: "Processing data and validating results",
  },
  weight: {
    Icon: Scale,
    title: "Estimating Weight",
    subtitle: "Processing data and validating results",
  },
  quality: {
    Icon: ClipboardCheck,
    title: "Quality Control Analysis",
    subtitle: "Processing data and validating results",
  },
  weather: {
    Icon: Cloud,
    title: "Fetching Weather Data",
    subtitle: "Connecting to weather services",
  },
  fx: {
    Icon: TrendingUp,
    title: "Fetching Exchange Rate",
    subtitle: "Connecting to FX services",
  },
  image: {
    Icon: Image,
    title: "Analyzing Image",
    subtitle: "Processing visual data",
  },
  file: {
    Icon: FileText,
    title: "Processing Document",
    subtitle: "Analyzing file contents",
  },
};

export function InstitutionalFullScreenSpinner({
  isVisible,
  type,
  message,
}: InstitutionalFullScreenSpinnerProps) {
  const config = TYPE_CONFIG[type];
  const Icon = config.Icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm"
          style={{ touchAction: "none" }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center justify-center p-8 max-w-sm mx-4 bg-white/95 rounded-2xl shadow-2xl backdrop-blur-sm"
          >
            {/* Large Institutional Spinner - 40% screen width on mobile */}
            <div className="relative w-[40vw] h-[40vw] max-w-[200px] max-h-[200px] mb-8">
              {/* Outer track - subtle */}
              <div className="absolute inset-0 border-[8px] border-primary/10 rounded-full" />
              
              {/* Middle track */}
              <div className="absolute inset-3 border-[6px] border-primary/15 rounded-full" />
              
              {/* Inner track */}
              <div className="absolute inset-6 border-[4px] border-primary/10 rounded-full" />
              
              {/* Main spinning indicator - AgriSMES Green */}
              <div
                className="absolute inset-0 border-[8px] border-transparent border-t-primary rounded-full"
                style={{
                  animation: "spin 1.2s linear infinite",
                }}
              />
              
              {/* Secondary spinning ring - slower */}
              <div
                className="absolute inset-4 border-[5px] border-transparent border-b-primary/50 rounded-full"
                style={{
                  animation: "spin 2s linear infinite reverse",
                }}
              />
              
              {/* Tertiary ring - even slower */}
              <div
                className="absolute inset-8 border-[3px] border-transparent border-t-primary/30 rounded-full"
                style={{
                  animation: "spin 3s linear infinite",
                }}
              />
              
              {/* Center icon container - Larger */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[40%] h-[40%] rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="w-[60%] h-[60%] text-primary" />
                </div>
              </div>
            </div>

            {/* Primary text */}
            <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-2 text-center">
              {message || config.title}
            </h2>

            {/* Secondary text */}
            <p className="text-sm md:text-base text-muted-foreground mb-6 text-center">
              {config.subtitle}
            </p>

            {/* Animated dots */}
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-primary rounded-full"
                  style={{
                    animation: `pulse 1.5s ease-in-out infinite`,
                    animationDelay: `${i * 200}ms`,
                  }}
                />
              ))}
            </div>

            {/* Branding */}
            <p className="text-[10px] text-muted-foreground/50 mt-8 uppercase tracking-widest">
              AgriSMES Analysis System
            </p>
          </motion.div>

          {/* Custom keyframes */}
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes pulse {
              0%, 100% { opacity: 0.4; transform: scale(0.8); }
              50% { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
