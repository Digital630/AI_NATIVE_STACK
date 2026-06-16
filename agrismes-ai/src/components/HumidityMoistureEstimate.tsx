import { useState, useCallback } from "react";
import { Droplets, MapPin, Loader2, X, Thermometer, Wind, AlertTriangle, CheckCircle, Wheat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface HumidityResult {
  location: string;
  country: string;
  humidity: number;
  temperature: number;
  windSpeed: number;
  moistureRisk: "low" | "moderate" | "high";
  recommendation: string;
  dryingConditions: string;
  commodityEstimates: CommodityMoistureEstimate[];
}

interface CommodityMoistureEstimate {
  name: string;
  estimatedMoisture: string;
  safeRange: string;
  status: "safe" | "caution" | "risk";
  note: string;
}

interface HumidityMoistureEstimateProps {
  onClose: () => void;
  onResult?: (result: HumidityResult) => void;
}

// Commodity-specific moisture interpretation based on environmental humidity
const getCommodityEstimates = (humidity: number, temperature: number): CommodityMoistureEstimate[] => {
  // Equilibrium moisture content (EMC) approximation based on humidity
  // Using simplified Henderson-Thompson equation principles
  const estimates: CommodityMoistureEstimate[] = [];

  // Cashew Kernels: Safe 4–6%
  const cashewEMC = humidity < 40 ? 4.2 : humidity < 60 ? 4.8 : humidity < 75 ? 5.4 : 5.9;
  estimates.push({
    name: "Cashew Kernels",
    estimatedMoisture: `${cashewEMC.toFixed(1)}%`,
    safeRange: "4–6% (trade-safe dry product)",
    status: cashewEMC <= 6 ? "safe" : cashewEMC <= 7 ? "caution" : "risk",
    note: cashewEMC <= 6 ? "Within safe range for trade and storage" : cashewEMC <= 7 ? "Slightly above — dry before export" : "Too high — mechanical drying required",
  });

  // Coffee (Green): Safe 8–10%
  const coffeeEMC = humidity < 40 ? 8.2 : humidity < 60 ? 8.8 : humidity < 75 ? 9.5 : 10.0;
  estimates.push({
    name: "Green Coffee Beans",
    estimatedMoisture: `${coffeeEMC.toFixed(1)}%`,
    safeRange: "8–10% (trade-ready standard)",
    status: coffeeEMC <= 10 ? "safe" : coffeeEMC <= 11 ? "caution" : "risk",
    note: coffeeEMC <= 10 ? "Within trade-ready range" : coffeeEMC <= 11 ? "Borderline — monitor closely" : "Exceeds safe range — re-dry recommended",
  });

  // Cocoa: Safe 6-7.5%, max 8%
  const cocoaEMC = humidity < 40 ? 4.8 : humidity < 60 ? 6.5 : humidity < 75 ? 8.0 : 10.2;
  estimates.push({
    name: "Cocoa Beans",
    estimatedMoisture: `${cocoaEMC.toFixed(1)}%`,
    safeRange: "6–7.5% (ICCO standard)",
    status: cocoaEMC <= 7.5 ? "safe" : cocoaEMC <= 8 ? "caution" : "risk",
    note: cocoaEMC <= 7.5 ? "Within ICCO export standard" : cocoaEMC <= 8 ? "Borderline — needs ventilation" : "Too high — risk of mold, re-dry immediately",
  });

  // Sesame: Safe 5-6%, max 8%
  const sesameEMC = humidity < 40 ? 3.8 : humidity < 60 ? 5.5 : humidity < 75 ? 7.2 : 9.5;
  estimates.push({
    name: "Sesame Seeds",
    estimatedMoisture: `${sesameEMC.toFixed(1)}%`,
    safeRange: "≤ 6% (export), ≤ 8% (storage)",
    status: sesameEMC <= 6 ? "safe" : sesameEMC <= 8 ? "caution" : "risk",
    note: sesameEMC <= 6 ? "Export ready" : sesameEMC <= 8 ? "Needs monitoring" : "Re-drying required",
  });

  return estimates;
};

const getMoistureRisk = (humidity: number): { risk: "low" | "moderate" | "high"; recommendation: string; dryingConditions: string } => {
  if (humidity < 50) {
    return {
      risk: "low",
      recommendation: "Excellent drying conditions. Sun drying effective for most commodities.",
      dryingConditions: "Favorable – sun drying recommended",
    };
  }
  if (humidity < 70) {
    return {
      risk: "moderate",
      recommendation: "Acceptable. Use covered or ventilated drying. Monitor commodity exposure time.",
      dryingConditions: "Moderate – use ventilated/covered drying",
    };
  }
  return {
    risk: "high",
    recommendation: "High humidity. Avoid open-air drying. Use mechanical dryers or well-ventilated indoor storage.",
    dryingConditions: "Unfavorable – mechanical drying recommended",
  };
};

const statusColors = {
  safe: "bg-green-50 border-green-200 text-green-800",
  caution: "bg-amber-50 border-amber-200 text-amber-800",
  risk: "bg-red-50 border-red-200 text-red-800",
};

const statusIcons = {
  safe: <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />,
  caution: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
  risk: <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />,
};

export function HumidityMoistureEstimate({ onClose, onResult }: HumidityMoistureEstimateProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<HumidityResult | null>(null);

  const fetchHumidity = useCallback(async (lat?: number, lon?: number) => {
    setIsLoading(true);
    try {
      const body: Record<string, number> = {};
      if (lat !== undefined && lon !== undefined) {
        body.lat = lat;
        body.lon = lon;
      }

      const { data, error } = await supabase.functions.invoke("global-weather", { body });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error("Weather data unavailable");

      const { humidity, temperature, windSpeed } = data.current;
      const moistureInfo = getMoistureRisk(humidity);
      const commodityEstimates = getCommodityEstimates(humidity, temperature);

      const humidityResult: HumidityResult = {
        location: data.location.name,
        country: data.location.country,
        humidity,
        temperature,
        windSpeed,
        moistureRisk: moistureInfo.risk,
        recommendation: moistureInfo.recommendation,
        dryingConditions: moistureInfo.dryingConditions,
        commodityEstimates,
      };

      setResult(humidityResult);
      onResult?.(humidityResult);
      toast.success("Moisture data retrieved!");
    } catch (err) {
      console.error("Humidity fetch error:", err);
      toast.error("Failed to retrieve data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [onResult]);

  const handleAutoDetect = useCallback(() => fetchHumidity(), [fetchHumidity]);

  const handleUseGPS = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchHumidity(pos.coords.latitude, pos.coords.longitude),
      () => { toast.error("Location denied. Using IP detection."); fetchHumidity(); },
      { timeout: 8000 }
    );
  }, [fetchHumidity]);

  const riskColors = {
    low: "bg-green-100 text-green-800 border-green-300",
    moderate: "bg-amber-100 text-amber-800 border-amber-300",
    high: "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-foreground text-sm">Moisture Content Estimate</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {!result && !isLoading && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Estimates commodity moisture levels based on real-time environmental humidity at your location using equilibrium moisture content (EMC) models.
              </p>
              <Button onClick={handleAutoDetect} className="w-full gap-2" size="sm">
                <MapPin className="w-4 h-4" />
                Auto-Detect Location
              </Button>
              <Button onClick={handleUseGPS} className="w-full gap-2" variant="outline" size="sm">
                <MapPin className="w-4 h-4" />
                Use GPS Location
              </Button>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center gap-2 py-6">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Fetching environmental data...</p>
            </div>
          )}

          {result && (
            <div className="space-y-3">
              {/* Location & Environment */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                <span>{result.location}, {result.country}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-blue-50 rounded-lg p-2 text-center">
                  <Droplets className="w-3.5 h-3.5 mx-auto mb-0.5 text-blue-600" />
                  <p className="text-lg font-bold text-blue-700">{result.humidity}%</p>
                  <p className="text-[10px] text-blue-600">Humidity</p>
                </div>
                <div className="bg-muted rounded-lg p-2 text-center">
                  <Thermometer className="w-3.5 h-3.5 mx-auto mb-0.5 text-orange-500" />
                  <p className="text-lg font-semibold">{result.temperature}°C</p>
                  <p className="text-[10px] text-muted-foreground">Temp</p>
                </div>
                <div className="bg-muted rounded-lg p-2 text-center">
                  <Wind className="w-3.5 h-3.5 mx-auto mb-0.5 text-sky-500" />
                  <p className="text-lg font-semibold">{result.windSpeed}</p>
                  <p className="text-[10px] text-muted-foreground">km/h</p>
                </div>
              </div>

              {/* Risk badge */}
              <div className={`rounded-lg border p-2.5 ${riskColors[result.moistureRisk]}`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  {result.moistureRisk === "low" ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  <span className="font-semibold text-xs">{result.dryingConditions}</span>
                </div>
                <p className="text-[11px]">{result.recommendation}</p>
              </div>

              {/* Commodity-specific estimates */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Wheat className="w-4 h-4 text-primary" />
                  <p className="text-xs font-semibold text-foreground">Commodity Moisture Estimates (EMC)</p>
                </div>
                <div className="space-y-1.5">
                  {result.commodityEstimates.map((est) => (
                    <div key={est.name} className={`rounded-lg border p-2.5 ${statusColors[est.status]}`}>
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5">
                          {statusIcons[est.status]}
                          <span className="text-xs font-semibold">{est.name}</span>
                        </div>
                        <span className="text-sm font-bold">{est.estimatedMoisture}</span>
                      </div>
                      <p className="text-[10px] opacity-80">Safe: {est.safeRange}</p>
                      <p className="text-[10px] mt-0.5">{est.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-[10px] text-muted-foreground italic">
                Estimates based on equilibrium moisture content models. Use a calibrated moisture meter for trade-grade accuracy. Reference: FAO/ISO/ICCO standards.
              </p>

              <div className="flex gap-2">
                <Button onClick={() => { setResult(null); fetchHumidity(); }} variant="outline" size="sm" className="flex-1">
                  Refresh
                </Button>
                <Button onClick={onClose} size="sm" className="flex-1">
                  Done
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
