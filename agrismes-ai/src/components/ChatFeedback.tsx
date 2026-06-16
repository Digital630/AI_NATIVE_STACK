import { useState } from "react";
import { ThumbsUp, ThumbsDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { InlineRewardFlowIcon } from "@/components/RewardFlowMinimal";
import { LevelName } from "@/hooks/useRewardPoints";

interface ChatFeedbackProps {
  conversationId: string;
  visitorId: string;
  onFeedbackSubmitted?: () => void;
  rewardLevel?: LevelName | "none";
  onRewardIconClick?: () => void;
}

export function ChatFeedback({ 
  conversationId, 
  visitorId, 
  onFeedbackSubmitted,
  rewardLevel = "none",
  onRewardIconClick
}: ChatFeedbackProps) {
  const [feedbackState, setFeedbackState] = useState<"idle" | "negative_input" | "submitted">("idle");
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitFeedback = async (rating: "helpful" | "not_helpful", text?: string) => {
    setIsSubmitting(true);
    try {
      // Determine quality tag based on feedback
      const qualityTag = rating === "helpful" ? "high_quality" : "needs_improvement";
      
      // Update the conversation with feedback
      await supabase
        .from("chat_conversations")
        .update({
          feedback_rating: rating,
          feedback_text: text || null,
          quality_tag: qualityTag,
          updated_at: new Date().toISOString(),
        })
        .eq("session_id", conversationId);

      setFeedbackState("submitted");
      onFeedbackSubmitted?.();
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePositive = () => {
    submitFeedback("helpful");
  };

  const handleNegative = () => {
    setFeedbackState("negative_input");
  };

  const handleNegativeSubmit = () => {
    submitFeedback("not_helpful", feedbackText.trim() || undefined);
  };

  if (feedbackState === "submitted") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground"
      >
        <div className="flex items-center justify-center gap-2">
          <span>Thank you for your feedback.</span>
          {onRewardIconClick && (
            <InlineRewardFlowIcon
              level={rewardLevel}
              onClick={onRewardIconClick}
              size="sm"
            />
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <AnimatePresence mode="wait">
        {feedbackState === "idle" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-3"
          >
            <span className="text-xs text-muted-foreground">Was this helpful?</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePositive}
                disabled={isSubmitting}
                className="h-8 px-3 text-xs gap-1.5"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                Helpful
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNegative}
                disabled={isSubmitting}
                className="h-8 px-3 text-xs gap-1.5"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                Not helpful
              </Button>
              {/* RewardFlow icon inline with feedback buttons */}
              {onRewardIconClick && (
                <InlineRewardFlowIcon
                  level={rewardLevel}
                  onClick={onRewardIconClick}
                  size="sm"
                />
              )}
            </div>
          </motion.div>
        )}

        {feedbackState === "negative_input" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">What was missing?</span>
              <button
                onClick={() => setFeedbackState("idle")}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <Textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value.slice(0, 250))}
              placeholder="Optional feedback..."
              className="min-h-[60px] text-sm resize-none"
              maxLength={250}
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                {feedbackText.length}/250
              </span>
              <Button
                size="sm"
                onClick={handleNegativeSubmit}
                disabled={isSubmitting}
                className="h-7 text-xs"
              >
                {isSubmitting ? "Sending..." : "Submit"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Inline feedback buttons for after key AI responses
export function InlineFeedbackButtons({ 
  onPositive, 
  onNegative, 
  disabled = false 
}: { 
  onPositive: () => void; 
  onNegative: () => void; 
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1 mt-1">
      <button
        onClick={onPositive}
        disabled={disabled}
        className="p-1 hover:bg-primary/10 rounded transition-colors text-muted-foreground hover:text-primary"
        title="Helpful"
      >
        <ThumbsUp className="w-3 h-3" />
      </button>
      <button
        onClick={onNegative}
        disabled={disabled}
        className="p-1 hover:bg-destructive/10 rounded transition-colors text-muted-foreground hover:text-destructive"
        title="Not helpful"
      >
        <ThumbsDown className="w-3 h-3" />
      </button>
    </div>
  );
}
