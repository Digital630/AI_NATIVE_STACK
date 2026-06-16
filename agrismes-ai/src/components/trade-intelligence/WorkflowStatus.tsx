import { Activity } from "lucide-react";

const WORKFLOW_LABELS: Record<string, string> = {
  pricing: "Pricing analysis",
  buyer_sourcing: "Buyer sourcing",
  seller_readiness: "Seller readiness",
  logistics_planning: "Logistics planning",
  certification_compliance: "Certification & compliance",
  export_documentation: "Export documentation",
  trade_route_comparison: "Trade route comparison",
  market_entry: "Market entry",
  general: "Trade intelligence",
};

export function WorkflowStatus({ type }: { type: string }) {
  const label = WORKFLOW_LABELS[type] || "Trade intelligence";

  return (
    <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-[#F7F7F8] border border-[#E5E7EB]">
      <Activity className="w-3.5 h-3.5 text-[#2563EB]" />
      <span className="text-xs font-medium text-[#6B7280]">Active workflow:</span>
      <span className="text-xs font-semibold text-[#111111]">{label}</span>
    </div>
  );
}
