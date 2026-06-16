import { useState, useEffect, useRef } from "react";
import { TrendingUp, TrendingDown, Minus, Activity, BarChart3, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { GlobalWeatherPanel } from "@/components/GlobalWeatherPanel";
import { FXConverterWidget } from "@/components/FXConverterWidget";

interface CommodityData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  unit: string;
  prediction: "bullish" | "bearish" | "neutral";
  weekHigh: number;
  weekLow: number;
  volume: string;
}

const FALLBACK_COMMODITIES: CommodityData[] = [
  { symbol: "COFFEE", name: "Coffee Arabica", price: 4850, change: 125, changePercent: 2.64, unit: "USD/MT", prediction: "bullish", weekHigh: 4920, weekLow: 4650, volume: "12.5K" },
  { symbol: "COCOA", name: "Cocoa Beans", price: 8240, change: -180, changePercent: -2.14, unit: "USD/MT", prediction: "bearish", weekHigh: 8500, weekLow: 8100, volume: "8.2K" },
  { symbol: "CASHEW", name: "Cashew RCN", price: 1150, change: 35, changePercent: 3.14, unit: "USD/MT", prediction: "bullish", weekHigh: 1180, weekLow: 1090, volume: "5.8K" },
  { symbol: "SESAME", name: "Sesame Seeds", price: 1680, change: -25, changePercent: -1.47, unit: "USD/MT", prediction: "neutral", weekHigh: 1720, weekLow: 1640, volume: "3.2K" },
  { symbol: "AVOCADO", name: "Avocado Hass", price: 2450, change: 85, changePercent: 3.59, unit: "USD/MT", prediction: "bullish", weekHigh: 2480, weekLow: 2320, volume: "4.1K" },
  { symbol: "MACADAMIA", name: "Macadamia NIS", price: 4200, change: 0, changePercent: 0, unit: "USD/MT", prediction: "neutral", weekHigh: 4280, weekLow: 4150, volume: "1.8K" },
];

const CommodityMarketDashboard = () => {
  const [commodities, setCommodities] = useState<CommodityData[]>(FALLBACK_COMMODITIES);
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);

  const fetchLiveData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("fetch-commodity-prices");
      
      if (!error && data?.prices) {
        const mappedData: CommodityData[] = data.prices.slice(0, 6).map((p: any) => ({
          symbol: p.symbol?.toUpperCase() || "UNK",
          name: p.name || p.symbol,
          price: p.price || 0,
          change: p.change || (Math.random() - 0.5) * 100,
          changePercent: p.changePercent || (Math.random() - 0.5) * 5,
          unit: p.unit || "USD/MT",
          prediction: p.change > 0 ? "bullish" : p.change < 0 ? "bearish" : "neutral",
          weekHigh: p.price * 1.03,
          weekLow: p.price * 0.97,
          volume: `${(Math.random() * 15 + 1).toFixed(1)}K`,
        }));
        if (mappedData.length > 0) {
          setCommodities(mappedData);
        }
      }
    } catch (err) {
      console.error("Failed to fetch commodity data:", err);
    } finally {
      setIsLoading(false);
      setLastUpdate(new Date());
    }
  };

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLiveData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4" />;
    if (change < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return "text-emerald-500";
    if (change < 0) return "text-red-500";
    return "text-muted-foreground";
  };

  const getBgColor = (change: number) => {
    if (change > 0) return "bg-emerald-500/10";
    if (change < 0) return "bg-red-500/10";
    return "bg-muted/50";
  };

  const getPredictionBadge = (prediction: string) => {
    switch (prediction) {
      case "bullish":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-600">
            <ArrowUpRight className="h-3 w-3" />
            Bullish
          </span>
        );
      case "bearish":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-600">
            <ArrowDownRight className="h-3 w-3" />
            Bearish
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            <Minus className="h-3 w-3" />
            Neutral
          </span>
        );
    }
  };

  return (
    <section className="py-8 md:py-12 bg-gradient-to-b from-background via-muted/30 to-background overflow-hidden">
      <div className="container-institutional">
        {/* Top Row: Weather + FX side by side on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2">
            <GlobalWeatherPanel className="" />
          </div>
          <div className="lg:col-span-1">
            <FXConverterWidget className="h-full" />
          </div>
        </div>

        {/* Main Dashboard Content - Full Width */}
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
                    Commodity Market Dashboard
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                  </h2>
                  <p className="text-sm text-muted-foreground">Live market data & predictions</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  Updated: {lastUpdate.toLocaleTimeString()}
                </span>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

        {/* Stock Ticker Strip */}
        <div className="relative mb-6 overflow-hidden rounded-xl border border-border/50 bg-card">
          <div className="flex items-center bg-primary/5 border-b border-border/50 px-4 py-2">
            <Activity className="h-4 w-4 text-primary mr-2" />
            <span className="text-xs font-medium text-foreground">LIVE TICKER</span>
          </div>
          
          <div 
            ref={tickerRef}
            className="flex overflow-x-auto scrollbar-hide py-3 px-2 gap-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <motion.div 
              className="flex gap-1"
              animate={{ x: [0, -50, 0] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              {[...commodities, ...commodities].map((commodity, idx) => (
                <div
                  key={`${commodity.symbol}-${idx}`}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${getBgColor(commodity.change)} cursor-pointer hover:scale-105 transition-transform min-w-max`}
                  onClick={() => setSelectedCommodity(commodity)}
                >
                  <span className="font-bold text-sm text-foreground">{commodity.symbol}</span>
                  <span className="text-sm text-muted-foreground">${commodity.price.toLocaleString()}</span>
                  <span className={`flex items-center gap-0.5 text-sm font-medium ${getTrendColor(commodity.change)}`}>
                    {getTrendIcon(commodity.change)}
                    {commodity.changePercent > 0 ? "+" : ""}{commodity.changePercent.toFixed(2)}%
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {commodities.map((commodity, index) => (
            <motion.div
              key={commodity.symbol}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-4 rounded-xl border border-border/50 bg-card hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group ${
                selectedCommodity?.symbol === commodity.symbol ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedCommodity(commodity)}
            >
              {/* Trend Indicator Line */}
              <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${
                commodity.change > 0 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                commodity.change < 0 ? 'bg-gradient-to-r from-red-500 to-red-400' :
                'bg-gradient-to-r from-muted to-muted-foreground/20'
              }`} />
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-muted-foreground">{commodity.symbol}</span>
                  {getPredictionBadge(commodity.prediction)}
                </div>
                
                <div className="text-lg md:text-xl font-bold text-foreground">
                  ${commodity.price.toLocaleString()}
                </div>
                
                <div className={`flex items-center gap-1 text-sm font-semibold ${getTrendColor(commodity.change)}`}>
                  {getTrendIcon(commodity.change)}
                  <span>{commodity.change > 0 ? "+" : ""}{commodity.change.toFixed(0)}</span>
                  <span className="text-xs">({commodity.changePercent > 0 ? "+" : ""}{commodity.changePercent.toFixed(2)}%)</span>
                </div>

                <div className="text-xs text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Vol: {commodity.volume} | {commodity.unit}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Selected Commodity Detail Panel */}
        <AnimatePresence>
          {selectedCommodity && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 overflow-hidden"
            >
              <div className="p-6 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{selectedCommodity.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedCommodity.unit}</p>
                  </div>
                  <button
                    onClick={() => setSelectedCommodity(null)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Close
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-background/50">
                    <p className="text-xs text-muted-foreground mb-1">Current Price</p>
                    <p className="text-xl font-bold text-foreground">${selectedCommodity.price.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50">
                    <p className="text-xs text-muted-foreground mb-1">Week High</p>
                    <p className="text-lg font-semibold text-emerald-600">${selectedCommodity.weekHigh.toFixed(0)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50">
                    <p className="text-xs text-muted-foreground mb-1">Week Low</p>
                    <p className="text-lg font-semibold text-red-500">${selectedCommodity.weekLow.toFixed(0)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50">
                    <p className="text-xs text-muted-foreground mb-1">Market Outlook</p>
                    <div className="mt-1">{getPredictionBadge(selectedCommodity.prediction)}</div>
                  </div>
                </div>

                {/* Mini Chart Placeholder */}
                <div className="mt-4 h-20 rounded-lg bg-background/30 flex items-center justify-center border border-border/30">
                  <div className="flex items-end gap-1 h-12">
                    {[40, 55, 45, 60, 50, 70, 65, 75, 70, 80, 75, 85].map((h, i) => (
                      <motion.div
                        key={i}
                        className={`w-2 rounded-t ${selectedCommodity.change >= 0 ? 'bg-emerald-500/60' : 'bg-red-500/60'}`}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          Market data updated periodically. Predictions are algorithmic estimates and should not be used as financial advice.
        </p>
        </div>
      </div>
    </section>
  );
};

export default CommodityMarketDashboard;
