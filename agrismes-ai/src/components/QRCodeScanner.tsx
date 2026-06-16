import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, ScanLine, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import jsQR from "jsqr";

interface QRCodeScannerProps {
  onScanSuccess: (data: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function QRCodeScanner({ onScanSuccess, onClose, isOpen }: QRCodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanSuccessRef = useRef(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const handleScanSuccess = useCallback((qrData: string) => {
    if (scanSuccessRef.current) return; // Prevent duplicate scans
    scanSuccessRef.current = true;
    stopCamera();
    toast.success("QR Code scanned successfully!");
    onScanSuccess(qrData);
  }, [stopCamera, onScanSuccess]);

  const startScanning = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) return;

    // Use jsQR library for cross-browser compatibility (works on Safari, Chrome, Firefox, etc.)
    scanIntervalRef.current = setInterval(() => {
      if (!video.videoWidth || scanSuccessRef.current) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          const qrData = code.data;
          if (qrData.includes("/redeem?token=")) {
            handleScanSuccess(qrData);
          }
        }
      } catch (err) {
        // Silently ignore detection errors
        console.error("[QRScanner] Detection error:", err);
      }
    }, 150); // Scan every 150ms for better responsiveness
  }, [handleScanSuccess]);

  const startCamera = useCallback(async () => {
    setError(null);
    setIsScanning(true);
    scanSuccessRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        startScanning();
      }
    } catch (err) {
      console.error("[QRScanner] Camera error:", err);
      setError("Unable to access camera. Please ensure camera permissions are granted.");
      setHasCamera(false);
      setIsScanning(false);
    }
  }, [startScanning]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] bg-black/90 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black/50">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Scan Reward QR Code
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Scanner Area */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md aspect-square">
            {/* Video Feed */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover rounded-2xl"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning Overlay */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-3/4 aspect-square">
                  {/* Corner Markers */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                  
                  {/* Scanning Line */}
                  <motion.div
                    animate={{ y: ["0%", "100%", "0%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                  />
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-2xl">
                <div className="text-center p-6">
                  <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
                  <p className="text-white text-sm mb-4">{error}</p>
                  <Button onClick={startCamera} variant="outline" size="sm">
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-black/50">
          <p className="text-white/80 text-center text-sm">
            Position the QR code within the frame to scan
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// In-chat camera button component
interface ScanButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function ScanButton({ onClick, disabled }: ScanButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      className="h-9 w-9 shrink-0"
      title="Scan reward QR code"
    >
      <ScanLine className="h-5 w-5" />
    </Button>
  );
}
