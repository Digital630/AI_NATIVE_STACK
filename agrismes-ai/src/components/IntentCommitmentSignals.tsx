import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  Lock,
  Clock,
  FileText,
  ArrowRight,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export interface IntentCommitmentData {
  confirmedRole: boolean;
  confirmedNoDirectContact: boolean;
  confirmedVerificationTimeline: boolean;
  realisticConstraint: string;
}

interface IntentCommitmentSignalsProps {
  onComplete: (data: IntentCommitmentData) => void;
  onSkip?: () => void;
  initialData?: Partial<IntentCommitmentData>;
  isSubmitting?: boolean;
}

export function IntentCommitmentSignals({
  onComplete,
  onSkip,
  initialData,
  isSubmitting = false,
}: IntentCommitmentSignalsProps) {
  const [confirmedRole, setConfirmedRole] = useState(initialData?.confirmedRole || false);
  const [confirmedNoDirectContact, setConfirmedNoDirectContact] = useState(
    initialData?.confirmedNoDirectContact || false
  );
  const [confirmedVerificationTimeline, setConfirmedVerificationTimeline] = useState(
    initialData?.confirmedVerificationTimeline || false
  );
  const [realisticConstraint, setRealisticConstraint] = useState(
    initialData?.realisticConstraint || ""
  );

  const allCheckboxesConfirmed = confirmedRole && confirmedNoDirectContact && confirmedVerificationTimeline;
  const constraintValid = realisticConstraint.trim().length >= 10;
  const canProceed = allCheckboxesConfirmed && constraintValid;

  const handleComplete = () => {
    if (!canProceed) return;
    onComplete({
      confirmedRole,
      confirmedNoDirectContact,
      confirmedVerificationTimeline,
      realisticConstraint: realisticConstraint.trim(),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="p-2 rounded-xl bg-amber-500/10">
          <Shield className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Intent Commitment</h3>
          <p className="text-xs text-muted-foreground">
            Please confirm your understanding before proceeding
          </p>
        </div>
      </div>

      {/* Checkbox Confirmations */}
      <div className="space-y-4">
        {/* Confirmation 1: Role */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
          <Checkbox
            id="confirm-role"
            checked={confirmedRole}
            onCheckedChange={(checked) => setConfirmedRole(!!checked)}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label
              htmlFor="confirm-role"
              className="text-sm font-medium text-foreground cursor-pointer leading-tight"
            >
              I confirm my role and understand incomplete or unrealistic listings may be delayed or rejected.
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Accurate and complete information improves your chances of admin approval.
            </p>
          </div>
          {confirmedRole && (
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          )}
        </div>

        {/* Confirmation 2: No Direct Contact */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
          <Checkbox
            id="confirm-no-contact"
            checked={confirmedNoDirectContact}
            onCheckedChange={(checked) => setConfirmedNoDirectContact(!!checked)}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label
              htmlFor="confirm-no-contact"
              className="text-sm font-medium text-foreground cursor-pointer leading-tight"
            >
              I understand there is NO direct contact until admin verification.
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              All introductions are facilitated by AgriSMES administrators after review.
            </p>
          </div>
          {confirmedNoDirectContact && (
            <Lock className="w-4 h-4 text-primary shrink-0" />
          )}
        </div>

        {/* Confirmation 3: Verification Timeline */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
          <Checkbox
            id="confirm-timeline"
            checked={confirmedVerificationTimeline}
            onCheckedChange={(checked) => setConfirmedVerificationTimeline(!!checked)}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Label
              htmlFor="confirm-timeline"
              className="text-sm font-medium text-foreground cursor-pointer leading-tight"
            >
              I acknowledge verification timelines may take time.
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Thorough review ensures quality and protects all parties involved.
            </p>
          </div>
          {confirmedVerificationTimeline && (
            <Clock className="w-4 h-4 text-blue-500 shrink-0" />
          )}
        </div>
      </div>

      {/* Realistic Constraint Field */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <Label htmlFor="constraint" className="text-sm font-medium">
            State one realistic constraint you currently face *
          </Label>
        </div>
        <Textarea
          id="constraint"
          placeholder="e.g., 'Limited export documentation experience' or 'Need guidance on Incoterms selection'"
          value={realisticConstraint}
          onChange={(e) => setRealisticConstraint(e.target.value)}
          className="min-h-[80px] text-sm"
          maxLength={500}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            This helps us provide relevant guidance and set realistic expectations.
          </p>
          <span className={`text-xs ${constraintValid ? "text-emerald-600" : "text-muted-foreground"}`}>
            {realisticConstraint.length}/500
          </span>
        </div>
      </div>

      {/* Validation Status */}
      <AnimatePresence>
        {!canProceed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-700 dark:text-amber-400">
                <p className="font-medium">Please complete all requirements:</p>
                <ul className="mt-1 space-y-0.5">
                  {!confirmedRole && <li>• Confirm your role understanding</li>}
                  {!confirmedNoDirectContact && <li>• Acknowledge no direct contact policy</li>}
                  {!confirmedVerificationTimeline && <li>• Accept verification timelines</li>}
                  {!constraintValid && <li>• Describe a realistic constraint (min. 10 characters)</li>}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        {onSkip && (
          <Button
            variant="ghost"
            onClick={onSkip}
            className="text-muted-foreground"
            disabled={isSubmitting}
          >
            Back
          </Button>
        )}
        <Button
          onClick={handleComplete}
          disabled={!canProceed || isSubmitting}
          className="flex-1 gap-2"
        >
          {isSubmitting ? (
            "Processing..."
          ) : (
            <>
              Continue to Listing Details
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>

      {/* Footer Notice */}
      <p className="text-[10px] text-muted-foreground text-center">
        Your commitment signals help filter low-quality submissions and improve admin review efficiency.
      </p>
    </motion.div>
  );
}

export default IntentCommitmentSignals;
