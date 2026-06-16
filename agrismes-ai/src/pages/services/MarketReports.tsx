import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Timer,
  ArrowLeft,
  Download,
  FileText,
  AlertTriangle,
  Loader2,
  Calendar,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw,
  Eye,
  Lock,
  MessageSquare,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const VISITOR_ID_KEY = "agrismes_visitor_id";

interface MarketReport {
  id: string;
  commodity: string;
  title: string;
  summary: string;
  date: string;
  priceChange: number;
  currentPrice: string;
  forecast: "bullish" | "bearish" | "neutral";
  isPremium: boolean;
}

const SAMPLE_REPORTS: MarketReport[] = [
  {
    id: "1",
    commodity: "Coffee",
    title: "East African Arabica Coffee Market Update",
    summary: "Arabica prices continue upward trend driven by Ethiopian and Kenyan premium grades. European demand remains strong despite economic headwinds.",
    date: "2026-01-15",
    priceChange: 5.2,
    currentPrice: "$3,850/MT",
    forecast: "bullish",
    isPremium: false,
  },
  {
    id: "2",
    commodity: "Cashew Nuts",
    title: "West African Cashew: Processing Capacity Analysis",
    summary: "Tanzania and Mozambique continue to expand processing capacity. RCN prices stable with slight upward pressure from Vietnam demand.",
    date: "2026-01-14",
    priceChange: 2.1,
    currentPrice: "$1,420/MT (RCN)",
    forecast: "neutral",
    isPremium: false,
  },
  {
    id: "3",
    commodity: "Avocado",
    title: "Premium Avocado Export Opportunities Q1 2026",
    summary: "Kenya's Hass avocado exports to Europe hit record volumes. New phytosanitary agreements with China open Asian markets.",
    date: "2026-01-12",
    priceChange: 8.5,
    currentPrice: "$2,100/MT",
    forecast: "bullish",
    isPremium: true,
  },
  {
    id: "4",
    commodity: "Sesame",
    title: "Global Sesame Seed Trade Flows Report",
    summary: "Ethiopian sesame dominates Middle East markets. Sudan recovery slow but steady. China import demand shows seasonal uptick.",
    date: "2026-01-10",
    priceChange: -1.8,
    currentPrice: "$1,650/MT",
    forecast: "bearish",
    isPremium: false,
  },
  {
    id: "5",
    commodity: "Macadamia",
    title: "Macadamia Nut Global Price Forecast 2026",
    summary: "South African production recovery pressures prices. Kenya and Malawi quality premiums remain strong in European markets.",
    date: "2026-01-08",
    priceChange: -3.2,
    currentPrice: "$6,200/MT (Kernel)",
    forecast: "bearish",
    isPremium: true,
  },
  {
    id: "6",
    commodity: "Spices",
    title: "East African Spice Export Comprehensive Analysis",
    summary: "Zanzibar cloves, Madagascar vanilla, and Tanzanian cardamom price analysis with demand forecasts for European and Asian markets.",
    date: "2026-01-05",
    priceChange: 4.0,
    currentPrice: "Various",
    forecast: "bullish",
    isPremium: true,
  },
];

export default function MarketReports() {
  const navigate = useNavigate();
  const [visitorId, setVisitorId] = useState("");
  const [activeService, setActiveService] = useState<{
    expires_at: string;
    access_minutes: number;
    service_type: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const isPremiumAccess = activeService?.service_type === "market_report_full";

  useEffect(() => {
    const storedVisitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (storedVisitorId) {
      setVisitorId(storedVisitorId);
      checkAccess(storedVisitorId);
    } else {
      setIsLoading(false);
      setIsExpired(true);
    }
  }, []);

  useEffect(() => {
    if (!activeService) return;

    const interval = setInterval(() => {
      const now = new Date();
      const expiry = new Date(activeService.expires_at);
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining("Session Expired");
        clearInterval(interval);
        return;
      }

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        setTimeRemaining(`${hours}h ${minutes % 60}m`);
      } else {
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeService]);

  const checkAccess = async (vid: string) => {
    try {
      const { data } = await supabase
        .from("redeemed_services")
        .select("*")
        .eq("visitor_id", vid)
        .in("service_type", ["market_report_basic", "market_report_full"])
        .eq("is_active", true)
        .gte("access_expires_at", new Date().toISOString())
        .order("access_expires_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setActiveService({
          expires_at: data[0].access_expires_at,
          access_minutes: data[0].access_minutes,
          service_type: data[0].service_type,
        });
      } else {
        setIsExpired(true);
      }
    } catch (err) {
      console.error("[MarketReports] Access check error:", err);
      setIsExpired(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getForecastIcon = (forecast: string) => {
    switch (forecast) {
      case "bullish":
        return <ArrowUpRight className="w-4 h-4 text-green-500" />;
      case "bearish":
        return <ArrowDownRight className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getForecastColor = (forecast: string) => {
    switch (forecast) {
      case "bullish":
        return "text-green-500 bg-green-500/10";
      case "bearish":
        return "text-red-500 bg-red-500/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Session Expired</h1>
          <p className="text-muted-foreground mb-6">
            Your market reports access has ended. Would you like to redeem more points for continued access?
          </p>
          <div className="space-y-3">
            <Button onClick={() => navigate("/")} className="w-full gap-2">
              <RefreshCw className="w-4 h-4" />
              Earn More Points
            </Button>
            <Button variant="outline" onClick={() => navigate("/")} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <div className="flex items-center gap-3">
              <Badge variant={isPremiumAccess ? "default" : "secondary"}>
                {isPremiumAccess ? "Full Access" : "Basic Access"}
              </Badge>
              <h1 className="font-semibold hidden sm:block">Market Reports</h1>
            </div>

            <motion.div
              animate={
                parseInt(timeRemaining.split(":")[0]) <= 5 && !timeRemaining.includes("h")
                  ? { scale: [1, 1.05, 1] }
                  : {}
              }
              transition={{ repeat: Infinity, duration: 1 }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                parseInt(timeRemaining.split(":")[0]) <= 5 && !timeRemaining.includes("h")
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary"
              }`}
            >
              <Timer className="w-4 h-4" />
              <span className="font-mono font-medium">{timeRemaining}</span>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Reports Available", value: SAMPLE_REPORTS.length, icon: FileText },
            { label: "Commodities Covered", value: "6", icon: BarChart3 },
            { label: "Avg. Price Change", value: "+2.8%", icon: TrendingUp },
            { label: "Last Updated", value: "Today", icon: Calendar },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <stat.icon className="w-4 h-4" />
                <span className="text-xs">{stat.label}</span>
              </div>
              <p className="text-xl font-semibold">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {SAMPLE_REPORTS.map((report, idx) => {
            const isLocked = report.isPremium && !isPremiumAccess;
            
            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-card border rounded-xl p-5 transition-all ${
                  isLocked
                    ? "border-border opacity-70"
                    : "border-border hover:border-primary/30 cursor-pointer"
                }`}
                onClick={() => !isLocked && setSelectedReport(
                  selectedReport === report.id ? null : report.id
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {report.commodity}
                      </Badge>
                      {report.isPremium && (
                        <Badge className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                          Premium
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(report.date).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-semibold text-foreground mb-2">
                      {report.title}
                    </h3>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {report.summary}
                    </p>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{report.currentPrice}</span>
                      </div>
                      <div className={`flex items-center gap-1 ${
                        report.priceChange >= 0 ? "text-green-500" : "text-red-500"
                      }`}>
                        {report.priceChange >= 0 ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                        <span className="font-medium">
                          {report.priceChange >= 0 ? "+" : ""}{report.priceChange}%
                        </span>
                      </div>
                      <Badge className={`text-xs ${getForecastColor(report.forecast)}`}>
                        {getForecastIcon(report.forecast)}
                        <span className="ml-1 capitalize">{report.forecast}</span>
                      </Badge>
                    </div>
                  </div>

                  {isLocked ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Lock className="w-5 h-5" />
                    </div>
                  ) : (
                    <Button variant="ghost" size="icon">
                      <Eye className="w-5 h-5" />
                    </Button>
                  )}
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {selectedReport === report.id && !isLocked && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-border"
                    >
                      <div className="bg-accent/50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium mb-2">Full Report Preview</h4>
                        <p className="text-sm text-muted-foreground">
                          {report.summary} Market analysis indicates continued 
                          {report.forecast === "bullish" ? " strength" : 
                           report.forecast === "bearish" ? " pressure" : " stability"} 
                          in the coming quarter. Key factors include supply chain 
                          dynamics, regional production forecasts, and evolving 
                          import demand patterns from major consuming markets.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="gap-2">
                          <Download className="w-4 h-4" />
                          Download PDF
                        </Button>
                        <Button size="sm" variant="outline">
                          Share Report
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Upgrade Notice for Basic Access */}
        {!isPremiumAccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent rounded-xl p-6 border border-amber-500/20"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Lock className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                  Unlock Premium Reports
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Upgrade to Full Access to view premium market analysis including 
                  detailed price forecasts, buyer insights, and exclusive data.
                </p>
                <Button
                  onClick={() => navigate("/")}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  Earn More Points
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Session Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-accent/30 rounded-xl p-6 border border-border text-center"
        >
          <h3 className="font-semibold mb-2">📊 Need Custom Market Intelligence?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Contact AgriSMES to request custom market reports tailored to your specific 
            commodities and target markets. Our analysts provide in-depth insights.
          </p>
          <Button 
            onClick={() => {
              navigate("/");
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('openChatWidget'));
              }, 500);
            }}
            className="gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Contact AgriSMES for Guidance
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            Access expires in {timeRemaining}. Downloaded reports remain available offline.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
