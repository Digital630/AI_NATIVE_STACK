import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, RefreshCw, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CommodityPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  unit: string;
  region?: string;
  source?: string;
  lastUpdated: Date;
}

interface PriceMetadata {
  source: string;
  dataDate: string;
  disclaimer: string;
}

// Fallback prices if API fails (based on World Bank Dec 2025 data)
const FALLBACK_PRICES: Record<string, { price: number; unit: string; change: number; region?: string }> = {
  arabica_coffee: { price: 8400, unit: "USD/MT", change: -650 },
  robusta_coffee: { price: 4200, unit: "USD/MT", change: -540 },
  ethiopian_coffee: { price: 9200, unit: "USD/MT", change: -600, region: "Yirgacheffe/Sidamo" },
  rcn_east_africa: { price: 1420, unit: "USD/MT RCN", change: 40, region: "Tanzania/Kenya" },
  rcn_west_africa: { price: 1350, unit: "USD/MT RCN", change: 30, region: "Ivory Coast/Ghana" },
  wfk_east_africa: { price: 8600, unit: "USD/MT", change: 200, region: "Tanzania/Kenya" },
  wfk_west_africa: { price: 8300, unit: "USD/MT", change: 200, region: "Ivory Coast/Ghana" },
  cocoa: { price: 5780, unit: "USD/MT", change: 170 },
  sesame: { price: 1750, unit: "USD/MT", change: 70 },
  avocado: { price: 2200, unit: "USD/MT", change: 100 },
  macadamia: { price: 33000, unit: "USD/MT NIS", change: 500 },
  cardamom: { price: 28500, unit: "USD/MT", change: 500 },
  pigeon_pea: { price: 720, unit: "USD/MT", change: 40 },
};

const COMMODITY_NAMES: Record<string, string> = {
  arabica_coffee: "Arabica Coffee",
  robusta_coffee: "Robusta Coffee",
  ethiopian_coffee: "Ethiopian Coffee",
  rcn_east_africa: "RCN East Africa",
  rcn_west_africa: "RCN West Africa",
  wfk_east_africa: "Cashew Kernels-WFK",
  wfk_west_africa: "Cashew Kernels-WFK",
  cocoa: "Cocoa Beans",
  sesame: "White Sesame",
  avocado: "Hass Avocado",
  macadamia: "Macadamia NIS",
  cardamom: "Green Cardamom",
  pigeon_pea: "Pigeon Peas",
};

export function CommodityPriceTicker() {
  const [prices, setPrices] = useState<CommodityPrice[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [metadata, setMetadata] = useState<PriceMetadata | null>(null);
  const [isLiveData, setIsLiveData] = useState(false);

  const fetchPrices = async () => {
    setIsRefreshing(true);
    
    try {
      // Fetch from World Bank data edge function
      const { data, error } = await supabase.functions.invoke("fetch-commodity-prices");
      
      if (error) throw error;
      
      if (data?.success && data?.prices) {
        const formattedPrices: CommodityPrice[] = data.prices.map((p: any) => ({
          symbol: p.symbol,
          name: p.name,
          price: p.price,
          change: p.change,
          changePercent: p.changePercent,
          unit: p.unit,
          region: p.region,
          source: p.source,
          lastUpdated: new Date(p.lastUpdated),
        }));
        
        setPrices(formattedPrices);
        setMetadata(data.metadata);
        setIsLiveData(true);
      } else {
        throw new Error("Invalid response");
      }
    } catch (err) {
      console.error("Failed to fetch live prices, using fallback:", err);
      // Use fallback prices
      const fallbackPrices: CommodityPrice[] = Object.entries(FALLBACK_PRICES).map(([symbol, data]) => ({
        symbol,
        name: COMMODITY_NAMES[symbol] || symbol,
        price: data.price,
        change: data.change,
        changePercent: (data.change / (data.price - data.change)) * 100,
        unit: data.unit,
        region: data.region,
        lastUpdated: new Date(),
      }));
      setPrices(fallbackPrices);
      setIsLiveData(false);
      setMetadata({
        source: "World Bank Pink Sheet (Cached)",
        dataDate: "December 2025",
        disclaimer: "Cached benchmark prices. Live data temporarily unavailable.",
      });
    } finally {
      setLastRefresh(new Date());
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    
    // Auto-refresh every 5 minutes (data is monthly, no need for frequent updates)
    const interval = setInterval(fetchPrices, 300000);
    return () => clearInterval(interval);
  }, []);

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-3.5 h-3.5 text-primary" />;
    if (change < 0) return <TrendingDown className="w-3.5 h-3.5 text-destructive" />;
    return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return "text-primary";
    if (change < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatChange = (change: number, changePercent: number) => {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(0)} (${sign}${changePercent.toFixed(1)}%)`;
  };

  return (
    <div className="w-full bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-y border-border overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-xs font-medium text-foreground">Live Commodity Prices</span>
          </div>
          <button
            onClick={fetchPrices}
            disabled={isRefreshing}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Scrolling ticker */}
        <div className="relative overflow-hidden">
          <motion.div
            className="flex gap-6"
            animate={{ x: [0, -2000] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 40,
                ease: "linear",
              },
            }}
          >
            {/* Duplicate prices for seamless loop */}
            {[...prices, ...prices].map((commodity, index) => (
              <div
                key={`${commodity.symbol}-${index}`}
                className="flex items-center gap-3 bg-background/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-border/50 shrink-0 min-w-[200px]"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-foreground whitespace-nowrap">
                    {commodity.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">
                      {commodity.unit}
                    </span>
                    {commodity.region && (
                      <span className="flex items-center gap-0.5 text-[9px] text-primary/70">
                        <MapPin className="w-2.5 h-2.5" />
                        {commodity.region}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-foreground">
                    ${formatPrice(commodity.price)}
                  </span>
                  <div className={`flex items-center gap-1 ${getTrendColor(commodity.change)}`}>
                    {getTrendIcon(commodity.change)}
                    <span className="text-[10px] font-medium whitespace-nowrap">
                      {formatChange(commodity.change, commodity.changePercent)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Static grid for smaller screens */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 md:hidden">
          {prices.slice(0, 4).map((commodity) => (
            <div
              key={commodity.symbol}
              className="flex flex-col bg-background/50 rounded-lg p-2 border border-border/50"
            >
              <span className="text-[10px] font-medium text-foreground truncate">
                {commodity.name}
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-bold text-foreground">
                  ${formatPrice(commodity.price)}
                </span>
                <div className={`flex items-center ${getTrendColor(commodity.change)}`}>
                  {getTrendIcon(commodity.change)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Markets (Pink Sheet) • 
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent("openChatWidget"))}
            className="text-primary hover:underline ml-1"
          >
            Ask Alex for quotes
          </button>
        </p>
      </div>
    </div>
  );
}
