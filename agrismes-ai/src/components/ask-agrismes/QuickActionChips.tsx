import { Search, DollarSign, FileText, Truck } from "lucide-react";

const QUICK_ACTIONS = [
  { label: "Find Suppliers", query: "Find verified suppliers for this commodity", icon: Search },
  { label: "Check Prices", query: "What are current market prices for this commodity?", icon: DollarSign },
  { label: "Export Requirements", query: "What export documents and certifications are required?", icon: FileText },
  { label: "Logistics Route", query: "What are the best logistics routes and transit times?", icon: Truck },
];

interface QuickActionChipsProps {
  onSelect: (query: string) => void;
}

export function QuickActionChips({ onSelect }: QuickActionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_ACTIONS.map((action, i) => (
        <button
          key={i}
          onClick={() => onSelect(action.query)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-secondary/50 hover:border-primary/20 transition-all text-xs text-muted-foreground hover:text-foreground"
        >
          <action.icon className="w-3 h-3" />
          {action.label}
        </button>
      ))}
    </div>
  );
}
