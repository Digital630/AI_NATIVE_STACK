import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";

interface ModelOption {
  id: string;
  label: string;
}

const MODELS: ModelOption[] = [
  { id: "gpt-5.3", label: "GPT 5.3" },
  { id: "gemini-2.5", label: "Gemini 2.5" },
];

interface ModelSelectorProps {
  value: string;
  onChange: (model: string) => void;
  compact?: boolean;
}

export function ModelSelector({ value, onChange, compact }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((p) => !p);
        }}
        className={`inline-flex items-center gap-1 text-muted-foreground transition-all duration-150 hover:text-foreground select-none ${
          compact ? "text-[12px]" : "text-[14px]"
        }`}
      >
        <span className="font-medium">Model</span>
        <ChevronDown
          className={`transition-transform duration-200 w-3.5 h-3.5 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute bottom-full mb-2 right-0 z-50 min-w-[150px] rounded-xl border border-border bg-popover shadow-lg animate-in fade-in-0 zoom-in-95 duration-150"
          style={{ transformOrigin: "bottom right" }}
        >
          <div className="p-1.5">
            {MODELS.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(model.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors duration-100 ${
                  value === model.id
                    ? "bg-secondary text-foreground font-medium"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                <span>{model.label}</span>
                {value === model.id && (
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
