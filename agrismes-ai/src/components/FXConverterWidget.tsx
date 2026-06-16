import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowRightLeft, RefreshCw, Clock, TrendingUp, AlertCircle, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRY_CURRENCY_MAP } from "@/hooks/useGlobalWeather";

interface FXRate {
  pair: string;
  rate: number;
  timestamp: Date;
  isCached: boolean;
}

const SUPPORTED_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "₵" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "ETB", name: "Ethiopian Birr", symbol: "Br" },
  { code: "XOF", name: "CFA Franc (BCEAO)", symbol: "CFA" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
];

const FX_CACHE_KEY = "agrismes_fx_cache";
const FX_CACHE_DURATION = 60 * 1000; // 60 seconds
const LOCATION_CURRENCY_KEY = "agrismes_user_currency";

interface FXConverterWidgetProps {
  className?: string;
  detectedCountryCode?: string;
}

export function FXConverterWidget({ className = "", detectedCountryCode }: FXConverterWidgetProps) {
  const [amount, setAmount] = useState<string>("1000");
  const [fromCurrency, setFromCurrency] = useState<string>("USD");
  const [toCurrency, setToCurrency] = useState<string>("TZS");
  const [rate, setRate] = useState<FXRate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);

  // Auto-detect currency based on location
  useEffect(() => {
    const detectCurrency = async () => {
      // First check if we have a passed country code from weather
      if (detectedCountryCode && COUNTRY_CURRENCY_MAP[detectedCountryCode]) {
        const currency = COUNTRY_CURRENCY_MAP[detectedCountryCode];
        if (SUPPORTED_CURRENCIES.some(c => c.code === currency)) {
          setToCurrency(currency);
          localStorage.setItem(LOCATION_CURRENCY_KEY, currency);
          return;
        }
      }

      // Check cached currency
      const cachedCurrency = localStorage.getItem(LOCATION_CURRENCY_KEY);
      if (cachedCurrency && SUPPORTED_CURRENCIES.some(c => c.code === cachedCurrency)) {
        setToCurrency(cachedCurrency);
        return;
      }

      // Backend-based detection (avoids browser CORS blocks)
      try {
        const { data, error } = await supabase.functions.invoke("global-weather", { body: {} });
        if (error) throw error;

        const countryCode = (data?.location?.countryCode || "").toUpperCase();
        const detectedCurrency = COUNTRY_CURRENCY_MAP[countryCode];

        if (detectedCurrency && SUPPORTED_CURRENCIES.some((c) => c.code === detectedCurrency)) {
          setToCurrency(detectedCurrency);
          localStorage.setItem(LOCATION_CURRENCY_KEY, detectedCurrency);

          const city = data?.location?.name;
          const country = data?.location?.country;
          setDetectedLocation(city && country ? `${city}, ${country}` : country || null);
        }
      } catch (e) {
        console.log("Currency auto-detection failed:", e);
      }
    };

    detectCurrency();
  }, [detectedCountryCode]);

  const fetchRate = useCallback(async (from: string, to: string, forceRefresh = false) => {
    const pair = `${from}_${to}`;
    const cacheKey = `${FX_CACHE_KEY}_${pair}`;

    // Check cache first
    if (!forceRefresh) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        const cacheTime = new Date(parsedCache.timestamp).getTime();
        if (Date.now() - cacheTime < FX_CACHE_DURATION) {
          setRate({
            pair,
            rate: parsedCache.rate,
            timestamp: new Date(parsedCache.timestamp),
            isCached: true,
          });
          return parsedCache.rate;
        }
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call edge function for FX data
      const { data, error: fnError } = await supabase.functions.invoke("fetch-fx-rate", {
        body: { from, to },
      });

      if (fnError) throw fnError;
      if (!data?.rate) throw new Error("Invalid rate data");

      const newRate: FXRate = {
        pair,
        rate: data.rate,
        timestamp: new Date(),
        isCached: false,
      };

      // Cache the rate
      localStorage.setItem(cacheKey, JSON.stringify({
        rate: data.rate,
        timestamp: newRate.timestamp.toISOString(),
      }));

      setRate(newRate);
      return data.rate;
    } catch (err) {
      console.error("FX fetch error:", err);
      
      // Try to use cached data on error
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        setRate({
          pair,
          rate: parsedCache.rate,
          timestamp: new Date(parsedCache.timestamp),
          isCached: true,
        });
        setError("Using cached rate");
        return parsedCache.rate;
      }

      setError("Rate unavailable");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Calculate converted amount
  useEffect(() => {
    if (rate && amount) {
      const numAmount = parseFloat(amount);
      if (!isNaN(numAmount)) {
        setConvertedAmount(numAmount * rate.rate);
      } else {
        setConvertedAmount(null);
      }
    }
  }, [amount, rate]);

  // Fetch rate on currency change
  useEffect(() => {
    if (fromCurrency && toCurrency && fromCurrency !== toCurrency) {
      fetchRate(fromCurrency, toCurrency);
    } else if (fromCurrency === toCurrency) {
      setRate({ pair: `${fromCurrency}_${toCurrency}`, rate: 1, timestamp: new Date(), isCached: false });
    }
  }, [fromCurrency, toCurrency, fetchRate]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (fromCurrency && toCurrency && fromCurrency !== toCurrency) {
        fetchRate(fromCurrency, toCurrency);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [fromCurrency, toCurrency, fetchRate]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const getCurrencySymbol = (code: string) => {
    return SUPPORTED_CURRENCIES.find((c) => c.code === code)?.symbol || code;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
    }
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card border border-border rounded-xl overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-primary/5 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">Live FX Converter</span>
        </div>
        <button
          onClick={() => fetchRate(fromCurrency, toCurrency, true)}
          disabled={isLoading}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <RefreshCw className={`h-4 w-4 text-muted-foreground ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Detected Location */}
        {detectedLocation && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 rounded-lg px-2.5 py-1.5">
            <MapPin className="h-3.5 w-3.5" />
            <span>Auto-detected: {detectedLocation}</span>
          </div>
        )}

        {/* Amount Input */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Amount</label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="h-10 text-lg font-medium"
          />
        </div>

        {/* Currency Selectors */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">From</label>
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map((curr) => (
                  <SelectItem key={curr.code} value={curr.code}>
                    {curr.code} - {curr.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <button
            onClick={handleSwap}
            className="mt-5 p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
          >
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className="flex-1">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">To</label>
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map((curr) => (
                  <SelectItem key={curr.code} value={curr.code}>
                    {curr.code} - {curr.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Result */}
        {convertedAmount !== null && (
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">Converted Amount</p>
            <p className="text-2xl font-bold text-foreground">
              {getCurrencySymbol(toCurrency)} {formatNumber(convertedAmount)}
            </p>
            {rate && (
              <p className="text-xs text-muted-foreground mt-2">
                1 {fromCurrency} = {formatNumber(rate.rate)} {toCurrency}
              </p>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-xs text-amber-600">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </div>
        )}

        {/* Timestamp & Disclaimer */}
        <div className="pt-2 border-t border-border space-y-2">
          {rate && (
            <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              Rate as of: {rate.timestamp.toLocaleTimeString()}
              {rate.isCached && " (cached)"}
            </div>
          )}
          <p className="text-[10px] text-muted-foreground text-center">
            Indicative reference rate. Not for settlement.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
