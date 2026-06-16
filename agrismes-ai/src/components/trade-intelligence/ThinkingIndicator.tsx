import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ThinkingIndicatorProps {
  steps: string[];
}

const STEP_LABELS: Record<string, string> = {
  "Analyzing your query…": "Parsing trade parameters",
  "Running deep trade analysis…": "Deep analysis active",
  "Searching trade data…": "Retrieving market data",
  "Analyzing logistics routes…": "Mapping corridors",
  "Retrieving commodity pricing across sources…": "Cross-referencing prices",
  "Comparing market data across origins…": "Origin comparison",
  "Building logistics model…": "Building logistics model",
  "Analyzing compliance requirements…": "Checking compliance",
  "Compiling trade intelligence brief…": "Generating decision signal",
  "Comparing market sources…": "Comparing sources",
};

export function ThinkingIndicator({ steps }: ThinkingIndicatorProps) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="mt-1 shrink-0">
        <Loader2 className="w-4 h-4 text-primary animate-spin" />
      </div>
      <div className="space-y-1.5">
        <AnimatePresence mode="popLayout">
          {steps.map((step, i) => (
            <motion.p
              key={step}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className={`text-sm ${
                i === steps.length - 1 ? "text-foreground font-medium" : "text-muted-foreground"
              }`}
            >
              {STEP_LABELS[step] || step}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
