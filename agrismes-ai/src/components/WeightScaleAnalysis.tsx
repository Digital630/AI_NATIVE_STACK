import { useState, useRef, useCallback, useEffect } from "react";
import { Scale, Camera, Upload, X, Download, Share2, RefreshCw, Package, AlertCircle, CheckCircle, CheckCircle2, Info, Clock, Activity } from "lucide-react";
import { useSubmissionStorage, type SubmissionConsent } from "@/hooks/useSubmissionStorage";
import { SubmissionConsentDialog } from "./SubmissionConsentDialog";
import { MakeItFunButton } from "./MakeItFunButton";
import { MarketAccessCTA } from "./MarketAccessCTA";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";
import bwipjs from "bwip-js";
import {
  attachStreamToVideo,
  waitForVideoReady,
  captureStillJpegDataUrl,
} from "@/utils/cameraCapture";
import { InstitutionalAnalyzingScreen } from "./InstitutionalAnalyzingScreen";
import { InstitutionalFullScreenSpinner } from "./InstitutionalFullScreenSpinner";
import { StorageContextPanel } from "./StorageContextPanel";
import type { StorageContext } from "@/utils/weatherRiskCalculations";
import { generateStorageInterpretation } from "@/utils/weatherRiskCalculations";
import { createAuditEntry, calculateConfidenceScore } from "@/utils/internalControlLayers";
import { calculateWeightStabilityRange, type ConfidenceLevel } from "./AnalysisRangeDisplay";
import { AnalysisDisclaimer } from "./AnalysisDisclaimer";

interface IndividualPackage {
  packageNumber: number;
  estimatedWeightKg: number;
  commodityType: string;
  commodityGrade?: string;
  commoditySize?: string;
  packagingType: string;
  dimensions: {
    estimatedLength: string;
    estimatedWidth: string;
    estimatedHeight: string;
  };
}

interface WeightEstimation {
  estimatedWeightKg: number;
  weightRange: {
    min: number;
    max: number;
  };
  confidenceLevel: "high" | "moderate" | "low";
  commodityType: string;
  commodityGrade?: string;
  commoditySize?: string;
  commodityVariety?: string;
  packagingType: string;
  packageCount: number;
  dimensions: {
    estimatedLength: string;
    estimatedWidth: string;
    estimatedHeight: string;
  };
  recommendations: string[];
  qualityNotes: string;
  individualPackages?: IndividualPackage[];
}

interface WeightScaleAnalysisProps {
  onClose: () => void;
  sessionId?: string;
  visitorId?: string;
}

type CaptureMode = "camera" | "upload" | "library";
type AnalysisPhase = "select" | "instructions" | "capture" | "analyzing" | "result";

export function WeightScaleAnalysis({ onClose, sessionId, visitorId }: WeightScaleAnalysisProps) {
  const [phase, setPhase] = useState<AnalysisPhase>("select");
  const [captureMode, setCaptureMode] = useState<CaptureMode>("camera");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [estimation, setEstimation] = useState<WeightEstimation | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // 3-layer storage state
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [consent, setConsent] = useState<SubmissionConsent>({ consentResearch: false, consentStoreImage: false, consentMarketing: false });
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const { storeSubmission, isStoring } = useSubmissionStorage();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [stream, previewUrl]);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        await attachStreamToVideo(videoRef.current, mediaStream);
      }
      setPhase("capture");
    } catch (error) {
      console.error("Camera access error:", error);
      toast.error("Could not access camera. Please check permissions.");
      setPhase("select");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const handleModeSelect = (mode: CaptureMode) => {
    setCaptureMode(mode);
    if (mode === "camera") {
      setPhase("instructions");
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleStartCapture = async () => {
    await startCamera();
  };

  const handleCapturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !stream) return;

    // Countdown
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise(r => setTimeout(r, 1000));
    }
    setCountdown(null);

    try {
      const dataUrl = await captureStillJpegDataUrl({
        stream,
        video: videoRef.current,
        canvas: canvasRef.current,
        quality: 0.9,
        maxWidth: 1920,
      });
      
      stopCamera();
      setPreviewUrl(dataUrl);
      analyzeImage(dataUrl);
    } catch (error) {
      console.error("Capture error:", error);
      toast.error("Failed to capture photo. Please try again.");
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image too large. Please use an image under 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPreviewUrl(dataUrl);
      analyzeImage(dataUrl);
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const analyzeImage = async (dataUrl: string) => {
    setPhase("analyzing");
    setIsAnalyzing(true);

    try {
      const base64Data = dataUrl.split(",")[1];
      const mimeMatch = dataUrl.match(/data:([^;]+);/);
      const mimeType = mimeMatch?.[1] || "image/jpeg";

      const { data, error } = await supabase.functions.invoke("analyze-weight-scale", {
        body: { imageBase64: base64Data, mimeType, sessionId, visitorId },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.rejected) {
        toast.error(data.message, { duration: 6000 });
        setPreviewUrl(null);
        setIsAnalyzing(false);
        setPhase("select");
        return;
      }

      if (data?.estimation) {
        setEstimation(data.estimation);
        setPhase("result");
        toast.success("Weight estimation complete!");
      } else {
        throw new Error("No estimation data received");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Analysis failed. Please try again with a clearer photo.");
      setPhase("select");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generatePDFBlob = async (): Promise<Blob> => {
    if (!estimation) throw new Error("No estimation data");

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // === OUTER DECORATIVE BORDER ===
    doc.setDrawColor(0, 80, 50);
    doc.setLineWidth(2.5);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16);
    
    doc.setDrawColor(34, 139, 80);
    doc.setLineWidth(0.5);
    doc.rect(12, 12, pageWidth - 24, pageHeight - 24);
    
    // Corner decorations
    const corners = [[12, 12], [pageWidth - 12, 12], [12, pageHeight - 12], [pageWidth - 12, pageHeight - 12]];
    doc.setFillColor(0, 80, 50);
    corners.forEach(([x, y]) => {
      doc.circle(x, y, 2, 'F');
    });

    // === HEADER SECTION ===
    doc.setFillColor(0, 80, 50);
    doc.rect(12, 12, pageWidth - 24, 35, "F");

    // Generate barcode in header
    const certId = `WE-${Date.now().toString(36).toUpperCase()}`;
    try {
      const barcodeCanvas = document.createElement("canvas");
      bwipjs.toCanvas(barcodeCanvas, {
        bcid: "code128",
        text: certId,
        scale: 2,
        height: 8,
        includetext: false,
        backgroundcolor: "ffffff",
      });
      const barcodeDataUrl = barcodeCanvas.toDataURL("image/png");
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin + 2, 16, 45, 14, 1, 1, 'F');
      doc.addImage(barcodeDataUrl, 'PNG', margin + 4, 18, 41, 10);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(255, 255, 255);
      doc.text(certId, margin + 24.5, 33, { align: 'center' });
    } catch (err) {
      console.error("Barcode generation failed:", err);
    }

    // Add commodity image to header if available
    if (previewUrl) {
      try {
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(pageWidth - margin - 47, 16, 45, 28, 2, 2, 'F');
        doc.addImage(previewUrl, 'JPEG', pageWidth - margin - 45, 18, 41, 24);
      } catch (err) {
        console.error("Failed to add commodity image:", err);
      }
    }

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("WEIGHT ESTIMATION", pageWidth / 2, 30, { align: "center" });
    doc.setFontSize(12);
    doc.text("CERTIFICATE", pageWidth / 2, 38, { align: "center" });

    // Certificate date and time
    const testDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric"
    });
    const testTime = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit", minute: "2-digit"
    });

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Certificate ID: ${certId}`, 20, 55);
    doc.text(`Date: ${testDate} at ${testTime}`, pageWidth - 20, 55, { align: "right" });

    // Main weight display
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(20, 62, pageWidth - 40, 45, 3, 3, "F");

    doc.setTextColor(34, 139, 34);
    doc.setFontSize(42);
    doc.setFont("helvetica", "bold");
    doc.text(`${estimation.estimatedWeightKg} kg`, pageWidth / 2, 87, { align: "center" });

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Range: ${estimation.weightRange.min} - ${estimation.weightRange.max} kg`, pageWidth / 2, 99, { align: "center" });

    // Confidence badge
    const confidenceColors: Record<string, number[]> = {
      high: [34, 139, 34],
      moderate: [234, 179, 8],
      low: [239, 68, 68],
    };
    const confColor = confidenceColors[estimation.confidenceLevel] || [100, 100, 100];
    doc.setFillColor(confColor[0], confColor[1], confColor[2]);
    doc.roundedRect(pageWidth / 2 - 25, 102, 50, 8, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(`${estimation.confidenceLevel.toUpperCase()} CONFIDENCE`, pageWidth / 2, 107.5, { align: "center" });

    // Details section
    let yPos = 122;
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("COMMODITY DETAILS", 20, yPos);
    yPos += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const details = [
      ["Commodity Type:", estimation.commodityType],
      ["Packaging Type:", estimation.packagingType],
      ["Package Count:", estimation.packageCount.toString()],
      ["Est. Dimensions:", `${estimation.dimensions.estimatedLength} × ${estimation.dimensions.estimatedWidth} × ${estimation.dimensions.estimatedHeight}`],
    ];

    details.forEach(([label, value]) => {
      doc.setTextColor(100, 100, 100);
      doc.text(label, 20, yPos);
      doc.setTextColor(30, 30, 30);
      doc.text(value, 70, yPos);
      yPos += 7;
    });

    // Quality notes
    yPos += 5;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("QUALITY NOTES", 20, yPos);
    yPos += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const notesLines = doc.splitTextToSize(estimation.qualityNotes, pageWidth - 45);
    doc.text(notesLines, 20, yPos);
    yPos += notesLines.length * 5 + 8;

    // Recommendations
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("RECOMMENDATIONS", 20, yPos);
    yPos += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    estimation.recommendations.forEach((rec, i) => {
      doc.setTextColor(34, 139, 34);
      doc.text("•", 20, yPos);
      doc.setTextColor(80, 80, 80);
      const recLines = doc.splitTextToSize(rec, pageWidth - 50);
      doc.text(recLines, 25, yPos);
      yPos += recLines.length * 5 + 3;
    });

    // Barcode
    try {
      const barcodeCanvas = document.createElement("canvas");
      bwipjs.toCanvas(barcodeCanvas, {
        bcid: "code128",
        text: certId,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: "center",
      });
      const barcodeDataUrl = barcodeCanvas.toDataURL("image/png");
      doc.addImage(barcodeDataUrl, "PNG", pageWidth / 2 - 30, pageHeight - 55, 60, 20);
    } catch (e) {
      console.error("Barcode generation failed:", e);
    }

    // Disclaimer
    doc.setFillColor(255, 248, 220);
    doc.roundedRect(15, pageHeight - 32, pageWidth - 30, 12, 2, 2, "F");
    doc.setFontSize(7);
    doc.setTextColor(120, 100, 60);
    doc.text(
      "DISCLAIMER: This is a visual estimation only. Actual weight may vary. Always verify with a certified weighing scale before trade.",
      pageWidth / 2,
      pageHeight - 25,
      { align: "center", maxWidth: pageWidth - 40 }
    );

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("AgriSMES.com", pageWidth / 2, pageHeight - 12, { align: "center" });

    return doc.output("blob");
  };

  const handleDownload = async () => {
    try {
      const blob = await generatePDFBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `weight-estimate-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Certificate downloaded!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download certificate.");
    }
  };

  const handleShare = async () => {
    try {
      const blob = await generatePDFBlob();
      const file = new File([blob], `weight-estimate-${Date.now()}.pdf`, { type: "application/pdf" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
        toast.success("Shared successfully!");
      } else {
        handleDownload();
      }
    } catch (error) {
      console.error("Share error:", error);
      handleDownload();
    }
  };

  const handleRetry = () => {
    stopCamera();
    setPreviewUrl(null);
    setEstimation(null);
    setPhase("select");
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const getConfidenceIcon = (level: string) => {
    switch (level) {
      case "high": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "moderate": return <Info className="w-4 h-4 text-yellow-600" />;
      default: return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case "high": return "bg-green-100 text-green-800 border-green-200";
      case "moderate": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-red-100 text-red-800 border-red-200";
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-green-600" />
          <span className="font-semibold text-gray-800">Weight Scale</span>
        </div>
        <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Selection Phase */}
        {phase === "select" && (
          <div className="space-y-4">
            <div className="text-center space-y-2 mb-6">
              <Package className="w-12 h-12 mx-auto text-green-600" />
              <h3 className="text-lg font-semibold text-gray-800">Estimate Package Weight</h3>
              <p className="text-sm text-gray-600">
                Scan commodity bags, boxes, or packages to get an instant weight estimation in kilograms.
              </p>
            </div>

            <div className="grid gap-3">
              <Button
                onClick={() => handleModeSelect("camera")}
                className="h-14 gap-3 bg-green-600 hover:bg-green-700"
              >
                <Camera className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Take Photo</div>
                  <div className="text-xs opacity-80">Capture with camera</div>
                </div>
              </Button>

              <Button
                onClick={() => handleModeSelect("library")}
                variant="outline"
                className="h-14 gap-3 border-green-200 text-green-700 hover:bg-green-50"
              >
                <Upload className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Photo Library</div>
                  <div className="text-xs text-gray-500">Select existing image</div>
                </div>
              </Button>

              <Button
                onClick={() => handleModeSelect("upload")}
                variant="outline"
                className="h-14 gap-3 border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <Upload className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Choose File</div>
                  <div className="text-xs text-gray-500">Upload from device</div>
                </div>
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}

        {/* Instructions Phase - Enhanced with better guidance */}
        {phase === "instructions" && (
          <div className="space-y-4">
            <div className="text-center space-y-2 mb-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                <Scale className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Weight Estimation Tips</h3>
              <p className="text-sm text-muted-foreground">
                Follow these tips for accurate results
              </p>
            </div>

            <div className="grid gap-3">
              {[
                { icon: Package, title: "Frame the Package", desc: "Ensure the entire bag/box is visible. Include all packages if multiple." },
                { icon: Camera, title: "Focus Clearly", desc: "Tap to focus on the package. Sharp images give better estimates." },
                { icon: Scale, title: "Show Size Reference", desc: "If possible, include a hand, ruler, or pallet for scale comparison." },
                { icon: AlertCircle, title: "Good Lighting", desc: "Ensure the area is well-lit. Avoid shadows covering the package." },
              ].map((item, index) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary flex-shrink-0">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>

            {/* Visual overlay preview */}
            <div className="aspect-[4/3] bg-muted/30 rounded-lg border-2 border-dashed border-primary/30 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-4 border-2 border-primary/30 rounded-lg" />
              <div className="text-center z-10">
                <Package className="w-16 h-16 mx-auto text-primary/30 mb-2" />
                <p className="text-sm text-muted-foreground">Position package within frame</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPhase("select")} className="flex-1">
                Back
              </Button>
              <Button onClick={handleStartCapture} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Start Camera
              </Button>
            </div>

            <p className="text-[10px] text-center text-muted-foreground">
              Weight estimates are AI-generated approximations. For accurate weights, use a calibrated scale.
            </p>
          </div>
        )}

        {/* Capture Phase */}
        {phase === "capture" && (
          <div className="space-y-4">
            <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Overlay frame */}
              <div className="absolute inset-4 border-2 border-white/50 rounded-lg pointer-events-none" />
              
              {/* Corner markers */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg" />

              {/* Countdown overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="text-6xl font-bold text-white animate-pulse">{countdown}</span>
                </div>
              )}
            </div>

            <p className="text-center text-sm text-gray-600">
              Position the package within the frame, then tap to capture
            </p>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRetry} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleCapturePhoto}
                className="flex-1 h-12 bg-primary hover:bg-primary/90 gap-2"
                disabled={countdown !== null}
              >
                <Camera className="w-5 h-5" />
                Capture Camera
              </Button>
            </div>
          </div>
        )}

        {/* Analyzing Phase - Institutional grade full-screen analyzing state */}
        {phase === "analyzing" && (
          <InstitutionalAnalyzingScreen type="weight" capturedImage={previewUrl} />
        )}

        {/* Result Phase */}
        {phase === "result" && estimation && (
          <div className="space-y-4">
            {/* Total Weight Badge with Stability Range - ENHANCED */}
            <Card className="bg-gradient-to-br from-primary to-primary/80 text-white overflow-hidden">
              <CardContent className="p-0">
                <div className="flex">
                  {/* Commodity Image */}
                  {previewUrl && (
                    <div className="w-24 h-40 flex-shrink-0">
                      <img 
                        src={previewUrl} 
                        alt="Commodity package" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {/* Result Content with STABILITY RANGE */}
                  <div className="flex-1 p-4 text-center flex flex-col justify-center">
                    <Scale className="w-5 h-5 mx-auto mb-1 opacity-80" />
                    <div className="text-xs uppercase tracking-wide opacity-70">
                      {estimation.packageCount > 1 ? "Total Estimated Weight" : "Estimated Weight"}
                    </div>
                    <div className="text-4xl font-bold">{estimation.estimatedWeightKg} kg</div>
                    
                    {/* Weight Stability Range - NEW */}
                    <div className="mt-2 bg-white/10 rounded-lg py-2 px-3">
                      <div className="text-[10px] uppercase tracking-wide opacity-70 mb-1">Weight Stability Range</div>
                      <div className="flex items-center justify-center gap-1 text-sm">
                        <span className="font-semibold">{estimation.weightRange.min}</span>
                        <span className="opacity-70">–</span>
                        <span className="font-semibold">{estimation.weightRange.max}</span>
                        <span className="opacity-80 ml-1">kg</span>
                      </div>
                    </div>
                    
                    {estimation.packageCount > 1 && (
                      <div className="mt-2 text-xs bg-white/20 rounded-full px-2 py-0.5 inline-block mx-auto">
                        {estimation.packageCount} packages detected
                      </div>
                    )}
                  </div>
                </div>
                {/* Confidence + Timestamp Row */}
                <div className="px-4 pb-2 flex items-center justify-between">
                  <Badge className={`${getConfidenceColor(estimation.confidenceLevel)}`}>
                    {getConfidenceIcon(estimation.confidenceLevel)}
                    <span className="ml-1">{estimation.confidenceLevel.charAt(0).toUpperCase() + estimation.confidenceLevel.slice(1)}</span>
                  </Badge>
                  <div className="flex items-center gap-1 text-xs opacity-70">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} at{" "}
                      {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Individual Packages Breakdown */}
            {estimation.individualPackages && estimation.individualPackages.length > 1 && (
              <Card className="border-green-200">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                    <Package className="w-4 h-4 text-green-600" />
                    Individual Package Weights
                  </h4>
                  <div className="space-y-2">
                    {estimation.individualPackages.map((pkg) => (
                      <div
                        key={pkg.packageNumber}
                        className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                            {pkg.packageNumber}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{pkg.commodityType}</div>
                            <div className="text-xs text-gray-500 capitalize">
                              {pkg.packagingType} • {pkg.dimensions.estimatedLength} × {pkg.dimensions.estimatedWidth}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-700">{pkg.estimatedWeightKg} kg</div>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 border-t border-green-200 mt-2">
                      <span className="font-semibold text-gray-700">Total</span>
                      <span className="text-xl font-bold text-green-700">{estimation.estimatedWeightKg} kg</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary Details */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Package className="w-4 h-4 text-green-600" />
                  {estimation.packageCount > 1 ? "Summary" : "Package Details"}
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-500">Commodity:</div>
                  <div className="font-medium">{estimation.commodityType}</div>
                  {estimation.commodityGrade && estimation.commodityGrade !== "Not visible" && (
                    <>
                      <div className="text-gray-500">Grade:</div>
                      <div className="font-medium">{estimation.commodityGrade}</div>
                    </>
                  )}
                  {estimation.commoditySize && estimation.commoditySize !== "Standard" && (
                    <>
                      <div className="text-gray-500">Size:</div>
                      <div className="font-medium">{estimation.commoditySize}</div>
                    </>
                  )}
                  {estimation.commodityVariety && estimation.commodityVariety !== "Not specified" && (
                    <>
                      <div className="text-gray-500">Type/Variety:</div>
                      <div className="font-medium">{estimation.commodityVariety}</div>
                    </>
                  )}
                  <div className="text-gray-500">Packaging:</div>
                  <div className="font-medium capitalize">{estimation.packagingType}</div>
                  <div className="text-gray-500">Package Count:</div>
                  <div className="font-medium">{estimation.packageCount} package(s)</div>
                  {estimation.packageCount === 1 && (
                    <>
                      <div className="text-gray-500">Dimensions:</div>
                      <div className="font-medium text-xs">
                        {estimation.dimensions.estimatedLength} × {estimation.dimensions.estimatedWidth} × {estimation.dimensions.estimatedHeight}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quality Notes */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Quality Notes
                </h4>
                <p className="text-sm text-blue-700">{estimation.qualityNotes}</p>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Recommendations</h4>
                <ul className="space-y-2">
                  {estimation.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <span className="text-gray-600">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-2">
              <Button onClick={handleDownload} className="w-full gap-2 bg-green-600 hover:bg-green-700">
                <Download className="w-4 h-4" />
                Download Certificate
              </Button>
              <Button onClick={handleShare} variant="outline" className="w-full gap-2 border-green-200 text-green-700">
                <Share2 className="w-4 h-4" />
                Share via WhatsApp
              </Button>
              
              {/* Make it Fun + Market Access Row */}
              <div className="flex gap-2 pt-2">
                <MakeItFunButton
                  imageBase64={previewUrl || undefined}
                  resultSummary={{
                    commodity: estimation.commodityType,
                    grade: estimation.commodityGrade,
                    quality: estimation.qualityNotes,
                    confidenceLevel: estimation.confidenceLevel === "high" ? "High" : 
                                     estimation.confidenceLevel === "moderate" ? "Moderate" : "Low",
                  }}
                  toolType="kg"
                  consentMarketing={consent.consentMarketing}
                  submissionId={submissionId}
                />
                <MarketAccessCTA
                  submissionId={submissionId}
                  commodity={estimation.commodityType}
                  isMarketReady={estimation.confidenceLevel === "high" || estimation.confidenceLevel === "moderate"}
                  grade={estimation.commodityGrade}
                  qualityNotes={estimation.qualityNotes}
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleRetry} variant="ghost" className="flex-1 gap-2 text-gray-600">
                  <RefreshCw className="w-4 h-4" />
                  Test Another
                </Button>
                <Button onClick={handleClose} variant="outline" className="flex-1 gap-2 text-gray-700">
                  <X className="w-4 h-4" />
                  Close
                </Button>
              </div>
            </div>

            {/* Disclaimer - Enhanced */}
            <AnalysisDisclaimer type="weight" variant="card" />
            
            {/* Consent Dialog - shows after result for data storage */}
            <SubmissionConsentDialog
              open={showConsentDialog}
              onOpenChange={setShowConsentDialog}
              toolType="kg"
              commodity={estimation.commodityType}
              onConfirm={async (newConsent) => {
                setConsent(newConsent);
                const storedResult = await storeSubmission({
                  toolType: "kg",
                  commodity: estimation.commodityType,
                  region: undefined,
                  resultJson: estimation as unknown as Record<string, unknown>,
                  imageBase64: newConsent.consentStoreImage ? previewUrl || undefined : undefined,
                  consent: newConsent,
                });
                if (storedResult.submissionId) {
                  setSubmissionId(storedResult.submissionId);
                }
                setShowConsentDialog(false);
              }}
              isLoading={isStoring}
            />
          </div>
        )}
      </div>
    </div>
  );
}
