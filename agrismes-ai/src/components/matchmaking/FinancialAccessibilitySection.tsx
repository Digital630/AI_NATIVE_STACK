import { Wallet, FileX, CheckCircle, HelpCircle } from "lucide-react";

const noRequirements = [
  "No audited financial statements",
  "No formal credit history",
  "No collateral or land titles",
  "No bank account history",
  "No minimum transaction history"
];

const whatYouCanProvide = [
  "Basic contact and business information",
  "References from local leaders, cooperatives, or past buyers",
  "Product samples when available",
  "Photos of your farm, warehouse, or products",
  "Simple records of past sales (handwritten is fine)"
];

export function FinancialAccessibilitySection() {
  return (
    <section className="bg-card border border-border rounded-xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Wallet className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Financial Accessibility</h2>
          <p className="text-sm text-muted-foreground mt-1">
            You don't need formal financial records to participate.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* What's NOT Required */}
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileX className="w-4 h-4 text-destructive" />
            <h3 className="text-sm font-medium text-foreground">Not Required to Start</h3>
          </div>
          <ul className="space-y-2">
            {noRequirements.map((item) => (
              <li key={item} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-destructive/60">✕</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* What You CAN Provide */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">What You Can Provide</h3>
          </div>
          <ul className="space-y-2">
            {whatYouCanProvide.map((item) => (
              <li key={item} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Financing Partners Note */}
      <div className="bg-muted/30 rounded-lg p-4 border border-border">
        <div className="flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">About Financing</p>
            <p className="text-xs text-muted-foreground mt-1">
              AgriSMES may work with financing partners to help participants access working capital 
              once trade readiness is established. Financing decisions are made by licensed financial 
              institutions — not AgriSMES. Creating a profile here does not guarantee financing.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
