import React from "react";
import { motion } from "framer-motion";
import {
  FileEdit,
  CheckCircle,
  Clock,
  AlertCircle,
  HelpCircle,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// User-facing status types
type ListingCompleteness = "in_progress" | "optimized";
type VerificationReadiness = "pending" | "conditional";
type AdminReviewStatus = "awaiting" | "clarification_required";

interface ListingStatusIndicatorsProps {
  completeness: ListingCompleteness;
  verificationReadiness: VerificationReadiness;
  reviewStatus: AdminReviewStatus;
  showExpectationText?: boolean;
  showNormalizationText?: boolean;
  compact?: boolean;
}

const COMPLETENESS_CONFIG: Record<ListingCompleteness, {
  label: string;
  color: string;
  icon: React.ReactNode;
}> = {
  in_progress: {
    label: "In Progress",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: <FileEdit className="w-3.5 h-3.5" />,
  },
  optimized: {
    label: "Optimized",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
};

const VERIFICATION_CONFIG: Record<VerificationReadiness, {
  label: string;
  color: string;
  icon: React.ReactNode;
}> = {
  pending: {
    label: "Pending",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  conditional: {
    label: "Conditional",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
};

const REVIEW_CONFIG: Record<AdminReviewStatus, {
  label: string;
  color: string;
  icon: React.ReactNode;
}> = {
  awaiting: {
    label: "Awaiting",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  clarification_required: {
    label: "Clarification Required",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: <HelpCircle className="w-3.5 h-3.5" />,
  },
};

export function ListingStatusIndicators({
  completeness,
  verificationReadiness,
  reviewStatus,
  showExpectationText = true,
  showNormalizationText = true,
  compact = false,
}: ListingStatusIndicatorsProps) {
  const completenessConfig = COMPLETENESS_CONFIG[completeness];
  const verificationConfig = VERIFICATION_CONFIG[verificationReadiness];
  const reviewConfig = REVIEW_CONFIG[reviewStatus];

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className={`${completenessConfig.color} text-[10px] cursor-help`}>
                {completenessConfig.icon}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Completeness: {completenessConfig.label}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className={`${verificationConfig.color} text-[10px] cursor-help`}>
                {verificationConfig.icon}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Verification: {verificationConfig.label}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className={`${reviewConfig.color} text-[10px] cursor-help`}>
                {reviewConfig.icon}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Admin Review: {reviewConfig.label}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Status Indicators */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Completeness */}
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">
            Listing Completeness
          </p>
          <Badge className={`${completenessConfig.color} text-xs`}>
            {completenessConfig.icon}
            <span className="ml-1">{completenessConfig.label}</span>
          </Badge>
        </div>

        {/* Verification Readiness */}
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">
            Verification Readiness
          </p>
          <Badge className={`${verificationConfig.color} text-xs`}>
            {verificationConfig.icon}
            <span className="ml-1">{verificationConfig.label}</span>
          </Badge>
        </div>

        {/* Admin Review */}
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">
            Admin Review
          </p>
          <Badge className={`${reviewConfig.color} text-xs`}>
            {reviewConfig.icon}
            <span className="ml-1">{reviewConfig.label}</span>
          </Badge>
        </div>
      </div>

      {/* Expectation Text */}
      {showExpectationText && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-400">
              <span className="font-medium">Expectation:</span> Listings like yours often require review time. This is normal and not a rejection.
            </p>
          </div>
        </div>
      )}

      {/* Normalization Text */}
      {showNormalizationText && reviewStatus === "clarification_required" && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <span className="font-medium">Note:</span> A delayed or returned listing does not mean you are unsuitable for trade. Additional information helps us serve you better.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Helper function to derive status from database values
export function deriveListingStatus(listing: {
  listing_completeness?: string | null;
  admin_review_status?: string | null;
  confirmed_role?: boolean;
  confirmed_no_direct_contact?: boolean;
  confirmed_verification_timeline?: boolean;
  realistic_constraint?: string | null;
}): {
  completeness: ListingCompleteness;
  verificationReadiness: VerificationReadiness;
  reviewStatus: AdminReviewStatus;
} {
  // Derive completeness
  const hasAllCommitments = 
    listing.confirmed_role && 
    listing.confirmed_no_direct_contact && 
    listing.confirmed_verification_timeline &&
    listing.realistic_constraint;
  
  const completeness: ListingCompleteness = hasAllCommitments ? "optimized" : "in_progress";

  // Derive verification readiness
  const verificationReadiness: VerificationReadiness = 
    listing.admin_review_status === "approved" || listing.admin_review_status === "pending"
      ? "pending"
      : "conditional";

  // Derive review status
  const reviewStatus: AdminReviewStatus =
    listing.admin_review_status === "conditional" || listing.admin_review_status === "not_ready"
      ? "clarification_required"
      : "awaiting";

  return { completeness, verificationReadiness, reviewStatus };
}

export default ListingStatusIndicators;
