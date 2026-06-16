import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Lock,
  Unlock,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AdminCodeEntryProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminVerified: () => void;
}

const VISITOR_ID_KEY = "agrismes_visitor_id";

// Generate a simple device fingerprint (browser-based)
function getDeviceFingerprint(): string {
  const nav = navigator;
  const screen = window.screen;
  const fingerprint = [
    nav.userAgent,
    nav.language,
    screen.colorDepth,
    screen.width + "x" + screen.height,
    new Date().getTimezoneOffset(),
  ].join("|");
  
  // Simple hash
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function AdminCodeEntry({
  isOpen,
  onClose,
  onAdminVerified,
}: AdminCodeEntryProps) {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);

  const visitorId = localStorage.getItem(VISITOR_ID_KEY) || "";
  const deviceFingerprint = getDeviceFingerprint();

  // Check lockout status when dialog opens
  useEffect(() => {
    if (isOpen && visitorId) {
      checkLockoutStatus();
    }
  }, [isOpen, visitorId]);

  const checkLockoutStatus = async () => {
    try {
      const response = await supabase.functions.invoke("admin-lockout-check", {
        body: { visitorId, deviceFingerprint },
      });

      if (response.data?.locked) {
        setIsLocked(true);
        setLockMessage(
          `Admin access is locked. Try again in ${response.data.remainingMinutes} minutes.`
        );
      } else {
        setIsLocked(false);
        setLockMessage(null);
      }
    } catch (err) {
      console.error("[AdminCodeEntry] Lockout check error:", err);
    }
  };

  const handleVerify = async () => {
    if (isLocked || !code.trim()) return;
    if (code.trim().length < 8) {
      setError("Admin code must be at least 8 characters.");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const response = await supabase.functions.invoke("admin-verify", {
        body: { code, visitorId, deviceFingerprint },
      });

      if (response.error) {
        throw new Error(response.error.message || "Verification failed");
      }

      const data = response.data;

      if (data.success) {
        // Server verified successfully — store the signed session token used to
        // authorize privileged admin endpoints, plus the UI-only access flag.
        if (data.token) {
          localStorage.setItem("agrismes_admin_token", data.token);
        }
        localStorage.setItem("agrismes_admin_access", "true");
        toast.success("Admin access granted! Full contact details are now visible.");
        onAdminVerified();
        onClose();
        setCode("");
        setRemainingAttempts(null);
      } else if (data.locked) {
        // Locked out
        setIsLocked(true);
        setLockMessage(data.message);
        setError(data.message);
        
        // Dispatch event to hide admin icon
        if (data.hideIcon) {
          window.dispatchEvent(new CustomEvent("adminLockout", { detail: { locked: true } }));
        }
      } else {
        // Wrong code, show remaining attempts
        setRemainingAttempts(data.remainingAttempts);
        setError(data.message);
      }
    } catch (err) {
      console.error("[AdminCodeEntry] Verification error:", err);
      setError("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setCode("");
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm z-[10000]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Admin Access
          </DialogTitle>
          <DialogDescription>
            Enter your admin code to bypass points requirement and view full contact details.
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 mt-4"
        >
          {/* Code Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Admin Code</label>
            <div className="relative">
              <Input
                type={showCode ? "text" : "password"}
                maxLength={64}
                autoComplete="off"
                placeholder="Enter admin code (min 8 characters)"
                value={code}
                onChange={(e) => {
                  // Allow letters, numbers, and symbols; cap at 64 chars.
                  const value = e.target.value.slice(0, 64);
                  setCode(value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && code.trim().length >= 8 && !isLocked) {
                    handleVerify();
                  }
                }}
                disabled={isLocked}
                className={`pr-10 font-mono h-12 ${error ? "border-destructive" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCode ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2 text-destructive text-sm bg-destructive/10 rounded-lg p-3"
              >
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Lockout Notice */}
          {isLocked && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg p-3"
            >
              <Lock className="w-4 h-4" />
              <span>{lockMessage || "Account temporarily locked for security."}</span>
            </motion.div>
          )}

          {/* Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleVerify}
              disabled={code.trim().length < 8 || isVerifying || isLocked}
              className="flex-1 gap-2"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  Verify
                </>
              )}
            </Button>
          </div>

          {/* Security Note */}
          <p className="text-[10px] text-muted-foreground text-center">
            Admin access is logged for security purposes. Failed attempts may result in temporary lockout.
          </p>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
