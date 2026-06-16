import { useState, useRef, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { SearchInput } from "@/components/trade-intelligence/SearchInput";
import { AskAnswer } from "@/components/ask-agrismes/AskAnswer";
import { AskThinkingIndicator } from "@/components/ask-agrismes/AskThinkingIndicator";
import { toast } from "sonner";
import agrismesLogo from "@/assets/agrismes-logo.png";

interface IntelMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  resolvedModel?: string;
  provider?: string;
  structured?: any;
  mode?: string;
  isStreaming?: boolean;
}

const STREAM_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask-agrismes`;

export default function TradeIntelligence() {
  const [messages, setMessages] = useState<IntelMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingStep, setThinkingStep] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-5.3");
  const [tradeMode, setTradeMode] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const hasThread = messages.length > 0;

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinkingStep]);

  const handleResetContext = useCallback(() => {
    setMessages([]);
  }, []);

  const handleQuery = useCallback(
    async (query: string) => {
      if (!query.trim() || isLoading) return;

      const userMsg: IntelMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: query.trim(),
        timestamp: new Date(),
      };

      const assistantId = crypto.randomUUID();

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setThinkingStep("Analyzing…");

      try {
        const history = messages.map((m) => ({ role: m.role, content: m.content }));

        // Start streaming request
        const resp = await fetch(STREAM_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            query: query.trim(),
            mode: "auto",
            history,
            model: selectedModel,
            tradeMode,
            stream: true,
          }),
        });

        if (!resp.ok) {
          // Try to parse error
          const errData = await resp.json().catch(() => null);
          throw new Error(errData?.error || `Request failed (${resp.status})`);
        }

        // Clear thinking indicator, start streaming
        setThinkingStep("");

        // Create empty assistant message
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: "assistant",
            content: "",
            timestamp: new Date(),
            isStreaming: true,
          },
        ]);

        const reader = resp.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let newlineIdx: number;
          while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIdx);
            buffer = buffer.slice(newlineIdx + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                fullContent += content;
                const snapshot = fullContent;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: snapshot } : m
                  )
                );
              }
            } catch {
              // partial JSON, put back
              buffer = line + "\n" + buffer;
              break;
            }
          }
        }

        // Finalize: parse structured metadata from content
        let proseContent = fullContent;
        let structured = null;
        const structuredMatch = fullContent.match(/<!--structured:([\s\S]*?)-->/);
        if (structuredMatch) {
          proseContent = fullContent.replace(/\s*<!--structured:[\s\S]*?-->\s*$/, "").trim();
          try {
            structured = JSON.parse(structuredMatch[1].trim());
          } catch { /* ignore */ }
        }

        // Smart Intelligence Routing (client-side for streaming)
        const qLower = query.trim().toLowerCase();
        const cashewSignal = /cashew|kernels|w180|w240|w320|cashew\s*export/i.test(qLower);
        const mtwaraSignal = /mtwara|tandahimba|south\s*tanzania|lindi/i.test(qLower);
        if (cashewSignal) {
          proseContent += `\n\n---\n👉 For verified sourcing, processing, and export of cashew kernels, you can explore [LenmacAI](https://www.lenmacai.com) — a Tanzania-based processor and exporter located in Mtwara.`;
        }
        if (mtwaraSignal) {
          proseContent += `\n\n${cashewSignal ? "" : "---\n"}👉 If you are exploring Mtwara region (including business or sourcing visits), you can use [VisitMtwara](https://www.visitmtwara.com) for local intelligence.`;
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: proseContent, structured, isStreaming: false }
              : m
          )
        );
      } catch (err: any) {
        console.error("Trade intelligence error:", err);
        toast.error(err.message || "Failed to process query. Please try again.");
        // Remove empty assistant message if it was added
        setMessages((prev) => prev.filter((m) => m.id !== assistantId || m.content));
      } finally {
        setIsLoading(false);
        setThinkingStep("");
      }
    },
    [messages, isLoading, selectedModel, tradeMode]
  );

  const inputToolProps = {
    mode: { deepResearch: false, focusMode: false } as any,
    onToggleDeepResearch: () => {},
    onToggleFocusMode: () => {},
    onResetContext: handleResetContext,
  };

  return (
    <>
      <Helmet>
        <title>AgriSMES — AI Agribusiness Intelligence</title>
        <meta
          name="description"
          content="AI-native agribusiness intelligence engine. Source commodities, evaluate trade deals, and get structured, professional answers."
        />
      </Helmet>

      {hasThread && (
        <header className="border-b border-border px-4 py-3 flex items-center justify-end shrink-0 md:pl-4 pl-14">
          <button
            onClick={handleResetContext}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            New search
          </button>
        </header>
      )}

      <main className="flex-1 flex flex-col overflow-hidden">
        {!hasThread ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
            {/* Logo */}
            <img
              src={agrismesLogo}
              alt="AgriSMES"
              className="h-14 md:h-16 mb-6 object-contain"
            />

            {/* Heading */}
            <h1 className="text-2xl md:text-[36px] font-semibold text-foreground mb-1.5 text-center tracking-tight leading-tight">
              Your Guide to Agribusiness
            </h1>
            <p className="text-muted-foreground text-[16px] mb-8 text-center">
              Ask Anything
            </p>

            {/* Search Input */}
            <div className="w-full max-w-[780px]">
              <SearchInput
                onSubmit={handleQuery}
                isLoading={isLoading}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                tradeMode={tradeMode}
                onToggleTradeMode={() => setTradeMode((p) => !p)}
                {...inputToolProps}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-4 py-6">
                {messages.map((msg) => (
                  <div key={msg.id} className="mb-6">
                    {msg.role === "user" ? (
                      <p className="text-foreground text-lg font-medium mb-4">{msg.content}</p>
                    ) : (
                      <AskAnswer
                        content={msg.content}
                        onFollowUp={handleQuery}
                        resolvedModel={msg.resolvedModel}
                        provider={msg.provider}
                        structured={msg.structured}
                        isStreaming={msg.isStreaming}
                      />
                    )}
                  </div>
                ))}
                {isLoading && !messages.some(m => m.isStreaming && m.content) && <AskThinkingIndicator />}
              </div>
              <div ref={threadEndRef} />
            </div>

            <div className="border-t border-border bg-background px-4 py-3 shrink-0">
              <div className="max-w-3xl mx-auto">
                <SearchInput
                  onSubmit={handleQuery}
                  isLoading={isLoading}
                  compact
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  tradeMode={tradeMode}
                  onToggleTradeMode={() => setTradeMode((p) => !p)}
                  {...inputToolProps}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
