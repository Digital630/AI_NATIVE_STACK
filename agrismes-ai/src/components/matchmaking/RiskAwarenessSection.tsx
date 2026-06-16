import { AlertTriangle, Shield, FileCheck, MessageSquare, Scale, CheckCircle } from "lucide-react";

export function RiskAwarenessSection() {
  return (
    <section className="bg-card border border-border rounded-xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-destructive/10">
          <AlertTriangle className="w-5 h-5 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Risk Awareness & Protection</h2>
          <p className="text-sm text-muted-foreground mt-1">
            We work to reduce common trade risks — but we cannot eliminate them entirely.
          </p>
        </div>
      </div>

      {/* Risk Reduction Measures */}
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3 bg-accent/30 rounded-lg">
          <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Payment Risk Reduction</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              We encourage structured payment terms and verified buyer/seller profiles before introductions. 
              However, final payment arrangements remain between trading parties.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-accent/30 rounded-lg">
          <FileCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Quality Expectations</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Quality standards (grade, moisture, packaging) are clarified before any transaction begins. 
              Both parties agree on inspection and acceptance criteria upfront.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-accent/30 rounded-lg">
          <MessageSquare className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Dispute Escalation</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              If issues arise, you can report concerns through our platform. Our team reviews disputes 
              and can mediate discussions — though final resolution remains between parties.
            </p>
          </div>
        </div>
      </div>

      {/* Illustrative Example */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Example: How We Help</p>
            <p className="text-xs text-muted-foreground mt-1">
              "A cooperative was concerned about a new buyer's reliability. AgriSMES verified the 
              buyer's references, facilitated a video introduction, and helped both parties agree 
              on payment-on-delivery for the first shipment. This reduced risk for both sides 
              while building trust for future transactions."
            </p>
            <p className="text-xs text-muted-foreground mt-2 italic">
              This is an illustrative example, not a guarantee of outcomes.
            </p>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="border-t border-border pt-4">
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Scale className="w-3 h-3 mt-0.5 shrink-0" />
          <p>
            <strong className="text-foreground">Important:</strong> AgriSMES facilitates introductions 
            and provides guidance, but is not a party to commercial contracts. We do not guarantee 
            payment, delivery, or quality outcomes. Always conduct your own due diligence.
          </p>
        </div>
      </div>
    </section>
  );
}
