import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Camera, Upload, Image as ImageIcon, CheckCircle, AlertTriangle, XCircle, Download, Share2, RotateCcw, Loader2, ClipboardCheck, Clock, Activity } from "lucide-react";
import { useSubmissionStorage, type SubmissionConsent } from "@/hooks/useSubmissionStorage";
import { SubmissionConsentDialog } from "./SubmissionConsentDialog";
import { MakeItFunButton } from "./MakeItFunButton";
import { MarketAccessCTA } from "./MarketAccessCTA";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import bwipjs from "bwip-js";
import { captureStillJpegDataUrl, waitForVideoReady } from "@/utils/cameraCapture";
import { InstitutionalAnalyzingScreen } from "./InstitutionalAnalyzingScreen";
import { InstitutionalFullScreenSpinner } from "./InstitutionalFullScreenSpinner";
import { StorageContextPanel } from "./StorageContextPanel";
import type { StorageContext } from "@/utils/weatherRiskCalculations";
import { generateStorageInterpretation } from "@/utils/weatherRiskCalculations";
import { createAuditEntry, calculateConfidenceScore } from "@/utils/internalControlLayers";
import { AnalysisDisclaimer } from "./AnalysisDisclaimer";

// Generate barcode as base64
const generateBarcodeBase64 = async (text: string): Promise<string> => {
  try {
    const canvas = document.createElement("canvas");
    await bwipjs.toCanvas(canvas, {
      bcid: "code128",
      text: text,
      scale: 3,
      height: 10,
      includetext: false,
    });
    return canvas.toDataURL("image/png");
  } catch {
    return "";
  }
};

// QC Analysis result interface - Enhanced with bio-risk and regional intelligence
interface BioRiskAssessment {
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  defectSummary: string[];
  insectDetected: boolean;
  moldIndicators: boolean;
  rottingIndicators: boolean;
  discoloration: boolean;
}

interface RegionalContext {
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  riskNote: string;
  seasonalContext: string;
  climateNote: string | null;
}

interface PhotoIntegrity {
  exifPresent: boolean;
  dateTaken: string | null;
  gpsPresent: boolean;
  integrityNote: string;
}

interface ImageQualityInfo {
  score: number;
  isLowQuality: boolean;
  suggestion: string | null;
}

interface QCAnalysisResult {
  commodityType: string;
  commodityGrade?: string;
  commoditySize?: string;
  commodityVariety?: string;
  gradeAssessment: {
    grade: string;
    gradeDescription: string;
    confidenceLevel: "high" | "moderate" | "low";
  };
  qualityMetrics: {
    colorUniformity: number;
    sizeConsistency: number;
    defectPercentage: number;
    moldDetected: boolean;
    foreignMatter: boolean;
  };
  gradingDetails: {
    category: string;
    specification: string;
    marketValue: "premium" | "standard" | "below_standard";
  };
  bioRiskAssessment?: BioRiskAssessment;
  regionalContext?: RegionalContext;
  photoIntegrity?: PhotoIntegrity;
  imageQuality?: ImageQualityInfo;
  recommendations: string[];
  qualityNotes: string;
  rejected?: boolean;
  rejectionReason?: string;
}

interface QualityControlAnalysisProps {
  onClose: () => void;
  onAnalysisComplete?: (result: QCAnalysisResult) => void;
  sessionId?: string;
  visitorId?: string;
}

type CaptureMode = "camera" | "upload" | "library";
type AnalysisPhase = "select" | "instructions" | "capture" | "analyzing" | "result";

export function QualityControlAnalysis({
  onClose,
  onAnalysisComplete,
  sessionId,
  visitorId,
}: QualityControlAnalysisProps) {
  const [phase, setPhase] = useState<AnalysisPhase>("select");
  const [captureMode, setCaptureMode] = useState<CaptureMode | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<QCAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  // 3-layer storage state
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [consent, setConsent] = useState<SubmissionConsent>({ consentResearch: false, consentStoreImage: false, consentMarketing: false });
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const { storeSubmission, isStoring } = useSubmissionStorage();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPhase("capture");
    } catch (err) {
      console.error("Camera access error:", err);
      toast.error("Unable to access camera. Please check permissions.");
      setPhase("select");
    }
  };

  const handleCapturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    // 3-second countdown
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise((r) => setTimeout(r, 1000));
    }
    setCountdown(null);

    try {
      const dataUrl = await captureStillJpegDataUrl({
        stream: streamRef.current,
        video: videoRef.current,
        canvas: canvasRef.current,
        quality: 0.9,
        maxWidth: 1920,
      });
      stopCamera();
      setCapturedImage(dataUrl);
      await analyzeImage(dataUrl);
    } catch (err) {
      console.error("Capture error:", err);
      toast.error("Failed to capture image. Please try again.");
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
      toast.error("Image too large. Please select an image under 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setCapturedImage(dataUrl);
      setPhase("analyzing");
      await analyzeImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (dataUrl: string, retryAttempt = 0) => {
    setPhase("analyzing");
    setError(null);

    try {
      const base64Data = dataUrl.split(",")[1];
      const mimeMatch = dataUrl.match(/data:([^;]+);/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

      const { data, error: fnError, response } = await supabase.functions.invoke("analyze-quality-control", {
        body: {
          imageBase64: base64Data,
          mimeType,
          sessionId,
          visitorId,
          retryAttempt,
        },
      });

      if (fnError) {
        let status: number | undefined;
        let backendPayload: any = null;

        try {
          const res = response as unknown as Response | undefined;
          status = res?.status;
          if (res) {
            const raw = await res.text();
            try {
              backendPayload = raw ? JSON.parse(raw) : null;
            } catch {
              backendPayload = null;
            }
          }
        } catch {
          // ignore parsing failures
        }

        const backendMessage =
          backendPayload?.error ||
          backendPayload?.rejectionMessage ||
          fnError.message ||
          "Analysis failed. Please try again.";

        const retryable = Boolean(backendPayload?.retryable) || status === 429 || status === 503 || status === 504;
        if (retryable && retryAttempt < 2) {
          const backoffMs = 800 * Math.pow(2, retryAttempt);
          toast.info("QC service is busy—retrying...", { duration: 2000 });
          setTimeout(() => analyzeImage(dataUrl, retryAttempt + 1), backoffMs);
          return;
        }

        throw new Error(backendMessage);
      }

      if (data?.rejected) {
        setError(data.rejectionMessage || "This image could not be analyzed for quality control.");
        setPhase("select");
        toast.error("Image not suitable for QC analysis. Please capture an agricultural commodity.");
        return;
      }

      if (data?.analysis) {
        setAnalysisResult(data.analysis);
        setPhase("result");
        onAnalysisComplete?.(data.analysis);
        toast.success("Quality control analysis complete!");
      } else {
        const msg = data?.error || "No analysis data received";
        throw new Error(msg);
      }
    } catch (err) {
      console.error("QC analysis error:", err);
      const msg = err instanceof Error ? err.message : "Analysis failed. Please try again.";
      setError(msg);
      setPhase("select");
      toast.error(msg);
    }
  };

  const handleRetry = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setError(null);
    setPhase("select");
  };

  const getGradeColor = (grade: string) => {
    if (grade.includes("Premium") || grade.includes("W180") || grade.includes("AA")) return "text-primary";
    if (grade.includes("Standard") || grade.includes("W240") || grade.includes("AB")) return "text-warning";
    return "text-muted-foreground";
  };

  const getConfidenceIcon = (level: string) => {
    switch (level) {
      case "high": return <CheckCircle className="w-4 h-4 text-primary" />;
      case "moderate": return <AlertTriangle className="w-4 h-4 text-warning" />;
      default: return <XCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // PDF generation - Institutional grade with captured image
  const generatePDFBlob = async (): Promise<Blob | null> => {
    if (!analysisResult) return null;

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;

    // === OUTER DECORATIVE BORDER ===
    pdf.setDrawColor(0, 80, 50);
    pdf.setLineWidth(2.5);
    pdf.rect(8, 8, pageWidth - 16, pageHeight - 16);
    
    pdf.setDrawColor(34, 139, 80);
    pdf.setLineWidth(0.5);
    pdf.rect(12, 12, pageWidth - 24, pageHeight - 24);
    
    // Corner decorations
    const corners = [[12, 12], [pageWidth - 12, 12], [12, pageHeight - 12], [pageWidth - 12, pageHeight - 12]];
    pdf.setFillColor(0, 80, 50);
    corners.forEach(([x, y]) => {
      pdf.circle(x, y, 2, 'F');
    });

    // === HEADER SECTION ===
    pdf.setFillColor(0, 80, 50);
    pdf.rect(12, 12, pageWidth - 24, 50, "F");

    // Barcode
    const certId = `QC-${Date.now().toString(36).toUpperCase()}`;
    try {
      const barcodeImg = await generateBarcodeBase64(certId);
      if (barcodeImg) {
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(margin + 2, 16, 45, 14, 1, 1, 'F');
        pdf.addImage(barcodeImg, "PNG", margin + 4, 18, 41, 10);
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(255, 255, 255);
        pdf.text(certId, margin + 24.5, 33, { align: 'center' });
      }
    } catch {}

    // Add captured commodity image to header if available
    if (capturedImage) {
      try {
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(pageWidth - margin - 47, 16, 45, 32, 2, 2, 'F');
        pdf.addImage(capturedImage, 'JPEG', pageWidth - margin - 45, 18, 41, 28);
      } catch (err) {
        console.error("Failed to add commodity image:", err);
      }
    }

    // Title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    pdf.text("QUALITY CONTROL", pageWidth / 2, 38, { align: "center" });
    pdf.setFontSize(14);
    pdf.text("CERTIFICATE", pageWidth / 2, 48, { align: "center" });

    // Certificate number and date
    const testDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric"
    });
    const testTime = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit", minute: "2-digit"
    });

    let y = 70;
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Certificate ID: ${certId}`, 20, y);
    pdf.text(`Date: ${testDate} at ${testTime}`, pageWidth - 20, y, { align: "right" });
    y += 10;

    // Commodity & Grade
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text(`Commodity: ${analysisResult.commodityType}`, 15, y);
    y += 10;
    pdf.text(`Grade: ${analysisResult.gradeAssessment.grade}`, 15, y);
    y += 8;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(analysisResult.gradeAssessment.gradeDescription, 15, y, { maxWidth: pageWidth - 30 });
    y += 15;

    // Quality Metrics - Organized Table Layout
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 80, 50);
    pdf.text("Quality Metrics", 15, y);
    y += 6;

    // Draw metrics table
    const metricsTableY = y;
    const colWidth = (pageWidth - 30) / 2;
    const rowHeight = 10;
    
    // Table header background
    pdf.setFillColor(240, 248, 240);
    pdf.rect(15, metricsTableY, pageWidth - 30, rowHeight * 3, "F");
    
    // Table borders
    pdf.setDrawColor(200, 220, 200);
    pdf.setLineWidth(0.3);
    pdf.rect(15, metricsTableY, pageWidth - 30, rowHeight * 3);
    pdf.line(15 + colWidth, metricsTableY, 15 + colWidth, metricsTableY + rowHeight * 3);
    pdf.line(15, metricsTableY + rowHeight, pageWidth - 15, metricsTableY + rowHeight);
    pdf.line(15, metricsTableY + rowHeight * 2, pageWidth - 15, metricsTableY + rowHeight * 2);
    
    // Metrics data
    const metrics = [
      { label: "Color Uniformity", value: `${analysisResult.qualityMetrics.colorUniformity}%` },
      { label: "Size Consistency", value: `${analysisResult.qualityMetrics.sizeConsistency}%` },
      { label: "Defect Rate", value: `${analysisResult.qualityMetrics.defectPercentage}%` },
      { label: "Mold Detected", value: analysisResult.qualityMetrics.moldDetected ? "Yes ⚠" : "No ✓" },
      { label: "Foreign Matter", value: analysisResult.qualityMetrics.foreignMatter ? "Yes ⚠" : "No ✓" },
    ];
    
    pdf.setFontSize(9);
    pdf.setTextColor(60, 60, 60);
    
    // Row 1: Color Uniformity | Size Consistency
    pdf.setFont("helvetica", "bold");
    pdf.text(metrics[0].label + ":", 18, metricsTableY + 6);
    pdf.text(metrics[1].label + ":", 18 + colWidth, metricsTableY + 6);
    pdf.setFont("helvetica", "normal");
    pdf.text(metrics[0].value, 15 + colWidth - 5, metricsTableY + 6, { align: "right" });
    pdf.text(metrics[1].value, pageWidth - 18, metricsTableY + 6, { align: "right" });
    
    // Row 2: Defect Rate | Mold Detected
    pdf.setFont("helvetica", "bold");
    pdf.text(metrics[2].label + ":", 18, metricsTableY + rowHeight + 6);
    pdf.text(metrics[3].label + ":", 18 + colWidth, metricsTableY + rowHeight + 6);
    pdf.setFont("helvetica", "normal");
    pdf.text(metrics[2].value, 15 + colWidth - 5, metricsTableY + rowHeight + 6, { align: "right" });
    pdf.text(metrics[3].value, pageWidth - 18, metricsTableY + rowHeight + 6, { align: "right" });
    
    // Row 3: Foreign Matter (centered spanning)
    pdf.setFont("helvetica", "bold");
    pdf.text(metrics[4].label + ":", 18, metricsTableY + rowHeight * 2 + 6);
    pdf.setFont("helvetica", "normal");
    pdf.text(metrics[4].value, 15 + colWidth - 5, metricsTableY + rowHeight * 2 + 6, { align: "right" });
    
    y = metricsTableY + rowHeight * 3 + 10;

    // Grading Details
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("Grading Details", 15, y);
    y += 8;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Category: ${analysisResult.gradingDetails.category}`, 15, y);
    y += 6;
    pdf.text(`Specification: ${analysisResult.gradingDetails.specification}`, 15, y);
    y += 6;
    pdf.text(`Market Value: ${analysisResult.gradingDetails.marketValue.replace("_", " ")}`, 15, y);
    y += 12;

    // Recommendations
    if (analysisResult.recommendations.length > 0) {
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("Recommendations", 15, y);
      y += 8;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      analysisResult.recommendations.forEach((rec, i) => {
        const lines = pdf.splitTextToSize(`${i + 1}. ${rec}`, pageWidth - 30);
        pdf.text(lines, 15, y);
        y += lines.length * 5 + 2;
      });
    }

    // Disclaimer
    pdf.setFillColor(255, 248, 220);
    pdf.roundedRect(15, pageHeight - 38, pageWidth - 30, 14, 2, 2, "F");
    pdf.setFontSize(7);
    pdf.setTextColor(120, 100, 60);
    pdf.text(
      "DISCLAIMER: This is a visual assessment only. Actual quality grades may vary. Always verify with certified lab testing for trade.",
      pageWidth / 2,
      pageHeight - 30,
      { align: "center", maxWidth: pageWidth - 40 }
    );

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text("AgriSMES.com", pageWidth / 2, pageHeight - 15, { align: "center" });

    return pdf.output("blob");
  };

  const handleDownload = async () => {
    const blob = await generatePDFBlob();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `QC-Certificate-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Certificate downloaded!");
    }
  };

  const handleShare = async () => {
    const blob = await generatePDFBlob();
    if (!blob) return;

    const file = new File([blob], `QC-Certificate-${Date.now()}.pdf`, { type: "application/pdf" });

    if (navigator.share && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        toast.success("Certificate shared!");
      } catch {
        await handleDownload();
      }
    } else {
      await handleDownload();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background z-[9999] flex flex-col overflow-hidden"
    >
      {/* Institutional Green Header - matching Moisture tool */}
      <div className="bg-primary text-primary-foreground">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <ClipboardCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">Quality Control Analysis</h2>
              <p className="text-xs text-white/80">Grading • Defect Detection • Color Sorting</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-white hover:bg-white/20 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {/* Select Mode */}
          {phase === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">Quality Control Analysis</h3>
                <p className="text-muted-foreground">
                  Analyze commodity grade, detect defects, mold, and sort by color/size.
                </p>
              </div>

              {/* Supported commodities */}
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                <h4 className="font-medium mb-2 text-primary">Supported Commodities:</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <div>• Cashew Kernels & RCN</div>
                  <div>• Coffee (Arabica/Robusta)</div>
                  <div>• Cocoa Beans</div>
                  <div>• Sesame Seeds</div>
                  <div>• Macadamia Nuts</div>
                  <div>• Pigeon Peas</div>
                  <div>• Cardamom & Spices</div>
                  <div>• Rice, Maize, Wheat</div>
                  <div>• Soybeans & Pulses</div>
                  <div>• Avocado & Pineapple</div>
                  <div>• Tea Leaves</div>
                  <div>• Vanilla Beans</div>
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="grid gap-3">
                <Button
                  onClick={() => {
                    setCaptureMode("camera");
                    setPhase("instructions");
                  }}
                  className="h-14 text-base gap-3"
                >
                  <Camera className="w-5 h-5" />
                  Take Photo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCaptureMode("upload");
                    fileInputRef.current?.click();
                  }}
                  className="h-14 text-base gap-3"
                >
                  <Upload className="w-5 h-5" />
                  Upload Image
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCaptureMode("library");
                    fileInputRef.current?.click();
                  }}
                  className="h-14 text-base gap-3"
                >
                  <ImageIcon className="w-5 h-5" />
                  Photo Library
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </motion.div>
          )}

          {/* Instructions */}
          {phase === "instructions" && (
            <motion.div
              key="instructions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2 mb-4">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <ClipboardCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Quality Control Tips</h3>
                <p className="text-sm text-muted-foreground">Follow these tips for accurate grading</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-muted/50 p-3 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                  <p className="text-sm">Spread samples evenly for accurate grading</p>
                </div>
                <div className="flex items-start gap-3 bg-muted/50 p-3 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                  <p className="text-sm">Use good lighting to show true color</p>
                </div>
                <div className="flex items-start gap-3 bg-muted/50 p-3 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                  <p className="text-sm">Include 20-50 pieces for best accuracy</p>
                </div>
                <div className="flex items-start gap-3 bg-muted/50 p-3 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                  <p className="text-sm">Use a plain background (white or neutral)</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPhase("select")} className="flex-1">
                  Back
                </Button>
                <Button onClick={startCamera} className="flex-1 h-12 gap-2">
                  <Camera className="w-5 h-5" />
                  Start Camera
                </Button>
              </div>
            </motion.div>
          )}

          {/* Capture */}
          {phase === "capture" && (
            <motion.div
              key="capture"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
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
                <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                
                {countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="text-6xl font-bold text-white animate-pulse">{countdown}</span>
                  </div>
                )}
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Position commodity samples within the frame, then tap to capture
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    stopCamera();
                    setPhase("select");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCapturePhoto}
                  className="flex-1 h-12 gap-2"
                  disabled={countdown !== null}
                >
                  <Camera className="w-5 h-5" />
                  Capture Camera
                </Button>
              </div>
            </motion.div>
          )}

          {/* Analyzing - Institutional grade full-screen analyzing state */}
          {phase === "analyzing" && (
            <InstitutionalAnalyzingScreen type="quality" capturedImage={capturedImage} />
          )}

          {/* Result */}
          {phase === "result" && analysisResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Captured Image Display */}
              {capturedImage && (
                <div className="bg-card rounded-xl border overflow-hidden">
                  <div className="bg-primary/5 px-4 py-2 border-b">
                    <p className="text-sm font-medium text-primary">Analyzed Sample</p>
                  </div>
                  <div className="p-3">
                    <img
                      src={capturedImage}
                      alt="Analyzed commodity sample"
                      className="w-full max-h-48 object-cover rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Grade Badge with Enhanced Confidence Display */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 text-center border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Commodity</p>
                <h3 className="text-xl font-bold mb-2 text-primary">{analysisResult.commodityType}</h3>
                {/* Show Grade, Size, Type badges if available */}
                <div className="flex flex-wrap justify-center gap-2 mb-3">
                  {analysisResult.commodityGrade && (
                    <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-xs font-medium">
                      Grade: {analysisResult.commodityGrade}
                    </span>
                  )}
                  {analysisResult.commoditySize && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
                      Size: {analysisResult.commoditySize}
                    </span>
                  )}
                  {analysisResult.commodityVariety && (
                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-medium">
                      Type: {analysisResult.commodityVariety}
                    </span>
                  )}
                </div>
                <div className={`text-3xl font-bold ${getGradeColor(analysisResult.gradeAssessment.grade)}`}>
                  {analysisResult.gradeAssessment.grade}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {analysisResult.gradeAssessment.gradeDescription}
                </p>
                {/* Enhanced Confidence Row with Timestamp */}
                <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border/50">
                  <Badge 
                    variant="outline" 
                    className={`flex items-center gap-1 ${
                      analysisResult.gradeAssessment.confidenceLevel === "high" ? "bg-green-100 text-green-800 border-green-200" :
                      analysisResult.gradeAssessment.confidenceLevel === "moderate" ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                      "bg-orange-100 text-orange-800 border-orange-200"
                    }`}
                  >
                    {getConfidenceIcon(analysisResult.gradeAssessment.confidenceLevel)}
                    <span className="capitalize">{analysisResult.gradeAssessment.confidenceLevel}</span>
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} at{" "}
                      {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quality Metrics */}
              <div className="bg-card rounded-lg p-4 border">
                <h4 className="font-semibold mb-3">Quality Metrics</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Color Uniformity</span>
                    <p className="font-medium">{analysisResult.qualityMetrics.colorUniformity}%</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Size Consistency</span>
                    <p className="font-medium">{analysisResult.qualityMetrics.sizeConsistency}%</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Defect Rate</span>
                    <p className="font-medium">{analysisResult.qualityMetrics.defectPercentage}%</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mold Detected</span>
                    <p className={`font-medium ${analysisResult.qualityMetrics.moldDetected ? "text-destructive" : "text-primary"}`}>
                      {analysisResult.qualityMetrics.moldDetected ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Grading Details */}
              <div className="bg-card rounded-lg p-4 border">
                <h4 className="font-semibold mb-3">Grading Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-medium">{analysisResult.gradingDetails.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Specification</span>
                    <span className="font-medium">{analysisResult.gradingDetails.specification}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Market Value</span>
                    <span className="font-medium capitalize">{analysisResult.gradingDetails.marketValue.replace("_", " ")}</span>
                  </div>
                </div>
              </div>

              {/* Bio-Risk Assessment */}
              {analysisResult.bioRiskAssessment && (
                <div className={`rounded-lg p-4 border ${
                  analysisResult.bioRiskAssessment.riskLevel === "HIGH" ? "bg-destructive/10 border-destructive/30" :
                  analysisResult.bioRiskAssessment.riskLevel === "MEDIUM" ? "bg-warning/10 border-warning/30" :
                  "bg-primary/5 border-primary/20"
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className={`w-5 h-5 ${
                      analysisResult.bioRiskAssessment.riskLevel === "HIGH" ? "text-destructive" :
                      analysisResult.bioRiskAssessment.riskLevel === "MEDIUM" ? "text-warning" : "text-primary"
                    }`} />
                    <h4 className="font-semibold">Bio-Risk: {analysisResult.bioRiskAssessment.riskLevel}</h4>
                  </div>
                  {analysisResult.bioRiskAssessment.defectSummary.length > 0 && (
                    <ul className="text-sm space-y-1 mb-2">
                      {analysisResult.bioRiskAssessment.defectSummary.map((d, i) => (
                        <li key={i} className="flex items-start gap-1">• {d}</li>
                      ))}
                    </ul>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span>Insect: {analysisResult.bioRiskAssessment.insectDetected ? "⚠ Yes" : "✓ No"}</span>
                    <span>Mold: {analysisResult.bioRiskAssessment.moldIndicators ? "⚠ Yes" : "✓ No"}</span>
                  </div>
                </div>
              )}

              {/* Regional Context */}
              {analysisResult.regionalContext?.riskNote && (
                <div className="bg-muted/50 rounded-lg p-3 border text-sm">
                  <p className="text-muted-foreground">{analysisResult.regionalContext.riskNote}</p>
                  {analysisResult.regionalContext.climateNote && (
                    <p className="text-xs text-muted-foreground mt-1 italic">{analysisResult.regionalContext.climateNote}</p>
                  )}
                </div>
              )}

              {/* Recommendations */}
              {analysisResult.recommendations.length > 0 && (
                <div className="bg-card rounded-lg p-4 border">
                  <h4 className="font-semibold mb-3">Recommendations</h4>
                  <ul className="space-y-2">
                    {analysisResult.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-primary font-medium">{i + 1}.</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Photo Integrity Note */}
              {analysisResult.photoIntegrity && (
                <div className="text-xs text-muted-foreground text-center p-2 bg-muted/30 rounded">
                  {analysisResult.photoIntegrity.integrityNote}
                </div>
              )}

              {/* Actions - Institutional green styling */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <Button onClick={handleDownload} variant="outline" className="gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button onClick={handleShare} className="gap-2 bg-primary hover:bg-primary/90">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
              
              {/* Make it Fun + Market Access Row */}
              <div className="flex gap-2 pt-2">
                <MakeItFunButton
                  imageBase64={capturedImage || undefined}
                  resultSummary={{
                    commodity: analysisResult.commodityType,
                    grade: analysisResult.commodityGrade || analysisResult.gradeAssessment.grade,
                    quality: analysisResult.gradingDetails.marketValue,
                    confidenceLevel: analysisResult.gradeAssessment.confidenceLevel === "high" ? "High" : 
                                     analysisResult.gradeAssessment.confidenceLevel === "moderate" ? "Moderate" : "Low",
                  }}
                  toolType="qc"
                  consentMarketing={consent.consentMarketing}
                  submissionId={submissionId}
                />
                <MarketAccessCTA
                  submissionId={submissionId}
                  commodity={analysisResult.commodityType}
                  isMarketReady={analysisResult.gradingDetails.marketValue === "premium" || analysisResult.gradingDetails.marketValue === "standard"}
                  grade={analysisResult.gradeAssessment.grade}
                  qualityNotes={analysisResult.qualityNotes}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleRetry} variant="ghost" className="gap-2 text-primary hover:bg-primary/10">
                  <RotateCcw className="w-4 h-4" />
                  Test Another
                </Button>
                <Button onClick={onClose} variant="ghost" className="hover:bg-muted">
                  Close
                </Button>
              </div>
              
              {/* Disclaimer - Enhanced */}
              <AnalysisDisclaimer type="qc" variant="card" />
              
              {/* Consent Dialog - shows after result for data storage */}
              <SubmissionConsentDialog
                open={showConsentDialog}
                onOpenChange={setShowConsentDialog}
                toolType="qc"
                commodity={analysisResult.commodityType}
                onConfirm={async (newConsent) => {
                  setConsent(newConsent);
                  const storedResult = await storeSubmission({
                    toolType: "qc",
                    commodity: analysisResult.commodityType,
                    region: analysisResult.regionalContext?.riskNote,
                    resultJson: analysisResult as unknown as Record<string, unknown>,
                    imageBase64: newConsent.consentStoreImage ? capturedImage || undefined : undefined,
                    consent: newConsent,
                  });
                  if (storedResult.submissionId) {
                    setSubmissionId(storedResult.submissionId);
                  }
                  setShowConsentDialog(false);
                }}
                isLoading={isStoring}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
