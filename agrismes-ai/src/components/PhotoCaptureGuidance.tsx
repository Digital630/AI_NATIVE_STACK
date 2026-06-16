import React from "react";
import { motion } from "framer-motion";
import { Sun, Focus, Maximize2, RulerIcon, Camera, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhotoCaptureGuidanceProps {
  type: "moisture" | "weight" | "qc";
  onProceed: () => void;
  onBack: () => void;
}

const GUIDANCE_TIPS = {
  moisture: [
    { icon: Sun, text: "Use daylight or bright, consistent lighting" },
    { icon: Focus, text: "Avoid flash glare – natural light is best" },
    { icon: Maximize2, text: "Fill the frame with the commodity sample" },
    { icon: RulerIcon, text: "Hold camera 30–40 cm from sample" },
    { icon: Camera, text: "Optional: Capture 2 angles for better accuracy" },
  ],
  weight: [
    { icon: Sun, text: "Ensure good lighting on all packages" },
    { icon: Maximize2, text: "Include all bags/boxes in the frame" },
    { icon: RulerIcon, text: "Step back to capture full package height" },
    { icon: Focus, text: "Labels should be visible if possible" },
    { icon: Camera, text: "Capture from standing height" },
  ],
  qc: [
    { icon: Sun, text: "Bright, even lighting reveals defects better" },
    { icon: Focus, text: "Neutral background (white/gray) preferred" },
    { icon: Maximize2, text: "Fill frame with representative sample" },
    { icon: RulerIcon, text: "Close-up: 20–30 cm distance" },
    { icon: Camera, text: "Avoid shadows over the sample" },
  ],
};

const TYPE_CONFIG = {
  moisture: {
    title: "Moisture Content Analysis",
    subtitle: "Photo guidance for accurate estimation",
  },
  weight: {
    title: "Weight Estimation",
    subtitle: "Photo guidance for package detection",
  },
  qc: {
    title: "Quality Control Analysis",
    subtitle: "Photo guidance for accurate grading",
  },
};

export function PhotoCaptureGuidance({ type, onProceed, onBack }: PhotoCaptureGuidanceProps) {
  const tips = GUIDANCE_TIPS[type];
  const config = TYPE_CONFIG[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col h-full bg-gradient-to-b from-primary/5 to-white p-4"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold text-foreground">{config.title}</h2>
        <p className="text-sm text-muted-foreground">{config.subtitle}</p>
      </div>

      {/* Tips List */}
      <div className="flex-1 space-y-3">
        {tips.map((tip, index) => (
          <motion.div
            key={tip.text}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
            className="flex items-center gap-3 bg-white rounded-lg border border-border p-3"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <tip.icon className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm text-foreground">{tip.text}</p>
          </motion.div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          Results are estimates for decision-support only. For trade-critical decisions, 
          confirm with certified measurement equipment.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-4">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={onProceed} className="flex-1 bg-primary hover:bg-primary/90">
          Start Capture
        </Button>
      </div>
    </motion.div>
  );
}

// Image Quality Warning Component (shown after capture if quality is low)
interface ImageQualityWarningProps {
  qualityLevel: "low" | "moderate";
  onRetake: () => void;
  onContinue: () => void;
}

export function ImageQualityWarning({ qualityLevel, onRetake, onContinue }: ImageQualityWarningProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {qualityLevel === "low" ? "Low Image Quality" : "Image Quality Could Be Better"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {qualityLevel === "low" 
                ? "This may significantly affect accuracy"
                : "Results may have wider uncertainty range"
              }
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-6 text-sm text-muted-foreground">
          <p>To improve results:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Use brighter, more even lighting</li>
            <li>Hold camera steady</li>
            <li>Move closer to the sample</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onContinue} className="flex-1">
            Continue Anyway
          </Button>
          <Button onClick={onRetake} className="flex-1 bg-primary hover:bg-primary/90">
            Retake Photo
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
