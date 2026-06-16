import { AGRI_COMMODITIES, CURRENCIES, UNITS, type MarginInputs } from "./calcEngine";

interface Props {
  inputs: MarginInputs;
  onChange: (updated: Partial<MarginInputs>) => void;
}

const labelClass = "block text-[12px] font-medium text-muted-foreground mb-1 uppercase tracking-wide";
const inputClass =
  "w-full bg-background border border-border rounded-lg px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

export default function MarginInputForm({ inputs, onChange }: Props) {
  const currencySymbol = CURRENCIES.find((c) => c.code === inputs.currency)?.symbol ?? "$";

  return (
    <div className="space-y-5">
      {/* Commodity */}
      <div>
        <label className={labelClass}>Commodity</label>
        <select
          className={inputClass}
          value={inputs.commodity}
          onChange={(e) => onChange({ commodity: e.target.value })}
        >
          <option value="">Select commodity…</option>
          {AGRI_COMMODITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Currency + Unit row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Currency</label>
          <select
            className={inputClass}
            value={inputs.currency}
            onChange={(e) => onChange({ currency: e.target.value })}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Unit</label>
          <select
            className={inputClass}
            value={inputs.unit}
            onChange={(e) => onChange({ unit: e.target.value })}
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Quantity */}
      <div>
        <label className={labelClass}>Quantity ({inputs.unit})</label>
        <input
          type="number"
          min="0"
          step="any"
          placeholder="e.g. 500"
          className={inputClass}
          value={inputs.quantity || ""}
          onChange={(e) => onChange({ quantity: parseFloat(e.target.value) || 0 })}
        />
      </div>

      {/* Buy Price + Sell Price row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Buy Price / {inputs.unit}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground select-none">
              {currencySymbol}
            </span>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              className={`${inputClass} pl-8`}
              value={inputs.buyPrice || ""}
              onChange={(e) => onChange({ buyPrice: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Sell Price / {inputs.unit}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground select-none">
              {currencySymbol}
            </span>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              className={`${inputClass} pl-8`}
              value={inputs.sellPrice || ""}
              onChange={(e) => onChange({ sellPrice: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>
      </div>

      {/* Quick spread indicator */}
      {inputs.buyPrice > 0 && inputs.sellPrice > 0 && (
        <div className="rounded-lg bg-secondary/60 px-4 py-2.5 text-[13px] text-muted-foreground flex items-center justify-between">
          <span>Price spread</span>
          <span className={`font-medium tabular-nums ${inputs.sellPrice >= inputs.buyPrice ? "text-emerald-600" : "text-red-500"}`}>
            {currencySymbol}{Math.abs(inputs.sellPrice - inputs.buyPrice).toFixed(2)} / {inputs.unit}
            {inputs.sellPrice < inputs.buyPrice && " ⚠ selling below cost"}
          </span>
        </div>
      )}
    </div>
  );
}
