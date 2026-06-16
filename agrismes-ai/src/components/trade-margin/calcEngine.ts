export interface CostItem {
  id: string;
  label: string;
  amount: number;
}

export interface MarginInputs {
  commodity: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  unit: string;
  currency: string;
  costs: CostItem[];
}

export interface MarginResults {
  totalRevenue: number;
  totalBuyCost: number;
  totalAdditionalCosts: number;
  totalCost: number;
  grossProfit: number;
  netProfit: number;
  grossMarginPct: number;
  netMarginPct: number;
  markupPct: number;
  roi: number;
  breakEvenSellPrice: number;
  costRevenueRatio: number;
  health: "strong" | "moderate" | "weak" | "loss";
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMODITY INTELLIGENCE LAYER
// Confidence = how deeply AgriSMES is calibrated for this commodity.
// HIGH   = Live TCB/market data + realized trade outcomes in system
// MEDIUM = Agri-commodity, regional benchmarks available, no live data feed
// LOW    = Outside agri scope — math runs, benchmarks are universal estimates only
// ─────────────────────────────────────────────────────────────────────────────

export type CommodityTier = "CASHEW" | "AGRI_CALIBRATED" | "AGRI_ESTIMATED" | "NON_AGRI";
export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export interface CommodityIntelligence {
  tier: CommodityTier;
  confidence: ConfidenceLevel;
  confidenceScore: number;        // 0-100
  canonicalName: string;          // normalised commodity name AgriSMES uses
  isAgri: boolean;
  redirected: boolean;            // true if user submitted non-agri and was redirected
  originalInput: string;          // what user typed
  benchmarkNetMarginMin: number;  // % — known range for this commodity
  benchmarkNetMarginMax: number;
  calibrationNote: string;        // shown to user
}

// Primary calibration map — cashew is depth-1, others are depth-2/3
const COMMODITY_MAP: Record<string, {
  canonical: string;
  tier: CommodityTier;
  confidence: ConfidenceLevel;
  score: number;
  marginMin: number;
  marginMax: number;
}> = {
  // ── CASHEW — Full TCB calibration ────────────────────────────────
  "cashew":          { canonical: "Cashew Nuts (RCN/Kernel)", tier: "CASHEW",           confidence: "HIGH",   score: 97, marginMin: 8,  marginMax: 22 },
  "cashew nuts":     { canonical: "Cashew Nuts (RCN/Kernel)", tier: "CASHEW",           confidence: "HIGH",   score: 97, marginMin: 8,  marginMax: 22 },
  "rcn":             { canonical: "Cashew Nuts (RCN/Kernel)", tier: "CASHEW",           confidence: "HIGH",   score: 97, marginMin: 8,  marginMax: 22 },
  "w180":            { canonical: "Cashew Kernels W180",      tier: "CASHEW",           confidence: "HIGH",   score: 97, marginMin: 10, marginMax: 25 },
  "w240":            { canonical: "Cashew Kernels W240",      tier: "CASHEW",           confidence: "HIGH",   score: 97, marginMin: 9,  marginMax: 22 },
  "w320":            { canonical: "Cashew Kernels W320",      tier: "CASHEW",           confidence: "HIGH",   score: 97, marginMin: 8,  marginMax: 20 },
  "cashew kernel":   { canonical: "Cashew Kernels",           tier: "CASHEW",           confidence: "HIGH",   score: 97, marginMin: 8,  marginMax: 22 },

  // ── AGRI CALIBRATED — Regional benchmarks active ─────────────────
  "cocoa":           { canonical: "Cocoa Beans",              tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 72, marginMin: 5,  marginMax: 18 },
  "cocoa beans":     { canonical: "Cocoa Beans",              tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 72, marginMin: 5,  marginMax: 18 },
  "coffee":          { canonical: "Coffee",                   tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 68, marginMin: 6,  marginMax: 20 },
  "coffee arabica":  { canonical: "Coffee (Arabica)",         tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 68, marginMin: 8,  marginMax: 22 },
  "coffee robusta":  { canonical: "Coffee (Robusta)",         tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 65, marginMin: 5,  marginMax: 16 },
  "sesame":          { canonical: "Sesame Seeds",             tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 65, marginMin: 6,  marginMax: 18 },
  "sesame seeds":    { canonical: "Sesame Seeds",             tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 65, marginMin: 6,  marginMax: 18 },
  "shea":            { canonical: "Shea Butter/Nuts",         tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 62, marginMin: 5,  marginMax: 16 },
  "shea butter":     { canonical: "Shea Butter",              tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 62, marginMin: 6,  marginMax: 18 },
  "groundnut":       { canonical: "Groundnuts",               tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 60, marginMin: 4,  marginMax: 14 },
  "peanut":          { canonical: "Groundnuts",               tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 60, marginMin: 4,  marginMax: 14 },
  "soybean":         { canonical: "Soybeans",                 tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 58, marginMin: 4,  marginMax: 12 },
  "cotton":          { canonical: "Cotton",                   tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 58, marginMin: 4,  marginMax: 14 },
  "palm oil":        { canonical: "Palm Oil",                 tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 60, marginMin: 5,  marginMax: 15 },
  "palm kernel":     { canonical: "Palm Kernel",              tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 58, marginMin: 5,  marginMax: 15 },
  "rice":            { canonical: "Rice",                     tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 55, marginMin: 3,  marginMax: 12 },
  "maize":           { canonical: "Maize (Corn)",             tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 55, marginMin: 3,  marginMax: 11 },
  "corn":            { canonical: "Maize (Corn)",             tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 55, marginMin: 3,  marginMax: 11 },
  "vanilla":         { canonical: "Vanilla",                  tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 62, marginMin: 10, marginMax: 30 },
  "ginger":          { canonical: "Ginger",                   tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 60, marginMin: 8,  marginMax: 22 },
  "rubber":          { canonical: "Natural Rubber",           tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 58, marginMin: 5,  marginMax: 16 },
  "timber":          { canonical: "Timber",                   tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 55, marginMin: 6,  marginMax: 20 },
  "dried fish":      { canonical: "Dried Fish",               tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 55, marginMin: 8,  marginMax: 25 },
  "fish":            { canonical: "Fish",                     tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 52, marginMin: 5,  marginMax: 20 },
  "prawns":          { canonical: "Prawns/Shrimp",            tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 55, marginMin: 8,  marginMax: 24 },
  "shrimp":          { canonical: "Prawns/Shrimp",            tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 55, marginMin: 8,  marginMax: 24 },
  "millet":          { canonical: "Millet",                   tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 50, marginMin: 3,  marginMax: 10 },
  "sorghum":         { canonical: "Sorghum",                  tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 50, marginMin: 3,  marginMax: 10 },
  "cassava":         { canonical: "Cassava",                  tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 48, marginMin: 4,  marginMax: 12 },
  "yam":             { canonical: "Yam",                      tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 48, marginMin: 5,  marginMax: 14 },
  "moringa":         { canonical: "Moringa",                  tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 52, marginMin: 8,  marginMax: 25 },
  "charcoal":        { canonical: "Charcoal",                 tier: "AGRI_CALIBRATED",  confidence: "MEDIUM", score: 50, marginMin: 6,  marginMax: 18 },

  // ── AGRI ESTIMATED — In scope but thin calibration ────────────────
  "macadamia":       { canonical: "Macadamia Nuts",           tier: "AGRI_ESTIMATED",   confidence: "MEDIUM", score: 45, marginMin: 10, marginMax: 28 },
  "avocado":         { canonical: "Avocado",                  tier: "AGRI_ESTIMATED",   confidence: "MEDIUM", score: 44, marginMin: 6,  marginMax: 20 },
  "mango":           { canonical: "Mango",                    tier: "AGRI_ESTIMATED",   confidence: "MEDIUM", score: 42, marginMin: 5,  marginMax: 18 },
  "pineapple":       { canonical: "Pineapple",                tier: "AGRI_ESTIMATED",   confidence: "MEDIUM", score: 42, marginMin: 4,  marginMax: 15 },
  "hibiscus":        { canonical: "Hibiscus (Zobo)",          tier: "AGRI_ESTIMATED",   confidence: "MEDIUM", score: 44, marginMin: 8,  marginMax: 22 },
  "tiger nuts":      { canonical: "Tiger Nuts",               tier: "AGRI_ESTIMATED",   confidence: "MEDIUM", score: 44, marginMin: 6,  marginMax: 18 },
  "baobab":          { canonical: "Baobab",                   tier: "AGRI_ESTIMATED",   confidence: "MEDIUM", score: 42, marginMin: 8,  marginMax: 24 },
  "turmeric":        { canonical: "Turmeric",                 tier: "AGRI_ESTIMATED",   confidence: "MEDIUM", score: 44, marginMin: 8,  marginMax: 22 },
  "chili":           { canonical: "Chili Pepper",             tier: "AGRI_ESTIMATED",   confidence: "MEDIUM", score: 44, marginMin: 7,  marginMax: 20 },
  "pepper":          { canonical: "Pepper",                   tier: "AGRI_ESTIMATED",   confidence: "MEDIUM", score: 44, marginMin: 6,  marginMax: 18 },
  "leather":         { canonical: "Leather / Hides",          tier: "AGRI_ESTIMATED",   confidence: "MEDIUM", score: 42, marginMin: 5,  marginMax: 16 },
  "cattle hide":     { canonical: "Cattle Hide",              tier: "AGRI_ESTIMATED",   confidence: "MEDIUM", score: 42, marginMin: 5,  marginMax: 15 },
  "beef":            { canonical: "Beef (Live / Processed)",  tier: "AGRI_ESTIMATED",   confidence: "MEDIUM", score: 40, marginMin: 4,  marginMax: 14 },
  "goat":            { canonical: "Goat (Live)",              tier: "AGRI_ESTIMATED",   confidence: "MEDIUM", score: 40, marginMin: 4,  marginMax: 14 },
};

// Non-agri keyword detection — these trigger hard redirect
const NON_AGRI_KEYWORDS = [
  "pharma","pharmaceutical","medicine","drug","tablet","capsule","injection","vaccine",
  "copper","steel","iron","aluminium","aluminum","gold","silver","platinum","zinc","nickel",
  "crude","petroleum","oil barrel","lng","lpg","diesel","petrol","fuel",
  "cement","sand","gravel","aggregate","construction",
  "electronics","semiconductor","chip","circuit","battery","solar panel",
  "textile","fabric","polyester","nylon","synthetic",
  "chemical","solvent","acid","fertilizer","urea","pesticide",
  "plastic","polymer","resin","rubber synthetic",
  "car","vehicle","machinery","equipment","spare parts",
  "software","saas","subscription","license","token","crypto","bitcoin",
];

// Closest agri redirect for non-agri submissions (what we run instead)
const NON_AGRI_REDIRECT_TARGET = "Cashew Nuts (RCN/Kernel)";

export function detectCommodity(input: string): CommodityIntelligence {
  const raw = (input || "").trim();
  const lower = raw.toLowerCase();

  // Check non-agri first — hard redirect
  const isNonAgri = NON_AGRI_KEYWORDS.some(kw => lower.includes(kw));
  if (isNonAgri) {
    return {
      tier: "NON_AGRI",
      confidence: "HIGH",              // HIGH because we're running cashew — our core
      confidenceScore: 97,
      canonicalName: NON_AGRI_REDIRECT_TARGET,
      isAgri: false,
      redirected: true,
      originalInput: raw,
      benchmarkNetMarginMin: 8,
      benchmarkNetMarginMax: 22,
      calibrationNote: `⚠️ NON-AGRI COMMODITY DETECTED — "${raw}" is outside AgriSMES calibration scope. ` +
        `AgriSMES is an agricultural trade verification system. Your inputs have been run against ` +
        `cashew trade benchmarks — AgriSMES primary calibration. For accurate non-agri verification, ` +
        `submit an agricultural commodity.`,
    };
  }

  // Check known commodities
  for (const [key, data] of Object.entries(COMMODITY_MAP)) {
    if (lower.includes(key) || lower === key) {
      const note = data.tier === "CASHEW"
        ? `✅ FULL CALIBRATION ACTIVE — AgriSMES is calibrated against live TCB auction data, ` +
          `realized export outcomes, and Tanzania/Ivory Coast procurement intelligence for this commodity. ` +
          `Benchmark range: ${data.marginMin}–${data.marginMax}% net margin.`
        : data.tier === "AGRI_CALIBRATED"
        ? `📊 CALIBRATED — Regional agri-trade benchmarks active for ${data.canonical}. ` +
          `No live data feed yet. Calibration depth increases as trade outcomes are submitted. ` +
          `Benchmark range: ${data.marginMin}–${data.marginMax}% net margin.`
        : `📐 ESTIMATED — ${data.canonical} is within AgriSMES agri scope but calibration is early-stage. ` +
          `Universal agri-trade logic applies. Submit realized outcomes to improve accuracy. ` +
          `Benchmark range: ${data.marginMin}–${data.marginMax}% net margin.`;

      return {
        tier: data.tier,
        confidence: data.confidence,
        confidenceScore: data.score,
        canonicalName: data.canonical,
        isAgri: true,
        redirected: false,
        originalInput: raw,
        benchmarkNetMarginMin: data.marginMin,
        benchmarkNetMarginMax: data.marginMax,
        calibrationNote: note,
      };
    }
  }

  // Unknown agri — assume agri, run with MEDIUM confidence
  return {
    tier: "AGRI_ESTIMATED",
    confidence: "MEDIUM",
    confidenceScore: 38,
    canonicalName: raw || "Unspecified Commodity",
    isAgri: true,
    redirected: false,
    originalInput: raw,
    benchmarkNetMarginMin: 5,
    benchmarkNetMarginMax: 20,
    calibrationNote: `📐 UNKNOWN COMMODITY — "${raw}" is not yet in AgriSMES calibration. ` +
      `Running universal agri-trade margin logic. Benchmark range is a general estimate (5–20% net). ` +
      `Submit realized trade outcomes to feed system calibration for this commodity.`,
  };
}

export function calculate(inputs: MarginInputs): MarginResults | null {
  const { buyPrice, sellPrice, quantity, costs } = inputs;

  if (!quantity || quantity <= 0 || buyPrice <= 0 || sellPrice <= 0) return null;

  const totalRevenue = sellPrice * quantity;
  const totalBuyCost = buyPrice * quantity;
  const totalAdditionalCosts = costs.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalCost = totalBuyCost + totalAdditionalCosts;

  const grossProfit = totalRevenue - totalBuyCost;
  const netProfit = totalRevenue - totalCost;

  const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const netMarginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const markupPct = totalBuyCost > 0 ? (grossProfit / totalBuyCost) * 100 : 0;
  const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
  const breakEvenSellPrice = quantity > 0 ? totalCost / quantity : 0;
  const costRevenueRatio = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0;

  let health: MarginResults["health"] = "strong";
  if (netMarginPct < 0) health = "loss";
  else if (netMarginPct < 5) health = "weak";
  else if (netMarginPct < 15) health = "moderate";
  else health = "strong";

  return {
    totalRevenue, totalBuyCost, totalAdditionalCosts, totalCost,
    grossProfit, netProfit, grossMarginPct, netMarginPct,
    markupPct, roi, breakEvenSellPrice, costRevenueRatio, health,
  };
}

export const HEALTH_CONFIG = {
  strong:   { label: "Strong Margin",   color: "text-emerald-600", bg: "bg-emerald-500", border: "border-emerald-200" },
  moderate: { label: "Moderate Margin", color: "text-amber-600",   bg: "bg-amber-500",   border: "border-amber-200" },
  weak:     { label: "Thin Margin",     color: "text-orange-600",  bg: "bg-orange-500",  border: "border-orange-200" },
  loss:     { label: "Loss Position",   color: "text-red-600",     bg: "bg-red-500",     border: "border-red-200" },
};

export const AGRI_COMMODITIES = [
  "Cashew Nuts (RCN)", "Cashew Kernels W180", "Cashew Kernels W240", "Cashew Kernels W320",
  "Cocoa Beans", "Coffee (Arabica)", "Coffee (Robusta)", "Sesame Seeds", "Shea Butter", "Shea Nuts",
  "Groundnuts", "Soybeans", "Maize (Corn)", "Rice", "Millet", "Sorghum",
  "Cotton", "Palm Oil", "Palm Kernel", "Natural Rubber", "Timber",
  "Vanilla", "Ginger", "Turmeric", "Chili Pepper", "Moringa", "Baobab", "Hibiscus (Zobo)",
  "Tiger Nuts", "Macadamia Nuts", "Avocado", "Mango", "Pineapple",
  "Cassava", "Yam", "Plantain", "Charcoal",
  "Dried Fish", "Frozen Fish", "Prawns/Shrimp",
  "Beef (Live)", "Goat (Live)", "Cattle Hide", "Leather",
  "Other Agri-Commodity",
];

export const CURRENCIES = [
  { code: "USD", symbol: "$",   label: "US Dollar" },
  { code: "EUR", symbol: "€",   label: "Euro" },
  { code: "GBP", symbol: "£",   label: "British Pound" },
  { code: "GHS", symbol: "₵",   label: "Ghanaian Cedi" },
  { code: "NGN", symbol: "₦",   label: "Nigerian Naira" },
  { code: "KES", symbol: "KSh", label: "Kenyan Shilling" },
  { code: "ZAR", symbol: "R",   label: "South African Rand" },
  { code: "TZS", symbol: "TSh", label: "Tanzanian Shilling" },
  { code: "UGX", symbol: "USh", label: "Ugandan Shilling" },
  { code: "XOF", symbol: "CFA", label: "West African CFA" },
  { code: "ETB", symbol: "Br",  label: "Ethiopian Birr" },
  { code: "RWF", symbol: "RF",  label: "Rwandan Franc" },
];

export const UNITS = ["kg", "MT (Metric Ton)", "bag (50kg)", "bag (100kg)", "crate", "litre", "barrel", "piece", "dozen"];

export const COST_PRESETS = [
  "Transport / Freight", "Storage / Warehousing", "Import Duty / Tariff",
  "Export Levy", "Port Handling", "Commission / Agency Fee",
  "Packaging", "Processing / Milling", "Insurance",
  "Inspection / Certification", "TCB Levy (4%)", "Other",
];

export function fmt(value: number, symbol: string, decimals = 2): string {
  return `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

export function fmtPct(value: number, decimals = 1): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}
