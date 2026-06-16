import React from "react";
import { Droplets, Scale, ClipboardCheck } from "lucide-react";
import { motion } from "framer-motion";

type AnalysisType = "moisture" | "quality" | "weight";

interface InstitutionalAnalyzingScreenProps {
  type: AnalysisType;
  capturedImage?: string | null;
}

const CONFIG = {
  moisture: {
    Icon: Droplets,
    title: "Analyzing… Please wait",
    subtitle: "Processing data and validating results",
    steps: ["Commodity detection", "Moisture measurement", "Quality assessment"],
  },
  quality: {
    Icon: ClipboardCheck,
    title: "Analyzing… Please wait",
    subtitle: "Processing data and validating results",
    steps: ["Grade assessment", "Defect detection", "Bio-risk analysis"],
  },
  weight: {
    Icon: Scale,
    title: "Analyzing… Please wait",
    subtitle: "Processing data and validating results",
    steps: ["Package detection", "Weight estimation", "Dimension analysis"],
  },
};

export function InstitutionalAnalyzingScreen({
  type,
  capturedImage,
}: InstitutionalAnalyzingScreenProps) {
  const config = CONFIG[type];
  const Icon = config.Icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-white rounded-xl"
    >
      {/* Optional captured image thumbnail - subtle */}
      {capturedImage && (
        <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-primary/20 mb-6 shadow-sm">
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-cover opacity-80"
          />
        </div>
      )}

      {/* Large institutional spinner - government/bank-grade style */}
      <div className="relative w-32 h-32 mb-8">
        {/* Outer track - subtle */}
        <div className="absolute inset-0 border-[6px] border-primary/10 rounded-full" />
        
        {/* Middle track - medium */}
        <div className="absolute inset-2 border-[4px] border-primary/15 rounded-full" />
        
        {/* Main spinning indicator - prominent, smooth, steady */}
        <div
          className="absolute inset-0 border-[6px] border-transparent border-t-primary rounded-full"
          style={{
            animation: "spin 1.5s linear infinite",
          }}
        />
        
        {/* Secondary spinning ring - slower for gravitas */}
        <div
          className="absolute inset-3 border-[3px] border-transparent border-b-primary/40 rounded-full"
          style={{
            animation: "spin 2.5s linear infinite reverse",
          }}
        />
        
        {/* Center icon container */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center">
            <Icon className="w-8 h-8 text-primary" />
          </div>
        </div>
      </div>

      {/* Primary text - bold, official, serious */}
      <h2 className="text-xl font-semibold text-foreground mb-2 text-center">
        {config.title}
      </h2>

      {/* Secondary text - calm, professional */}
      <p className="text-sm text-muted-foreground mb-6 text-center">
        {config.subtitle}
      </p>

      {/* Processing steps indicator - institutional style */}
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {config.steps.map((step, index) => (
          <div
            key={step}
            className="flex items-center gap-3 px-4 py-2 bg-muted/30 rounded-lg"
          >
            {/* Animated dot indicator */}
            <div className="relative w-3 h-3 flex-shrink-0">
              <div
                className="absolute inset-0 bg-primary rounded-full"
                style={{
                  animation: `pulse 1.5s ease-in-out infinite`,
                  animationDelay: `${index * 300}ms`,
                }}
              />
              <div
                className="absolute inset-0 bg-primary/30 rounded-full"
                style={{
                  animation: `ping 1.5s ease-in-out infinite`,
                  animationDelay: `${index * 300}ms`,
                }}
              />
            </div>
            <span className="text-sm text-muted-foreground">{step}</span>
          </div>
        ))}
      </div>

      {/* Subtle branding */}
      <p className="text-[10px] text-muted-foreground/50 mt-8 uppercase tracking-widest">
        AgriSMES Analysis System
      </p>

      {/* Add custom keyframes for smoother animation */}
      <style>{`
        @keyframes ping {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </motion.div>
  );
}
