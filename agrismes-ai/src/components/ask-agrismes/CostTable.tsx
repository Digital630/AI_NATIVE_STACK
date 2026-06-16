interface CostRow {
  item: string;
  value: string;
  note?: string;
}

interface CostTableProps {
  rows: CostRow[];
}

export function CostTable({ rows }: CostTableProps) {
  if (!rows?.length) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Cost & Margin Analysis</p>
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/30">
              <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Item</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Value</th>
              <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-border/50">
                <td className="py-2.5 px-3 text-foreground font-medium">{row.item}</td>
                <td className="py-2.5 px-3 text-foreground tabular-nums">{row.value}</td>
                <td className="py-2.5 px-3 text-muted-foreground text-xs hidden sm:table-cell">{row.note || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
