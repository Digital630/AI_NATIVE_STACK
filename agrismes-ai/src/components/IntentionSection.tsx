import { Target } from "lucide-react";

const IntentionSection = () => {
  return (
    <section id="intention" className="section-institutional section-accent">
      <div className="container-institutional">
        {/* Section Context - WHO / WHAT / NEXT */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">Understanding AgriSMES</p>
        </div>

        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Target className="h-6 w-6 text-primary-foreground" />
          </div>
          <h2 className="section-title mb-0">Our Intention</h2>
        </div>

        <div className="max-w-4xl space-y-6">
          <p className="body-text">
            This section clarifies what AgriSMES does and does not do. Understanding this distinction 
            is important for SMEs, banks, and partners engaging with the platform.
          </p>

          <p className="body-text">
            AgriSMES exists to address a structural gap in the SME ecosystem.
          </p>
          
          <p className="body-text">
            Many productive SMEs generate valuable agricultural output but remain financially invisible 
            due to limited documentation, lack of trade structure, and restricted access to formal banking systems.
          </p>

          <div className="bg-background border-l-4 border-primary p-6 rounded-r-lg">
            <p className="text-foreground font-medium mb-3">
              AgriSMES does not provide loans and does not influence credit decisions.
            </p>
            <p className="body-text">
              Instead, the platform prepares SMEs to become bank-ready, reduces operational and trade risk, 
              and enables access to verified global markets after financing approval through structured, 
              transparent processes.
            </p>
          </div>

          <p className="body-text">
            <a href="/the-gap" className="text-primary hover:underline">
              Learn more about the gap AgriSMES addresses
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default IntentionSection;
