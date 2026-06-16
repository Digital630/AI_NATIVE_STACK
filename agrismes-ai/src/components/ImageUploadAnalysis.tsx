import { useState, useRef, useCallback } from "react";
import { Camera, X, Loader2, AlertTriangle, CheckCircle, Info, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface ImageAnalysisResult {
  productQuality: {
    assessment: string;
    description: string;
  };
  moistureContent: {
    assessment: string;
    description: string;
  };
  harvestReadiness: {
    assessment: string;
    description: string;
  };
  heatStress: {
    assessment: string;
    description: string;
  };
  confidenceLevel: "High confidence" | "Moderate confidence" | "Low confidence";
  overallSummary: string;
  recommendations: string[];
  detectedCommodity?: string;
}

interface ImageUploadAnalysisProps {
  onAnalysisComplete: (analysis: ImageAnalysisResult, imagePreview: string) => void;
  onPointsAwarded?: () => void;
  sessionId?: string;
  visitorId?: string;
  disabled?: boolean;
}

// Purpose: General product image analysis (not moisture-specific)
// This is the CAMERA button - for general agricultural product photos

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

export function ImageUploadAnalysis({
  onAnalysisComplete,
  onPointsAwarded,
  sessionId,
  visitorId,
  disabled = false,
}: ImageUploadAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Please upload a JPG, JPEG, or PNG image.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "Image size must be under 5MB.";
    }
    return null;
  }, []);

  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsAnalyzing(true);

    try {
      // Convert to base64
      const base64 = await fileToBase64(file);

      // Call analysis endpoint
      const { data, error: functionError } = await supabase.functions.invoke("analyze-product-image", {
        body: {
          imageBase64: base64,
          mimeType: file.type,
          sessionId,
          visitorId,
        },
      });

      if (functionError) {
        throw new Error(functionError.message || "Analysis failed");
      }

      // Handle content rejection (non-agri-commodity images)
      if (data?.rejected) {
        const rejectionMessage = data.rejectionReason || data.error || "This image is outside the agri-commodity scope.";
        setError(rejectionMessage);
        toast.error(rejectionMessage, { duration: 6000 });
        setPreviewUrl(null);
        return;
      }

      if (!data?.success) {
        throw new Error(data?.error || "Analysis failed");
      }

      // Award points for image upload
      onPointsAwarded?.();

      // Show low quality warning if applicable
      if (data.lowQualityWarning) {
        toast.warning("The image quality appears to be low. Results may be less accurate.", {
          duration: 5000,
        });
      }

      // Pass results to parent
      onAnalysisComplete(data.analysis, objectUrl);
      
      toast.success("Image analysis complete!");

    } catch (err) {
      console.error("Image analysis error:", err);
      const message = err instanceof Error ? err.message : "Failed to analyze image";
      setError(message);
      toast.error(message, { duration: 5000 });
      setPreviewUrl(null);
    } finally {
      setIsAnalyzing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [validateFile, fileToBase64, sessionId, visitorId, onAnalysisComplete, onPointsAwarded]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const clearPreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [previewUrl]);

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isAnalyzing}
      />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleButtonClick}
        disabled={disabled || isAnalyzing}
        className="h-9 w-9 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
        title="Take photo for general product analysis (not moisture test)"
      >
        {isAnalyzing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
      </Button>

      {/* Preview overlay when analyzing */}
      <AnimatePresence>
        {previewUrl && isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute bottom-full right-0 mb-2 p-2 bg-card border border-border rounded-lg shadow-lg z-50"
          >
            <div className="relative w-20 h-20">
              <img
                src={previewUrl}
                alt="Analyzing..."
                className="w-full h-full object-cover rounded opacity-75"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            </div>
            <p className="text-xs text-center mt-1 text-muted-foreground">Analyzing...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Component to display analysis results in chat
interface AnalysisResultDisplayProps {
  analysis: ImageAnalysisResult;
  imagePreview: string;
  onContactExpert?: () => void;
}

export function AnalysisResultDisplay({
  analysis,
  imagePreview,
  onContactExpert,
}: AnalysisResultDisplayProps) {
  const confidenceColor = {
    "High confidence": "text-green-600 bg-green-50 border-green-200",
    "Moderate confidence": "text-amber-600 bg-amber-50 border-amber-200",
    "Low confidence": "text-red-600 bg-red-50 border-red-200",
  };

  const assessmentIcon = (assessment: string) => {
    if (assessment.toLowerCase().includes("good") || assessment.toLowerCase().includes("optimal") || assessment.toLowerCase().includes("healthy") || assessment.toLowerCase().includes("ready")) {
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    }
    if (assessment.toLowerCase().includes("unable")) {
      return <Info className="h-3 w-3 text-muted-foreground" />;
    }
    return <AlertTriangle className="h-3 w-3 text-amber-500" />;
  };

  const isLowConfidence = analysis.confidenceLevel === "Low confidence";
  const isModerateConfidence = analysis.confidenceLevel === "Moderate confidence";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg overflow-hidden"
    >
      {/* Header with image preview */}
      <div className="flex gap-3 p-3 bg-muted/30">
        <img
          src={imagePreview}
          alt="Analyzed product"
          className="w-16 h-16 object-cover rounded"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">Product Analysis</span>
            {analysis.detectedCommodity && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {analysis.detectedCommodity}
              </span>
            )}
          </div>
          <div className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border ${confidenceColor[analysis.confidenceLevel]}`}>
            {analysis.confidenceLevel}
          </div>
        </div>
      </div>

      {/* Analysis details */}
      <div className="p-3 space-y-3">
        {/* Summary */}
        <p className="text-sm text-foreground">{analysis.overallSummary}</p>

        {/* Quality indicators - Moisture Content prioritized first */}
        <div className="grid grid-cols-2 gap-2">
          <div className="text-xs space-y-0.5 bg-primary/5 p-2 rounded border border-primary/10">
            <div className="flex items-center gap-1 font-medium text-primary">
              {assessmentIcon(analysis.moistureContent.assessment)}
              Moisture Content
            </div>
            <p className="text-muted-foreground">{analysis.moistureContent.assessment}</p>
            <p className="text-[10px] text-muted-foreground/70">{analysis.moistureContent.description}</p>
          </div>
          <div className="text-xs space-y-0.5">
            <div className="flex items-center gap-1 font-medium">
              {assessmentIcon(analysis.productQuality.assessment)}
              Quality
            </div>
            <p className="text-muted-foreground">{analysis.productQuality.assessment}</p>
          </div>
          <div className="text-xs space-y-0.5">
            <div className="flex items-center gap-1 font-medium">
              {assessmentIcon(analysis.harvestReadiness.assessment)}
              Readiness
            </div>
            <p className="text-muted-foreground">{analysis.harvestReadiness.assessment}</p>
          </div>
          <div className="text-xs space-y-0.5">
            <div className="flex items-center gap-1 font-medium">
              {assessmentIcon(analysis.heatStress.assessment)}
              Health
            </div>
            <p className="text-muted-foreground">{analysis.heatStress.assessment}</p>
          </div>
        </div>

        {/* Recommendations */}
        {analysis.recommendations.length > 0 && (
          <div className="text-xs">
            <p className="font-medium mb-1">Recommendations:</p>
            <ul className="space-y-0.5 text-muted-foreground">
              {analysis.recommendations.slice(0, 3).map((rec, idx) => (
                <li key={idx} className="flex items-start gap-1">
                  <span className="text-primary">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Low/Moderate confidence handoff suggestion */}
        {(isLowConfidence || isModerateConfidence) && onContactExpert && (
          <div className="pt-2 border-t border-border">
            <button
              onClick={onContactExpert}
              className="flex items-center gap-2 text-xs text-primary hover:underline"
            >
              <MessageCircle className="h-3 w-3" />
              Would you like to connect with an AgriSMES expert for verification?
            </button>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="px-3 py-2 bg-muted/30 border-t border-border">
        <p className="text-[10px] text-muted-foreground">
          This analysis is AI-generated and for informational purposes only. Final quality assessments require expert verification.
        </p>
      </div>
    </motion.div>
  );
}
