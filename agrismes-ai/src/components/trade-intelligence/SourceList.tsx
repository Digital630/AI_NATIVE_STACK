import type { Source } from "@/types/trade";
import { ExternalLink } from "lucide-react";

interface SourceListProps {
  sources: Source[];
}

export function SourceList({ sources }: SourceListProps) {
  return (
    <div className="pt-4 mt-4 border-t border-border">
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">Sources</p>
      <div className="space-y-1">
        {sources.map((src, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <span className="text-muted-foreground font-mono text-xs mt-0.5">[{i + 1}]</span>
            <div className="flex-1 min-w-0">
              {src.url && src.url.startsWith("http") ? (
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:underline inline-flex items-center gap-1"
                >
                  <span className="truncate">{src.title}</span>
                  <ExternalLink className="w-3 h-3 shrink-0 text-muted-foreground" />
                </a>
              ) : (
                <span className="text-foreground">{src.title}</span>
              )}
              {src.domain && (
                <span className="text-muted-foreground text-xs ml-2">{src.domain}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
