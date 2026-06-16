import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSubmissionStorage } from "@/hooks/useSubmissionStorage";

interface MarketAccessCTAProps {
  submissionId: string | null;
  commodity: string;
  isMarketReady: boolean;
  grade?: string;
  qualityNotes?: string;
}

export function MarketAccessCTA({
  submissionId,
  commodity,
  isMarketReady,
  grade,
  qualityNotes,
}: MarketAccessCTAProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [volumeEstimate, setVolumeEstimate] = useState("");
  const [preferredMarket, setPreferredMarket] = useState<"local" | "export" | "both">("both");

  const { requestMarketAccess } = useSubmissionStorage();

  // Don't show if not market ready or no submission
  if (!isMarketReady || !submissionId) {
    return null;
  }

  const handleSubmit = async () => {
    if (!volumeEstimate.trim()) {
      toast.error("Please enter an estimated volume");
      return;
    }

    setIsSubmitting(true);

    try {
      const requestId = await requestMarketAccess(
        submissionId,
        commodity,
        volumeEstimate,
        preferredMarket
      );

      if (requestId) {
        setIsSuccess(true);
        toast.success("Market access request submitted!");
      } else {
        toast.error("Please sign in to request market access");
      }
    } catch (err) {
      console.error("Market access error:", err);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
      >
        <TrendingUp className="h-4 w-4" />
        Request Market Access
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          {!isSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Request Market Access
                </DialogTitle>
                <DialogDescription>
                  Your {commodity} meets market-ready standards
                  {grade && ` (${grade})`}. Connect with verified buyers and traders.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Quality Summary */}
                <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                  <p className="text-sm font-medium text-green-800">
                    ✓ Quality Verified: {commodity}
                  </p>
                  {qualityNotes && (
                    <p className="text-xs text-green-600 mt-1">{qualityNotes}</p>
                  )}
                </div>

                {/* Volume Estimate */}
                <div className="space-y-2">
                  <Label htmlFor="volume">Estimated Volume (MT/month)</Label>
                  <Input
                    id="volume"
                    placeholder="e.g., 5, 10-20, 50+"
                    value={volumeEstimate}
                    onChange={(e) => setVolumeEstimate(e.target.value)}
                  />
                </div>

                {/* Preferred Market */}
                <div className="space-y-2">
                  <Label htmlFor="market">Preferred Market</Label>
                  <Select
                    value={preferredMarket}
                    onValueChange={(v) => setPreferredMarket(v as "local" | "export" | "both")}
                  >
                    <SelectTrigger id="market">
                      <SelectValue placeholder="Select market" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local Market</SelectItem>
                      <SelectItem value="export">Export Market</SelectItem>
                      <SelectItem value="both">Both Markets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Request Submitted!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Our team will review your {commodity} profile and connect you with 
                  suitable buyers. Expect a response within 2-3 business days.
                </p>
              </div>
              <Button onClick={() => setIsOpen(false)}>Done</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
