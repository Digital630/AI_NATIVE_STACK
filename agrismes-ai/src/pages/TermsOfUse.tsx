import { useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const TermsOfUse = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-white">
        <div className="container-institutional py-12 md:py-16">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-dark mb-8">Terms of Use</h1>
          
          <div className="prose prose-lg max-w-none text-foreground space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-primary-dark mb-4">Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                AgriSMES is a trade readiness and SME structuring platform. Our purpose is to help 
                small and medium enterprises prepare for formal engagement with financial institutions 
                and access to global markets. By using this website, you agree to the following terms.
              </p>
            </section>

            {/* NEW: Scope of Service */}
            <section className="bg-muted/30 rounded-lg p-6 border border-border">
              <h2 className="text-xl font-semibold text-primary-dark mb-4">Scope of Service</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                AgriSMES provides informational guidance, coordination support, and decision-readiness 
                assistance for small and medium enterprises (SMEs) involved in agribusiness and commodity trade.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">AgriSMES:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Does not act as a buyer, seller, broker, agent, guarantor, or lender</li>
                <li>Does not take custody of user funds</li>
                <li>Does not guarantee funding, buyers, suppliers, or transaction outcomes</li>
                <li>Does not execute trades on behalf of users unless explicitly agreed in writing</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                All commercial, financial, and operational decisions remain the responsibility of the user.
              </p>
            </section>

            {/* NEW: Human Oversight & AI Use */}
            <section>
              <h2 className="text-xl font-semibold text-primary-dark mb-4">Human Oversight & AI Assistance</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                FundMySME uses artificial intelligence tools to support information delivery, clarity, and structured guidance.
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>AI outputs are informational only</li>
                <li>AI does not make final commercial or financial decisions</li>
                <li>High-risk, financial, or complex matters are supported by human review and interaction</li>
                <li>Users are never required to rely solely on AI outputs</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                FundMySME maintains a human-in-the-loop approach for responsible use.
              </p>
            </section>

            {/* NEW: Intended Users */}
            <section>
              <h2 className="text-xl font-semibold text-primary-dark mb-4">Intended Users</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">FundMySME is designed for:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                <li>SMEs, importers, exporters, producers, processors, and intermediaries</li>
                <li>Users seeking structured, compliant participation in agribusiness and commodity trade</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mb-4">FundMySME is not intended for:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Illegal or sanctioned trade</li>
                <li>Speculative schemes</li>
                <li>Misrepresentation or fraud</li>
                <li>Bypassing regulatory, banking, or compliance requirements</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Misuse may result in restricted access.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary-dark mb-4">Use of the Website</h2>
              <p className="text-muted-foreground leading-relaxed">
                Users may browse the website, submit information through available forms, and contact 
                our team for informational purposes. The website is intended to provide general 
                information about our trade readiness framework and services.
              </p>
            </section>

            {/* NEW: How to Use the Platform Safely */}
            <section className="bg-primary/5 border border-primary/20 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-primary-dark mb-4">How to Use the Platform Safely</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Verify all counterparties independently before transacting</li>
                <li>Do not share sensitive financial information through unsecured channels</li>
                <li>Use the AI chat for guidance, not as a substitute for professional advice</li>
                <li>Review the <Link to="/risk-management" className="text-primary hover:underline">Risk Management</Link> page for due diligence practices</li>
                <li>Contact FundMySME directly for high-value or complex decisions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary-dark mb-4">No Guarantee of Services or Outcomes</h2>
              <p className="text-muted-foreground leading-relaxed">
                Submitting information through this website does not guarantee funding, approval, 
                or engagement with FundMySME or any financial institution. All financing decisions 
                are made independently by licensed financial institutions. FundMySME does not provide 
                loans, guarantees, or credit approvals.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary-dark mb-4">Accuracy of Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                Users are responsible for providing accurate and truthful information when submitting 
                forms or communicating with FundMySME. Inaccurate or misleading information may affect 
                the assessment process.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary-dark mb-4">Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                All content, branding, logos, and materials on this website belong to FundMySME unless 
                otherwise stated. Users may not reproduce, distribute, or use any content without 
                prior written permission.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary-dark mb-4">Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                FundMySME is not liable for any decisions made based on information provided on this 
                website. The information presented is for general informational purposes and should 
                not be relied upon as professional advice.
              </p>
            </section>

            {/* NEW: Updates & Changes */}
            <section>
              <h2 className="text-xl font-semibold text-primary-dark mb-4">Updates & Changes</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                FundMySME may update:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Platform features</li>
                <li>AI behavior</li>
                <li>Policies and procedures</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Updates are made to improve safety, clarity, and effectiveness. Continued use of the 
                platform indicates acceptance of updated terms.
              </p>
            </section>

            {/* NEW: Governing Law */}
            <section>
              <h2 className="text-xl font-semibold text-primary-dark mb-4">Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms are governed by the applicable laws of the jurisdiction under which 
                FundMySME operates. Disputes, where applicable, shall be interpreted under this 
                governing law framework.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary-dark mb-4">Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions regarding these Terms of Use, please contact us at:
              </p>
              <p className="text-muted-foreground mt-2">
                <strong>Email:</strong>{" "}
                <a href="mailto:lentachai@gmail.com" className="text-primary hover:underline">
                  lentachai@gmail.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfUse;
