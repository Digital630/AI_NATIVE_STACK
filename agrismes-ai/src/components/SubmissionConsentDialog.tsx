import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Shield, Database, Sparkles, ArrowRight, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "./AuthModal";

export interface ConsentValues {
  consentResearch: boolean;
  consentStoreImage: boolean;
  consentMarketing: boolean;
}

interface SubmissionConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (consent: ConsentValues) => void;
  toolType: "qc" | "moisture" | "kg";
  commodity?: string;
  isLoading?: boolean;
}

export function SubmissionConsentDialog({
  open,
  onOpenChange,
  onConfirm,
  toolType,
  commodity,
  isLoading = false,
}: SubmissionConsentDialogProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [consent, setConsent] = useState<ConsentValues>({
    consentResearch: false,
    consentStoreImage: false,
    consentMarketing: false,
  });

  const toolNames: Record<string, string> = {
    qc: "Quality Control",
    moisture: "Moisture Content",
    kg: "Weight Estimation",
  };

  const handleConfirm = () => {
    onConfirm(consent);
    onOpenChange(false);
  };

  const handleSkip = () => {
    onConfirm({
      consentResearch: false,
      consentStoreImage: false,
      consentMarketing: false,
    });
    onOpenChange(false);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // User is now authenticated, they can continue with consent
  };

  // Show auth prompt if not authenticated
  if (!isAuthenticated && !authLoading) {
    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Save Your Results
              </DialogTitle>
              <DialogDescription>
                Sign in or create an account to save your {toolNames[toolType]} results
                {commodity ? ` for ${commodity}` : ""} and track your analysis history.
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <LogIn className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-medium text-foreground mb-2">
                  Create a free account to:
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1 text-left max-w-xs mx-auto">
                  <li>• Save analysis results to your profile</li>
                  <li>• Track submission history over time</li>
                  <li>• Request market access for quality samples</li>
                  <li>• Contribute to agricultural research</li>
                </ul>
              </div>
            </div>

            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button variant="ghost" onClick={handleSkip} disabled={isLoading}>
                Skip for now
              </Button>
              <Button onClick={() => setShowAuthModal(true)} className="gap-1">
                Sign in <ArrowRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          defaultMode="signup"
        />
      </>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Save Your Results
          </DialogTitle>
          <DialogDescription>
            Your {toolNames[toolType]} results{commodity ? ` for ${commodity}` : ""} are ready. 
            Would you like to save them for future reference?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Store Image Consent */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="consent-image"
              checked={consent.consentStoreImage}
              onCheckedChange={(checked) =>
                setConsent({ ...consent, consentStoreImage: checked === true })
              }
            />
            <div className="space-y-1">
              <Label htmlFor="consent-image" className="font-medium cursor-pointer">
                Save my image
              </Label>
              <p className="text-xs text-muted-foreground">
                Store the captured image securely for your records. Only you can access it.
              </p>
            </div>
          </div>

          {/* Research Consent */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="consent-research"
              checked={consent.consentResearch}
              onCheckedChange={(checked) =>
                setConsent({ ...consent, consentResearch: checked === true })
              }
            />
            <div className="space-y-1">
              <Label htmlFor="consent-research" className="font-medium cursor-pointer flex items-center gap-1">
                <Database className="h-3 w-3" />
                Contribute to research
              </Label>
              <p className="text-xs text-muted-foreground">
                Share anonymized data to help improve agri-commodity analysis. No personal info is shared.
              </p>
            </div>
          </div>

          {/* Marketing Consent */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="consent-marketing"
              checked={consent.consentMarketing}
              onCheckedChange={(checked) =>
                setConsent({ ...consent, consentMarketing: checked === true })
              }
            />
            <div className="space-y-1">
              <Label htmlFor="consent-marketing" className="font-medium cursor-pointer flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Enable fun features
              </Label>
              <p className="text-xs text-muted-foreground">
                Allow "Make it Fun" outputs (cartoon, badges) to be saved for sharing.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleSkip} disabled={isLoading}>
            Skip
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading} className="gap-1">
            {isLoading ? "Saving..." : "Save Results"} {!isLoading && <ArrowRight className="h-4 w-4" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
