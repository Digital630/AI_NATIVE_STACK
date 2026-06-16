import React, { useState, useRef, useCallback, useEffect } from "react";
import { Share2, X, Loader2, Droplets, AlertTriangle, CheckCircle, CheckCircle2, ThermometerSun, Clock, MapPin, Download, FileText, Camera, RefreshCw, MessageCircle, Upload, Activity, Info, Lightbulb, Wheat } from "lucide-react";
import { useSubmissionStorage, type SubmissionConsent } from "@/hooks/useSubmissionStorage";
import { SubmissionConsentDialog } from "./SubmissionConsentDialog";
import { MakeItFunButton } from "./MakeItFunButton";
import { MarketAccessCTA } from "./MarketAccessCTA";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import agrismesLogo from "@/assets/agrismes-logo-v3.png";
import { attachStreamToVideo, captureStillJpegDataUrl, waitForVideoReady } from "@/utils/cameraCapture";
import { InstitutionalAnalyzingScreen } from "./InstitutionalAnalyzingScreen";
import { InstitutionalFullScreenSpinner } from "./InstitutionalFullScreenSpinner";
import { StorageContextPanel } from "./StorageContextPanel";
import type { StorageContext } from "@/utils/weatherRiskCalculations";
import { MoistureBatchInputForm, type BatchContext } from "./MoistureBatchInputForm";
import { generateStorageInterpretation, generateMoistureInterpretation, type MoistureInterpretationContext } from "@/utils/weatherRiskCalculations";
import { createAuditEntry, calculateConfidenceScore } from "@/utils/internalControlLayers";
import { calculateMoistureRange, type ConfidenceLevel } from "./AnalysisRangeDisplay";
import { AnalysisDisclaimer, MethodExplanation } from "./AnalysisDisclaimer";
import { ExplainThis } from "./ExplainThis";
import { GlossaryTerm } from "./GlossaryTerm";
const generateBarcodeBase64 = async (text: string): Promise<string> => {
  try {
    const bwipjs = await import("bwip-js");
    const canvas = document.createElement("canvas");
    // @ts-ignore - bwip-js browser API
    await bwipjs.toCanvas(canvas, {
      bcid: "code128",
      text: text,
      scale: 2,
      height: 8,
      includetext: false,
      backgroundcolor: "ffffff",
    });
    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Barcode generation error:", error);
    return "";
  }
};

interface MoistureAnalysisResult {
  commodity: string;
  commodityGrade?: string;
  commoditySize?: string;
  commodityType?: string;
  moisturePercentage: number | null;
  moistureRangeMin: number;
  moistureRangeMax: number;
  moistureStatus: "optimal" | "acceptable" | "high" | "low" | "critical" | "abnormal";
  quality: string;
  recommendations: string[];
  timestamp: string;
  imageMetadata?: {
    estimatedLocation?: string;
    capturedAt?: string;
    imageAge?: string;
    isOnlineSourced?: boolean;
    sourceWarning?: string;
  };
  confidenceLevel: ConfidenceLevel;
  method: string;
  analysisTimestamp: string;
  safeRange?: string;
  isAbnormal?: boolean;
  abnormalDirection?: string;
  abnormalReasons?: string[];
}

interface MoistureContentAnalysisProps {
  onAnalysisComplete?: (result: MoistureAnalysisResult) => void;
  onClose?: () => void;
  sessionId?: string;
  visitorId?: string;
  disabled?: boolean;
}

// Industry-standard moisture content thresholds — CORRECTED for cashew and coffee
const MOISTURE_THRESHOLDS: Record<string, { optimal: number; range: [number, number]; acceptable: [number, number]; name: string }> = {
  cashew: { optimal: 5.0, range: [4, 6], acceptable: [3.5, 7], name: "Cashew Nuts" },
  macadamia: { optimal: 2.5, range: [1.5, 3.5], acceptable: [1, 4], name: "Macadamia Nuts" },
  coffee: { optimal: 9.0, range: [8, 10], acceptable: [7.5, 11], name: "Coffee (Green)" },
  cocoa: { optimal: 6.5, range: [5.5, 7.5], acceptable: [5, 8], name: "Cocoa Beans" },
  sesame: { optimal: 6.0, range: [5, 7], acceptable: [4.5, 8], name: "Sesame Seeds" },
  soybean: { optimal: 11, range: [10, 12], acceptable: [9, 13], name: "Soybeans" },
  rice: { optimal: 13, range: [12, 14], acceptable: [11, 15], name: "Rice" },
  wheat: { optimal: 13, range: [12, 14], acceptable: [11, 15], name: "Wheat" },
  maize: { optimal: 13, range: [12, 14], acceptable: [11, 15], name: "Maize" },
  corn: { optimal: 13, range: [12, 14], acceptable: [11, 15], name: "Corn" },
  pulses: { optimal: 11, range: [10, 12], acceptable: [9, 13], name: "Pulses" },
  "pigeon pea": { optimal: 11, range: [10, 12], acceptable: [9, 13], name: "Pigeon Pea" },
  lentils: { optimal: 11, range: [10, 12], acceptable: [9, 13], name: "Lentils" },
  beans: { optimal: 11, range: [10, 12], acceptable: [9, 13], name: "Beans" },
  cardamom: { optimal: 9, range: [8, 10], acceptable: [7, 11], name: "Cardamom" },
  spices: { optimal: 9, range: [8, 10], acceptable: [7, 12], name: "Spices" },
  pepper: { optimal: 10, range: [8, 11], acceptable: [7, 12], name: "Pepper" },
  pineapple: { optimal: 86, range: [85, 87], acceptable: [83, 89], name: "Pineapple (Fresh)" },
  avocado: { optimal: 70, range: [60, 75], acceptable: [55, 80], name: "Avocado" },
};

type CaptureMode = "camera" | "upload" | "library";
type AnalysisPhase = "select" | "batch-input" | "instructions" | "capture" | "analyzing" | "result";

export function MoistureContentAnalysis({
  onAnalysisComplete,
  onClose,
  sessionId,
  visitorId,
  disabled = false,
}: MoistureContentAnalysisProps) {
  const [phase, setPhase] = useState<AnalysisPhase>("select");
  const [captureMode, setCaptureMode] = useState<CaptureMode>("camera");
  const [result, setResult] = useState<MoistureAnalysisResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [storageContext, setStorageContext] = useState<StorageContext | null>(null);
  const [interpretationNotes, setInterpretationNotes] = useState<string[]>([]);
  const [batchContext, setBatchContext] = useState<BatchContext | null>(null);
  
  // 3-layer storage state
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [consent, setConsent] = useState<SubmissionConsent>({ consentResearch: false, consentStoreImage: false, consentMarketing: false });
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const { storeSubmission, isStoring } = useSubmissionStorage();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getMoistureStatus = (commodity: string, percentage: number): MoistureAnalysisResult["moistureStatus"] => {
    const key = commodity.toLowerCase().replace(/\s+/g, " ").trim();
    const thresholds = MOISTURE_THRESHOLDS[key] || 
      Object.values(MOISTURE_THRESHOLDS).find(t => t.name.toLowerCase().includes(key)) ||
      { optimal: 11, range: [10, 12], acceptable: [8, 14] };
    
    if (percentage >= thresholds.range[0] && percentage <= thresholds.range[1]) return "optimal";
    if (percentage >= thresholds.acceptable[0] && percentage <= thresholds.acceptable[1]) return "acceptable";
    if (percentage > thresholds.acceptable[1]) return percentage > thresholds.acceptable[1] + 3 ? "critical" : "high";
    return "low";
  };

  const getOptimalRange = (commodity: string): string => {
    const key = commodity.toLowerCase().replace(/\s+/g, " ").trim();
    const thresholds = MOISTURE_THRESHOLDS[key] || 
      Object.values(MOISTURE_THRESHOLDS).find(t => t.name.toLowerCase().includes(key));
    if (thresholds) return `${thresholds.range[0]}-${thresholds.range[1]}%`;
    return "10-12%";
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (previewUrl && previewUrl.startsWith("blob:")) {
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
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.setAttribute("webkit-playsinline", "true");
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

  const analyzeImage = async (dataUrl: string, retryAttempt = 0) => {
    setPhase("analyzing");
    setIsAnalyzing(true);

    try {
      const base64Data = dataUrl.split(",")[1];
      const mimeMatch = dataUrl.match(/data:([^;]+);/);
      const mimeType = mimeMatch?.[1] || "image/jpeg";

      if (!base64Data || base64Data.length < 1000) {
        throw new Error("Invalid image data. Please try again with a clearer photo.");
      }

      console.log("[MoistureContentAnalysis] Invoking analysis", {
        retryAttempt,
        base64Length: base64Data.length,
        sessionId,
        visitorId,
      });

      const { data, error, response } = await supabase.functions.invoke("analyze-moisture-content", {
        body: {
          imageBase64: base64Data,
          mimeType,
          sessionId,
          visitorId,
          retryAttempt,
          batchContext: batchContext || undefined,
        },
      });

      // Handle function invocation errors
      if (error) {
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
          backendPayload?.rejectionReason ||
          error.message ||
          "Unable to process the image. Please try again.";

        const retryable = Boolean(backendPayload?.retryable) || status === 429 || status === 503 || status === 504;

        if (retryable && retryAttempt < 2) {
          const backoffMs = 800 * Math.pow(2, retryAttempt);
          toast.info("Service is busy—retrying...", { duration: 2000 });
          setTimeout(() => analyzeImage(dataUrl, retryAttempt + 1), backoffMs);
          return;
        }

        throw new Error(backendMessage);
      }

      // Handle rejection (non-agri-commodity)
      if (data?.rejected) {
        toast.error("Sorry, please capture an image of an agri-commodity (coffee, cashew, cocoa, sesame, grains) to get your moisture content result.", {
          duration: 6000,
        });
        setPreviewUrl(null);
        setIsAnalyzing(false);
        setPhase("select");
        return;
      }

      // Handle retryable errors
      if (!data?.success && data?.retryable && retryAttempt < 2) {
        toast.info("Retrying analysis...", { duration: 2000 });
        setTimeout(() => analyzeImage(dataUrl, retryAttempt + 1), 1000);
        return;
      }

      // Handle non-success responses
      if (!data?.success || !data?.analysis) {
        const errorMessage = data?.error || "Unable to analyze moisture content. Please try with a clearer image.";
        throw new Error(errorMessage);
      }

      // Handle abnormal result
      const isAbnormalResult = data.analysis.isAbnormal === true;
      const centerMoisture = data.analysis.moisturePercentage;
      const confidence: ConfidenceLevel = data.analysis.confidenceLevel || "Medium";
      const analysisTimestamp = new Date().toISOString();

      let moistureRange = { min: 0, max: 0 };
      let moistureStatus: MoistureAnalysisResult["moistureStatus"] = "optimal";

      if (isAbnormalResult || centerMoisture === null) {
        moistureStatus = "abnormal";
        moistureRange = { min: 0, max: 0 };
      } else {
        moistureRange = calculateMoistureRange(centerMoisture, confidence);
        moistureStatus = getMoistureStatus(data.analysis.commodity || "", centerMoisture);
      }
      
      const analysisResult: MoistureAnalysisResult = {
        commodity: data.analysis.commodity || "Unknown",
        moisturePercentage: centerMoisture,
        moistureRangeMin: moistureRange.min,
        moistureRangeMax: moistureRange.max,
        moistureStatus,
        quality: data.analysis.quality || "Unknown",
        recommendations: data.analysis.recommendations || [],
        timestamp: analysisTimestamp,
        imageMetadata: data.analysis.imageMetadata,
        confidenceLevel: confidence,
        method: data.analysis.method || "AI Moisture Assessment",
        analysisTimestamp,
        safeRange: data.analysis.safeRange || undefined,
        isAbnormal: isAbnormalResult,
        abnormalDirection: data.analysis.abnormalDirection || undefined,
        abnormalReasons: data.analysis.abnormalReasons || [],
      };

      // Generate interpretation notes based on storage context and moisture layers
      const notes: string[] = [];
      
      // Storage context notes (ADDITIVE - does not change numeric outputs)
      if (storageContext) {
        const storageNotes = generateStorageInterpretation(storageContext);
        if (storageNotes.moistureNote) {
          notes.push(storageNotes.moistureNote);
        }
      }

      // Moisture interpretation layers
      const moistureContext: MoistureInterpretationContext = {
        measurementMethod: "optical", // AI-based
        storageTime: storageContext?.timeInStorage === "hours" ? "immediate" : 
                     storageContext?.timeInStorage === "days" ? "medium" : 
                     storageContext?.timeInStorage === "weeks" ? "long-term" : undefined,
        ambientTemperature: storageContext?.ambientTemperature,
        ambientHumidity: storageContext?.ambientHumidity,
      };
      
      const moistureInterpretation = generateMoistureInterpretation(moistureContext);
      if (moistureInterpretation.methodNote) {
        notes.push(moistureInterpretation.methodNote);
      }
      if (moistureInterpretation.storageNote) {
        notes.push(moistureInterpretation.storageNote);
      }
      if (moistureInterpretation.temperatureNote) {
        notes.push(moistureInterpretation.temperatureNote);
      }

      setInterpretationNotes(notes);

      // Create audit entry (internal logging)
      const confidenceScore = calculateConfidenceScore({
        measurementMethod: "optical",
        hasStorageContext: !!storageContext,
        hasTemperature: !!storageContext?.ambientTemperature,
        hasHumidity: !!storageContext?.ambientHumidity,
        imageQuality: data.analysis.confidenceLevel === "High" ? "high" : 
                      data.analysis.confidenceLevel === "Moderate" ? "medium" : "low",
      });

      createAuditEntry("moisture", {
        sessionId,
        visitorId,
        storageContext: storageContext || undefined,
        confidenceScore,
        commodityRulesApplied: [analysisResult.commodity, `${analysisResult.moisturePercentage}%`],
        result: { ...analysisResult } as Record<string, unknown>,
      });

      setResult(analysisResult);
      setPhase("result");
      onAnalysisComplete?.(analysisResult);
      toast.success("Moisture analysis complete!");

    } catch (err) {
      console.error("Moisture analysis error:", err);
      const message = err instanceof Error ? err.message : "Failed to analyze moisture content";
      toast.error(message, { duration: 5000 });
      setPreviewUrl(null);
      setPhase("select");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRetry = () => {
    stopCamera();
    setResult(null);
    setPreviewUrl(null);
    setPhase("select");
  };

  const handleClose = () => {
    stopCamera();
    setResult(null);
    setPreviewUrl(null);
    onClose?.();
  };

  // Generate professional institutional-grade certificate PDF
  const generateCertificatePDF = useCallback(async () => {
    if (!result) return;
    
    setIsGeneratingPDF(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
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
      doc.rect(12, 12, pageWidth - 24, 50, 'F');
      
      // Generate barcode
      const barcodeRef = `MC${Date.now().toString(36).toUpperCase()}`;
      try {
        const barcodeDataUrl = await generateBarcodeBase64(barcodeRef);
        if (barcodeDataUrl) {
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(margin + 2, 16, 45, 14, 1, 1, 'F');
          doc.addImage(barcodeDataUrl, 'PNG', margin + 4, 18, 41, 10);
          doc.setFontSize(6);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(255, 255, 255);
          doc.text(barcodeRef, margin + 24.5, 33, { align: 'center' });
        }
      } catch (err) {
        console.error("Barcode generation failed:", err);
      }
      
      // Add commodity image to header if available
      if (previewUrl) {
        try {
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(pageWidth - margin - 47, 16, 45, 32, 2, 2, 'F');
          doc.addImage(previewUrl, 'JPEG', pageWidth - margin - 45, 18, 41, 28);
        } catch (err) {
          console.error("Failed to add commodity image:", err);
        }
      }
      
      // Title
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text("MOISTURE CONTENT", pageWidth / 2, 38, { align: 'center' });
      doc.setFontSize(14);
      doc.text("ANALYSIS CERTIFICATE", pageWidth / 2, 48, { align: 'center' });
      
      // Certificate number and date
      const testDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
      const testTime = new Date().toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit'
      });
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Certificate ID: ${barcodeRef}`, 20, 70);
      doc.text(`Date: ${testDate} at ${testTime}`, pageWidth - 20, 70, { align: 'right' });
      
      // Main result box
      const statusColors: Record<string, number[]> = {
        optimal: [34, 139, 34],
        acceptable: [234, 179, 8],
        high: [239, 68, 68],
        low: [59, 130, 246],
        critical: [220, 38, 38],
      };
      const statusColor = statusColors[result.moistureStatus] || [100, 100, 100];
      
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(20, 78, pageWidth - 40, 50, 3, 3, 'F');
      
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.setFontSize(48);
      doc.setFont('helvetica', 'bold');
      doc.text(`${result.moisturePercentage}%`, pageWidth / 2, 105, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(80, 80, 80);
      doc.text(`Optimal Range: ${getOptimalRange(result.commodity)}`, pageWidth / 2, 118, { align: 'center' });
      
      // Commodity details
      let yPos = 140;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text("COMMODITY DETAILS", 20, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const details = [
        ["Commodity:", result.commodity],
        ["Quality Grade:", result.quality],
        ["Confidence Level:", result.confidenceLevel],
        ["Status:", result.moistureStatus.charAt(0).toUpperCase() + result.moistureStatus.slice(1)],
      ];
      
      details.forEach(([label, value]) => {
        doc.setTextColor(100, 100, 100);
        doc.text(label, 20, yPos);
        doc.setTextColor(30, 30, 30);
        doc.text(value, 70, yPos);
        yPos += 7;
      });
      
      // Recommendations
      yPos += 8;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text("RECOMMENDATIONS", 20, yPos);
      yPos += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      result.recommendations.forEach((rec, i) => {
        doc.setTextColor(34, 139, 34);
        doc.text(`${i + 1}.`, 20, yPos);
        doc.setTextColor(80, 80, 80);
        const recLines = doc.splitTextToSize(rec, pageWidth - 55);
        doc.text(recLines, 28, yPos);
        yPos += recLines.length * 5 + 4;
      });
      
      // Disclaimer
      doc.setFillColor(255, 248, 220);
      doc.roundedRect(15, pageHeight - 38, pageWidth - 30, 14, 2, 2, 'F');
      doc.setFontSize(7);
      doc.setTextColor(120, 100, 60);
      doc.text(
        "DISCLAIMER: This is a visual estimation only. Actual moisture content may vary. Always verify with certified lab testing for trade.",
        pageWidth / 2,
        pageHeight - 30,
        { align: 'center', maxWidth: pageWidth - 40 }
      );
      
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("AgriSMES.com", pageWidth / 2, pageHeight - 15, { align: 'center' });
      
      doc.save(`moisture-analysis-${Date.now()}.pdf`);
      toast.success("Certificate downloaded!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate certificate.");
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [result, previewUrl]);

  const generatePDFBlob = async (): Promise<Blob | null> => {
    if (!result) return null;
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
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
      doc.rect(12, 12, pageWidth - 24, 50, 'F');
      
      // Generate barcode
      const barcodeRef = `MC${Date.now().toString(36).toUpperCase()}`;
      try {
        const barcodeDataUrl = await generateBarcodeBase64(barcodeRef);
        if (barcodeDataUrl) {
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(margin + 2, 16, 45, 14, 1, 1, 'F');
          doc.addImage(barcodeDataUrl, 'PNG', margin + 4, 18, 41, 10);
          doc.setFontSize(6);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(255, 255, 255);
          doc.text(barcodeRef, margin + 24.5, 33, { align: 'center' });
        }
      } catch (err) {
        console.error("Barcode generation failed:", err);
      }
      
      // Add commodity image to PDF if available
      if (previewUrl) {
        try {
          doc.setFillColor(255, 255, 255);
          doc.roundedRect(pageWidth - margin - 47, 16, 45, 32, 2, 2, 'F');
          doc.addImage(previewUrl, 'JPEG', pageWidth - margin - 45, 18, 41, 28);
        } catch (err) {
          console.error("Failed to add commodity image:", err);
        }
      }
      
      // Title
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text("MOISTURE CONTENT", pageWidth / 2, 38, { align: 'center' });
      doc.setFontSize(14);
      doc.text("ANALYSIS CERTIFICATE", pageWidth / 2, 48, { align: 'center' });
      
      // Certificate number and date
      const testDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
      const testTime = new Date().toLocaleTimeString('en-GB', {
        hour: '2-digit', minute: '2-digit'
      });
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Certificate ID: ${barcodeRef}`, 20, 70);
      doc.text(`Date: ${testDate} at ${testTime}`, pageWidth - 20, 70, { align: 'right' });
      
      // Main result box
      const statusColors: Record<string, number[]> = {
        optimal: [34, 139, 34],
        acceptable: [234, 179, 8],
        high: [239, 68, 68],
        low: [59, 130, 246],
        critical: [220, 38, 38],
      };
      const statusColor = statusColors[result.moistureStatus] || [100, 100, 100];
      
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(20, 78, pageWidth - 40, 50, 3, 3, 'F');
      
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.setFontSize(48);
      doc.setFont('helvetica', 'bold');
      doc.text(`${result.moisturePercentage}%`, pageWidth / 2, 105, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(80, 80, 80);
      doc.text(`Optimal Range: ${getOptimalRange(result.commodity)}`, pageWidth / 2, 118, { align: 'center' });
      
      // Commodity details
      let yPos = 140;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text("COMMODITY DETAILS", 20, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const details = [
        ["Commodity:", result.commodity],
        ["Quality Grade:", result.quality],
        ["Confidence Level:", result.confidenceLevel],
        ["Status:", result.moistureStatus.charAt(0).toUpperCase() + result.moistureStatus.slice(1)],
      ];
      
      details.forEach(([label, value]) => {
        doc.setTextColor(100, 100, 100);
        doc.text(label, 20, yPos);
        doc.setTextColor(30, 30, 30);
        doc.text(value, 70, yPos);
        yPos += 7;
      });
      
      // Recommendations
      yPos += 8;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text("RECOMMENDATIONS", 20, yPos);
      yPos += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      result.recommendations.forEach((rec, i) => {
        doc.setTextColor(34, 139, 34);
        doc.text(`${i + 1}.`, 20, yPos);
        doc.setTextColor(80, 80, 80);
        const recLines = doc.splitTextToSize(rec, pageWidth - 55);
        doc.text(recLines, 28, yPos);
        yPos += recLines.length * 5 + 4;
      });
      
      // Disclaimer
      doc.setFillColor(255, 248, 220);
      doc.roundedRect(15, pageHeight - 38, pageWidth - 30, 14, 2, 2, 'F');
      doc.setFontSize(7);
      doc.setTextColor(120, 100, 60);
      doc.text(
        "DISCLAIMER: This is a visual estimation only. Actual moisture content may vary. Always verify with certified lab testing for trade.",
        pageWidth / 2,
        pageHeight - 30,
        { align: 'center', maxWidth: pageWidth - 40 }
      );
      
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("AgriSMES.com", pageWidth / 2, pageHeight - 15, { align: 'center' });
      
      return doc.output("blob");
    } catch (error) {
      console.error("PDF blob generation error:", error);
      return null;
    }
  };

  const handleShare = async () => {
    try {
      const blob = await generatePDFBlob();
      if (!blob) {
        toast.error("Failed to generate certificate for sharing.");
        return;
      }
      
      const file = new File([blob], `moisture-analysis-${Date.now()}.pdf`, { type: "application/pdf" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
        toast.success("Shared successfully!");
      } else {
        generateCertificatePDF();
      }
    } catch (error) {
      console.error("Share error:", error);
      generateCertificatePDF();
    }
  };

  const getStatusColor = (status: MoistureAnalysisResult["moistureStatus"]) => {
    switch (status) {
      case "optimal": return "text-green-600";
      case "acceptable": return "text-yellow-600";
      case "high": return "text-orange-600";
      case "low": return "text-blue-600";
      case "critical": return "text-red-600";
      case "abnormal": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const getStatusBgColor = (status: MoistureAnalysisResult["moistureStatus"]) => {
    switch (status) {
      case "optimal": return "bg-green-100 text-green-800 border-green-200";
      case "acceptable": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "low": return "bg-blue-100 text-blue-800 border-blue-200";
      case "critical": return "bg-red-100 text-red-800 border-red-200";
      case "abnormal": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case "High": return "bg-green-100 text-green-800 border-green-200";
      case "Moderate": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-red-100 text-red-800 border-red-200";
    }
  };

  const getConfidenceIcon = (level: string) => {
    switch (level) {
      case "High": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "Moderate": return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default: return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
  };

  return (
    <>
      {/* Full-screen institutional spinner for analyzing phase */}
      <InstitutionalFullScreenSpinner 
        isVisible={isAnalyzing} 
        type="moisture" 
        message="Analyzing Moisture Content"
      />
      
      <div className="flex flex-col h-full bg-gradient-to-b from-primary/5 to-background">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">AI Moisture Assessment</span>
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
              <Droplets className="w-12 h-12 mx-auto text-primary" />
              <h3 className="text-lg font-semibold text-foreground">AI Moisture Assessment</h3>
              <p className="text-sm text-muted-foreground">
                Commodity-specific moisture estimation for cashew, coffee, cocoa, and sesame.
              </p>
              <p className="text-xs text-muted-foreground italic">
                Indicative result only. Always confirm with a calibrated moisture meter before major trade, storage, or processing decisions.
              </p>
            </div>

            <Button
              onClick={() => setPhase("batch-input")}
              className="w-full h-14 gap-3"
              disabled={disabled}
            >
              <Wheat className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Start Assessment</div>
                <div className="text-xs opacity-80">Enter batch details → Take photo</div>
              </div>
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}

        {/* Batch Input Phase */}
        {phase === "batch-input" && (
          <MoistureBatchInputForm
            onSubmit={(ctx) => {
              setBatchContext(ctx);
              setPhase("instructions");
            }}
            onBack={() => setPhase("select")}
          />
        )}

        {/* Instructions Phase - Enhanced with better guidance */}
        {phase === "instructions" && (
          <div className="space-y-4">
            <div className="text-center space-y-2 mb-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                <Droplets className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Moisture Analysis Tips</h3>
              <p className="text-sm text-muted-foreground">
                Follow these tips for accurate results
              </p>
            </div>

            <div className="grid gap-3">
              {[
                { icon: Droplets, title: "Capture the Commodity", desc: "Show the actual commodity (beans, nuts, grains) not just the packaging." },
                { icon: Camera, title: "Close-Up Shot", desc: "Get close enough to see the texture and color clearly." },
                { icon: ThermometerSun, title: "Natural Lighting", desc: "Use natural daylight when possible. Avoid flash." },
                { icon: Clock, title: "Steady Hold", desc: "Hold the camera steady for 2-3 seconds. Auto-capture will trigger." },
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
                <Droplets className="w-16 h-16 mx-auto text-primary/30 mb-2" />
                <p className="text-sm text-muted-foreground">Position commodity within frame</p>
              </div>
            </div>

            <div className="grid gap-2">
              <Button onClick={handleStartCapture} className="h-12 gap-2">
                <Camera className="h-4 w-4" />
                Take Photo
              </Button>
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="h-12 gap-2">
                <Upload className="h-4 w-4" />
                Upload from Device
              </Button>
              <Button variant="ghost" onClick={() => setPhase("batch-input")} className="text-sm">
                Back to Batch Details
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            <p className="text-[10px] text-center text-muted-foreground italic">
              Indicative result only. Always confirm with a calibrated moisture meter.
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
              Position the commodity sample within the frame, then tap to capture
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
          <InstitutionalAnalyzingScreen type="moisture" capturedImage={previewUrl} />
        )}

        {/* Result Phase */}
        {phase === "result" && result && (
          <div className="space-y-4">
            {/* Main Result Badge */}
            <Card className={`overflow-hidden ${result.isAbnormal ? 'bg-gradient-to-br from-red-600 to-red-500' : 'bg-gradient-to-br from-primary to-primary/80'} text-white`}>
              <CardContent className="p-0">
                <div className="flex">
                  {previewUrl && (
                    <div className="w-24 h-36 flex-shrink-0">
                      <img src={previewUrl} alt="Commodity sample" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 p-4 text-center flex flex-col justify-center">
                    {result.isAbnormal ? (
                      <>
                        <AlertTriangle className="w-6 h-6 mx-auto mb-1" />
                        <div className="text-xs uppercase tracking-wide opacity-70">Estimated Condition</div>
                        <div className="text-lg font-bold mt-1">Likely {result.abnormalDirection === "too_dry" ? "Below" : "Above"} Safe Range</div>
                        {result.safeRange && (
                          <div className="text-xs opacity-80 mt-1">Safe Range: {result.safeRange}</div>
                        )}
                        <Badge className="mt-2 mx-auto bg-red-100 text-red-800 border-red-200">
                          Risk — Requires Physical Meter
                        </Badge>
                      </>
                    ) : (
                      <>
                        <Droplets className="w-5 h-5 mx-auto mb-1 opacity-80" />
                        <div className="text-xs uppercase tracking-wide opacity-70">Estimated Moisture</div>
                        <div className="text-4xl font-bold mt-1">{result.moisturePercentage}%</div>
                        <div className="text-xs opacity-80 mt-1">
                          Safe Range: {result.safeRange || getOptimalRange(result.commodity)}
                        </div>
                        <Badge className={`mt-2 mx-auto ${getStatusBgColor(result.moistureStatus)}`}>
                          {result.moistureStatus === "optimal" ? "Within Recommended Range" : result.moistureStatus.charAt(0).toUpperCase() + result.moistureStatus.slice(1)}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
                {/* Confidence + Method Row */}
                <div className="px-4 pb-3 flex items-center justify-between">
                  <Badge className={`${getConfidenceColor(result.confidenceLevel)}`}>
                    {getConfidenceIcon(result.confidenceLevel)}
                    <span className="ml-1">{result.confidenceLevel}</span>
                  </Badge>
                  <div className="flex items-center gap-2">
                    <ExplainThis 
                      topic="Moisture Content" 
                      value={`${result.moistureRangeMin}-${result.moistureRangeMax}%`}
                      context={result.commodity}
                      compact
                    />
                    <div className="flex items-center gap-1 text-xs opacity-70">
                      <Activity className="w-3 h-3" />
                      <span>{result.method}</span>
                    </div>
                  </div>
                </div>
                {/* Timestamp */}
                <div className="px-4 pb-2 flex items-center justify-center gap-1 text-xs opacity-60">
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(result.analysisTimestamp).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} at{" "}
                    {new Date(result.analysisTimestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Abnormal Condition Warning */}
            {result.isAbnormal && result.abnormalReasons && result.abnormalReasons.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4 space-y-2">
                  <h4 className="font-semibold text-red-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Abnormal Conditions Detected
                  </h4>
                  <ul className="space-y-1">
                    {result.abnormalReasons.map((reason, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                        <span className="mt-1">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-red-600 font-medium mt-2">
                    A precise moisture percentage cannot be provided. Please verify with a physical moisture meter.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Commodity Details */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-green-600" />
                  Commodity Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-500">Commodity:</div>
                  <div className="font-medium">{result.commodity}</div>
                  {result.commodityGrade && (
                    <>
                      <div className="text-gray-500">Grade:</div>
                      <div className="font-medium">{result.commodityGrade}</div>
                    </>
                  )}
                  {result.commoditySize && (
                    <>
                      <div className="text-gray-500">Size:</div>
                      <div className="font-medium">{result.commoditySize}</div>
                    </>
                  )}
                  {result.commodityType && (
                    <>
                      <div className="text-gray-500">Type:</div>
                      <div className="font-medium">{result.commodityType}</div>
                    </>
                  )}
                  <div className="text-gray-500">Quality:</div>
                  <div className="font-medium">{result.quality}</div>
                  <div className="text-gray-500">Confidence:</div>
                  <div className="font-medium flex items-center gap-1">
                    {getConfidenceIcon(result.confidenceLevel)}
                    {result.confidenceLevel}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Recommendations</h4>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, i) => (
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
              <Button 
                onClick={generateCertificatePDF} 
                className="w-full gap-2 bg-green-600 hover:bg-green-700"
                disabled={isGeneratingPDF}
              >
                {isGeneratingPDF ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
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
                    commodity: result.commodity,
                    grade: result.commodityGrade,
                    quality: result.quality,
                    moistureStatus: result.moistureStatus,
                    confidenceLevel: result.confidenceLevel,
                  }}
                  toolType="moisture"
                  consentMarketing={consent.consentMarketing}
                  submissionId={submissionId}
                />
                <MarketAccessCTA
                  submissionId={submissionId}
                  commodity={result.commodity}
                  isMarketReady={result.moistureStatus === "optimal" || result.moistureStatus === "acceptable"}
                  grade={result.commodityGrade}
                  qualityNotes={result.quality}
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

            {/* Method Explanation + Disclaimer */}
            <MethodExplanation showDetails={result.confidenceLevel !== "High"} />
            
            {/* Disclaimer */}
            <AnalysisDisclaimer type="moisture" variant="card" />
            
            {/* Consent Dialog - shows after result for data storage */}
            <SubmissionConsentDialog
              open={showConsentDialog}
              onOpenChange={setShowConsentDialog}
              toolType="moisture"
              commodity={result.commodity}
              onConfirm={async (newConsent) => {
                setConsent(newConsent);
                const storedResult = await storeSubmission({
                  toolType: "moisture",
                  commodity: result.commodity,
                  region: result.imageMetadata?.estimatedLocation,
                  resultJson: result as unknown as Record<string, unknown>,
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
    </>
  );
}
