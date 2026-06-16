import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { TradeAnswer } from "@/types/trade";

interface StructuredAnswerProps {
  answer: TradeAnswer;
  isDeepResearch?: boolean;
}

function ExpandableSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground uppercase tracking-wide font-medium hover:bg-secondary/30 transition-colors"
      >
        {title}
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function StructuredAnswer({ answer, isDeepResearch }: StructuredAnswerProps) {
  return (
    <div className="space-y-4">
      {/* Risks — decision-relevant, always visible */}
      {answer.risks?.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Risks</p>
          <ul className="text-sm text-foreground space-y-0.5">
            {answer.risks.slice(0, 3).map((risk, i) => (
              <li key={i}>· {risk}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Steps — actionable, always visible */}
      {answer.next_actions?.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Next Steps</p>
          <ul className="text-sm text-foreground space-y-0.5">
            {answer.next_actions.slice(0, 3).map((action, i) => (
              <li key={i}>· {action}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Required documents — compact */}
      {answer.required_documents?.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Documents</p>
          <ul className="text-sm text-foreground space-y-0.5">
            {answer.required_documents.map((doc, i) => (
              <li key={i}>· {doc}</li>
            ))}
          </ul>
        </div>
      )}

      {/* --- Expandable detail sections below --- */}

      {/* Key Details table — expandable */}
      {answer.structured_breakdown?.length > 0 && (() => {
        const hasInsight = answer.structured_breakdown.some(row => row.insight);
        return (
          <ExpandableSection title="Detailed Market Context" defaultOpen={false}>
            <div className="border border-border rounded overflow-hidden">
              <table className="w-full text-sm">
                {hasInsight && (
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-2 text-left text-xs text-muted-foreground font-medium w-[28%]">Parameter</th>
                      <th className="px-4 py-2 text-left text-xs text-muted-foreground font-medium w-[32%]">Value</th>
                      <th className="px-4 py-2 text-left text-xs text-muted-foreground font-medium">Insight</th>
                    </tr>
                  </thead>
                )}
                <tbody>
                  {answer.structured_breakdown.map((row, i) => (
                    <tr key={i} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-2.5 text-muted-foreground border-r border-border">
                        {row.label}
                      </td>
                      <td className={`px-4 py-2.5 text-foreground ${hasInsight ? "border-r border-border" : ""}`}>
                        {row.value}
                      </td>
                      {hasInsight && (
                        <td className="px-4 py-2.5 text-muted-foreground text-[13px]">
                          {row.insight || ""}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ExpandableSection>
        );
      })()}

      {/* Price Intelligence — expandable */}
      {answer.price_intelligence && answer.price_intelligence.price_ranges?.length > 0 && (
        <ExpandableSection title="Price Intelligence">
          <div className="border border-border rounded overflow-hidden mb-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-xs text-muted-foreground font-medium">Grade</th>
                  <th className="px-3 py-2 text-left text-xs text-muted-foreground font-medium">FOB Range</th>
                  <th className="px-3 py-2 text-left text-xs text-muted-foreground font-medium">CIF Range</th>
                </tr>
              </thead>
              <tbody>
                {answer.price_intelligence.price_ranges.map((p, i) => (
                  <tr key={i} className="border-b border-border last:border-b-0">
                    <td className="px-3 py-2 text-foreground font-medium">{p.grade}</td>
                    <td className="px-3 py-2 text-foreground">{p.fob_range}</td>
                    <td className="px-3 py-2 text-foreground">{p.cif_range}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {answer.price_intelligence.variability_explanation && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {answer.price_intelligence.variability_explanation}
            </p>
          )}
        </ExpandableSection>
      )}

      {/* Cost Structure — expandable */}
      {answer.cost_structure?.length > 0 && (
        <ExpandableSection title="Cost Structure">
          <div className="border border-border rounded overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {answer.cost_structure.map((item, i) => (
                  <tr key={i} className="border-b border-border last:border-b-0">
                    <td className="px-3 py-2 text-muted-foreground w-2/5">{item.item}</td>
                    <td className="px-3 py-2 text-foreground">{item.estimate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ExpandableSection>
      )}

      {/* Logistics — expandable */}
      {answer.logistics_insight && (
        <ExpandableSection title="Logistics">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
            {answer.logistics_insight}
          </p>
        </ExpandableSection>
      )}

      {/* Compliance — expandable */}
      {answer.compliance_detail && (
        <ExpandableSection title="Compliance">
          {answer.compliance_detail.certificates_required?.length > 0 && (
            <div className="mb-2">
              <p className="text-xs text-muted-foreground mb-1">Certificates</p>
              <ul className="text-sm text-foreground space-y-0.5">
                {answer.compliance_detail.certificates_required.map((c: string, i: number) => (
                  <li key={i}>· {c}</li>
                ))}
              </ul>
            </div>
          )}
          {answer.compliance_detail.destination_requirements?.length > 0 && (
            <div className="mb-2">
              <p className="text-xs text-muted-foreground mb-1">Destination Requirements</p>
              <ul className="text-sm text-foreground space-y-0.5">
                {answer.compliance_detail.destination_requirements.map((r: string, i: number) => (
                  <li key={i}>· {r}</li>
                ))}
              </ul>
            </div>
          )}
          {answer.compliance_detail.risk_flags?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Considerations</p>
              <ul className="text-sm text-foreground space-y-0.5">
                {answer.compliance_detail.risk_flags.map((f: string, i: number) => (
                  <li key={i}>· {f}</li>
                ))}
              </ul>
            </div>
          )}
        </ExpandableSection>
      )}

      {/* Market Context — expandable */}
      {answer.market_context && (
        <ExpandableSection title="Market Context">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {answer.market_context.supply_trends && (
              <div>
                <p className="text-muted-foreground text-xs">Supply</p>
                <p className="text-foreground">{answer.market_context.supply_trends}</p>
              </div>
            )}
            {answer.market_context.demand_conditions && (
              <div>
                <p className="text-muted-foreground text-xs">Demand</p>
                <p className="text-foreground">{answer.market_context.demand_conditions}</p>
              </div>
            )}
            {answer.market_context.trade_flow && (
              <div>
                <p className="text-muted-foreground text-xs">Trade Flow</p>
                <p className="text-foreground">{answer.market_context.trade_flow}</p>
              </div>
            )}
            {answer.market_context.seasonal_factors && (
              <div>
                <p className="text-muted-foreground text-xs">Seasonal</p>
                <p className="text-foreground">{answer.market_context.seasonal_factors}</p>
              </div>
            )}
          </div>
        </ExpandableSection>
      )}
    </div>
  );
}
