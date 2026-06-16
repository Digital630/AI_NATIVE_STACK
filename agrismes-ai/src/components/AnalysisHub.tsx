import React, { useState } from "react";
import { 
  X, 
  Leaf, 
  Thermometer, 
  Layers, 
  AlertTriangle,
  Cloud,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CropHealthAnalysis } from "@/components/CropHealthAnalysis";
import { motion } from "framer-motion";

interface AnalysisHubProps {
  onClose: () => void;
  sessionId?: string;
}

type AnalysisType = "crop-health" | "heat-stress" | "soil-signals" | "pesticide-risk" | "climate-impact";

const ANALYSIS_OPTIONS = [
  {
    id: "crop-health" as AnalysisType,
    title: "Crop Health",
    subtitle: "Leaf & Fruit Assessment",
    description: "Analyze plant vigor, disease indicators, and harvest readiness",
    icon: Leaf,
    available: true,
    features: ["Leaf condition analysis", "Fruit maturity check", "Harvest readiness", "Disease indicators"]
  },
  {
    id: "heat-stress" as AnalysisType,
    title: "Heat Stress",
    subtitle: "Temperature Impact",
    description: "Identify heat stress indicators and get mitigation guidance",
    icon: Thermometer,
    available: true,
    features: ["Wilting detection", "Color change analysis", "Irrigation guidance", "Preventive measures"]
  },
  {
    id: "soil-signals" as AnalysisType,
    title: "Soil Signals",
    subtitle: "Visual Soil Assessment",
    description: "Observe soil condition indicators from images",
    icon: Layers,
    available: true,
    features: ["Moisture estimation", "Texture observation", "Erosion signs", "Organic matter"]
  },
  {
    id: "pesticide-risk" as AnalysisType,
    title: "Pesticide Risk",
    subtitle: "Testing Pathway",
    description: "Risk flagging and lab testing guidance (not chemical detection)",
    icon: AlertTriangle,
    available: true,
    features: ["Visual risk indicators", "Lab testing pathway", "Sample preparation", "Buyer communication"]
  },
  {
    id: "climate-impact" as AnalysisType,
    title: "Climate Impact",
    subtitle: "Coming Soon",
    description: "Track climate patterns affecting your commodities",
    icon: Cloud,
    available: false,
    features: ["Weather patterns", "Seasonal forecasts", "Risk alerts", "Adaptation guidance"]
  }
];

export function AnalysisHub({ onClose, sessionId }: AnalysisHubProps) {
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisType | null>(null);

  // Show specific analysis tool
  if (activeAnalysis && activeAnalysis !== "climate-impact") {
    return (
      <CropHealthAnalysis
        onClose={() => setActiveAnalysis(null)}
        sessionId={sessionId}
        analysisType={activeAnalysis}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 overflow-y-auto">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">Analysis Hub</h1>
            <p className="text-sm text-muted-foreground">
              AI-assisted agricultural analysis tools
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Analysis Options */}
        <div className="space-y-3">
          {ANALYSIS_OPTIONS.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className={`cursor-pointer transition-all ${
                  option.available 
                    ? 'hover:border-primary/50 hover:shadow-md' 
                    : 'opacity-60 cursor-not-allowed'
                }`}
                onClick={() => option.available && setActiveAnalysis(option.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        option.available ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        <option.icon className={`w-5 h-5 ${
                          option.available ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {option.title}
                          {!option.available && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                              Coming Soon
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {option.subtitle}
                        </CardDescription>
                      </div>
                    </div>
                    {option.available && (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-2">
                    {option.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {option.features.map((feature) => (
                      <span 
                        key={feature}
                        className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
          <h3 className="text-sm font-medium text-foreground mb-2">
            Decision-Support Tools
          </h3>
          <p className="text-xs text-muted-foreground">
            These analysis tools provide AI-assisted indicators for decision support. 
            They do not replace professional diagnosis, laboratory testing, or expert consultation. 
            Results should be used as guidance alongside other sources of information.
          </p>
        </div>

        {/* Close Button */}
        <Button variant="ghost" onClick={onClose} className="w-full mt-4">
          Back to Chat
        </Button>
      </div>
    </div>
  );
}
