import { Brain, FileCheck, Building2, Globe } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Brain,
    title: "AI-Based SME Assessment",
    description: "AgriSMES uses AI-enabled tools, Trade Data Analysis (TDA), and Market Intelligence Data Mining (MIDM) to assess SME readiness, risk profile, product viability, and trade capacity."
  },
  {
    number: "02",
    icon: FileCheck,
    title: "Trade & Process Structuring",
    description: "SMEs are guided to align with bank-acceptable documentation, operational SOPs, quality standards, inspection processes, and traceability requirements."
  },
  {
    number: "03",
    icon: Building2,
    title: "Bank Readiness",
    description: "AgriSMES prepares SMEs to engage financial institutions with clear trade logic, defined use-of-funds, and predictable cash-flow structures. All financing decisions remain solely with licensed financial institutions."
  },
  {
    number: "04",
    icon: Globe,
    title: "Market Access After Financing",
    description: "Once financing is approved and trade conditions are met, SMEs may access verified and demand-backed global markets through established export channels."
  }
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="section-institutional">
      <div className="container-institutional">
        {/* Section Context - WHO / WHAT / NEXT */}
        <div className="mb-8 max-w-3xl">
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">For Agribusiness SMEs</p>
          <h2 className="section-title">How It Works</h2>
          <p className="body-text">
            This section helps agribusiness SMEs understand how banks assess trade readiness before financing discussions. 
            Each step below represents what financial institutions typically expect from structured trade operations.
          </p>
        </div>
        
        <div className="grid gap-6 md:gap-8">
          {steps.map((step) => (
            <div key={step.number} className="card-institutional flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-primary rounded-lg flex items-center justify-center">
                  <step.icon className="h-7 w-7 text-primary-foreground" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-primary font-bold text-sm">STEP {step.number}</span>
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="body-text">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Next Step Guidance */}
        <div className="mt-10 p-6 bg-accent/30 border border-border rounded-lg max-w-3xl">
          <p className="text-sm font-medium text-foreground mb-2">What happens next?</p>
          <p className="body-text">
            After understanding these steps, the practical next action is to submit an inquiry through our chat or contact form. 
            A representative will review your situation and guide you on which step applies to your current trade readiness.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
