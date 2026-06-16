import { CheckCircle2 } from "lucide-react";

interface ConditionsChecklistProps {
  conditions: string[];
}

export function ConditionsChecklist({ conditions }: ConditionsChecklistProps) {
  if (!conditions?.length) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Execution Conditions</p>
      <div className="space-y-1.5">
        {conditions.map((condition, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-muted-foreground/50 shrink-0 mt-0.5" />
            <span className="text-sm text-foreground leading-relaxed">{condition}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
