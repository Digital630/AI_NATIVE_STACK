/**
 * MiniMarketWidget Component
 * Compact live market price display for embedding in listings pages
 */

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, RefreshCw, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface CommodityPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  unit: string;
}

// Fallback prices
const FALLBACK_PRICES: CommodityPrice[] = [
  { symbol: "robusta_coffee", name: "Robusta Coffee", price: 4200, change: -540, changePercent: -11.4, unit: "USD/MT" },
  { symbol: "rcn_east_africa", name: "RCN East Africa", price: 1420, change: 40, changePercent: 2.9, unit: "USD/MT" },
  { symbol: "cocoa", name: "Cocoa Beans", price: 5780, change: 170, changePercent: 3.0, unit: "USD/MT" },
  { symbol: "sesame", name: "White Sesame", price: 1750, change: 70, changePercent: 4.2, unit: "USD/MT" },
];

interface MiniMarketWidgetProps {
  className?: string;
  maxItems?: number;
}

export function MiniMarketWidget({ className = "", maxItems = 4 }: MiniMarketWidgetProps) {
  const navigate = useNavigate();
  const [prices, setPrices] = useState<CommodityPrice[]>(FALLBACK_PRICES);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPrices = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-commodity-prices");
      if (!error && data?.success && data?.prices) {
        setPrices(data.prices.slice(0, maxItems).map((p: any) => ({
          symbol: p.symbol,
          name: p.name,
          price: p.price,
          change: p.change,
          changePercent: p.changePercent,
          unit: p.unit,
        })));
      }
    } catch (err) {
      console.error("Failed to fetch prices:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            Live Market Prices
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={fetchPrices}
            disabled={isLoading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {prices.slice(0, maxItems).map((commodity) => (
            <div
              key={commodity.symbol}
              className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  {commodity.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {commodity.unit}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-foreground">
                  ${formatPrice(commodity.price)}
                </span>
                <div className={`flex items-center gap-1 text-xs ${
                  commodity.change >= 0 ? "text-green-600" : "text-red-500"
                }`}>
                  {commodity.change >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>
                    {commodity.change >= 0 ? "+" : ""}{commodity.changePercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-3 text-xs"
          onClick={() => navigate("/market-intelligence")}
        >
          <ExternalLink className="mr-1.5 h-3 w-3" />
          Full Market Intelligence
        </Button>
        
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          World Bank Pink Sheet • Monthly Benchmarks
        </p>
      </CardContent>
    </Card>
  );
}
