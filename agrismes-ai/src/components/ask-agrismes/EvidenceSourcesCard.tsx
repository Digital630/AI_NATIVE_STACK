import { BookOpen } from "lucide-react";

interface Source {
  name: string;
  supports?: string;
}

interface EvidenceSourcesCardProps {
  sources: Source[];
}

export function EvidenceSourcesCard({ sources }: EvidenceSourcesCardProps) {
  if (!sources?.length) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Sources</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, i) => (
          <span
            key={i}
            className="inline-flex items-center px-2.5 py-1 rounded-md bg-secondary/40 text-sm text-muted-foreground"
          >
            {source.name}
          </span>
        ))}
      </div>
    </div>
  );
}
