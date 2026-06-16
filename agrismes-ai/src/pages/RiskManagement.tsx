import { useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const RiskManagement = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-white">
        <div className="container-institutional py-12 md:py-16">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-dark mb-4">Risk Management</h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-3xl">
            Trade risks exist for importers, exporters, and intermediaries. This page helps you operate safely.
          </p>
          
          <div className="prose prose-lg max-w-none text-foreground space-y-10">
            {/* Section 1 */}
            <section>
              <h2 className="text-xl font-semibold text-primary-dark mb-4">1. Why Risk Management Matters</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                International agri-commodity trade includes operational, financial, quality, compliance, and fraud risks.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                AgriSMES helps users reduce risk through structured guidance and decision readiness.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                This is informational support. Outcomes depend on each transaction and partner behavior.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-semibold text-primary-dark mb-4">2. Risks Importers Commonly Face</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Supplier fraud (fake stock, fake documents, impersonation)</li>
                <li>Quality mismatch (specs not met, contamination, moisture/aflatoxin issues)</li>
                <li>Payment risk (advance payment loss, fake LC, document discrepancies)</li>
                <li>Logistics risk (delays, port congestion, container issues)</li>
                <li>Contract risk (weak terms, unclear Incoterms, no dispute path)</li>
                <li>Compliance risk (import permits, labeling, sanitary requirements)</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-semibold text-primary-dark mb-4">3. Risks Exporters Commonly Face</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Buyer fraud (fake buyers, fake bank instruments, chargeback tactics)</li>
                <li>Payment delays (TT delays, document holds, LC discrepancy penalties)</li>
                <li>Contract risk (buyer changes specs after shipment)</li>
                <li>Logistics risk (demurrage, rollovers, customs delays)</li>
                <li>Quality claims risk (lack of lab tests and pre-shipment inspection)</li>
                <li>Broker/intermediary risk (unverified agents, unauthorized representation)</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-semibold text-primary-dark mb-4">4. Risks for Brokers / Agents / Intermediaries</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Commission disputes</li>
                <li>Misrepresentation risk</li>
                <li>Confidentiality risk</li>
                <li>Compliance exposure (KYC/AML expectations)</li>
                <li>Reputation risk</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-semibold text-primary-dark mb-4">5. Practical Due Diligence Checklist</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-3">Supplier Verification</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>Company registration documents, physical address confirmation</li>
                    <li>References or trade history proof</li>
                    <li>Product photos/video with date proof</li>
                    <li>Sample testing / third-party inspection</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-foreground mb-3">Buyer Verification</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>Company profile and address validation</li>
                    <li>Purchase history signals</li>
                    <li>Bank instrument verification via official channels</li>
                    <li>Avoid "urgent" pressure tactics</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-foreground mb-3">Transaction Structure</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>Clear Incoterms (FOB/CIF etc.)</li>
                    <li>Clear specs (moisture, grade, packaging, tolerance)</li>
                    <li>Payment clarity (LC/TT, milestones)</li>
                    <li>Dispute resolution clause + jurisdiction</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-foreground mb-3">Documentation Discipline</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>Proforma invoice accuracy</li>
                    <li>Packing list, COA, phytosanitary (as applicable)</li>
                    <li>Lab tests where needed (aflatoxin/moisture/foreign matter)</li>
                    <li>Shipping documents aligned to payment terms</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xl font-semibold text-primary-dark mb-4">6. When to Contact AgriSMES</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you are about to send money, sign a contract, ship goods, or rely on a broker, structured support is recommended.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                If you would like, you can{" "}
                <a href="/#contact" className="text-primary hover:underline font-medium">
                  contact AgriSMES
                </a>{" "}
                and a representative will be with you shortly to support the next steps.
              </p>
            </section>

            {/* Section 7 - Incident Escalation */}
            <section className="bg-muted/30 rounded-lg p-6 border border-border">
              <h2 className="text-xl font-semibold text-primary-dark mb-4">7. Incident Escalation & Support</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you encounter a serious issue such as:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                <li>Suspected fraud</li>
                <li>Payment disputes</li>
                <li>Document forgery</li>
                <li>Misrepresentation</li>
                <li>Urgent shipment or compliance risk</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You should:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                <li>Pause the transaction if possible</li>
                <li>Preserve documentation and communication records</li>
                <li>Contact AgriSMES for structured guidance</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                AgriSMES can help assess the situation and advise on next procedural steps. AgriSMES does not act as a legal authority or enforcement body.
              </p>
            </section>

            {/* Safety Note */}
            <section className="bg-primary/5 border border-primary/20 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-primary-dark mb-3">Safety Note</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                AgriSMES provides structured guidance and coordination. Engagement is voluntary and does not imply approval, funding, or guaranteed outcomes.
              </p>
            </section>

            {/* Related Links */}
            <section>
              <h2 className="text-xl font-semibold text-primary-dark mb-4">Related Resources</h2>
              <div className="flex flex-wrap gap-4">
                <Link to="/insights/platform-intelligence/export-readiness" className="text-primary hover:underline">
                  Export Readiness
                </Link>
                <Link to="/insights/platform-intelligence/quality-control" className="text-primary hover:underline">
                  Quality Control
                </Link>
                <Link to="/the-gap" className="text-primary hover:underline">
                  The Gap We Address
                </Link>
                <Link to="/explore-listings" className="text-primary hover:underline">
                  Explore Listings
                </Link>
                <Link to="/download" className="text-primary hover:underline">
                  Download App
                </Link>
                <Link to="/faqs" className="text-primary hover:underline">
                  FAQs
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RiskManagement;