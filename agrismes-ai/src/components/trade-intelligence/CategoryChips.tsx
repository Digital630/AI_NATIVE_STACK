interface CategoryChipsProps {
  onSelect: (query: string) => void;
}

const COMMODITIES = [
  { emoji: "🌰", label: "Cashew", query: "Cashew sourcing and export from Tanzania" },
  { emoji: "☕", label: "Coffee", query: "Coffee sourcing and export from Tanzania" },
  { emoji: "🌾", label: "Sesame", query: "Sesame sourcing and export from Tanzania" },
  { emoji: "🌽", label: "Maize", query: "Maize sourcing and export from Tanzania" },
  { emoji: "🥑", label: "Avocado", query: "Avocado sourcing and export from Tanzania" },
  { emoji: "🍍", label: "Pineapple", query: "Pineapple sourcing and export from Tanzania" },
  { emoji: "🌿", label: "Spices", query: "Spices sourcing and export from Tanzania" },
];

const SERVICES = [
  { emoji: "🚛", label: "Logistics", query: "Logistics options for agricultural exports from Tanzania" },
  { emoji: "📄", label: "Export Documentation", query: "Export documentation requirements for Tanzania" },
  { emoji: "🏭", label: "Processing Services", query: "Agricultural processing services in Tanzania" },
];

const LOCATIONS = [
  { emoji: "📍", label: "Mtwara Region", query: "Agricultural trade opportunities in Mtwara region Tanzania" },
  { emoji: "📍", label: "Lindi Region", query: "Agricultural sourcing from Lindi region Tanzania" },
  { emoji: "📍", label: "Mbeya", query: "Agricultural commodities from Mbeya Tanzania" },
  { emoji: "📍", label: "Kigoma", query: "Coffee and commodities from Kigoma Tanzania" },
  { emoji: "📍", label: "Kagera", query: "Coffee sourcing from Kagera Tanzania" },
  { emoji: "📍", label: "Dar es Salaam", query: "Export hub logistics from Dar es Salaam Tanzania" },
];

function ChipRow({ chips, onSelect }: { chips: typeof COMMODITIES; onSelect: (q: string) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.label}
          onClick={() => onSelect(chip.query)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-background text-sm text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all duration-150"
        >
          <span>{chip.emoji}</span>
          <span>{chip.label}</span>
        </button>
      ))}
    </div>
  );
}

export function CategoryChips({ onSelect }: CategoryChipsProps) {
  return (
    <div className="w-full max-w-[780px] flex flex-col gap-3">
      <ChipRow chips={COMMODITIES} onSelect={onSelect} />
      <ChipRow chips={SERVICES} onSelect={onSelect} />
      <ChipRow chips={LOCATIONS} onSelect={onSelect} />
    </div>
  );
}
