/**
 * PreTradeReadinessLadder Component
 * Visual guide showing the stages of trade readiness
 * Helps users understand where they are and what's needed to progress
 */

import { CheckCircle, Circle, ArrowRight, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type ReadinessStage = "explorer" | "emerging" | "trade_ready" | "institutional_ready";

interface ReadinessLevel {
  id: ReadinessStage;
  title: string;
  shortTitle: string;
  description: string;
  requirements: string[];
  color: string;
  bgColor: string;
}

const READINESS_LEVELS: ReadinessLevel[] = [
  {
    id: "explorer",
    title: "Explorer",
    shortTitle: "Explorer",
    description: "New to export markets, learning requirements",
    requirements: [
      "Basic product knowledge",
      "Interest in export markets",
      "Understanding of local quality standards"
    ],
    color: "text-slate-600",
    bgColor: "bg-slate-100 dark:bg-slate-800"
  },
  {
    id: "emerging",
    title: "Emerging Trader",
    shortTitle: "Emerging",
    description: "Developing capabilities, building documentation",
    requirements: [
      "Product samples available",
      "Basic quality documentation",
      "Local market experience",
      "Business registration"
    ],
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30"
  },
  {
    id: "trade_ready",
    title: "Trade Ready",
    shortTitle: "Trade Ready",
    description: "Export-capable with proper documentation",
    requirements: [
      "Export license obtained",
      "Quality certifications (phytosanitary, etc.)",
      "Established supply capacity",
      "Banking relationships for trade finance",
      "Logistics partners identified"
    ],
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/30"
  },
  {
    id: "institutional_ready",
    title: "Institutional Ready",
    shortTitle: "Institutional",
    description: "Ready for large-scale, long-term contracts",
    requirements: [
      "Audited financial statements",
      "Traceability systems in place",
      "Volume capacity (100+ MT)",
      "Track record of successful exports",
      "Insurance and risk management",
      "Sustainability certifications"
    ],
    color: "text-primary",
    bgColor: "bg-primary/10"
  }
];

interface PreTradeReadinessLadderProps {
  currentStage?: ReadinessStage;
  compact?: boolean;
  showProgress?: boolean;
  className?: string;
}

export function PreTradeReadinessLadder({
  currentStage,
  compact = false,
  showProgress = true,
  className = ""
}: PreTradeReadinessLadderProps) {
  const currentIndex = currentStage 
    ? READINESS_LEVELS.findIndex(l => l.id === currentStage)
    : -1;

  if (compact) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <TooltipProvider>
          {READINESS_LEVELS.map((level, index) => {
            const isComplete = currentIndex >= index;
            const isCurrent = currentIndex === index;
            
            return (
              <Tooltip key={level.id}>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <div
                      className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                        transition-all cursor-help
                        ${isComplete 
                          ? `${level.bgColor} ${level.color}` 
                          : "bg-muted text-muted-foreground"
                        }
                        ${isCurrent ? "ring-2 ring-primary ring-offset-2" : ""}
                      `}
                    >
                      {isComplete ? <CheckCircle className="h-3.5 w-3.5" /> : index + 1}
                    </div>
                    {index < READINESS_LEVELS.length - 1 && (
                      <div 
                        className={`w-4 h-0.5 ${
                          currentIndex > index ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-semibold">{level.title}</p>
                  <p className="text-xs text-muted-foreground">{level.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Pre-Trade Readiness Ladder
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>This ladder shows the stages of trade readiness. Each stage builds on the previous, helping you understand what's needed to access larger markets and institutional buyers.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription>
              Understand your journey from local supplier to institutional-grade exporter
            </CardDescription>
          </div>
          {currentStage && (
            <Badge className={READINESS_LEVELS[currentIndex]?.bgColor}>
              {READINESS_LEVELS[currentIndex]?.shortTitle}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {READINESS_LEVELS.map((level, index) => {
            const isComplete = currentIndex >= index;
            const isCurrent = currentIndex === index;
            const isNext = currentIndex === index - 1;
            
            return (
              <div
                key={level.id}
                className={`
                  relative p-4 rounded-lg border transition-all
                  ${isCurrent 
                    ? "border-primary bg-primary/5 shadow-sm" 
                    : isComplete 
                      ? `${level.bgColor} border-transparent`
                      : "border-border bg-muted/30"
                  }
                  ${isNext ? "border-dashed" : ""}
                `}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center shrink-0
                      ${isComplete ? level.bgColor : "bg-muted"}
                    `}
                  >
                    {isComplete ? (
                      <CheckCircle className={`h-5 w-5 ${level.color}`} />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`font-semibold ${isComplete ? level.color : "text-muted-foreground"}`}>
                        {level.title}
                      </h4>
                      {isCurrent && (
                        <Badge variant="outline" className="text-xs">
                          Current Stage
                        </Badge>
                      )}
                      {isNext && (
                        <Badge variant="secondary" className="text-xs">
                          Next Step
                        </Badge>
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${isComplete ? "text-foreground" : "text-muted-foreground"}`}>
                      {level.description}
                    </p>
                    
                    {showProgress && (isCurrent || isNext) && (
                      <div className="mt-3 space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Requirements:
                        </p>
                        <ul className="text-xs space-y-1">
                          {level.requirements.map((req, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                isComplete ? "bg-primary" : "bg-muted-foreground/50"
                              }`} />
                              <span className={isComplete ? "text-foreground" : "text-muted-foreground"}>
                                {req}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Connector line */}
                {index < READINESS_LEVELS.length - 1 && (
                  <div className="absolute left-[1.9rem] top-full h-4 w-0.5 bg-border -translate-x-1/2 hidden sm:block" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Compact inline version for forms and listing cards
export function ReadinessIndicator({ stage }: { stage?: ReadinessStage }) {
  if (!stage) return null;
  
  const level = READINESS_LEVELS.find(l => l.id === stage);
  if (!level) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`${level.bgColor} ${level.color} border-transparent cursor-help`}
          >
            {level.shortTitle}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-semibold">{level.title}</p>
          <p className="text-xs text-muted-foreground">{level.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
