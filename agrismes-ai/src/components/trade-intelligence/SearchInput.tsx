import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUp, Plus } from "lucide-react";
import { InputToolPanel, type SearchMode } from "./InputToolPanel";
import { ModelSelector } from "./ModelSelector";

const PLACEHOLDERS = [
  "Ask anything about sourcing, pricing, export, or agribusiness in Tanzania…",
  "Cashew W320 pricing and export from Mtwara",
  "Coffee sourcing from Kigoma and Kagera regions",
  "Export documentation for sesame from Tanzania to UAE",
];

interface SearchInputProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
  compact?: boolean;
  mode?: SearchMode;
  onToggleDeepResearch?: () => void;
  onToggleFocusMode?: () => void;
  onResetContext?: () => void;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  tradeMode?: boolean;
  onToggleTradeMode?: () => void;
}

export function SearchInput({
  onSubmit,
  isLoading,
  compact,
  mode = { deepResearch: false, focusMode: false },
  onToggleDeepResearch,
  onToggleFocusMode,
  onResetContext,
  selectedModel = "gpt-5.3",
  onModelChange,
  tradeMode = false,
  onToggleTradeMode,
}: SearchInputProps) {
  const [value, setValue] = useState("");
  const [toolOpen, setToolOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const plusBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const max = compact ? 140 : 220;
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, max) + "px";
    }
  }, [value, compact]);

  useEffect(() => {
    if (isFocused || value) return;
    const interval = setInterval(() => {
      setPlaceholderVisible(false);
      setTimeout(() => {
        setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
        setPlaceholderVisible(true);
      }, 300);
    }, 3500);
    return () => clearInterval(interval);
  }, [isFocused, value]);

  const handleSubmit = useCallback(() => {
    if (!value.trim() || isLoading) return;
    onSubmit(value.trim());
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, isLoading, onSubmit]);

  const hasActiveMode = mode.deepResearch || mode.focusMode;
  const hasTools = onToggleDeepResearch || onToggleFocusMode || onResetContext;

  // Compact mode (thread bottom bar)
  if (compact) {
    return (
      <div className="relative w-full max-w-[740px] mx-auto">
        {hasActiveMode && (
          <div className="flex items-center gap-2 mb-2">
            {mode.deepResearch && (
              <span className="text-[11px] font-medium text-primary bg-primary/8 px-2 py-0.5 rounded">
                Deep Research
              </span>
            )}
            {mode.focusMode && (
              <span className="text-[11px] font-medium text-primary bg-primary/8 px-2 py-0.5 rounded">
                Strict Mode
              </span>
            )}
          </div>
        )}

        <div
          className="relative flex items-end rounded-xl bg-background transition-all duration-200"
          style={{
            border: "1.5px solid",
            borderColor: isFocused ? "hsl(var(--primary))" : "hsl(var(--border))",
            boxShadow: isFocused ? "0 0 0 3px hsl(var(--primary) / 0.08)" : "none",
          }}
        >
          {hasTools && (
            <button
              ref={plusBtnRef}
              onClick={() => setToolOpen((p) => !p)}
              className="shrink-0 ml-3 mb-[10px] w-[30px] h-[30px] rounded-full flex items-center justify-center transition-all text-muted-foreground hover:text-foreground hover:bg-secondary"
              aria-label="Open tools"
              type="button"
            >
              <Plus className={`w-[18px] h-[18px] transition-transform duration-200 ${toolOpen ? "rotate-45" : ""}`} />
            </button>
          )}

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Follow up or ask a new question…"
              rows={1}
              className="w-full bg-transparent resize-none outline-none text-foreground placeholder:text-muted-foreground/50"
              style={{
                fontSize: "14px",
                lineHeight: "1.5",
                padding: "12px 50px 12px 8px",
                minHeight: "44px",
                maxHeight: "140px",
                overflowY: "auto",
              }}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0 mr-[10px] mb-[10px]">
            <ModelSelector value={selectedModel} onChange={onModelChange || (() => {})} compact />
            <button
              onClick={handleSubmit}
              disabled={!value.trim() || isLoading}
              type="button"
              className={`w-[32px] h-[32px] rounded-full flex items-center justify-center transition-all duration-150 ${
                value.trim() && !isLoading
                  ? "bg-foreground text-background hover:opacity-80"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <ArrowUp className="w-[16px] h-[16px]" />
            </button>
          </div>
        </div>

        {hasTools && (
          <InputToolPanel
            open={toolOpen}
            onClose={() => setToolOpen(false)}
            mode={mode}
            onToggleDeepResearch={onToggleDeepResearch || (() => {})}
            onToggleFocusMode={onToggleFocusMode || (() => {})}
            onResetContext={onResetContext || (() => {})}
            anchorRef={plusBtnRef}
          />
        )}
      </div>
    );
  }

  // Hero mode (landing page — slim Perplexity-style input)
  return (
    <div className="relative w-full max-w-[740px] mx-auto">
      {hasActiveMode && (
        <div className="flex items-center gap-2 mb-2">
          {mode.deepResearch && (
            <span className="text-[11px] font-medium text-primary bg-primary/8 px-2 py-0.5 rounded">
              Deep Research
            </span>
          )}
          {mode.focusMode && (
            <span className="text-[11px] font-medium text-primary bg-primary/8 px-2 py-0.5 rounded">
              Strict Mode
            </span>
          )}
        </div>
      )}

      <div
        className="relative flex flex-col rounded-2xl bg-background transition-all duration-200 cursor-text"
        onClick={() => textareaRef.current?.focus()}
        style={{
          border: "1px solid",
          borderColor: isFocused ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border))",
          boxShadow: isFocused
            ? "0 0 0 3px hsl(var(--primary) / 0.06), 0 4px 20px -6px hsl(var(--foreground) / 0.08)"
            : "0 2px 16px -4px hsl(var(--foreground) / 0.06)",
        }}
      >
        {/* Textarea area */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder=""
            rows={1}
            className="w-full bg-transparent resize-none outline-none text-foreground placeholder:text-muted-foreground/50"
            style={{
              fontSize: "15px",
              lineHeight: "1.6",
              padding: "18px 20px 6px 20px",
              minHeight: "64px",
              maxHeight: "160px",
              overflowY: "auto",
            }}
            disabled={isLoading}
          />

          {/* Animated placeholder */}
          {!value && (
            <span
              className="pointer-events-none absolute top-0 left-0 text-muted-foreground/45 transition-opacity duration-300 whitespace-nowrap overflow-hidden text-ellipsis max-w-[calc(100%-60px)]"
              style={{
                fontSize: "15px",
                lineHeight: "1.6",
                padding: "18px 20px 6px 20px",
                opacity: placeholderVisible ? 1 : 0,
              }}
            >
              {PLACEHOLDERS[placeholderIdx]}
            </span>
          )}
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-3 pb-3 pt-0">
        <div className="flex items-center gap-1.5">
            {hasTools && (
              <button
                ref={plusBtnRef}
                onClick={(e) => {
                  e.stopPropagation();
                  setToolOpen((p) => !p);
                }}
                className="w-[32px] h-[32px] rounded-full flex items-center justify-center transition-all text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                aria-label="Open tools"
                type="button"
              >
                <Plus className={`w-[17px] h-[17px] transition-transform duration-200 ${toolOpen ? "rotate-45" : ""}`} />
              </button>
            )}
            {onToggleTradeMode && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleTradeMode();
                }}
                type="button"
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-150 border ${
                  tradeMode
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-secondary/50 text-muted-foreground border-border hover:text-foreground hover:border-foreground/20"
                }`}
              >
                Trade Mode {tradeMode ? "ON" : "OFF"}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <ModelSelector value={selectedModel} onChange={onModelChange || (() => {})} />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSubmit();
              }}
              disabled={!value.trim() || isLoading}
              type="button"
              className={`w-[34px] h-[34px] rounded-full flex items-center justify-center transition-all duration-150 ${
                value.trim() && !isLoading
                  ? "bg-foreground text-background hover:opacity-80 shadow-sm"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <ArrowUp className="w-[16px] h-[16px]" />
            </button>
          </div>
        </div>
      </div>

      {hasTools && (
        <InputToolPanel
          open={toolOpen}
          onClose={() => setToolOpen(false)}
          mode={mode}
          onToggleDeepResearch={onToggleDeepResearch || (() => {})}
          onToggleFocusMode={onToggleFocusMode || (() => {})}
          onResetContext={onResetContext || (() => {})}
          anchorRef={plusBtnRef}
        />
      )}
    </div>
  );
}
