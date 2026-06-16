import { useState } from "react";
import { Copy, Check, Share2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { ReturnLoopQuestions } from "./ReturnLoopQuestions";

interface AskAnswerProps {
  content: string;
  onFollowUp: (query: string) => void;
  resolvedModel?: string;
  provider?: string;
  structured?: any;
  onRegenerate?: () => void;
  isStreaming?: boolean;
}

function StreamingCursor() {
  return (
    <span className="inline-block w-[2px] h-[1.1em] bg-foreground/70 animate-pulse ml-0.5 align-text-bottom" />
  );
}

export function AskAnswer({ content, onFollowUp, resolvedModel, onRegenerate, isStreaming }: AskAnswerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareText = content.slice(0, 500) + (content.length > 500 ? "…" : "");
    if (navigator.share) {
      try {
        await navigator.share({ title: "AGRISMES Intelligence", text: shareText });
      } catch { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(content);
      toast.success("Copied for sharing");
    }
  };

  const modelLabel = resolvedModel
    ? `Powered by ${resolvedModel.includes("gpt") ? "OpenAI GPT-5" : resolvedModel.includes("gemini") ? "Google Gemini" : resolvedModel}`
    : null;

  return (
    <div className="space-y-4">
      <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-headings:text-base prose-headings:font-semibold prose-headings:mt-5 prose-headings:mb-2 prose-p:text-[15px] prose-p:leading-relaxed prose-li:text-[15px] prose-strong:text-foreground prose-ul:my-2 prose-ol:my-2 prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
        <ReactMarkdown>{content}</ReactMarkdown>
        {isStreaming && <StreamingCursor />}
      </div>

      {!isStreaming && content && (
        <>
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-secondary/50 transition-colors text-xs text-muted-foreground hover:text-foreground active:scale-[0.97]"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-secondary/50 transition-colors text-xs text-muted-foreground hover:text-foreground active:scale-[0.97]"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-secondary/50 transition-colors text-xs text-muted-foreground hover:text-foreground active:scale-[0.97]"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regenerate
                </button>
              )}
            </div>
            {modelLabel && (
              <span className="text-[11px] text-muted-foreground/60 select-none">{modelLabel}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
