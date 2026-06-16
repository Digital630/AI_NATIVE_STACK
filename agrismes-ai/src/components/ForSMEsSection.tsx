import { CheckCircle2 } from "lucide-react";

const benefits = [
  "A clear path to bank readiness",
  "Structured, transparent trade processes",
  "Reduced operational and market risk",
  "Access to verified global demand after financing approval",
  "Exposure to AI-supported agribusiness optimization",
];

const ForSMEsSection = () => {
  return (
    <section id="for-smes" className="section-institutional section-accent">
      <div className="container-institutional">
        <div className="max-w-4xl">
          {/* Section Context - WHO / WHAT / NEXT */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">For Agribusiness Operators</p>
          </div>

          <h2 className="section-title">For SMEs, Agents & Suppliers</h2>
          
          <p className="body-text mb-4">
            This section is for productive agricultural operators who need structured systems to access financing and global markets. 
            Whether you are an SME owner, buying agent, or commodity supplier, the information below outlines what AgriSMES provides.
          </p>

          <p className="body-text mb-8">
            AgriSMES works with productive but under-banked SMEs that require structured systems 
            to access financing and global markets.
          </p>

          <div className="card-institutional bg-background">
            <h3 className="text-lg font-semibold text-foreground mb-6">SMEs gain:</h3>
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
          <div className="mt-8 p-6 bg-background border border-border rounded-lg">
            <p className="text-sm font-medium text-foreground mb-2">What happens next?</p>
            <p className="body-text">
              SMEs ready to explore trade readiness can submit an inquiry through the chat widget or contact form. 
              To help us respond effectively, mention your commodity type, approximate volumes, and current documentation status.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForSMEsSection;
