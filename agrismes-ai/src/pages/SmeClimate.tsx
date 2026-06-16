import { useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const SmeClimate = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <article className="prose prose-lg max-w-none">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              SMEs, Climate Resilience, and Market Stability
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              How climate variability affects SME operations and market participation.
            </p>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Climate as an Operational Reality
              </h2>
              <p className="text-muted-foreground mb-4">
                Climate variability is an operational factor that directly affects SME productivity, 
                supply reliability, and market participation—particularly in agriculture and agri-related value chains.
              </p>
              <p className="text-muted-foreground mb-4">For SMEs, climate impacts are experienced through:</p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                <li>Input availability and cost</li>
                <li>Production volatility</li>
                <li>Quality consistency</li>
                <li>Delivery reliability</li>
              </ul>
            </section>

            <hr className="border-border my-8" />

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Impact on Trade Operations
              </h2>
              <p className="text-muted-foreground mb-4">
                Climate volatility creates supply consistency risk, affecting both exporters and importers:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                <li>Quality and logistics disruptions affect shipment reliability</li>
                <li>Production instability translates into market unreliability</li>
                <li>Structured operations reduce volatility exposure</li>
              </ul>
            </section>

            <hr className="border-border my-8" />

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Productivity, Resilience, and Market Outcomes
              </h2>
              <p className="text-muted-foreground mb-4">
                SMEs that adopt climate-aware production and operational practices tend to demonstrate:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                <li>More stable output</li>
                <li>Improved resource efficiency</li>
                <li>Reduced exposure to seasonal shocks</li>
                <li>Stronger supply reliability</li>
              </ul>
              <p className="text-muted-foreground">
                Reliable suppliers are easier for buyers to engage and more likely to sustain long-term trade relationships.
              </p>
            </section>

            <hr className="border-border my-8" />

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Link to Risk Management
              </h2>
              <p className="text-muted-foreground mb-4">
                Climate resilience is a component of broader trade risk management. SMEs facing climate 
                volatility should also consider:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                <li>Supply chain diversification</li>
                <li>Quality testing and documentation</li>
                <li>Logistics contingency planning</li>
                <li>Buyer communication and expectation management</li>
              </ul>
              <p className="text-muted-foreground">
                For detailed risk mitigation guidance, see our{" "}
                <Link to="/risk-management" className="text-primary hover:underline">
                  Risk Management
                </Link>{" "}
                page.
              </p>
            </section>

            <hr className="border-border my-8" />

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                A Practical Perspective
              </h2>
              <p className="text-muted-foreground mb-4">
                Climate resilience, within the AgriSMES framework, is viewed as:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                <li>A productivity factor</li>
                <li>A risk management consideration</li>
                <li>A contributor to long-term market viability</li>
              </ul>
              <p className="text-muted-foreground">
                This perspective is intentionally practical and aligned with how markets and institutions assess sustainability.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Related Topics
              </h2>
              <div className="flex flex-wrap gap-4">
                <Link to="/risk-management" className="text-primary hover:underline">
                  Risk Management
                </Link>
                <Link to="/the-gap" className="text-primary hover:underline">
                  The Gap AgriSMES Addresses
                </Link>
                <Link to="/readiness-check" className="text-primary hover:underline">
                  Trade Readiness Check
                </Link>
              </div>
            </section>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SmeClimate;
