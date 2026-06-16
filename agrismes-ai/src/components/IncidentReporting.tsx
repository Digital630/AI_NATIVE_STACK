import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, 
  Flag, 
  FileWarning, 
  UserX, 
  MessageSquare,
  Send,
  Loader2,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type IncidentType = 
  | "incorrect_listing"
  | "misrepresentation"
  | "suspected_fraud"
  | "document_issue"
  | "other";

const INCIDENT_TYPES: Record<IncidentType, { label: string; icon: React.ReactNode; description: string }> = {
  incorrect_listing: {
    label: "Incorrect Listing",
    icon: <FileWarning className="w-4 h-4" />,
    description: "Listing contains inaccurate or outdated information",
  },
  misrepresentation: {
    label: "Misrepresentation Concern",
    icon: <UserX className="w-4 h-4" />,
    description: "Party may not be who they claim to be",
  },
  suspected_fraud: {
    label: "Suspected Fraud",
    icon: <AlertTriangle className="w-4 h-4" />,
    description: "Suspicious behavior or potential fraud detected",
  },
  document_issue: {
    label: "Document Issue",
    icon: <Flag className="w-4 h-4" />,
    description: "Problems with submitted documentation",
  },
  other: {
    label: "Other Issue",
    icon: <MessageSquare className="w-4 h-4" />,
    description: "Another type of concern not listed above",
  },
};

interface IncidentReportingProps {
  listingId?: string;
  context?: string;
  className?: string;
}

export function IncidentReportingButton({ listingId, context, className }: IncidentReportingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [incidentType, setIncidentType] = useState<IncidentType | "">("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!incidentType || !description.trim()) return;

    setIsSubmitting(true);
    
    // Simulate submission (would connect to Supabase in production)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Reset after showing success
    setTimeout(() => {
      setIsOpen(false);
      setIsSubmitted(false);
      setIncidentType("");
      setDescription("");
    }, 2000);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={cn("gap-1.5 text-muted-foreground hover:text-destructive", className)}
      >
        <Flag className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Report an Issue</span>
        <span className="sm:hidden">Report</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Report an Issue
            </DialogTitle>
            <DialogDescription>
              Help us maintain platform integrity. Your report will be reviewed by AgriSMES.
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {isSubmitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Report Submitted</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Thank you. Our team will review this incident.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {/* Incident Type Selection */}
                <div className="space-y-2">
                  <Label>Type of Issue</Label>
                  <Select value={incidentType} onValueChange={(v) => setIncidentType(v as IncidentType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select issue type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(INCIDENT_TYPES).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            {config.icon}
                            <span>{config.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {incidentType && (
                    <p className="text-xs text-muted-foreground">
                      {INCIDENT_TYPES[incidentType].description}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Please describe the issue in detail..."
                    className="min-h-[100px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Include any relevant details that would help us investigate.
                  </p>
                </div>

                {/* Context Info */}
                {(listingId || context) && (
                  <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Report Context</p>
                    {listingId && <p>Listing ID: {listingId}</p>}
                    {context && <p>{context}</p>}
                  </div>
                )}

                {/* What Happens Next */}
                <div className="bg-accent/30 border border-border rounded-lg p-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">What Happens Next</p>
                  <ul className="space-y-1">
                    <li>• Incidents trigger internal review</li>
                    <li>• AgriSMES may suspend listings or access if needed</li>
                    <li>• You may be contacted for additional information</li>
                  </ul>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={!incidentType || !description.trim() || isSubmitting}
                  className="w-full gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Report
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Compact incident link for footers/sidebars
export function IncidentReportLink({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline",
          className
        )}
      >
        Report an Issue
      </button>
      
      {/* Reuse the same dialog */}
      <IncidentReportingButton listingId="" context="" className="hidden" />
    </>
  );
}
