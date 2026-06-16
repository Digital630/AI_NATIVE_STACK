import { Building2, CheckCircle2 } from "lucide-react";

const benefits = [
  "Pre-assessed SME pipelines",
  "Market-linked trade structures",
  "Predictable trade cycles",
  "Reduced onboarding and monitoring burden",
  "No on-lending or credit intermediation risk",
];

const ForBanksSection = () => {
  return (
    <section id="for-banks" className="section-institutional">
      <div className="container-institutional">
        <div className="max-w-4xl">
          {/* Section Context - WHO / WHAT / NEXT */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">For Financial Institutions</p>
          </div>

          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <h2 className="section-title mb-0">For Banks & Financial Partners</h2>
          </div>
          
          <p className="body-text mb-4">
            This section explains how AgriSMES complements bank trade finance operations by improving the quality of SME pipelines 
            without introducing credit intermediation risk.
          </p>

          <p className="body-text mb-8">
            AgriSMES is designed to complement financial institutions by improving SME documentation quality, 
            clarifying trade use-of-funds, and reducing monitoring complexity.
          </p>

          <div className="card-institutional">
            <h3 className="text-lg font-semibold text-foreground mb-6">Banks benefit from:</h3>
            <ul className="space-y-4">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="body-text">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Next Step Guidance */}
          <div className="mt-8 p-6 bg-accent/30 border border-border rounded-lg">
            <p className="text-sm font-medium text-foreground mb-2">What happens next?</p>
            <p className="body-text">
              Banks interested in exploring structured SME pipelines can reach out through the contact section below. 
              AgriSMES representatives will provide detailed information on assessment criteria and pipeline characteristics.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForBanksSection;
