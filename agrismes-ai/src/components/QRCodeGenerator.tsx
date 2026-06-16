import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import { Gift, Download, Scan, Clock, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LevelName } from "@/hooks/useRewardPoints";
import rewardflowIcon from "@/assets/rewardflow-icon.png";

interface QRCodeGeneratorProps {
  visitorId: string;
  points: number;
  level: LevelName;
  onQRGenerated?: () => void;
}

export function QRCodeGenerator({ visitorId, points, level, onQRGenerated }: QRCodeGeneratorProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  const generateToken = () => {
    // Generate a secure random token
    const array = new Uint8Array(24);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const generateQRCode = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const newToken = generateToken();
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry

      // Save token to database
      const { error: insertError } = await supabase
        .from("redemption_tokens")
        .insert({
          visitor_id: visitorId,
          token: newToken,
          points_at_creation: points,
          level_at_creation: level,
          expires_at: expiry.toISOString(),
        });

      if (insertError) {
        console.error("[QRCode] Insert error:", insertError);
        throw new Error("Failed to save redemption token");
      }

      // Generate QR code URL that links to redemption page
      // Use production URL so mobile camera scans redirect to the correct site
      const productionUrl = "https://wwwagrismescom.lovable.app";
      const redemptionUrl = `${productionUrl}/redeem?token=${newToken}`;
      
      // Generate QR code as data URL with custom styling
      const qrUrl = await QRCode.toDataURL(redemptionUrl, {
        width: 280,
        margin: 2,
        color: {
          dark: "#1a1a1a",
          light: "#ffffff",
        },
        errorCorrectionLevel: "H",
      });

      setQrDataUrl(qrUrl);
      setToken(newToken);
      setExpiresAt(expiry);
      onQRGenerated?.();
    } catch (err) {
      console.error("[QRCode] Generation error:", err);
      setError("Failed to generate QR code. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrDataUrl) return;
    
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `agrismes-rewards-${token?.slice(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTimeRemaining = () => {
    if (!expiresAt) return "";
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="bg-gradient-to-br from-primary/5 via-background to-accent/10 rounded-xl p-6 border border-border shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Gift className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Redeem Your Points</h3>
          <p className="text-xs text-muted-foreground">
            Scan to unlock exclusive AgriSMES services
          </p>
        </div>
      </div>

      {/* Points Display */}
      <div className="bg-card rounded-lg p-4 mb-4 border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={rewardflowIcon}
              alt="RewardFlow"
              className="h-6 w-6"
              style={{ filter: "sepia(1) saturate(5) hue-rotate(90deg) brightness(0.9)" }}
            />
            <span className="text-2xl font-bold text-primary">{points}</span>
            <span className="text-sm text-muted-foreground">points</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <Award className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">{level}</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!qrDataUrl ? (
          <motion.div
            key="generate"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Button
              onClick={generateQRCode}
              disabled={isGenerating || points < 100}
              className="w-full gap-2"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Generating...
                </>
              ) : (
                <>
                  <Scan className="w-5 h-5" />
                  Generate Redemption QR Code
                </>
              )}
            </Button>
            {points < 100 && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Earn at least 100 points to unlock redemption
              </p>
            )}
            {error && (
              <p className="text-xs text-destructive text-center mt-2">{error}</p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="qr"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-4"
          >
            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-3 rounded-xl shadow-lg">
                <img
                  src={qrDataUrl}
                  alt="Redemption QR Code"
                  className="w-64 h-64"
                />
              </div>
            </div>

            {/* Congratulations Message */}
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-foreground">
                🎉 Congratulations!
              </p>
              <p className="text-sm text-muted-foreground">
                You have earned <span className="font-bold text-primary">{points} points</span>!
                Scan this code to unlock exclusive AgriSMES services.
              </p>
            </div>

            {/* Expiry Timer */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Expires in {formatTimeRemaining()}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={downloadQRCode}
                className="flex-1 gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button
                onClick={() => {
                  setQrDataUrl(null);
                  setToken(null);
                  setExpiresAt(null);
                }}
                variant="ghost"
                className="flex-1"
              >
                Generate New
              </Button>
            </div>

            {/* Instructions */}
            <div className="bg-accent/30 rounded-lg p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">How to redeem:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Open camera on your phone</li>
                <li>Point at the QR code</li>
                <li>Tap the link to view available services</li>
                <li>Choose a service to unlock</li>
              </ol>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
