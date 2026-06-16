import React, { useState } from "react";
import { Wheat, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export interface BatchContext {
  commodity: string;
  form: string;
  dryingMethod: string;
  storageCondition: string;
  timeSinceHarvest: string;
  weatherExposure: string;
  sensoryCondition: string;
  textureCondition: string;
  packagingType: string;
}

interface MoistureBatchInputFormProps {
  onSubmit: (context: BatchContext) => void;
  onBack: () => void;
}

const COMMODITIES = [
  { value: "cashew", label: "Cashew Nuts" },
  { value: "coffee", label: "Coffee (Green)" },
  { value: "cocoa", label: "Cocoa Beans" },
  { value: "sesame", label: "Sesame Seeds" },
];

const FORMS: Record<string, { value: string; label: string }[]> = {
  cashew: [
    { value: "whole_kernel", label: "Whole Kernel (W240/W320/W450)" },
    { value: "split", label: "Split / Pieces" },
    { value: "raw_in_shell", label: "Raw in Shell (RCN)" },
  ],
  coffee: [
    { value: "green_washed", label: "Green Washed" },
    { value: "green_natural", label: "Green Natural/Dry Process" },
    { value: "parchment", label: "Parchment" },
    { value: "cherry", label: "Cherry (Fresh)" },
  ],
  cocoa: [
    { value: "fermented_dried", label: "Fermented & Dried Beans" },
    { value: "unfermented", label: "Unfermented Beans" },
    { value: "nibs", label: "Nibs" },
  ],
  sesame: [
    { value: "white_hulled", label: "White Hulled" },
    { value: "natural_unhulled", label: "Natural / Unhulled" },
    { value: "black", label: "Black Sesame" },
  ],
};

const DRYING_METHODS = [
  { value: "sun_open", label: "Sun drying (open air)" },
  { value: "sun_covered", label: "Sun drying (covered/raised)" },
  { value: "shade", label: "Shade drying" },
  { value: "mechanical", label: "Mechanical / Machine dryer" },
  { value: "not_dried", label: "Not yet dried" },
  { value: "unknown", label: "Unknown" },
];

const STORAGE_CONDITIONS = [
  { value: "sealed_warehouse", label: "Sealed warehouse / climate controlled" },
  { value: "indoor_warehouse", label: "Indoor warehouse (not sealed)" },
  { value: "covered_shed", label: "Covered shed / open-sided" },
  { value: "outdoor", label: "Outdoor / open storage" },
  { value: "damp_humid", label: "Damp or humid location" },
  { value: "unknown", label: "Unknown" },
];

const TIME_SINCE_HARVEST = [
  { value: "days", label: "Days (fresh harvest)" },
  { value: "weeks", label: "1–4 weeks" },
  { value: "months", label: "1–3 months" },
  { value: "many_months", label: "3–6 months" },
  { value: "over_6_months", label: "Over 6 months" },
  { value: "unknown", label: "Unknown" },
];

const WEATHER_EXPOSURE = [
  { value: "dry_arid", label: "Dry / Arid climate" },
  { value: "moderate", label: "Moderate humidity" },
  { value: "humid", label: "High humidity / tropical" },
  { value: "rain_exposed", label: "Rain-exposed during drying/storage" },
  { value: "unknown", label: "Unknown" },
];

const SENSORY_CONDITIONS = [
  { value: "clean_normal", label: "Clean smell, no issues" },
  { value: "slightly_musty", label: "Slightly musty / stale" },
  { value: "mold_smell", label: "Mold / mildew smell" },
  { value: "heat_fermentation", label: "Heat / fermentation smell" },
  { value: "unknown", label: "Unknown / Not checked" },
];

const TEXTURE_CONDITIONS = [
  { value: "brittle_crisp", label: "Brittle / Crisp" },
  { value: "firm_solid", label: "Firm / Solid" },
  { value: "slightly_soft", label: "Slightly soft / Pliable" },
  { value: "soft_spongy", label: "Soft / Spongy / Flexible" },
  { value: "unknown", label: "Unknown" },
];

const PACKAGING_TYPES = [
  { value: "hermetic", label: "Hermetic / Vacuum sealed" },
  { value: "poly_lined", label: "Poly-lined jute bags" },
  { value: "jute_sisal", label: "Jute / Sisal bags (unlined)" },
  { value: "open_bulk", label: "Open / Bulk (no packaging)" },
  { value: "unknown", label: "Unknown" },
];

export function MoistureBatchInputForm({ onSubmit, onBack }: MoistureBatchInputFormProps) {
  const [commodity, setCommodity] = useState("");
  const [form, setForm] = useState("");
  const [dryingMethod, setDryingMethod] = useState("");
  const [storageCondition, setStorageCondition] = useState("");
  const [timeSinceHarvest, setTimeSinceHarvest] = useState("");
  const [weatherExposure, setWeatherExposure] = useState("");
  const [sensoryCondition, setSensoryCondition] = useState("");
  const [textureCondition, setTextureCondition] = useState("");
  const [packagingType, setPackagingType] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const availableForms = commodity ? FORMS[commodity] || [] : [];
  const canSubmit = commodity && dryingMethod && storageCondition;

  const filledCount = [commodity, form, dryingMethod, storageCondition, timeSinceHarvest, weatherExposure, sensoryCondition, textureCondition, packagingType]
    .filter(v => v && v !== "unknown").length;

  const handleSubmit = () => {
    const selectedCommodity = COMMODITIES.find(c => c.value === commodity);
    onSubmit({
      commodity: selectedCommodity?.label || commodity,
      form: availableForms.find(f => f.value === form)?.label || form,
      dryingMethod: DRYING_METHODS.find(d => d.value === dryingMethod)?.label || dryingMethod,
      storageCondition: STORAGE_CONDITIONS.find(s => s.value === storageCondition)?.label || storageCondition,
      timeSinceHarvest: TIME_SINCE_HARVEST.find(t => t.value === timeSinceHarvest)?.label || timeSinceHarvest,
      weatherExposure: WEATHER_EXPOSURE.find(w => w.value === weatherExposure)?.label || weatherExposure,
      sensoryCondition: SENSORY_CONDITIONS.find(s => s.value === sensoryCondition)?.label || sensoryCondition,
      textureCondition: TEXTURE_CONDITIONS.find(t => t.value === textureCondition)?.label || textureCondition,
      packagingType: PACKAGING_TYPES.find(p => p.value === packagingType)?.label || packagingType,
    });
  };

  const renderSelect = (label: string, value: string, onChange: (v: string) => void, options: { value: string; label: string }[], required = false) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-foreground">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 text-sm">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2 mb-4">
        <Wheat className="w-10 h-10 mx-auto text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Batch Details</h3>
        <p className="text-xs text-muted-foreground">
          Provide batch details for a controlled, evidence-based moisture estimate.
          More details = higher confidence.
        </p>
      </div>

      {/* Required fields */}
      <div className="space-y-3">
        {renderSelect("Commodity", commodity, (v) => { setCommodity(v); setForm(""); }, COMMODITIES, true)}
        
        {commodity && availableForms.length > 0 && (
          renderSelect("Form / Type", form, setForm, availableForms)
        )}

        {renderSelect("Drying Method", dryingMethod, setDryingMethod, DRYING_METHODS, true)}
        {renderSelect("Storage Condition", storageCondition, setStorageCondition, STORAGE_CONDITIONS, true)}
      </div>

      {/* Confidence indicator */}
      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border">
        <div className="flex gap-0.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-4 rounded-sm ${
                i < filledCount
                  ? filledCount >= 7 ? "bg-green-500" : filledCount >= 4 ? "bg-yellow-500" : "bg-orange-500"
                  : "bg-muted-foreground/20"
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          {filledCount >= 7 ? "High" : filledCount >= 4 ? "Medium" : "Low"} confidence ({filledCount}/9 fields)
        </span>
      </div>

      {/* Advanced fields toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-1.5 text-xs text-primary font-medium w-full justify-center"
      >
        {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {showAdvanced ? "Hide" : "Show"} additional details ({5 - [timeSinceHarvest, weatherExposure, sensoryCondition, textureCondition, packagingType].filter(v => v && v !== "unknown").length} remaining)
      </button>

      {showAdvanced && (
        <div className="space-y-3">
          {renderSelect("Time Since Harvest", timeSinceHarvest, setTimeSinceHarvest, TIME_SINCE_HARVEST)}
          {renderSelect("Weather Exposure", weatherExposure, setWeatherExposure, WEATHER_EXPOSURE)}
          {renderSelect("Smell / Mold / Heat", sensoryCondition, setSensoryCondition, SENSORY_CONDITIONS)}
          {renderSelect("Texture / Brittleness", textureCondition, setTextureCondition, TEXTURE_CONDITIONS)}
          {renderSelect("Packaging Type", packagingType, setPackagingType, PACKAGING_TYPES)}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onBack} className="flex-1">Back</Button>
        <Button onClick={handleSubmit} className="flex-1" disabled={!canSubmit}>
          Continue to Photo
        </Button>
      </div>

      <p className="text-[10px] text-center text-muted-foreground italic">
        Indicative result only. Always confirm with a calibrated moisture meter before major trade, storage, or processing decisions.
      </p>
    </div>
  );
}
