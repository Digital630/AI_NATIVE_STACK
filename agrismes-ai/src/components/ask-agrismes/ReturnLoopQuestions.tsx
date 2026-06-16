interface ReturnLoopQuestionsProps {
  questions: string[];
  onSelect: (query: string) => void;
}

export function ReturnLoopQuestions({ questions, onSelect }: ReturnLoopQuestionsProps) {
  if (!questions?.length) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Dig Deeper</p>
      <div className="flex flex-wrap gap-2">
        {questions.map((q, i) => (
          <button
            key={i}
            onClick={() => onSelect(q)}
            className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-secondary/50 transition-colors text-sm text-foreground text-left leading-relaxed"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
