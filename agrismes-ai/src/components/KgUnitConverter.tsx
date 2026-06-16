import { useState } from "react";
import { Scale, X, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface KgUnitConverterProps {
  onClose: () => void;
  onResult?: (summary: string) => void;
}

const conversions = [
  { unit: "Pounds (lbs)", factor: 2.20462, symbol: "lbs" },
  { unit: "Ounces (oz)", factor: 35.274, symbol: "oz" },
  { unit: "Grams (g)", factor: 1000, symbol: "g" },
  { unit: "Metric Tons (MT)", factor: 0.001, symbol: "MT" },
  { unit: "US Short Tons", factor: 0.00110231, symbol: "short tons" },
];

export function KgUnitConverter({ onClose, onResult }: KgUnitConverterProps) {
  const [kgValue, setKgValue] = useState("");

  const kg = parseFloat(kgValue);
  const isValid = !isNaN(kg) && kg > 0;

  // Live conversion — results show immediately as user types
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isValid) {
      const lbs = (kg * 2.20462).toFixed(2);
      const oz = (kg * 35.274).toFixed(2);
      onResult?.(`${kg} kg = ${lbs} lbs = ${oz} oz`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">KG Unit Converter</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Enter weight in kilograms</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 50"
              value={kgValue}
              onChange={(e) => setKgValue(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          {/* Live results — no button click needed */}
          {isValid && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Conversion Results</p>
              <div className="bg-muted rounded-lg divide-y divide-border">
                {conversions.map(({ unit, factor, symbol }) => (
                  <div key={symbol} className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm text-muted-foreground">{unit}</span>
                    <span className="text-sm font-semibold text-foreground">
                      {(kg * factor).toLocaleString(undefined, { maximumFractionDigits: 4 })} {symbol}
                    </span>
                  </div>
                ))}
              </div>

              {kg >= 1000 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2.5">
                  <p className="text-xs text-green-800">
                    <strong>Trade note:</strong> {kg.toLocaleString()} kg = {(kg / 1000).toFixed(2)} MT. 
                    Container: ~20 MT (20ft) / ~26 MT (40ft).
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={() => setKgValue("")} variant="outline" size="sm" className="flex-1">
              Clear
            </Button>
            <Button onClick={() => {
              if (isValid) {
                const lbs = (kg * 2.20462).toFixed(2);
                const oz = (kg * 35.274).toFixed(2);
                onResult?.(`${kg} kg = ${lbs} lbs = ${oz} oz`);
              }
              onClose();
            }} size="sm" className="flex-1">
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
