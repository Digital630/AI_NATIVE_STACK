import { useRef, useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, Focus, RotateCcw, FileText } from "lucide-react";

export interface SearchMode {
  deepResearch: boolean;
  focusMode: boolean;
}

interface InputToolPanelProps {
  open: boolean;
  onClose: () => void;
  mode: SearchMode;
  onToggleDeepResearch: () => void;
  onToggleFocusMode: () => void;
  onResetContext: () => void;
  anchorRef?: React.RefObject<HTMLButtonElement | null>;
}

const PANEL_WIDTH = 264;
const EDGE_MARGIN = 14;

export function InputToolPanel({
  open,
  onClose,
  mode,
  onToggleDeepResearch,
  onToggleFocusMode,
  onResetContext,
  anchorRef,
}: InputToolPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const computePosition = useCallback(() => {
    if (!anchorRef?.current) return null;
    const anchor = anchorRef.current.getBoundingClientRect();
    const panelHeight = panelRef.current?.offsetHeight || 240;

    let top: number;
    let left = anchor.left;

    // Try opening upward first
    const spaceAbove = anchor.top;
    const spaceBelow = window.innerHeight - anchor.bottom;

    if (spaceAbove >= panelHeight + EDGE_MARGIN) {
      top = anchor.top - panelHeight - 8;
    } else if (spaceBelow >= panelHeight + EDGE_MARGIN) {
      top = anchor.bottom + 8;
    } else {
      // Fallback: position from top edge with margin
      top = EDGE_MARGIN;
    }

    // Horizontal clamping
    if (left + PANEL_WIDTH > window.innerWidth - EDGE_MARGIN) {
      left = window.innerWidth - PANEL_WIDTH - EDGE_MARGIN;
    }
    if (left < EDGE_MARGIN) {
      left = EDGE_MARGIN;
    }

    return { top, left };
  }, [anchorRef]);

  // Position on open and on resize
  useEffect(() => {
    if (!open) { setPosition(null); return; }
    // Compute after render so panelRef has dimensions
    requestAnimationFrame(() => {
      setPosition(computePosition());
    });

    const onResize = () => setPosition(computePosition());
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, computePosition]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target) && !anchorRef?.current?.contains(target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  const panel = (
    <div
      ref={panelRef}
      className="fixed rounded-lg border border-border bg-background shadow-md animate-fade-in"
      style={{
        zIndex: 9999,
        width: PANEL_WIDTH,
        top: position?.top ?? -9999,
        left: position?.left ?? -9999,
        visibility: position ? "visible" : "hidden",
      }}
    >
      <div className="p-1.5 space-y-0.5">
        {/* Deep Research */}
        <button
          onClick={() => { onToggleDeepResearch(); onClose(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left text-sm transition-colors hover:bg-secondary group"
        >
          <Search className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
          <div className="min-w-0">
            <div className="font-medium text-foreground flex items-center gap-2">
              Deep trade research
              {mode.deepResearch && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">On</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">More sources, deeper logistics analysis</div>
            {!mode.deepResearch && (
              <div className="text-[10px] text-muted-foreground/60 mt-0.5">Part of Pro plan · coming soon</div>
            )}
          </div>
        </button>

        {/* Focus Mode */}
        <button
          onClick={() => { onToggleFocusMode(); onClose(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left text-sm transition-colors hover:bg-secondary group"
        >
          <Focus className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
          <div className="min-w-0">
            <div className="font-medium text-foreground flex items-center gap-2">
              Strict agribusiness mode
              {mode.focusMode && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">On</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Decision-focused, no fluff</div>
          </div>
        </button>

        <div className="h-px bg-border mx-2 my-1" />

        {/* Attach Document — disabled */}
        <button
          disabled
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left text-sm opacity-50 cursor-not-allowed group"
          title="Available in next phase"
        >
          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <div className="font-medium text-foreground">Upload trade document</div>
            <div className="text-xs text-muted-foreground mt-0.5">Coming soon</div>
          </div>
        </button>

        <div className="h-px bg-border mx-2 my-1" />

        {/* Reset Context */}
        <button
          onClick={() => { onResetContext(); onClose(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left text-sm transition-colors hover:bg-secondary group"
        >
          <RotateCcw className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
          <div className="min-w-0">
            <div className="font-medium text-foreground">Start new analysis</div>
            <div className="text-xs text-muted-foreground mt-0.5">Clear session context</div>
          </div>
        </button>
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}
