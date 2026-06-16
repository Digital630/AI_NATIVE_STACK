import { Scale, Droplets, Camera, Sun, Focus, Package, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface AnalysisInstructionsProps {
  type: "weight" | "moisture";
  onProceed: () => void;
  onBack: () => void;
}

/**
 * Enhanced instructions component for weight estimation and moisture content analysis.
 * Provides clear, visual guidance for accurate results.
 */
export function AnalysisInstructions({ type, onProceed, onBack }: AnalysisInstructionsProps) {
  const isWeight = type === "weight";

  const instructions = isWeight
    ? [
        {
          icon: Package,
          title: "Frame the Package",
          description: "Ensure the entire bag/box is visible in the frame. Include all packages if multiple.",
        },
        {
          icon: Focus,
          title: "Focus Clearly",
          description: "Tap to focus on the package. Sharp images give more accurate weight estimates.",
        },
        {
          icon: Maximize2,
          title: "Show Size Reference",
          description: "If possible, include a reference object (hand, ruler, pallet) for scale comparison.",
        },
        {
          icon: Sun,
          title: "Good Lighting",
          description: "Ensure the area is well-lit. Avoid shadows covering the package.",
        },
      ]
    : [
        {
          icon: Droplets,
          title: "Capture the Commodity",
          description: "Show the actual commodity (beans, nuts, grains) not just the packaging.",
        },
        {
          icon: Focus,
          title: "Close-Up Shot",
          description: "Get close enough to see the texture and color of the commodity clearly.",
        },
        {
          icon: Sun,
          title: "Natural Lighting",
          description: "Use natural daylight when possible. Avoid flash which can alter colors.",
        },
        {
          icon: Camera,
          title: "Steady Hold",
          description: "Hold the camera steady for 2-3 seconds. The system will auto-capture.",
        },
      ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="text-center mb-4">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
          {isWeight ? (
            <Scale className="h-6 w-6 text-primary" />
          ) : (
            <Droplets className="h-6 w-6 text-primary" />
          )}
        </div>
        <h3 className="font-semibold text-lg">
          {isWeight ? "Weight Estimation" : "Moisture Analysis"} Tips
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Follow these tips for the most accurate results
        </p>
      </div>

      <div className="grid gap-3">
        {instructions.map((instruction, index) => (
          <motion.div
            key={instruction.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <instruction.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{instruction.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {instruction.description}
              </p>
            </div>
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary flex-shrink-0">
              {index + 1}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={onProceed} className="flex-1">
          <Camera className="h-4 w-4 mr-2" />
          Start Capture
        </Button>
      </div>

      <p className="text-[10px] text-center text-muted-foreground mt-3">
        {isWeight
          ? "Weight estimates are AI-generated approximations. For accurate weights, use a calibrated scale."
          : "Moisture readings are visual estimates. For precise measurements, use a certified moisture meter."}
      </p>
    </motion.div>
  );
}

/**
 * Inline low-quality image feedback component.
 * Shows when image quality is detected as suboptimal.
 */
interface ImageQualityFeedbackProps {
  quality: "low" | "moderate" | "good";
  suggestions?: string[];
}

export function ImageQualityFeedback({ quality, suggestions }: ImageQualityFeedbackProps) {
  if (quality === "good") return null;

  const isLow = quality === "low";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-3 rounded-lg border ${
        isLow
          ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
          : "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
      }`}
    >
      <div className="flex items-start gap-2">
        <Sun className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
          isLow ? "text-amber-600" : "text-yellow-600"
        }`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${
            isLow ? "text-amber-800 dark:text-amber-200" : "text-yellow-800 dark:text-yellow-200"
          }`}>
            {isLow ? "Low Image Quality Detected" : "Image Quality Could Be Better"}
          </p>
          <ul className={`text-xs mt-1 space-y-0.5 ${
            isLow ? "text-amber-700 dark:text-amber-300" : "text-yellow-700 dark:text-yellow-300"
          }`}>
            {(suggestions || [
              "Improve lighting conditions",
              "Hold the camera steady",
              "Ensure the subject is in focus",
            ]).map((suggestion, i) => (
              <li key={i} className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-current" />
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Analysis progress indicator with phase descriptions.
 */
interface AnalysisProgressProps {
  type: "weight" | "moisture";
  currentPhase: "uploading" | "detecting" | "analyzing" | "generating";
}

export function AnalysisProgress({ type, currentPhase }: AnalysisProgressProps) {
  const phases = [
    { id: "uploading", label: "Processing image..." },
    { id: "detecting", label: type === "weight" ? "Detecting packages..." : "Detecting commodity..." },
    { id: "analyzing", label: type === "weight" ? "Estimating weight..." : "Measuring moisture..." },
    { id: "generating", label: "Generating certificate..." },
  ];

  const currentIndex = phases.findIndex(p => p.id === currentPhase);

  return (
    <div className="space-y-3">
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            {type === "weight" ? (
              <Scale className="h-6 w-6 text-primary" />
            ) : (
              <Droplets className="h-6 w-6 text-primary" />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {phases.map((phase, index) => {
          const isActive = index === currentIndex;
          const isComplete = index < currentIndex;

          return (
            <div
              key={phase.id}
              className={`flex items-center gap-2 text-sm transition-all duration-300 ${
                isActive
                  ? "text-primary font-medium"
                  : isComplete
                  ? "text-muted-foreground line-through"
                  : "text-muted-foreground/50"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full transition-all ${
                  isActive
                    ? "bg-primary animate-pulse"
                    : isComplete
                    ? "bg-primary/50"
                    : "bg-muted"
                }`}
              />
              {phase.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
