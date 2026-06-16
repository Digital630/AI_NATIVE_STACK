import { useState, useRef, useEffect, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SearchInput } from "@/components/trade-intelligence/SearchInput";
import { SeedPrompts } from "@/components/trade-intelligence/SeedPrompts";
import { AskAnswer } from "@/components/ask-agrismes/AskAnswer";
import { AskThinkingIndicator } from "@/components/ask-agrismes/AskThinkingIndicator";

interface AskMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  resolvedModel?: string;
  provider?: string;
  structured?: any;
}

const ASK_SEEDS = [
  "Can you help me find cocoa suppliers?",
  "Evaluate coffee export from Ethiopia to Germany at $3.8/kg",
  "Is sesame from Sudan to UAE safe at $1,400/MT FOB?",
  "What documents do I need to export cashews to the EU?",
  "Compare avocado pricing: Kenya vs Tanzania",
  "What are the logistics for shipping spices from India to Canada?",
];

export default function AskAgrismes() {
  const [messages, setMessages] = useState<AskMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingStep, setThinkingStep] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-5.3");
  const [tradeMode, setTradeMode] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const hasThread = messages.length > 0;

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinkingStep]);

  const handleQuery = useCallback(
    async (query: string) => {
      if (!query.trim() || isLoading) return;

      const userMsg: AskMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: query.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      // Simulate thinking steps
      setThinkingStep("Analyzing trade question…");
      const t1 = setTimeout(() => setThinkingStep("Checking agribusiness context…"), 1200);
      const t2 = setTimeout(() => setThinkingStep("Generating answer…"), 2400);

      try {
        const history = messages.map((m) => ({ role: m.role, content: m.content }));

        const { data, error } = await supabase.functions.invoke("ask-agrismes", {
          body: { query: query.trim(), mode: "ask_agrismes", history, model: selectedModel, tradeMode },
        });

        clearTimeout(t1);
        clearTimeout(t2);

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || "Failed to get response");

        const assistantMsg: AskMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.answer,
          timestamp: new Date(),
          resolvedModel: data.resolved_model,
          provider: data.provider,
          structured: data.structured,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: any) {
        clearTimeout(t1);
        clearTimeout(t2);
        console.error("Ask AGRISMES error:", err);
        toast.error("Unable to generate a response right now. Please try again.");
        const errorMsg: AskMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Unable to generate a response right now. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
        setThinkingStep("");
      }
    },
    [messages, isLoading, selectedModel, tradeMode]
  );

  const handleReset = useCallback(() => {
    setMessages([]);
  }, []);

  const inputToolProps = {
    mode: { deepResearch: false, focusMode: false },
    onToggleDeepResearch: () => {},
    onToggleFocusMode: () => {},
    onResetContext: handleReset,
  };

  return (
    <>
      <Helmet>
        <title>Ask AGRISMES — AI Agribusiness Assistant</title>
        <meta
          name="description"
          content="Ask any agribusiness question and get professional, structured trade intelligence answers."
        />
      </Helmet>

      <header className="border-b border-border px-4 py-3 flex items-center justify-between shrink-0 md:pl-4 pl-14">
        <span className="text-muted-foreground text-sm font-normal">
          {hasThread ? "Ask AGRISMES" : "Ask AGRISMES"}
        </span>
        {hasThread && (
          <button
            onClick={handleReset}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            New question
          </button>
        )}
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        {!hasThread ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4 pb-24">
            <h1 className="text-3xl md:text-[40px] font-semibold text-foreground mb-2 text-center tracking-tight leading-tight">
              Ask AGRISMES anything
            </h1>
            <p className="text-muted-foreground text-[15px] mb-10 text-center max-w-md leading-relaxed">
              Get professional trade intelligence on sourcing, pricing, logistics, compliance, and market conditions.
            </p>
            <div className="w-full max-w-[780px] mb-10">
              <SearchInput onSubmit={handleQuery} isLoading={isLoading} selectedModel={selectedModel} onModelChange={setSelectedModel} tradeMode={tradeMode} onToggleTradeMode={() => setTradeMode(p => !p)} {...inputToolProps} />
            </div>
            <SeedPrompts onSelect={handleQuery} />
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
                      <AskAnswer content={msg.content} onFollowUp={handleQuery} resolvedModel={msg.resolvedModel} provider={msg.provider} structured={msg.structured} />
                    )}
                  </div>
                ))}
                {isLoading && <AskThinkingIndicator />}
              </div>
              <div ref={threadEndRef} />
            </div>
            <div className="border-t border-border bg-background px-4 py-3 shrink-0">
              <div className="max-w-3xl mx-auto">
                <SearchInput onSubmit={handleQuery} isLoading={isLoading} compact selectedModel={selectedModel} onModelChange={setSelectedModel} tradeMode={tradeMode} onToggleTradeMode={() => setTradeMode(p => !p)} {...inputToolProps} />
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
