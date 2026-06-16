import React from "react";
import { motion } from "framer-motion";
import {
  Brain,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Shield,
  Lightbulb,
  Ban,
  Target,
  TrendingUp,
  FileSearch,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Trade Readiness Stages
type TradeReadinessStage = "explorer" | "emerging" | "trade_ready" | "institutional_ready";
type AdminReviewStatus = "pending" | "conditional" | "not_ready";

interface TradeDecisionRoomProps {
  stage: TradeReadinessStage;
  primaryRisk?: string;
  reviewLikelihood: AdminReviewStatus;
  doBriefing: string[];
  dontBriefing: string[];
  nextBestAction: string;
  messageCount?: number;
  hasSubmittedListing?: boolean;
}

const STAGE_CONFIG: Record<TradeReadinessStage, {
  label: string;
  color: string;
  icon: React.ReactNode;
  description: string;
}> = {
  explorer: {
    label: "Explorer",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    icon: <FileSearch className="w-4 h-4" />,
    description: "Learning about trade opportunities",
  },
  emerging: {
    label: "Emerging",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: <TrendingUp className="w-4 h-4" />,
    description: "Building trade readiness",
  },
  trade_ready: {
    label: "Trade-Ready",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: <CheckCircle className="w-4 h-4" />,
    description: "Ready for facilitated introductions",
  },
  institutional_ready: {
    label: "Institutional-Ready",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: <Users className="w-4 h-4" />,
    description: "Prepared for bank and institutional engagement",
  },
};

const REVIEW_CONFIG: Record<AdminReviewStatus, {
  label: string;
  color: string;
  icon: React.ReactNode;
}> = {
  pending: {
    label: "Pending",
    color: "text-amber-600",
    icon: <Clock className="w-4 h-4" />,
  },
  conditional: {
    label: "Conditional",
    color: "text-blue-600",
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  not_ready: {
    label: "Not Ready",
    color: "text-muted-foreground",
    icon: <XCircle className="w-4 h-4" />,
  },
};

// Helper function to calculate stage based on user engagement
export function calculateTradeReadiness(
  messageCount: number,
  hasSubmittedListing: boolean,
  hasVerifiedPoints: boolean
): { stage: TradeReadinessStage; reviewLikelihood: AdminReviewStatus } {
  if (messageCount >= 15 && hasSubmittedListing && hasVerifiedPoints) {
    return { stage: "institutional_ready", reviewLikelihood: "pending" };
  }
  if (messageCount >= 10 && hasSubmittedListing) {
    return { stage: "trade_ready", reviewLikelihood: "pending" };
  }
  if (messageCount >= 5 || hasSubmittedListing) {
    return { stage: "emerging", reviewLikelihood: "conditional" };
  }
  return { stage: "explorer", reviewLikelihood: "not_ready" };
}

// Generate AI briefings based on stage
export function generateAIBriefings(stage: TradeReadinessStage): {
  doBriefing: string[];
  dontBriefing: string[];
  nextBestAction: string;
  primaryRisk: string;
} {
  const briefings: Record<TradeReadinessStage, {
    doBriefing: string[];
    dontBriefing: string[];
    nextBestAction: string;
    primaryRisk: string;
  }> = {
    explorer: {
      doBriefing: [
        "Engage with Alex to understand trade requirements",
        "Review commodity documentation standards",
        "Clarify your role (buyer, seller, or service provider)",
      ],
      dontBriefing: [
        "Do not submit incomplete listings",
        "Avoid vague quantity or capacity descriptions",
        "Do not expect immediate introductions",
      ],
      nextBestAction: "Start a conversation with Alex about your trade objectives",
      primaryRisk: "Insufficient engagement to assess trade readiness",
    },
    emerging: {
      doBriefing: [
        "Complete all required listing fields accurately",
        "Provide realistic volume and timeline expectations",
        "Include any relevant certifications or licenses",
      ],
      dontBriefing: [
        "Do not exaggerate capacity or volumes",
        "Avoid incomplete contact information",
        "Do not skip the verification process",
      ],
      nextBestAction: "Submit a detailed listing with accurate information",
      primaryRisk: "Documentation gaps or unclear requirements",
    },
    trade_ready: {
      doBriefing: [
        "Ensure all documentation is current and verifiable",
        "Be responsive to admin clarification requests",
        "Prepare for potential introduction timelines",
      ],
      dontBriefing: [
        "Do not provide outdated certificates",
        "Avoid delayed responses to admin queries",
        "Do not make assumptions about counterparty details",
      ],
      nextBestAction: "Monitor your inbox for admin verification updates",
      primaryRisk: "Minor documentation or verification delays",
    },
    institutional_ready: {
      doBriefing: [
        "Maintain complete and verified documentation",
        "Be prepared for institutional due diligence",
        "Ensure financial and trade references are accessible",
      ],
      dontBriefing: [
        "Do not provide inconsistent information across documents",
        "Avoid unrealistic timelines or commitments",
        "Do not bypass AgriSMES's facilitation process",
      ],
      nextBestAction: "Await admin assignment for facilitated introduction",
      primaryRisk: "None identified — profile is well-prepared",
    },
  };

  return briefings[stage];
}

export function AITradeDecisionRoom({
  stage,
  primaryRisk,
  reviewLikelihood,
  doBriefing,
  dontBriefing,
  nextBestAction,
}: TradeDecisionRoomProps) {
  const stageConfig = STAGE_CONFIG[stage];
  const reviewConfig = REVIEW_CONFIG[reviewLikelihood];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 sm:p-6 border-b border-border">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-primary/10">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              AI Trade Decision Room
            </h2>
            <p className="text-xs text-muted-foreground">
              Prepare for verification • Improve listing quality
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Trade Readiness Status */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Trade Readiness Status
          </h3>
          
          <div className="grid gap-3 sm:grid-cols-3">
            {/* Stage */}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                Stage
              </p>
              <div className="flex items-center gap-2">
                <Badge className={`${stageConfig.color} text-xs`}>
                  {stageConfig.icon}
                  <span className="ml-1">{stageConfig.label}</span>
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {stageConfig.description}
              </p>
            </div>

            {/* Primary Risk */}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                Primary Risk
              </p>
              <p className="text-xs text-foreground">
                {primaryRisk || "No specific risks identified"}
              </p>
            </div>

            {/* Admin Review Likelihood */}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                Admin Review
              </p>
              <div className={`flex items-center gap-1.5 ${reviewConfig.color}`}>
                {reviewConfig.icon}
                <span className="text-xs font-medium">{reviewConfig.label}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* AI DO / DON'T Briefing */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* DO */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-emerald-600 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              DO (Improves Approval Chances)
            </h4>
            <ul className="space-y-1.5">
              {doBriefing.map((item, idx) => (
                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                  <Lightbulb className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* DON'T */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-destructive flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" />
              DON'T (Causes Rejection/Delay)
            </h4>
            <ul className="space-y-1.5">
              {dontBriefing.map((item, idx) => (
                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                  <Ban className="w-3 h-3 text-destructive/70 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator />

        {/* Next Best Action */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-medium text-primary mb-1">
                Your Next Best Action
              </h4>
              <p className="text-sm text-foreground">
                {nextBestAction}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-primary shrink-0" />
          </div>
        </div>

        {/* Important Notice */}
        <div className="text-[10px] text-muted-foreground text-center space-y-1">
          <p className="font-medium">
            AI NEVER approves, introduces, or exposes contacts.
          </p>
          <p>
            All decisions and introductions are made by AgriSMES administrators.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default AITradeDecisionRoom;
