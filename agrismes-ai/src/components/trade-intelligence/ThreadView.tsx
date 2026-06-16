import { useState } from "react";
import { Copy, RefreshCw, Check } from "lucide-react";
import type { ThreadMessage } from "@/types/trade";
import { WorkflowStatus } from "./WorkflowStatus";
import { ContextChips } from "./ContextChips";
import { SourceList } from "./SourceList";
import { FollowUpActions } from "./FollowUpActions";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { StructuredAnswer } from "./StructuredAnswer";
import { DealEvaluationPanel } from "./DealEvaluationPanel";
import { toast } from "sonner";

interface ThreadViewProps {
  messages: ThreadMessage[];
  contextChips: { key: string; value: string }[];
  isLoading: boolean;
  thinkingSteps: string[];
  onFollowUp: (query: string) => void;
}

function ActionBar({ message, onFollowUp }: { message: ThreadMessage; onFollowUp: (q: string) => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const parts: string[] = [];
    const ev = message.answer?.deal_evaluation;
    if (ev) {
      parts.push(`Decision: ${ev.decision_signal} | Confidence: ${ev.confidence_level} | Risk: ${ev.risk_level}`);
      if (ev.summary) parts.push(ev.summary);
    }
    if (message.answer?.direct_answer) parts.push(message.answer.direct_answer);
    if (message.answer?.risks?.length) parts.push(`Risks: ${message.answer.risks.join("; ")}`);
    if (message.answer?.next_actions?.length) parts.push(`Next Steps: ${message.answer.next_actions.join("; ")}`);

    navigator.clipboard.writeText(parts.join("\n\n"));
    setCopied(true);
    toast.success("Summary copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefine = () => {
    const commodity = message.context_variables?.commodity || "";
    onFollowUp(`Refine this analysis${commodity ? ` for ${commodity}` : ""} — add missing quality metrics and adjust risk assessment`);
  };

  return (
    <div className="flex items-center gap-2 pt-3 border-t border-border">
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border bg-background hover:bg-secondary/50 transition-colors text-xs text-muted-foreground hover:text-foreground"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? "Copied" : "Copy Summary"}
      </button>
      <button
        onClick={handleRefine}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border bg-background hover:bg-secondary/50 transition-colors text-xs text-muted-foreground hover:text-foreground"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Refine Analysis
      </button>
    </div>
  );
}

export function ThreadView({ messages, contextChips, isLoading, thinkingSteps, onFollowUp }: ThreadViewProps) {
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {lastAssistant?.workflow_type && (
        <WorkflowStatus type={lastAssistant.workflow_type} />
      )}

      {contextChips.length > 0 && (
        <div className="mb-4">
          <ContextChips chips={contextChips} />
        </div>
      )}

      {messages.map((msg, msgIdx) => (
        <div key={msg.id} className="mb-6">
          {msg.role === "user" ? (
            <div className="mb-4">
              <p className="text-foreground text-lg font-medium">{msg.content}</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* 1. Decision Signal — HERO POSITION (top priority) */}
              {msg.answer?.deal_evaluation && (
                <DealEvaluationPanel evaluation={msg.answer.deal_evaluation} />
              )}

              {/* 2. Direct answer / Deal Evaluation prose */}
              {msg.answer?.direct_answer && (
                <p className="text-foreground text-[15px] leading-relaxed">
                  {msg.answer.direct_answer}
                </p>
              )}

              {/* 3-7. Structured sections: Risks, Next Steps, then expandable details */}
              {msg.answer && <StructuredAnswer answer={msg.answer} isDeepResearch={msg.is_deep_research} />}

              {/* Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <SourceList sources={msg.sources} />
              )}

              {/* Action buttons */}
              <ActionBar message={msg} onFollowUp={onFollowUp} />

              {/* Follow-up questions */}
              {msg.follow_up_questions && msg.follow_up_questions.length > 0 && (
                <FollowUpActions questions={msg.follow_up_questions} onSelect={onFollowUp} />
              )}
            </div>
          )}
        </div>
      ))}

      {isLoading && <ThinkingIndicator steps={thinkingSteps} />}
    </div>
  );
}
