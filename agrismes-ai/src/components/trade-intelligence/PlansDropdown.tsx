import { useRef, useEffect } from "react";
import { Check } from "lucide-react";

interface PlansDropdownProps {
  open: boolean;
  onClose: () => void;
}

const PLANS = [
  {
    name: "Free",
    active: true,
    features: [
      "Basic trade queries",
      "Standard structured answers",
      "Limited daily usage",
    ],
  },
  {
    name: "Pro",
    active: false,
    features: [
      "Deep trade research mode",
      "Expanded source retrieval",
      "Advanced logistics insights",
      "Higher usage limits",
    ],
  },
  {
    name: "Enterprise",
    active: false,
    features: [
      "Custom intelligence workflows",
      "API access",
      "Dedicated support",
      "Business system integration",
    ],
  },
];

export function PlansDropdown({ open, onClose }: PlansDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute left-0 bottom-full mb-2 w-[320px] rounded-lg border border-border bg-background shadow-sm animate-fade-in z-50"
    >
      <div className="p-4 space-y-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className="rounded-md border border-border p-3"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-foreground">
                {plan.name}
              </span>
              {plan.active ? (
                <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  Active
                </span>
              ) : (
                <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">
                  Coming soon
                </span>
              )}
            </div>
            <ul className="space-y-1">
              {plan.features.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-1.5 text-xs text-muted-foreground"
                >
                  <Check className="w-3 h-3 mt-0.5 shrink-0 text-muted-foreground/60" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
