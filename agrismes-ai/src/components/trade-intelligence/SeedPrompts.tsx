interface SeedPromptsProps {
  onSelect: (query: string) => void;
}

const SEEDS = [
  { text: "I need to source coffee from East Africa", label: "Discover", icon: "🌍" },
  { text: "Evaluate sesame export from Sudan to UAE at $1,400/MT FOB", label: "Evaluate deal", icon: "📊" },
  { text: "Find cocoa suppliers in Tanzania", label: "Source", icon: "🔍" },
  { text: "Compare cashew W320 pricing: Tanzania vs Vietnam", label: "Compare", icon: "⚖️" },
  { text: "What documents do I need to export maize to Kenya?", label: "Compliance", icon: "📋" },
  { text: "Is this coffee deal viable at $3.8/kg FOB from Ethiopia to Germany?", label: "Risk check", icon: "⚠️" },
];

export function SeedPrompts({ onSelect }: SeedPromptsProps) {
  return (
    <div className="w-full max-w-[780px] grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {SEEDS.map((seed, i) => (
        <button
          key={i}
          onClick={() => onSelect(seed.text)}
          className="text-left px-4 py-3.5 rounded-xl border border-border bg-background hover:border-primary/20 hover:shadow-sm transition-all duration-200 group"
        >
          <div className="flex items-start gap-3">
            <span className="text-base mt-0.5 shrink-0">{seed.icon}</span>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary/60 group-hover:text-primary block mb-1 transition-colors">
                {seed.label}
              </span>
              <span className="text-[13px] text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed line-clamp-2">
                {seed.text}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
