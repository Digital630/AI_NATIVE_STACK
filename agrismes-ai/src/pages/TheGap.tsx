import { useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const TheGap = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <article className="prose prose-lg max-w-none">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              The Gap AgriSMES Addresses
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Understanding the structural gap between SMEs and institutions.
            </p>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                The Core Challenge
              </h2>
              <p className="text-muted-foreground mb-4">
                Small and medium-sized enterprises (SMEs) play a central role in economic activity. 
                However, a structural gap often exists between SMEs and formal market and financial systems.
              </p>
              <p className="text-muted-foreground mb-4">
                This gap is primarily a gap of <strong className="text-foreground">structure, readiness, and market alignment</strong>.
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                <li>Unstructured trade leads to high fraud and payment risk</li>
                <li>Lack of documentation readiness prevents institutional engagement</li>
                <li>Poor coordination between SMEs, buyers, and finance creates inefficiency</li>
              </ul>
            </section>

            <hr className="border-border my-8" />

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Market Access: The Primary Constraint
              </h2>
              <p className="text-muted-foreground mb-4">
                In practice, a significant portion of SME challenges originate from limited or unclear market access.
              </p>
              <p className="text-muted-foreground mb-4">
                Market uncertainty often represents <strong className="text-foreground">up to 80% of the underlying SME constraint</strong>.
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                <li>SMEs have production capacity but lack consistent, verifiable market connections</li>
                <li>Without confirmed market pathways, SMEs struggle to demonstrate viability</li>
                <li>Financing discussions are delayed or end prematurely</li>
              </ul>
            </section>

            <hr className="border-border my-8" />

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                How AgriSMES Fills the Gap
              </h2>
              <p className="text-muted-foreground mb-4">
                AgriSMES operates as a <strong className="text-foreground">decision readiness + structured support</strong> framework.
              </p>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                <li>Structuring SMEs for institutional review</li>
                <li>Aligning SMEs with verified buyers and credible market demand</li>
                <li>Supporting realistic trade pathways</li>
                <li>Reducing fraud and payment risk through structured processes</li>
              </ul>
            </section>

            <hr className="border-border my-8" />

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                What AgriSMES Does Not Do
              </h2>
              <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                <li>Guarantee funding</li>
                <li>Approve loans</li>
                <li>Replace institutional due diligence</li>
                <li>Bypass compliance or risk processes</li>
              </ul>
              <p className="text-muted-foreground">
                These boundaries are intentional and necessary.
              </p>
            </section>

            <hr className="border-border my-8" />

            {/* Platform Positioning Statement */}
            <section className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-12">
              <p className="text-muted-foreground leading-relaxed">
                AgriSMES integrates agribusiness, commodity trade, and artificial intelligence to help SMEs 
                operate in a safer, more structured, and more efficient way, supporting both new entrants 
                and existing businesses.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Related Topics
              </h2>
              <div className="flex flex-wrap gap-4">
                <Link to="/services/matchmaking" className="text-primary hover:underline">
                  Explore Listings
                </Link>
                <Link to="/risk-management" className="text-primary hover:underline">
                  Risk Management
                </Link>
                <Link to="/insights/platform-intelligence/export-readiness" className="text-primary hover:underline">
                  Export Readiness
                </Link>
                <Link to="/sme-climate" className="text-primary hover:underline">
                  SMEs, Climate Resilience & Market Stability
                </Link>
                <Link to="/download" className="text-primary hover:underline">
                  Download App
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

export default TheGap;