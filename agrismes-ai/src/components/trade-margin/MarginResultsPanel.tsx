import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Percent, Target, Activity } from "lucide-react";
import { type MarginResults, HEALTH_CONFIG, fmt, fmtPct } from "./calcEngine";

interface Props {
  results: MarginResults;
  currency: string;
  currencySymbol: string;
}

function StatCard({
  label, value, sub, icon: Icon, positive,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  positive?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1.5"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        <Icon className="w-3.5 h-3.5 text-muted-foreground/60" />
      </div>
      <p
        className={`text-[22px] font-semibold tabular-nums leading-none ${
          positive === undefined ? "text-foreground" : positive ? "text-emerald-600" : "text-red-500"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-[12px] shadow-lg">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill }} className="tabular-nums">
          {p.name}: {p.value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  );
};

export default function MarginResultsPanel({ results, currencySymbol }: Props) {
  const health = HEALTH_CONFIG[results.health];
  const isProfit = results.netProfit >= 0;

  const chartData = [
    { name: "Buy Cost",   value: results.totalBuyCost,         fill: "#94a3b8" },
    { name: "Add. Costs", value: results.totalAdditionalCosts, fill: "#64748b" },
    { name: "Revenue",    value: results.totalRevenue,          fill: "#3b82f6" },
    { name: "Net Profit", value: Math.abs(results.netProfit),   fill: isProfit ? "#10b981" : "#ef4444" },
  ];

  const netMarginBarWidth = Math.min(Math.abs(results.netMarginPct), 100);

  return (
    <div className="space-y-5">
      {/* Health badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`rounded-xl border ${health.border} bg-card px-4 py-3 flex items-center justify-between`}
      >
        <div className="flex items-center gap-2.5">
          {isProfit ? (
            <TrendingUp className={`w-5 h-5 ${health.color}`} />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-500" />
          )}
          <div>
            <p className={`text-[14px] font-semibold ${health.color}`}>{health.label}</p>
            <p className="text-[12px] text-muted-foreground">
              Net margin: {results.netMarginPct.toFixed(1)}%
            </p>
          </div>
        </div>
        <span className={`text-[12px] font-medium px-2.5 py-1 rounded-full ${health.bg} text-white`}>
          {results.health.toUpperCase()}
        </span>
      </motion.div>

      {/* Net margin progress bar */}
      <div>
        <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
          <span>Net Margin</span>
          <span className={isProfit ? "text-emerald-600" : "text-red-500"}>
            {results.netMarginPct.toFixed(1)}%
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${netMarginBarWidth}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`h-full rounded-full ${health.bg}`}
          />
        </div>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Gross Margin"
          value={`${results.grossMarginPct.toFixed(1)}%`}
          sub="Revenue minus buy cost"
          icon={Percent}
          positive={results.grossMarginPct >= 0}
        />
        <StatCard
          label="Net Margin"
          value={`${results.netMarginPct.toFixed(1)}%`}
          sub="After all costs"
          icon={Activity}
          positive={results.netMarginPct >= 0}
        />
        <StatCard
          label="Net Profit"
          value={fmt(results.netProfit, currencySymbol)}
          sub={`Gross: ${fmt(results.grossProfit, currencySymbol)}`}
          icon={DollarSign}
          positive={results.netProfit >= 0}
        />
        <StatCard
          label="Markup"
          value={`${results.markupPct.toFixed(1)}%`}
          sub="On buy cost"
          icon={TrendingUp}
          positive={results.markupPct >= 0}
        />
        <StatCard
          label="Break-Even Price"
          value={fmt(results.breakEvenSellPrice, currencySymbol)}
          sub="Per unit to cover all costs"
          icon={Target}
        />
        <StatCard
          label="ROI"
          value={fmtPct(results.roi)}
          sub="Return on total cost"
          icon={Activity}
          positive={results.roi >= 0}
        />
      </div>

      {/* Bar chart */}
      <div>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Trade Breakdown ({currencySymbol})
        </p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={36} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${currencySymbol}${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary row */}
      <div className="rounded-lg bg-secondary/50 p-3 grid grid-cols-3 gap-2 text-center text-[12px]">
        <div>
          <p className="text-muted-foreground">Total Revenue</p>
          <p className="font-semibold text-foreground tabular-nums">{fmt(results.totalRevenue, currencySymbol)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Total Cost</p>
          <p className="font-semibold text-foreground tabular-nums">{fmt(results.totalCost, currencySymbol)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Cost/Revenue</p>
          <p className="font-semibold text-foreground tabular-nums">{results.costRevenueRatio.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}
