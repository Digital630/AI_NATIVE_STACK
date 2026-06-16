import type { FollowUp } from "@/types/trade";

interface FollowUpActionsProps {
  questions: FollowUp[];
  onSelect: (query: string) => void;
}

export function FollowUpActions({ questions, onSelect }: FollowUpActionsProps) {
  return (
    <div className="pt-4 mt-4 border-t border-border">
      <div className="flex flex-wrap gap-2">
        {questions.map((q, i) => (
          <button
            key={i}
            onClick={() => onSelect(q.text)}
            className="px-3 py-1.5 rounded border border-border bg-background hover:bg-secondary/50 transition-colors text-sm text-foreground"
          >
            {q.action_label}
          </button>
        ))}
      </div>
    </div>
  );
}
