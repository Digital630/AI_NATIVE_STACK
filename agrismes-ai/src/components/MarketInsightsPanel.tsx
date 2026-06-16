import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Sun,
  Calendar,
  MapPin,
  BarChart3,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Cloud,
  Thermometer,
  Droplets,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWeatherData } from "@/hooks/useWeatherData";
import { generateMarketInsightsReport } from "@/utils/pdfGenerators";
import { toast } from "sonner";

type TrendType = "up" | "down" | "stable";

interface CommodityInsight {
  name: string;
  trend: TrendType;
  priceContext: string;
  season: string;
  regions: string[];
  qualityNotes: string;
  weatherImpact: string;
  demandStatus: string;
}

// Mock market data - In production, this would come from actual APIs
const COMMODITY_INSIGHTS: Record<string, CommodityInsight> = {
  coffee: {
    name: "Coffee (Arabica)",
    trend: "up",
    priceContext: "Specialty grades commanding premiums",
    season: "Oct - Dec peak harvest",
    regions: ["Ethiopia Sidamo", "Kenya AA", "Tanzania Kilimanjaro"],
    qualityNotes: "Cupping scores 85+ in high demand",
    weatherImpact: "Favorable conditions in East Africa",
    demandStatus: "Strong EU and US demand",
  },
  cashew: {
    name: "Cashew (RCN & Kernels)",
    trend: "stable",
    priceContext: "Kernel grades W320/W240 steady",
    season: "Oct - Jan main harvest",
    regions: ["Tanzania Mtwara", "Ivory Coast", "Benin"],
    qualityNotes: "KOR 48%+ preferred by processors",
    weatherImpact: "Normal seasonal patterns",
    demandStatus: "Vietnam/India processing steady",
  },
  cocoa: {
    name: "Cocoa Beans",
    trend: "up",
    priceContext: "Supply constraints supporting prices",
    season: "Oct - Mar main crop",
    regions: ["Ivory Coast", "Ghana", "Tanzania"],
    qualityNotes: "Fermentation quality key differentiator",
    weatherImpact: "West Africa production normalized",
    demandStatus: "Strong chocolate demand globally",
  },
  sesame: {
    name: "Sesame Seeds",
    trend: "stable",
    priceContext: "White sesame premiums maintained",
    season: "Sep - Dec harvest",
    regions: ["Ethiopia", "Tanzania", "Nigeria"],
    qualityNotes: "99.9% purity standard for export",
    weatherImpact: "Good yields expected",
    demandStatus: "Asian markets active",
  },
  avocado: {
    name: "Avocado (Hass)",
    trend: "up",
    priceContext: "EU market prices elevated",
    season: "Mar - Sep peak",
    regions: ["Kenya", "Tanzania", "South Africa"],
    qualityNotes: "Dry matter 21%+ for export",
    weatherImpact: "Irrigation critical in dry zones",
    demandStatus: "Growing European consumption",
  },
  macadamia: {
    name: "Macadamia Nuts",
    trend: "up",
    priceContext: "Premium nuts in short supply",
    season: "Feb - Sep harvest",
    regions: ["Kenya", "South Africa", "Malawi"],
    qualityNotes: "Style 0-2 commanding premiums",
    weatherImpact: "Favorable growing conditions",
    demandStatus: "Global demand exceeds supply",
  },
};

type CommodityKey = keyof typeof COMMODITY_INSIGHTS;

interface MarketInsightsPanelProps {
  className?: string;
}

export function MarketInsightsPanel({ className = "" }: MarketInsightsPanelProps) {
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityKey>("coffee");
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const { weatherData, isLoading: isLoadingWeather, refreshWeather, getWeatherForRegion } = useWeatherData();

  const insight = COMMODITY_INSIGHTS[selectedCommodity];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshWeather();
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsRefreshing(false);
  };

  const handleDownloadReport = async () => {
    setIsGeneratingPDF(true);
    try {
      // Prepare weather data for the report
      const weatherForReport = Object.values(weatherData).map((w) => ({
        region: w.region,
        temperature: w.weather.temperature,
        humidity: w.weather.humidity,
        description: w.weather.description,
      }));

      generateMarketInsightsReport(insight, weatherForReport, false);
      toast.success(`Market report for ${insight.name} downloaded!`);
    } catch (error) {
      toast.error("Failed to generate report. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getTrendIcon = (trend: TrendType) => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-primary" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <BarChart3 className="w-4 h-4 text-muted-foreground" />;
  };

  const getTrendColor = (trend: TrendType) => {
    if (trend === "up") return "text-primary bg-primary/10";
    if (trend === "down") return "text-destructive bg-destructive/10";
    return "text-muted-foreground bg-muted";
  };

  const getTrendLabel = (trend: TrendType) => {
    if (trend === "up") return "Trending Up";
    if (trend === "down") return "Trending Down";
    return "Stable";
  };

  return (
    <div className={`bg-card border border-border rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Market Insights</h2>
              <p className="text-xs text-muted-foreground">
                AI-powered commodity intelligence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Commodity Selector */}
            <div className="p-4 border-b border-border bg-muted/30">
              <div className="flex flex-wrap gap-2">
                {Object.keys(COMMODITY_INSIGHTS).map((key) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCommodity(key as CommodityKey)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                      selectedCommodity === key
                        ? "bg-primary text-primary-foreground"
                        : "bg-background border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                    }`}
                  >
                    {COMMODITY_INSIGHTS[key].name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Insight Content */}
            <div className="p-4 space-y-4">
              {/* Commodity Title & Trend */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{insight.name}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{insight.priceContext}</p>
                </div>
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getTrendColor(insight.trend)}`}
                >
                  {getTrendIcon(insight.trend)}
                  {getTrendLabel(insight.trend)}
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Harvest Season
                  </div>
                  <p className="text-sm font-medium text-foreground">{insight.season}</p>
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Sun className="w-3.5 h-3.5" />
                    Weather Impact
                  </div>
                  <p className="text-sm font-medium text-foreground">{insight.weatherImpact}</p>
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Demand Status
                  </div>
                  <p className="text-sm font-medium text-foreground">{insight.demandStatus}</p>
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Quality Notes
                  </div>
                  <p className="text-sm font-medium text-foreground">{insight.qualityNotes}</p>
                </div>
              </div>

              {/* Key Regions with Live Weather */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    Key Production Regions
                  </div>
                  {isLoadingWeather && (
                    <span className="text-xs text-muted-foreground animate-pulse">Loading weather...</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {insight.regions.map((region) => {
                    const weather = getWeatherForRegion(region.toLowerCase().replace(/\s+/g, "_"));
                    return (
                      <div
                        key={region}
                        className="px-2 py-1.5 bg-background border border-border rounded-md text-xs text-foreground group relative"
                      >
                        <span>{region}</span>
                        {weather && (
                          <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                            <Thermometer className="w-3 h-3" />
                            <span>{weather.weather.temperature}°C</span>
                            <Droplets className="w-3 h-3 ml-1" />
                            <span>{weather.weather.humidity}%</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Weather Summary */}
              {Object.keys(weatherData).length > 0 && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Cloud className="w-3.5 h-3.5" />
                    Live Weather in Production Zones
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(weatherData).slice(0, 4).map((w) => (
                      <div key={w.region} className="flex items-center gap-2 text-xs">
                        <span className={`w-2 h-2 rounded-full ${
                          w.weather.icon === "sunny" ? "bg-yellow-400" :
                          w.weather.icon === "rainy" ? "bg-blue-400" :
                          w.weather.icon === "stormy" ? "bg-purple-400" : "bg-gray-400"
                        }`} />
                        <span className="text-foreground font-medium truncate">{w.region.split(" ").slice(0, 2).join(" ")}</span>
                        <span className="text-muted-foreground ml-auto">{w.weather.temperature}°C</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="flex items-start gap-2 p-3 bg-accent border border-border rounded-lg">
                <AlertTriangle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Market context is AI-generated for informational purposes. For current pricing
                  and specific quotes, consult with the AgriSMES team via chat.
                </p>
              </div>

              {/* CTA Row */}
              <div className="flex items-center justify-between pt-2 gap-2">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Updated contextually
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadReport}
                    disabled={isGeneratingPDF}
                    className="text-xs gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {isGeneratingPDF ? "Generating..." : "PDF Report"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent("openChatWidget"));
                      sessionStorage.setItem(
                        "agrismes_chat_source_page",
                        `market_insights_${selectedCommodity}`
                      );
                    }}
                    className="text-xs"
                  >
                    Ask Alex
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
