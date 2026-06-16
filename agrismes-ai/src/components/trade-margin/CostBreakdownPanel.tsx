import { PlusCircle, Trash2 } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { type CostItem, COST_PRESETS, fmt } from "./calcEngine";

interface Props {
  costs: CostItem[];
  currencySymbol: string;
  onChange: (costs: CostItem[]) => void;
}

const inputClass =
  "bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

const PIE_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#6366f1",
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-[12px] shadow-lg">
      <p className="font-medium text-foreground">{payload[0].name}</p>
      <p className="text-muted-foreground tabular-nums">{payload[0].value?.toLocaleString()}</p>
    </div>
  );
};

export default function CostBreakdownPanel({ costs, currencySymbol, onChange }: Props) {
  const totalCosts = costs.reduce((s, c) => s + (c.amount || 0), 0);

  const addRow = () => {
    const newItem: CostItem = {
      id: crypto.randomUUID(),
      label: "",
      amount: 0,
    };
    onChange([...costs, newItem]);
  };

  const removeRow = (id: string) => {
    onChange(costs.filter((c) => c.id !== id));
  };

  const updateRow = (id: string, patch: Partial<CostItem>) => {
    onChange(costs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const pieData = costs
    .filter((c) => c.amount > 0)
    .map((c, i) => ({ name: c.label || `Cost ${i + 1}`, value: c.amount }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          Additional Trade Costs
        </p>
        <button
          onClick={addRow}
          className="flex items-center gap-1.5 text-[12px] text-primary hover:text-primary/80 font-medium transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Add Cost
        </button>
      </div>

      {/* Cost rows */}
      {costs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-8 text-center text-[13px] text-muted-foreground">
          No additional costs added yet.
          <br />
          <button onClick={addRow} className="mt-2 text-primary hover:underline text-[12px]">
            + Add transport, duties, commission…
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {costs.map((cost, idx) => (
            <div key={cost.id} className="flex items-center gap-2">
              {/* Label */}
              <div className="flex-1 min-w-0">
                <input
                  list={`presets-${cost.id}`}
                  placeholder="Cost label…"
                  className={`${inputClass} w-full`}
                  value={cost.label}
                  onChange={(e) => updateRow(cost.id, { label: e.target.value })}
                />
                <datalist id={`presets-${cost.id}`}>
                  {COST_PRESETS.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>

              {/* Amount */}
              <div className="w-36 relative shrink-0">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground select-none">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  className={`${inputClass} w-full pl-7`}
                  value={cost.amount || ""}
                  onChange={(e) => updateRow(cost.id, { amount: parseFloat(e.target.value) || 0 })}
                />
              </div>

              {/* Remove */}
              <button
                onClick={() => removeRow(cost.id)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0"
                title="Remove"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Total */}
      {costs.length > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-secondary/60 px-4 py-2.5 text-[13px]">
          <span className="text-muted-foreground">Total additional costs</span>
          <span className="font-semibold text-foreground tabular-nums">
            {fmt(totalCosts, currencySymbol)}
          </span>
        </div>
      )}

      {/* Donut chart — only show when there's data */}
      {pieData.length > 1 && (
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Cost Distribution
          </p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-1">
            {pieData.map((entry, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                />
                {entry.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
