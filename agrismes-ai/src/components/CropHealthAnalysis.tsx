import React, { useState, useRef, useCallback } from "react";
import { 
  Camera, 
  Upload, 
  FileImage, 
  X, 
  Loader2, 
  Leaf, 
  AlertTriangle,
  CheckCircle,
  Info,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { InstitutionalAnalyzingScreen } from "@/components/InstitutionalAnalyzingScreen";
import jsPDF from "jspdf";

interface CropHealthAnalysisProps {
  onClose: () => void;
  sessionId?: string;
  analysisType: "crop-health" | "heat-stress" | "soil-signals" | "pesticide-risk";
}

const ANALYSIS_CONFIG = {
  "crop-health": {
    title: "Crop Health Analysis",
    subtitle: "Leaf & fruit condition assessment with harvest readiness",
    icon: Leaf,
    prompt: `Analyze this agricultural image for crop health indicators. Assess:
1. Leaf condition (color, spots, wilting, pest damage)
2. Fruit/produce maturity and quality indicators
3. Harvest readiness estimation
4. Visible disease or nutrient deficiency signs
5. Overall plant vigor assessment

Return JSON: {
  "commodityType": "string",
  "healthScore": "number 0-100",
  "leafCondition": { "status": "healthy|moderate|poor", "observations": ["string"] },
  "fruitAssessment": { "maturity": "immature|developing|ready|overripe", "quality": "excellent|good|fair|poor" },
  "harvestReadiness": { "ready": "boolean", "estimatedDays": "number or null", "notes": "string" },
  "diseaseIndicators": ["string"],
  "nutrientStatus": { "status": "adequate|deficient|excess", "observations": ["string"] },
  "recommendations": ["string"],
  "confidenceLevel": "high|moderate|low",
  "limitations": "string"
}`
  },
  "heat-stress": {
    title: "Heat Stress Indicators",
    subtitle: "Temperature impact assessment and guidance",
    icon: AlertTriangle,
    prompt: `Analyze this agricultural image for heat stress indicators. Assess:
1. Leaf wilting, curling, or scorching
2. Color changes indicating thermal stress
3. Fruit/produce heat damage signs
4. Soil moisture visual indicators
5. Overall stress severity

Return JSON: {
  "commodityType": "string",
  "stressLevel": "none|mild|moderate|severe",
  "stressScore": "number 0-100",
  "indicators": {
    "leafWilting": "boolean",
    "colorChanges": "boolean",
    "scorching": "boolean",
    "fruitDamage": "boolean"
  },
  "observations": ["string"],
  "immediateActions": ["string"],
  "preventiveMeasures": ["string"],
  "irrigationGuidance": "string",
  "confidenceLevel": "high|moderate|low",
  "limitations": "string"
}`
  },
  "soil-signals": {
    title: "Soil Signals",
    subtitle: "Visual soil condition observations",
    icon: Info,
    prompt: `Analyze this image for visual soil condition indicators. Assess:
1. Soil color and texture appearance
2. Moisture content visual indicators
3. Compaction or erosion signs
4. Organic matter presence
5. Surface condition

Return JSON: {
  "soilType": "string",
  "moistureLevel": "dry|adequate|wet|saturated",
  "textureEstimate": "sandy|loamy|clay|mixed",
  "colorIndicators": { "observation": "string", "possibleMeaning": "string" },
  "erosionSigns": "boolean",
  "compactionIndicators": "boolean",
  "organicMatterPresence": "low|moderate|high",
  "observations": ["string"],
  "recommendations": ["string"],
  "labTestingSuggested": "boolean",
  "confidenceLevel": "high|moderate|low",
  "limitations": "string"
}`
  },
  "pesticide-risk": {
    title: "Pesticide Risk & Testing Pathway",
    subtitle: "Risk indicators and lab testing guidance",
    icon: AlertTriangle,
    prompt: `Analyze this agricultural image for pesticide exposure risk indicators. Note: This is NOT chemical detection - only visual risk flagging.

Assess:
1. Visible spray residue patterns
2. Leaf burn or chemical damage patterns
3. Unusual coloration suggesting chemical exposure
4. Application timing indicators
5. Risk level based on visual observations

Return JSON: {
  "commodityType": "string",
  "riskLevel": "low|moderate|high",
  "visualIndicators": {
    "residuePatterns": "boolean",
    "chemicalBurnSigns": "boolean",
    "unusualColoration": "boolean"
  },
  "observations": ["string"],
  "riskFactors": ["string"],
  "labTestingRecommended": "boolean",
  "testingPathway": {
    "testTypes": ["string"],
    "samplePreparation": "string",
    "labGuidance": "string"
  },
  "preHarvestInterval": "string or null",
  "buyerCommunication": "string",
  "confidenceLevel": "high|moderate|low",
  "limitations": "string",
  "disclaimer": "This assessment provides decision-support only. It does not detect, measure, or confirm pesticide presence. Laboratory testing is required for definitive analysis."
}`
  }
};

export function CropHealthAnalysis({ onClose, sessionId, analysisType }: CropHealthAnalysisProps) {
  const [mode, setMode] = useState<"select" | "capture" | "analyzing" | "result">("select");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const config = ANALYSIS_CONFIG[analysisType];
  const IconComponent = config.icon;

  const processImage = useCallback(async (imageBase64: string, mimeType: string) => {
    setMode("analyzing");
    setError(null);

    try {
      const response = await supabase.functions.invoke("analyze-crop-health", {
        body: {
          imageBase64,
          mimeType,
          analysisType,
          prompt: config.prompt,
          sessionId,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Analysis failed");
      }

      if (response.data?.success) {
        setAnalysisResult(response.data.analysis);
        setMode("result");
      } else if (response.data?.rejected) {
        setError(response.data.rejectionReason || "Image could not be analyzed");
        setMode("select");
      } else {
        throw new Error("Unexpected response");
      }
    } catch (err: any) {
      console.error("[CropHealthAnalysis] Error:", err);
      setError(err.message || "Analysis failed. Please try again.");
      setMode("select");
      toast.error("Analysis failed. Please try again.");
    }
  }, [analysisType, config.prompt, sessionId]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      setCapturedImage(result);
      processImage(base64, file.type);
    };
    reader.readAsDataURL(file);
  }, [processImage]);

  const generateCertificate = useCallback(() => {
    if (!analysisResult) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(34, 139, 34);
    doc.rect(0, 0, pageWidth, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("SMEFlow Analysis Certificate", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(config.title, pageWidth / 2, 32, { align: "center" });
    
    // Content
    doc.setTextColor(0, 0, 0);
    let yPos = 55;
    
    doc.setFontSize(11);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPos);
    doc.text(`Time: ${new Date().toLocaleTimeString()}`, pageWidth - 60, yPos);
    yPos += 15;

    // Analysis details based on type
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Analysis Results", 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const addField = (label: string, value: string) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 20, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(value, 70, yPos);
      yPos += 8;
    };

    if (analysisResult.commodityType) addField("Commodity", analysisResult.commodityType);
    if (analysisResult.healthScore) addField("Health Score", `${analysisResult.healthScore}/100`);
    if (analysisResult.stressLevel) addField("Stress Level", analysisResult.stressLevel);
    if (analysisResult.riskLevel) addField("Risk Level", analysisResult.riskLevel);
    if (analysisResult.confidenceLevel) addField("Confidence", analysisResult.confidenceLevel);

    yPos += 10;

    // Recommendations
    if (analysisResult.recommendations?.length) {
      doc.setFont("helvetica", "bold");
      doc.text("Recommendations:", 20, yPos);
      yPos += 8;
      doc.setFont("helvetica", "normal");
      analysisResult.recommendations.slice(0, 5).forEach((rec: string) => {
        const lines = doc.splitTextToSize(`• ${rec}`, pageWidth - 40);
        doc.text(lines, 25, yPos);
        yPos += lines.length * 5 + 3;
      });
    }

    // Disclaimer
    yPos = 260;
    doc.setFillColor(245, 245, 245);
    doc.rect(15, yPos - 5, pageWidth - 30, 25, "F");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const disclaimer = "DECISION-SUPPORT ONLY: This analysis provides AI-assisted indicators for decision support purposes. It does not constitute professional diagnosis, guarantee accuracy, or replace laboratory testing. Results may have limitations based on image quality and environmental factors.";
    const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - 40);
    doc.text(disclaimerLines, 20, yPos);

    // Footer
    doc.setFontSize(8);
    doc.text("Generated by SMEFlow | AgriSMES Trade Readiness Platform", pageWidth / 2, 290, { align: "center" });

    doc.save(`smeflow-${analysisType}-${Date.now()}.pdf`);
    toast.success("Certificate downloaded");
  }, [analysisResult, analysisType, config.title]);

  const reset = () => {
    setMode("select");
    setCapturedImage(null);
    setAnalysisResult(null);
    setError(null);
  };

  // Mode Selection
  if (mode === "select") {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <IconComponent className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">{config.title}</h1>
                <p className="text-xs text-muted-foreground">{config.subtitle}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Card className="border-2 border-dashed">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-base">Select Image Source</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-14"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Take Photo</p>
                  <p className="text-xs text-muted-foreground">Use device camera</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-14"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileImage className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Photo Library</p>
                  <p className="text-xs text-muted-foreground">Choose from gallery</p>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-14"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Choose File</p>
                  <p className="text-xs text-muted-foreground">Upload from device</p>
                </div>
              </Button>
            </CardContent>
          </Card>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          <div className="mt-6 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              <strong>Decision-support only:</strong> This tool provides possible indicators and recommendations. It does not guarantee accuracy or replace professional assessment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Analyzing
  if (mode === "analyzing") {
    return (
      <InstitutionalAnalyzingScreen 
        type="quality" 
        capturedImage={capturedImage}
      />
    );
  }

  // Results
  if (mode === "result" && analysisResult) {
    return (
      <div className="min-h-screen bg-background p-4 overflow-y-auto">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-semibold text-foreground">{config.title} Results</h1>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {capturedImage && (
            <div className="mb-4 rounded-lg overflow-hidden border">
              <img src={capturedImage} alt="Analyzed" className="w-full h-48 object-cover" />
            </div>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {analysisResult.healthScore !== undefined && (
              <Card className="text-center p-3">
                <p className="text-2xl font-bold text-primary">{analysisResult.healthScore}</p>
                <p className="text-xs text-muted-foreground">Health Score</p>
              </Card>
            )}
            {analysisResult.stressLevel && (
              <Card className="text-center p-3">
                <p className={`text-lg font-bold ${
                  analysisResult.stressLevel === 'severe' ? 'text-destructive' :
                  analysisResult.stressLevel === 'moderate' ? 'text-yellow-600' : 'text-primary'
                }`}>
                  {analysisResult.stressLevel.toUpperCase()}
                </p>
                <p className="text-xs text-muted-foreground">Stress Level</p>
              </Card>
            )}
            {analysisResult.riskLevel && (
              <Card className="text-center p-3">
                <p className={`text-lg font-bold ${
                  analysisResult.riskLevel === 'high' ? 'text-destructive' :
                  analysisResult.riskLevel === 'moderate' ? 'text-yellow-600' : 'text-primary'
                }`}>
                  {analysisResult.riskLevel.toUpperCase()}
                </p>
                <p className="text-xs text-muted-foreground">Risk Level</p>
              </Card>
            )}
            {analysisResult.confidenceLevel && (
              <Card className="text-center p-3">
                <p className="text-lg font-bold text-foreground">{analysisResult.confidenceLevel}</p>
                <p className="text-xs text-muted-foreground">Confidence</p>
              </Card>
            )}
          </div>

          {/* Observations */}
          {analysisResult.observations?.length > 0 && (
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Observations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {analysisResult.observations.map((obs: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      {obs}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {analysisResult.recommendations?.length > 0 && (
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {analysisResult.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Limitations */}
          {analysisResult.limitations && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>Limitations:</strong> {analysisResult.limitations}
              </p>
            </div>
          )}

          {/* Disclaimer */}
          <div className="mb-6 p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              <strong>Decision-support only:</strong> This analysis is for guidance purposes. Laboratory testing may be required for definitive results.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={reset} className="flex-1">
              New Analysis
            </Button>
            <Button onClick={generateCertificate} className="flex-1 gap-2">
              <Download className="w-4 h-4" />
              Download Certificate
            </Button>
          </div>

          <Button variant="ghost" onClick={onClose} className="w-full mt-3">
            Close
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
