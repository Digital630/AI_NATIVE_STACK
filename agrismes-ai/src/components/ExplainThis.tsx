/**
 * ExplainThis Component
 * AI-powered explainer for complex metrics and concepts
 * Part of Epistemic Clarity initiative
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Lightbulb, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ExplainThisProps {
  /** The metric or concept to explain */
  topic: string;
  /** Current value (optional) - adds context to explanation */
  value?: string | number;
  /** Additional context (e.g., commodity type) */
  context?: string;
  /** Compact mode for inline usage */
  compact?: boolean;
  /** Custom trigger element */
  children?: React.ReactNode;
}

// Pre-defined simple explanations for common metrics (instant, no API call)
const INSTANT_EXPLANATIONS: Record<string, (value?: string | number, context?: string) => string> = {
  "moisture": (value, context) => {
    const v = typeof value === "number" ? value : parseFloat(String(value) || "0");
    const commodity = context || "your crop";
    if (v <= 10) return `${v}% moisture is excellent for ${commodity}. This is ideal for long-term storage and export. Your product will stay fresh for months.`;
    if (v <= 13) return `${v}% moisture is acceptable for ${commodity}. Good for short-term storage (1-2 months). Consider additional drying for export.`;
    if (v <= 15) return `${v}% moisture is slightly high for ${commodity}. Risk of mold within weeks. Dry further before storing or selling.`;
    return `${v}% moisture is too high for ${commodity}. Immediate drying required to prevent spoilage. Do not store in current condition.`;
  },
  "grade": (value, context) => {
    const grade = String(value || "").toUpperCase();
    const commodity = context || "your product";
    if (grade.includes("AA") || grade.includes("1") || grade === "A") {
      return `Grade ${grade} is premium quality for ${commodity}. This qualifies for specialty markets and commands the highest prices. Excellent work!`;
    }
    if (grade.includes("AB") || grade.includes("2") || grade === "B") {
      return `Grade ${grade} is standard export quality for ${commodity}. Suitable for commercial markets with good pricing. Room for improvement to reach premium.`;
    }
    return `Grade ${grade} indicates opportunities for improvement in ${commodity}. Focus on sorting and quality control to reach higher grades and better prices.`;
  },
  "defects": (value) => {
    const v = typeof value === "number" ? value : parseInt(String(value) || "0", 10);
    if (v <= 2) return `${v} defects per sample is excellent. This meets specialty coffee standards. Buyers will pay premium prices for this quality.`;
    if (v <= 5) return `${v} defects per sample is good for commercial export. Meets standard requirements. Some sorting could improve this further.`;
    if (v <= 10) return `${v} defects per sample is borderline. May limit buyer options. Consider better sorting and quality control at harvest.`;
    return `${v} defects per sample is high. Significant sorting needed before selling. This affects both price and buyer interest.`;
  },
  "price": (value, context) => {
    const commodity = context || "this commodity";
    return `The current price of ${value} for ${commodity} reflects global supply and demand. Compare with last month to understand market trends. Consider timing your sale when prices are above average.`;
  },
  "confidence": (value) => {
    const v = typeof value === "number" ? value : parseFloat(String(value) || "0");
    if (v >= 90) return `${v}% confidence means the analysis is highly reliable. The image was clear and conditions were ideal. Trust this result.`;
    if (v >= 75) return `${v}% confidence means the analysis is reasonably accurate. Some factors may affect precision. Use as a strong indicator.`;
    if (v >= 60) return `${v}% confidence suggests moderate reliability. Consider retaking the image in better lighting for higher accuracy.`;
    return `${v}% confidence indicates uncertainty in the analysis. Please retake the image with better lighting and camera focus for more reliable results.`;
  },
  "risk": (value) => {
    const level = String(value || "").toLowerCase();
    if (level === "low") return "Low risk means conditions are favorable. Proceed with normal operations. Monitor for changes but no immediate action needed.";
    if (level === "medium") return "Medium risk suggests caution. Take preventive measures like extra drying or better storage. Monitor conditions closely.";
    return "High risk requires immediate attention. Protect your product from potential spoilage. Consider accelerated sale or enhanced storage.";
  }
};

export function ExplainThis({ 
  topic, 
  value, 
  context,
  compact = false,
  children 
}: ExplainThisProps) {
  const [open, setOpen] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getExplanation = async () => {
    setLoading(true);
    setError(null);

    // First try instant explanation
    const normalizedTopic = topic.toLowerCase().replace(/[^a-z]/g, "");
    for (const [key, explainer] of Object.entries(INSTANT_EXPLANATIONS)) {
      if (normalizedTopic.includes(key)) {
        setExplanation(explainer(value, context));
        setLoading(false);
        return;
      }
    }

    // Fall back to AI explanation
    try {
      const { data, error: fnError } = await supabase.functions.invoke("chat-stream", {
        body: {
          messages: [
            {
              role: "system",
              content: `You are a helpful agricultural advisor explaining concepts to farmers and traders in simple terms. 
              Keep explanations under 3 sentences. Use everyday language. 
              Be encouraging and practical. Focus on what this means for their business.`
            },
            {
              role: "user",
              content: `Explain "${topic}"${value ? ` with current value: ${value}` : ""}${context ? ` for ${context}` : ""} in simple terms that a smallholder farmer would understand.`
            }
          ],
          stream: false
        }
      });

      if (fnError) throw fnError;

      // Handle the response - it may come as streaming chunks or direct response
      if (data?.choices?.[0]?.message?.content) {
        setExplanation(data.choices[0].message.content);
      } else if (typeof data === "string") {
        setExplanation(data);
      } else {
        // Provide a generic helpful response
        setExplanation(`${topic} is an important metric in agricultural trade. It helps buyers and sellers understand quality and make fair pricing decisions.`);
      }
    } catch (err) {
      console.error("Explain This error:", err);
      // Provide fallback explanation
      setExplanation(`${topic} is a key measurement in agricultural trade that affects pricing and quality assessment.`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !explanation) {
      getExplanation();
    }
  };

  const trigger = children || (
    <Button
      variant="ghost"
      size={compact ? "sm" : "default"}
      className={`gap-1.5 text-primary hover:text-primary/80 hover:bg-primary/5 ${compact ? "h-7 px-2 text-xs" : ""}`}
    >
      <Lightbulb className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      {!compact && "Explain This"}
    </Button>
  );

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-4 bg-card border shadow-lg z-50"
        side="top"
        align="center"
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm text-foreground">
                Understanding: {topic}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setOpen(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          {loading ? (
            <div className="flex items-center gap-2 py-4 justify-center text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Getting explanation...</span>
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : explanation ? (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {explanation}
            </p>
          ) : null}

          {value && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Current value: <span className="font-medium text-foreground">{value}</span>
                {context && <span className="text-muted-foreground"> ({context})</span>}
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
