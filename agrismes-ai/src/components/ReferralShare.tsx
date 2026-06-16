import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Copy, Check, Users, Gift, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReferralSystem } from "@/hooks/useReferralSystem";
import { toast } from "sonner";
import { trackReferralLinkCopied, trackReferralLinkShared } from "@/utils/googleAnalytics";

interface ReferralShareProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function ReferralShare({ isOpen, onClose, className = "" }: ReferralShareProps) {
  const { referralData, isLoading, initializeReferralCode, REFERRAL_POINTS } = useReferralSystem();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && !referralData) {
      initializeReferralCode();
    }
  }, [isOpen, referralData, initializeReferralCode]);

  const handleCopy = async () => {
    if (!referralData) return;
    
    try {
      await navigator.clipboard.writeText(referralData.referralLink);
      setCopied(true);
      toast.success("Referral link copied!");
      
      // Track in Google Analytics
      trackReferralLinkCopied(referralData.referralCode);
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = async () => {
    if (!referralData) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "AgriSMES - Agribusiness Trade Readiness",
          text: "Explore AgriSMES for agri-commodity trade support, export readiness, and SME financing guidance.",
          url: referralData.referralLink,
        });
        
        // Track successful share
        trackReferralLinkShared(referralData.referralCode, "native_share");
      } catch (err) {
        // User cancelled or error - fallback to copy
        handleCopy();
      }
    } else {
      handleCopy();
      trackReferralLinkShared(referralData.referralCode, "copy_fallback");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`bg-card border border-border rounded-xl p-5 shadow-lg ${className}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Gift className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Share & Earn Points</h3>
                <p className="text-xs text-muted-foreground">+{REFERRAL_POINTS} pts per referral</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-6">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground mt-2">Generating your referral link...</p>
            </div>
          ) : referralData ? (
            <>
              {/* Referral link */}
              <div className="bg-muted/50 rounded-lg p-3 mb-4">
                <p className="text-xs text-muted-foreground mb-1">Your referral link:</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-foreground bg-background px-2 py-1 rounded flex-1 truncate border">
                    {referralData.referralLink}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>

              {/* Stats */}
              {referralData.convertedReferrals > 0 && (
                <div className="flex items-center gap-4 mb-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      <span className="font-medium text-foreground">{referralData.convertedReferrals}</span> referrals
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Gift className="h-3.5 w-3.5 text-primary" />
                    <span className="text-muted-foreground">
                      <span className="font-medium text-primary">+{referralData.pointsEarned}</span> pts earned
                    </span>
                  </div>
                </div>
              )}

              {/* Share button */}
              <Button onClick={handleShare} className="w-full gap-2" size="sm">
                <Share2 className="h-4 w-4" />
                Share with Network
              </Button>

              {/* How it works */}
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Share your link with colleagues in agribusiness. When they engage with AgriSMES, 
                  you both earn RewardFlow points to unlock exclusive services like matchmaking and trade consultations.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-xs text-muted-foreground">Unable to generate referral link</p>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={initializeReferralCode}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Compact inline trigger button
export function ReferralShareTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-muted/50"
    >
      <Share2 className="h-3 w-3" />
      <span>Share & Earn</span>
    </button>
  );
}
