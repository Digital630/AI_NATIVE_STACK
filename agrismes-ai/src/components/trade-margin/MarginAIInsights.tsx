import { useState, useCallback } from "react";
import { Sparkles, RefreshCw, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Info } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { type MarginInputs, type MarginResults, type CommodityIntelligence, CURRENCIES, fmt, detectCommodity } from "./calcEngine";

interface Props {
  inputs: MarginInputs;
  results: MarginResults;
}

const STREAM_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask-agrismes`;

// ── Confidence badge config ───────────────────────────────────────────────────
const CONFIDENCE_CONFIG = {
  HIGH:   { label: "HIGH CONFIDENCE", bg: "#064E3B", text: "#6EE7B7", border: "#065F46", icon: "✅" },
  MEDIUM: { label: "CALIBRATED",      bg: "#1C1917", text: "#FCD34D", border: "#78350F", icon: "📊" },
  LOW:    { label: "ESTIMATED",       bg: "#1C1917", text: "#FCA5A5", border: "#7F1D1D", icon: "📐" },
};

function buildPrompt(inputs: MarginInputs, results: MarginResults, intel: CommodityIntelligence): string {
  const sym = CURRENCIES.find((c) => c.code === inputs.currency)?.symbol ?? "$";
  const stressDown10 = ((((inputs.sellPrice * 0.9) * inputs.quantity) - results.totalCost) / (inputs.sellPrice * 0.9 * inputs.quantity) * 100);
  const stressUp15   = (((results.totalRevenue) - (results.totalCost * 1.15)) / results.totalRevenue * 100);
  const stressBoth   = ((((inputs.sellPrice * 0.9) * inputs.quantity) - (results.totalCost * 1.15)) / (inputs.sellPrice * 0.9 * inputs.quantity) * 100);

  return `You are AgriSMES Verification Intelligence — a hard-edged institutional trade margin system.
You operate like a Bloomberg terminal. No softness. No encouragement. State facts, flag risks, give a verdict.
You are calibrated for agricultural commodity trade. Cashew is your primary depth. Other agri-commodities use regional benchmarks.

COMMODITY DETECTION RESULT:
- Original Input   : "${intel.originalInput}"
- Canonical Name   : ${intel.canonicalName}
- Calibration Tier : ${intel.tier}
- Confidence Level : ${intel.confidence} (Score: ${intel.confidenceScore}/100)
- Redirected       : ${intel.redirected ? `YES — user submitted "${intel.originalInput}" (non-agri). Analysis redirected to agri benchmarks.` : "NO"}
- Benchmark Range  : ${intel.benchmarkNetMarginMin}–${intel.benchmarkNetMarginMax}% net margin

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRADE PARAMETERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Commodity   : ${intel.canonicalName}
Quantity    : ${inputs.quantity} ${inputs.unit}
Currency    : ${inputs.currency}
Buy Price   : ${fmt(inputs.buyPrice, sym)} / ${inputs.unit}
Sell Price  : ${fmt(inputs.sellPrice, sym)} / ${inputs.unit}
Spread      : ${fmt(inputs.sellPrice - inputs.buyPrice, sym)} / ${inputs.unit}
Costs Loaded: ${fmt(results.totalAdditionalCosts, sym)}
${inputs.costs.map(c => `              • ${c.label || "Other"}: ${fmt(c.amount, sym)}`).join("\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFIED ECONOMICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Revenue      : ${fmt(results.totalRevenue, sym)}
Total Cost         : ${fmt(results.totalCost, sym)}
Net Profit         : ${fmt(results.netProfit, sym)}
Gross Margin       : ${results.grossMarginPct.toFixed(2)}%
Net Margin         : ${results.netMarginPct.toFixed(2)}%
Markup             : ${results.markupPct.toFixed(2)}%
ROI                : ${results.roi.toFixed(2)}%
Break-Even Price   : ${fmt(results.breakEvenSellPrice, sym)} / ${inputs.unit}
Cost/Revenue Ratio : ${results.costRevenueRatio.toFixed(2)}%
Margin Signal      : ${results.health.toUpperCase()}
Benchmark Range    : ${intel.benchmarkNetMarginMin}–${intel.benchmarkNetMarginMax}% net (${intel.canonicalName})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRE-COMPUTED STRESS TESTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Scenario A: -10% sell price     → Net Margin: ${stressDown10.toFixed(2)}%${stressDown10 < 0 ? " ⚠️ LOSS" : ""}
Scenario B: +15% cost increase  → Net Margin: ${stressUp15.toFixed(2)}%${stressUp15 < 0 ? " ⚠️ LOSS" : ""}
Scenario C: Both simultaneously → Net Margin: ${stressBoth.toFixed(2)}%${stressBoth < 0 ? " ⚠️ LOSS" : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${intel.redirected ? `⚠️ REDIRECT NOTICE: The user submitted "${intel.originalInput}" — a non-agricultural commodity outside AgriSMES calibration scope. Analysis has been run against agri-trade benchmarks. State this clearly and directly at the top of your output. Tell the user AgriSMES is an agricultural trade verification system and they should submit an agri-commodity for verified output.` : ""}

Deliver output in this exact structure. Be blunt. Be institutional. Use numbers. No filler.

## ▸ VERIFICATION VERDICT
One line. Format: **[PROCEED / PROCEED WITH CONDITIONS / RENEGOTIATE / REJECT]** — state exactly why in one sentence. Numbers only.

## ▸ BENCHMARK POSITION
Is this deal above, within, or below the ${intel.benchmarkNetMarginMin}–${intel.benchmarkNetMarginMax}% benchmark for ${intel.canonicalName}? By how many percentage points? What does that mean operationally?

## ▸ RISK FLAGS
List real risks from these specific numbers only. No generic statements.
Rate each: 🔴 Critical | 🟡 Elevated | 🟢 Managed

## ▸ STRESS TEST INTERPRETATION
Interpret the 3 pre-computed scenarios above. Which scenario breaks the deal? What is the operational implication?

## ▸ IMPROVEMENT LEVERS
2–3 specific, numbered actions to improve net margin. Use actual numbers from the trade. No vague advice.

## ▸ CALIBRATION STATUS
State the confidence level (${intel.confidence}) and what it means for this output. ${intel.tier === "CASHEW" ? "State that this is backed by live TCB auction data and realized cashew export outcomes." : intel.tier === "AGRI_CALIBRATED" ? "State that calibration is regional benchmark-based and will improve as trade outcomes are submitted." : "State that calibration is estimated and the user can improve system accuracy by submitting realized trade outcomes."}

Use markdown. Hard facts only. This is a verification terminal.`;
}

// ── Confidence Badge Component ────────────────────────────────────────────────
function ConfidenceBadge({ intel }: { intel: CommodityIntelligence }) {
  const cfg = CONFIDENCE_CONFIG[intel.confidence];
  return (
    <div style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 8, padding: "10px 14px", marginBottom: 12,
      fontFamily: "monospace"
    }}>
      {intel.redirected && (
        <div style={{
          background: "#7F1D1D", border: "1px solid #B91C1C",
          borderRadius: 6, padding: "8px 12px", marginBottom: 10,
          fontSize: 12, color: "#FCA5A5", fontWeight: 700,
        }}>
          ⛔ NON-AGRI DETECTED — "{intel.originalInput}" redirected to agri benchmarks.
          AgriSMES is an agricultural trade verification system.
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: cfg.text, fontWeight: 800, letterSpacing: 2 }}>
          {cfg.icon} {cfg.label}
        </span>
        <span style={{
          fontSize: 10, color: "#6B7280", background: "#111827",
          padding: "2px 8px", borderRadius: 99, fontWeight: 700
        }}>
          {intel.confidenceScore}/100
        </span>
        <div style={{ flex: 1, height: 4, background: "#1F2937", borderRadius: 99 }}>
          <div style={{
            width: `${intel.confidenceScore}%`, height: "100%",
            background: intel.confidence === "HIGH" ? "#10B981" : intel.confidence === "MEDIUM" ? "#F59E0B" : "#EF4444",
            borderRadius: 99, transition: "width 0.6s ease"
          }} />
        </div>
      </div>
      <div style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.5 }}>
        {intel.calibrationNote}
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: "#6B7280" }}>
        Commodity: <span style={{ color: "#E5E7EB", fontWeight: 700 }}>{intel.canonicalName}</span>
        &nbsp;·&nbsp;Benchmark: <span style={{ color: "#E5E7EB" }}>
          {intel.benchmarkNetMarginMin}–{intel.benchmarkNetMarginMax}% net margin
        </span>
      </div>
    </div>
  );
}

export default function MarginAIInsights({ inputs, results }: Props) {
  const [aiContent, setAiContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const hasContent = aiContent.length > 0;

  const intel = detectCommodity(inputs.commodity);

  const runAnalysis = useCallback(async () => {
    setAiContent("");
    setError("");
    setIsStreaming(true);
    setCollapsed(false);

    try {
      const resp = await fetch(STREAM_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          query: buildPrompt(inputs, results, intel),
          mode: "auto",
          stream: true,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => null);
        throw new Error(err?.error || `Request failed (${resp.status})`);
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || !line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const chunk = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (chunk) { full += chunk; setAiContent(full); }
          } catch {}
        }
      }
    } catch (e: any) {
      setError(e.message || "Verification failed. Check inputs and retry.");
    } finally {
      setIsStreaming(false);
    }
  }, [inputs, results, intel]);

  const canRun = inputs.buyPrice > 0 && inputs.sellPrice > 0 && inputs.quantity > 0;

  return (
    <div style={{ marginTop: 24, borderTop: "1px solid #E2E8F0", paddingTop: 20 }}>

      {/* ── Header row ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles className="w-4 h-4 text-primary" />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", letterSpacing: 0.3 }}>
            Verification Intelligence
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {hasContent && (
            <button
              onClick={() => setCollapsed(c => !c)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 4 }}
            >
              {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={runAnalysis}
            disabled={!canRun || isStreaming}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 7,
              background: canRun && !isStreaming ? "#1B4332" : "#F1F5F9",
              color: canRun && !isStreaming ? "#ffffff" : "#94A3B8",
              border: "none", cursor: canRun && !isStreaming ? "pointer" : "not-allowed",
              fontSize: 13, fontWeight: 700, letterSpacing: 0.3,
              transition: "all 0.15s ease",
            }}
          >
            {isStreaming
              ? <><RefreshCw className="w-3 h-3 animate-spin" /> Verifying…</>
              : hasContent
              ? <><RefreshCw className="w-3 h-3" /> Re-Verify</>
              : <><Sparkles className="w-3 h-3" /> Verify This Deal</>
            }
          </button>
        </div>
      </div>

      {/* ── Confidence badge — always visible when commodity is entered ── */}
      {inputs.commodity && <ConfidenceBadge intel={intel} />}

      {/* ── Empty state ── */}
      {!hasContent && !isStreaming && (
        <p style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic" }}>
          {canRun
            ? "Trade inputs loaded. Click Verify This Deal to run institutional verification."
            : "Complete trade inputs above to enable verification."}
        </p>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{
          background: "#FEF2F2", border: "1px solid #FCA5A5",
          borderRadius: 8, padding: "10px 14px", marginTop: 8,
          fontSize: 13, color: "#DC2626", display: "flex", gap: 8, alignItems: "flex-start"
        }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* ── AI Output ── */}
      {hasContent && !collapsed && (
        <div style={{
          background: "#F8FAFC", border: "1px solid #E2E8F0",
          borderRadius: 10, padding: "16px 18px", marginTop: 8,
          fontSize: 13.5, lineHeight: 1.7, color: "#1E293B",
        }}>
          <ReactMarkdown>{aiContent}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
