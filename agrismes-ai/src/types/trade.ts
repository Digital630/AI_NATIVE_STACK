export interface SessionContext {
  commodity: string | null;
  grade: string | null;
  origin: string | null;
  destination: string | null;
  incoterm: string | null;
  quantity: string | null;
  role: string | null;
  packaging: string | null;
  certification: string | null;
}

export interface Source {
  title: string;
  url: string;
  domain: string;
  type: "verified" | "estimated" | "inferred";
}

export interface FollowUp {
  text: string;
  action_label: string;
}

export interface DealEvaluation {
  decision_signal: "Proceed" | "Proceed with Caution" | "Investigate Further" | "High Risk" | "Reject";
  confidence_level: "High" | "Medium" | "Low";
  risk_level: "Low" | "Medium" | "High";
  summary: string;
  key_flags: string[];
  strengths: string[];
  missing_information: string[];
  recommended_next_checks: string[];
}

export interface TradeAnswer {
  direct_answer: string;
  structured_breakdown: { label: string; value: string; insight?: string }[];
  logistics_insight: string | null;
  trade_brief: {
    commodity: string;
    origin: string;
    destination: string;
    incoterm: string;
    quantity: string;
    key_constraints: string[];
    next_step: string;
  } | null;
  missing_inputs: string[];
  risks: string[];
  required_documents: string[];
  next_actions: string[];
  deal_evaluation?: DealEvaluation | null;
  cost_structure?: { item: string; estimate: string; confidence: string }[];
  compliance_detail?: {
    certificates_required: string[];
    destination_requirements: string[];
    risk_flags: string[];
  };
  market_context?: {
    supply_trends: string;
    demand_conditions: string;
    trade_flow: string;
    seasonal_factors: string;
  };
  price_intelligence?: {
    price_ranges: { grade: string; fob_range: string; cif_range: string }[];
    variability_explanation: string;
  };
}

export interface ThreadMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  workflow_type?: string;
  thinking_steps?: string[];
  answer?: TradeAnswer;
  sources?: Source[];
  follow_up_questions?: FollowUp[];
  confidence_note?: string | null;
  context_variables?: Partial<SessionContext>;
  is_deep_research?: boolean;
}
