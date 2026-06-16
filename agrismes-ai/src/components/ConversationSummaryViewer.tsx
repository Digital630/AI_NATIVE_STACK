import React, { useMemo, useCallback, useState } from "react";
import { Copy, Check, Shield, Award, FileText, Share2, Send } from "lucide-react";
import rewardflowIcon from "@/assets/rewardflow-icon.png";
import agrismesLogo from "@/assets/agrismes-logo-v3.png";
import { LevelName } from "@/hooks/useRewardPoints";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ConversationSubmitForm, shareConversation } from "@/components/ConversationSubmitForm";

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

interface ImageAnalysisData {
  productQuality: { assessment: string; description: string };
  moistureContent: { assessment: string; description: string };
  harvestReadiness: { assessment: string; description: string };
  heatStress: { assessment: string; description: string };
  confidenceLevel: string;
  overallSummary: string;
  recommendations: string[];
  detectedCommodity?: string | null;
}

interface ConversationSummaryViewerProps {
  messages: ConversationMessage[];
  level: LevelName;
  points: number;
  detectedSkill?: string;
  imageAnalysisResults?: Array<{
    analysis: ImageAnalysisData;
    imagePreview: string;
    timestamp: number;
  }>;
  visitorId?: string;
}

// Hard requirement: no emojis in the rendered document (even if chat included emojis)
const stripEmojis = (input: string): string => {
  const text = input ?? "";
  try {
    // Covers most emoji pictographs + modifiers
    return text
      .replace(/\p{Extended_Pictographic}/gu, "")
      .replace(/[\uFE0F\u200D]/g, ""); // VS16 + ZWJ
  } catch {
    // Fallback for runtimes without Unicode property escapes
    return text.replace(/[\u{1F300}-\u{1FAFF}]/gu, "");
  }
};

// Remove [[REWARDFLOW_ICON]] markers from text for PDF
const stripRewardFlowMarkers = (input: string): string => {
  return (input ?? "").replace(/\[\[REWARDFLOW_ICON\]\]/gi, "").trim();
};

const sanitizeTranscriptText = (input: string): string => {
  // Keep verbatim spacing/newlines, only remove emojis, markers, and normalize CRLF
  return stripRewardFlowMarkers(stripEmojis((input ?? "").replace(/\r\n/g, "\n")));
};

const getCompleteExchangeCount = (messages: ConversationMessage[]): number => {
  let exchanges = 0;
  for (let i = 0; i < messages.length - 1; i++) {
    if (messages[i].role === "user" && messages[i + 1]?.role === "assistant") {
      exchanges++;
      i++;
    }
  }
  return exchanges;
};

// Level-specific badge colors
const getLevelBadgeStyle = (level: LevelName): string => {
  switch (level) {
    case "Gold":
      return "bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950";
    case "Premium":
      return "bg-gradient-to-r from-emerald-600 to-green-700 text-white";
    case "Platinum":
      return "bg-gradient-to-r from-slate-400 to-slate-600 text-white";
    case "Silver":
      return "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800";
    default:
      return "bg-gradient-to-r from-primary/80 to-primary text-primary-foreground";
  }
};

export function ConversationSummaryViewer({
  messages,
  level,
  points,
  detectedSkill,
  imageAnalysisResults = [],
  visitorId = "",
}: ConversationSummaryViewerProps) {
  const [copied, setCopied] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  const dateStr = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const timeStr = useMemo(() => {
    const now = new Date();
    return now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const exchangeCount = useMemo(() => getCompleteExchangeCount(messages), [messages]);

  // Generate a reference number
  const referenceNumber = useMemo(() => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `FMS-${timestamp.slice(-4)}-${random}`;
  }, []);

  const rewardflowLetter = useMemo(() => {
    // Soft maturity logic: tone adaptation only (visibility is handled by caller)
    const isStructured = exchangeCount >= 4;

    const skillSentence = detectedSkill
      ? ` Observations suggest the user's questions relate to ${sanitizeTranscriptText(detectedSkill).trim()}.`
      : "";

    if (!isStructured) {
      return (
        `This document records early-stage engagement between a user and Alex (AgriSMES). ` +
        `Across the initial exchanges, the user shared questions and context to explore next steps and requirements.` +
        skillSentence +
        ` The current RewardFlow level of ${level} reflects engagement to date and is provided for continuity.`
      );
    }

    return (
      `This document reflects a more structured progression between a user and Alex (AgriSMES). ` +
      `Across multiple exchanges, the user refined questions and moved from general inquiry toward clearer trade-readiness details.` +
      skillSentence +
      ` The current RewardFlow level of ${level} reflects cumulative engagement depth and interaction quality.`
    );
  }, [exchangeCount, detectedSkill, level]);

  // Build plain text version for clipboard
  const getPlainTextContent = useCallback(() => {
    const header = `═══════════════════════════════════════════════════════════════\n` +
      `                    CONVERSATION SUMMARY\n` +
      `                      AgriSMES Platform\n` +
      `═══════════════════════════════════════════════════════════════\n\n` +
      `Reference: ${referenceNumber}\n` +
      `Date: ${dateStr}\n` +
      `Time: ${timeStr}\n` +
      `Assistant: Alex (AgriSMES Trade Readiness Desk)\n\n` +
      `───────────────────────────────────────────────────────────────\n` +
      `                         TRANSCRIPT\n` +
      `───────────────────────────────────────────────────────────────\n\n`;
    
    const transcript = messages
      .map((m) => {
        const speaker = m.role === "assistant" ? "ALEX (AGRISMES)" : "USER";
        const content = sanitizeTranscriptText(m.content);
        return `${speaker}:\n${content}`;
      })
      .join("\n\n---\n\n");

    const footer = `\n\n───────────────────────────────────────────────────────────────\n` +
      `                  REWARDFLOW ENGAGEMENT SUMMARY\n` +
      `───────────────────────────────────────────────────────────────\n\n` +
      `Level: ${level}\n` +
      `Points: ${points}\n\n` +
      `${rewardflowLetter}\n\n` +
      `═══════════════════════════════════════════════════════════════\n` +
      `                         DISCLAIMER\n` +
      `═══════════════════════════════════════════════════════════════\n\n` +
      `This summary is informational only and does not represent approval,\n` +
      `eligibility, certification, or endorsement by AgriSMES or any\n` +
      `affiliated institution.\n\n` +
      `© ${new Date().getFullYear()} AgriSMES — Trade Readiness Framework\n`;

    return header + transcript + footer;
  }, [messages, dateStr, timeStr, referenceNumber, level, points, rewardflowLetter]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getPlainTextContent());
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  }, [getPlainTextContent]);

  const handleShare = useCallback(async () => {
    await shareConversation(getPlainTextContent(), "AgriSMES Conversation Summary");
  }, [getPlainTextContent]);

  // NOTE: Caller guarantees gating; this component assumes required data exists.

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Action Bar - Copy, Share, Submit */}
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="gap-1.5"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-500" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="gap-1.5"
        >
          <Share2 className="w-4 h-4" />
          Share
        </Button>

        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            console.log("[ConversationSummaryViewer] Submit button clicked, opening form");
            setShowSubmitForm(true);
          }}
          className="gap-1.5 ml-auto"
        >
          <Send className="w-4 h-4" />
          Submit
        </Button>
      </div>

      {/* Submit Form Dialog */}
      <ConversationSubmitForm
        isOpen={showSubmitForm}
        onClose={() => setShowSubmitForm(false)}
        visitorId={visitorId}
        messages={messages}
        points={points}
        level={level}
      />

      {/* Professional Certificate-Style Document */}
      {/* Professional Certificate-Style Document */}
      <div className="bg-gradient-to-b from-card via-card to-muted/30 border-2 border-primary/20 shadow-2xl rounded-lg overflow-hidden">
        {/* Decorative Top Border */}
        <div className="h-2 bg-gradient-to-r from-primary via-primary/80 to-primary" />
        
        {/* HEADER - Certificate Style */}
        <header className="relative px-8 pt-8 pb-6">
          {/* Watermark Pattern */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
            <div className="w-full h-full" style={{
              backgroundImage: `repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 1px, transparent 10px)`,
            }} />
          </div>
          
          {/* Logo and Title */}
          <div className="flex items-start justify-between gap-6 relative">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                <img 
                  src={agrismesLogo} 
                  alt="AgriSMES" 
                  className="h-10 w-auto"
                  loading="lazy"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                  Conversation Summary
                </h1>
                <p className="text-sm text-muted-foreground font-medium">
                  Trade Readiness Desk — Informational Record
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex items-center gap-2 shrink-0 border-primary/30 hover:bg-primary/5"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-primary">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
          
          {/* Document Metadata - Certificate Style Grid */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg border border-border">
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Reference</div>
              <div className="text-sm font-mono font-medium text-foreground">{referenceNumber}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Date</div>
              <div className="text-sm font-medium text-foreground">{dateStr}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Time</div>
              <div className="text-sm font-medium text-foreground">{timeStr}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Assistant</div>
              <div className="text-sm font-medium text-foreground">Alex</div>
            </div>
          </div>
        </header>

        {/* Decorative Divider */}
        <div className="mx-8 flex items-center gap-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-border" />
          <FileText className="w-4 h-4 text-muted-foreground/50" />
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-border to-border" />
        </div>

        {/* BODY - Transcript Section */}
        <main className="px-8 py-6">
          <section aria-label="Full transcript" className="space-y-4">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2 mb-4">
              <span className="w-8 h-px bg-primary/30" />
              Conversation Transcript
              <span className="flex-1 h-px bg-border" />
            </h2>
            
            {messages.map((m, idx) => {
              const speaker = m.role === "assistant" ? "Alex (AgriSMES)" : "User";
              const content = sanitizeTranscriptText(m.content);
              const isAssistant = m.role === "assistant";

              return (
                <div key={idx} className={`relative pl-4 ${isAssistant ? 'border-l-2 border-primary/40' : 'border-l-2 border-muted-foreground/20'}`}>
                  <div className={`text-xs font-semibold uppercase tracking-wide mb-1.5 ${isAssistant ? 'text-primary' : 'text-muted-foreground'}`}>
                    {speaker}
                  </div>
                  <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {content}
                  </div>
                </div>
              );
            })}
          </section>

          {/* IMAGE ANALYSIS RESULTS (if any) */}
          {imageAnalysisResults.length > 0 && (
            <section aria-label="Product Image Analysis" className="mt-8 pt-6 border-t border-border">
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2 mb-4">
                <span className="w-8 h-px bg-primary/30" />
                Product Image Analysis
                <span className="flex-1 h-px bg-border" />
              </h2>
              
              {imageAnalysisResults.map((result, idx) => (
                <div key={idx} className="bg-muted/30 rounded-lg p-4 mb-4 text-sm border border-border/50">
                  <div className="font-semibold mb-2 text-foreground">
                    Analysis #{idx + 1} {result.analysis.detectedCommodity && `— ${result.analysis.detectedCommodity}`}
                  </div>
                  <div className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
                    <Shield className="w-3 h-3" />
                    Confidence: {result.analysis.confidenceLevel}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                    <div className="p-2 bg-background rounded border border-border/50">
                      <span className="font-semibold text-muted-foreground">Quality:</span>
                      <span className="ml-1 text-foreground">{result.analysis.productQuality.assessment}</span>
                    </div>
                    <div className="p-2 bg-background rounded border border-border/50">
                      <span className="font-semibold text-muted-foreground">Moisture:</span>
                      <span className="ml-1 text-foreground">{result.analysis.moistureContent.assessment}</span>
                    </div>
                    <div className="p-2 bg-background rounded border border-border/50">
                      <span className="font-semibold text-muted-foreground">Readiness:</span>
                      <span className="ml-1 text-foreground">{result.analysis.harvestReadiness.assessment}</span>
                    </div>
                    <div className="p-2 bg-background rounded border border-border/50">
                      <span className="font-semibold text-muted-foreground">Health:</span>
                      <span className="ml-1 text-foreground">{result.analysis.heatStress.assessment}</span>
                    </div>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">{result.analysis.overallSummary}</p>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground mt-2 italic">
                Image analysis is AI-generated and for informational purposes only.
              </p>
            </section>
          )}

          {/* Decorative Divider */}
          <div className="my-8 flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-border" />
            <Award className="w-4 h-4 text-primary/50" />
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-border to-border" />
          </div>

          {/* FOOTER — REWARDFLOW ENGAGEMENT CERTIFICATE */}
          <section aria-label="RewardFlow Engagement Summary" className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
                <span className="w-8 h-px bg-primary/30" />
                RewardFlow Engagement Summary
              </h2>

              <div className="flex items-center gap-3">
                <img
                  src={rewardflowIcon}
                  alt="RewardFlow icon"
                  className="h-7 w-7"
                  style={{ filter: "sepia(1) saturate(5) hue-rotate(90deg) brightness(0.9)" }}
                  loading="lazy"
                />
                <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold shadow-sm ${getLevelBadgeStyle(level)}`}>
                  <span>{level}</span>
                  <span className="opacity-80">•</span>
                  <span>{points} pts</span>
                </div>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-foreground/90">{rewardflowLetter}</p>
          </section>
        </main>

        {/* DISCLAIMER FOOTER - Legal Style */}
        <footer className="px-8 py-6 bg-muted/50 border-t border-border">
          <div className="flex items-start gap-3">
            <Shield className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong>Disclaimer:</strong> This summary is informational only and does not represent approval,
                eligibility, certification, or endorsement by AgriSMES or any affiliated institution.
              </p>
              <p className="text-[10px] text-muted-foreground/70">
                © {new Date().getFullYear()} AgriSMES — Trade Readiness Framework. All conversations may be analyzed to improve service quality.
              </p>
            </div>
          </div>
        </footer>

        {/* Decorative Bottom Border */}
        <div className="h-1.5 bg-gradient-to-r from-primary via-primary/80 to-primary" />
      </div>
    </div>
  );
}
