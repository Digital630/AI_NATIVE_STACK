import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cloud,
  Droplets,
  Wind,
  MapPin,
  RefreshCw,
  Navigation,
  Search,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Thermometer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGlobalWeather, AFRICAN_REGION_PRESETS, LocationData } from "@/hooks/useGlobalWeather";
import {
  calculateMoldDryingRisk,
  type CommodityType,
  type RiskLevel,
  getVentilationRecommendation,
} from "@/utils/weatherRiskCalculations";

interface GlobalWeatherPanelProps {
  className?: string;
}

const COMMODITY_OPTIONS: { value: CommodityType; label: string }[] = [
  { value: "cashew", label: "Cashew" },
  { value: "coffee", label: "Coffee" },
  { value: "cocoa", label: "Cocoa" },
];

function RiskBadge({ level }: { level: RiskLevel }) {
  const config = {
    LOW: { bg: "bg-emerald-500/15", text: "text-emerald-700", icon: CheckCircle2 },
    MEDIUM: { bg: "bg-amber-500/15", text: "text-amber-700", icon: AlertTriangle },
    HIGH: { bg: "bg-red-500/15", text: "text-red-700", icon: AlertTriangle },
  };

  const { bg, text, icon: Icon } = config[level];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
      <Icon className="h-3.5 w-3.5" />
      {level}
    </span>
  );
}

export function GlobalWeatherPanel({ className = "" }: GlobalWeatherPanelProps) {
  const {
    current,
    hourlyForecast,
    dailyForecast,
    location,
    lastUpdated,
    isLoading,
    error,
    isCached,
    searchCity,
    useMyLocation,
    selectRegion,
    selectLocation,
    refresh,
    getWeatherDescription,
    getWeatherIcon,
  } = useGlobalWeather();

  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityType>("coffee");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Calculate mold/drying risk
  const moldRisk = current
    ? calculateMoldDryingRisk(selectedCommodity, {
        humidity: current.humidity,
        rainProbability: current.rainProbability,
        wetHours: hourlyForecast.filter((h) => h.rainProbability >= 50).length,
      })
    : null;

  // Search handler with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchCity(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchCity]);

  const handleSelectSearchResult = (loc: LocationData) => {
    selectLocation(loc);
    setSearchQuery("");
    setSearchResults([]);
    setShowSearch(false);
  };

  if (isLoading && !current) {
    return (
      <div className={`bg-card border border-border rounded-xl p-6 ${className}`}>
        <div className="flex items-center justify-center gap-3 py-8">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading weather data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card border border-border rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between bg-primary/5 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Cloud className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">Live Weather (Global)</span>
          {isCached && (
            <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-700 rounded">
              Cached
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={isLoading}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
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
            <div className="p-4 space-y-4">
              {/* Location Controls */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={useMyLocation}
                    className="flex-1 gap-1.5"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    My Location
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSearch(!showSearch)}
                    className="flex-1 gap-1.5"
                  >
                    <Search className="h-3.5 w-3.5" />
                    Search
                  </Button>
                </div>

                <Select onValueChange={selectRegion}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Regional Presets" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(AFRICAN_REGION_PRESETS).map(([id, region]) => (
                      <SelectItem key={id} value={id}>
                        {id.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())} - {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* City Search */}
                {showSearch && (
                  <div className="relative">
                    <Input
                      placeholder="Search city..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-9 text-sm"
                    />
                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                        {searchResults.map((loc, i) => (
                          <button
                            key={i}
                            onClick={() => handleSelectSearchResult(loc)}
                            className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-center gap-2"
                          >
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            {loc.name}, {loc.country}
                          </button>
                        ))}
                      </div>
                    )}
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Current Location */}
              {location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{location.name}{location.country ? `, ${location.country}` : ""}</span>
                </div>
              )}

              {error && !current && (
                <div className="text-center py-4 text-sm text-destructive">
                  {error}
                </div>
              )}

              {current && (
                <>
                  {/* Current Conditions */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{getWeatherIcon(current.weatherCode, current.isDay)}</span>
                        <span className="text-2xl font-bold text-foreground">{Math.round(current.temperature)}°C</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{getWeatherDescription(current.weatherCode)}</p>
                    </div>

                    <div className="bg-muted/30 rounded-lg p-3 space-y-1.5">
                      <div className="flex items-center gap-2 text-sm">
                        <Droplets className="h-4 w-4 text-blue-500" />
                        <span className="text-foreground">{current.humidity}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Wind className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{Math.round(current.windSpeed)} km/h</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Cloud className="h-4 w-4 text-blue-400" />
                        <span className="text-foreground">{current.rainProbability}% rain</span>
                      </div>
                    </div>
                  </div>

                  {/* Commodity Selector + Mold Risk */}
                  <div className="bg-muted/20 rounded-lg p-3 border border-border/50">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-medium text-muted-foreground">Commodity at Risk</label>
                      <Select value={selectedCommodity} onValueChange={(v) => setSelectedCommodity(v as CommodityType)}>
                        <SelectTrigger className="h-8 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COMMODITY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {moldRisk && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">Mold & Drying Risk</span>
                          <RiskBadge level={moldRisk.level} />
                        </div>
                        
                        <div className="text-xs text-muted-foreground space-y-1">
                          {moldRisk.factors.map((f, i) => (
                            <div key={i}>• {f}</div>
                          ))}
                        </div>

                        <div className="mt-2 p-2 bg-card rounded border border-border/50">
                          <p className="text-xs font-medium text-foreground mb-1">Post-Harvest Guidance</p>
                          <p className="text-xs text-muted-foreground">{moldRisk.recommendation}</p>
                        </div>

                        {moldRisk.level !== "LOW" && (
                          <div className="p-2 bg-primary/5 rounded border border-primary/20">
                            <p className="text-xs font-medium text-primary mb-1">Ventilation</p>
                            <p className="text-xs text-muted-foreground">
                              {getVentilationRecommendation(moldRisk.level)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Hourly Outlook (12h) */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">12-Hour Outlook</p>
                    <div className="flex overflow-x-auto gap-2 pb-2" style={{ scrollbarWidth: "none" }}>
                      {hourlyForecast.slice(0, 12).map((h, i) => (
                        <div
                          key={i}
                          className="flex-shrink-0 w-14 bg-muted/30 rounded-lg p-2 text-center"
                        >
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(h.time).toLocaleTimeString([], { hour: "2-digit" })}
                          </p>
                          <p className="text-lg my-0.5">{getWeatherIcon(h.weatherCode, true)}</p>
                          <p className="text-xs font-medium text-foreground">{Math.round(h.temperature)}°</p>
                          <p className="text-[10px] text-blue-500">{h.rainProbability}%</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3-Day Outlook */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">3-Day Outlook</p>
                    <div className="space-y-2">
                      {dailyForecast.map((d, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-muted/30 rounded-lg p-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getWeatherIcon(d.weatherCode, true)}</span>
                            <span className="text-sm text-foreground">
                              {i === 0
                                ? "Today"
                                : new Date(d.date).toLocaleDateString([], { weekday: "short" })}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-blue-500 flex items-center gap-1">
                              <Droplets className="h-3 w-3" />
                              {d.rainProbability}%
                            </span>
                            <span className="text-sm font-medium text-foreground">
                              {Math.round(d.tempMax)}° / {Math.round(d.tempMin)}°
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <p className="text-[10px] text-muted-foreground text-center border-t border-border pt-3">
                    Guidance only. Actual handling practices and local conditions matter.
                  </p>

                  {/* Last Updated */}
                  {lastUpdated && (
                    <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Last updated: {lastUpdated.toLocaleTimeString()}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
