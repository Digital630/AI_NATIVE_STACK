import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Warehouse, Thermometer, Droplets, Package } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { StorageContext } from "@/utils/weatherRiskCalculations";

interface StorageContextPanelProps {
  onContextChange: (context: StorageContext | null) => void;
  className?: string;
}

const STORAGE_TYPES = [
  { value: "warehouse", label: "Warehouse" },
  { value: "room", label: "Storage Room" },
  { value: "store", label: "Store" },
  { value: "container-sealed", label: "Container (Sealed)" },
  { value: "container-ventilated", label: "Container (Ventilated)" },
  { value: "outdoor", label: "Outdoor" },
];

const TIME_OPTIONS = [
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
];

const PACKAGING_TYPES = [
  { value: "jute-bags", label: "Jute Bags" },
  { value: "polypropylene", label: "Polypropylene" },
  { value: "hermetic", label: "Hermetic" },
  { value: "bulk", label: "Bulk" },
  { value: "other", label: "Other" },
];

const VENTILATION_OPTIONS = [
  { value: "poor", label: "Poor" },
  { value: "moderate", label: "Moderate" },
  { value: "good", label: "Good" },
];

export function StorageContextPanel({ onContextChange, className = "" }: StorageContextPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [storageType, setStorageType] = useState<string>("");
  const [timeInStorage, setTimeInStorage] = useState<string>("");
  const [packagingType, setPackagingType] = useState<string>("");
  const [ventilationQuality, setVentilationQuality] = useState<string>("");
  const [ambientTemperature, setAmbientTemperature] = useState<string>("");
  const [ambientHumidity, setAmbientHumidity] = useState<string>("");
  const [hotContainer, setHotContainer] = useState<boolean>(false);

  const hasContext = storageType || timeInStorage || packagingType || ventilationQuality;

  const buildContext = (): StorageContext | null => {
    if (!storageType || !timeInStorage || !packagingType || !ventilationQuality) {
      return null;
    }

    return {
      storageType: storageType as StorageContext["storageType"],
      timeInStorage: timeInStorage as StorageContext["timeInStorage"],
      packagingType: packagingType as StorageContext["packagingType"],
      ventilationQuality: ventilationQuality as StorageContext["ventilationQuality"],
      ambientTemperature: ambientTemperature ? parseFloat(ambientTemperature) : undefined,
      ambientHumidity: ambientHumidity ? parseFloat(ambientHumidity) : undefined,
      hotContainer,
    };
  };

  const handleChange = () => {
    const context = buildContext();
    onContextChange(context);
  };

  const handleClear = () => {
    setStorageType("");
    setTimeInStorage("");
    setPackagingType("");
    setVentilationQuality("");
    setAmbientTemperature("");
    setAmbientHumidity("");
    setHotContainer(false);
    onContextChange(null);
  };

  return (
    <div className={`border border-border rounded-lg overflow-hidden bg-card ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Warehouse className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Storage Context</span>
          {hasContext && (
            <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded">
              Active
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 space-y-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Optional: Add storage context for enhanced interpretation notes. If skipped, analysis
                proceeds normally.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {/* Storage Type */}
                <div>
                  <Label className="text-xs">Storage Type</Label>
                  <Select
                    value={storageType}
                    onValueChange={(v) => {
                      setStorageType(v);
                      setTimeout(handleChange, 0);
                    }}
                  >
                    <SelectTrigger className="h-9 mt-1 text-xs">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {STORAGE_TYPES.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Time in Storage */}
                <div>
                  <Label className="text-xs">Time in Storage</Label>
                  <Select
                    value={timeInStorage}
                    onValueChange={(v) => {
                      setTimeInStorage(v);
                      setTimeout(handleChange, 0);
                    }}
                  >
                    <SelectTrigger className="h-9 mt-1 text-xs">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Packaging Type */}
                <div>
                  <Label className="text-xs">Packaging</Label>
                  <Select
                    value={packagingType}
                    onValueChange={(v) => {
                      setPackagingType(v);
                      setTimeout(handleChange, 0);
                    }}
                  >
                    <SelectTrigger className="h-9 mt-1 text-xs">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PACKAGING_TYPES.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Ventilation */}
                <div>
                  <Label className="text-xs">Ventilation</Label>
                  <Select
                    value={ventilationQuality}
                    onValueChange={(v) => {
                      setVentilationQuality(v);
                      setTimeout(handleChange, 0);
                    }}
                  >
                    <SelectTrigger className="h-9 mt-1 text-xs">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {VENTILATION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Temperature */}
                <div>
                  <Label className="text-xs flex items-center gap-1">
                    <Thermometer className="h-3 w-3" />
                    Temperature (°C)
                  </Label>
                  <Input
                    type="number"
                    value={ambientTemperature}
                    onChange={(e) => {
                      setAmbientTemperature(e.target.value);
                      setTimeout(handleChange, 0);
                    }}
                    placeholder="e.g., 28"
                    className="h-9 mt-1 text-xs"
                  />
                </div>

                {/* Humidity */}
                <div>
                  <Label className="text-xs flex items-center gap-1">
                    <Droplets className="h-3 w-3" />
                    Humidity (%)
                  </Label>
                  <Input
                    type="number"
                    value={ambientHumidity}
                    onChange={(e) => {
                      setAmbientHumidity(e.target.value);
                      setTimeout(handleChange, 0);
                    }}
                    placeholder="e.g., 65"
                    className="h-9 mt-1 text-xs"
                  />
                </div>
              </div>

              {/* Hot Container Checkbox */}
              {(storageType === "container-sealed" || storageType === "container-ventilated") && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="hotContainer"
                    checked={hotContainer}
                    onCheckedChange={(checked) => {
                      setHotContainer(checked === true);
                      setTimeout(handleChange, 0);
                    }}
                  />
                  <Label htmlFor="hotContainer" className="text-xs text-muted-foreground">
                    Hot container (extended sun exposure)
                  </Label>
                </div>
              )}

              {/* Clear Button */}
              {hasContext && (
                <button
                  onClick={handleClear}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Clear all
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
