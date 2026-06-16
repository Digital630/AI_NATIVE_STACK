import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-white">
        <div className="container-institutional py-12 md:py-16">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-dark mb-8">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none text-foreground space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-primary-dark mb-4">Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                AgriSMES respects your privacy. This policy explains how we collect, use, and 
                protect the information you provide when using our website and services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary-dark mb-4">Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We may collect the following information when you interact with our website:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Name</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>Business information</li>
                <li>Any information submitted through forms on this website</li>
                <li>Chat inputs and conversation history</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary-dark mb-4">How Information Is Used</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The information we collect is used for the following purposes:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>To review submissions and assess trade readiness</li>
                <li>To contact users if clarification is required</li>
                <li>For internal assessment purposes only</li>
                <li>To improve our services and platform effectiveness</li>
                <li>For analytics and service improvements</li>
              </ul>
            </section>

            {/* NEW: Data Use & Ownership */}
            <section className="bg-muted/30 rounded-lg p-6 border border-border">
              <h2 className="text-xl font-semibold text-primary-dark mb-4">Data Use & Ownership</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Users retain ownership of their submitted information.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                AgriSMES collects only data necessary to provide services and improve platform effectiveness.
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                <li>Personal data is not sold or shared without consent</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Aggregated and anonymized insights may be used to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-4">
                <li>Improve services</li>
                <li>Understand SME readiness patterns</li>
                <li>Prepare non-identifying institutional reports</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                AgriSMES distinguishes between personal data (protected) and aggregated intelligence (non-identifying).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary-dark mb-4">Data Storage & Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                Information submitted to AgriSMES is stored securely. Access to user data is 
                restricted to authorized personnel who require it for assessment and operational purposes.
              </p>
            </section>

            {/* NEW: Platform Security */}
            <section>
              <h2 className="text-xl font-semibold text-primary-dark mb-4">Platform Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                AgriSMES may use infrastructure providers such as Cloudflare for security, traffic 
                management, and performance protection (e.g., DDoS mitigation). Cloudflare does not 
                provide access to user content beyond standard security operations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary-dark mb-4">Information Sharing</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                AgriSMES is committed to protecting your information:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Your data is not sold to third parties</li>
                <li>Your data is not shared publicly</li>
                <li>Information may be shared internally for assessment purposes only</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary-dark mb-4">Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                This website may use cookies for basic site functionality. Cookies help us 
                understand how users interact with our website and improve your browsing experience.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary-dark mb-4">Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                User data is retained only as long as necessary for the purposes described in this policy. 
                Data may be retained for compliance, legal, or operational purposes as required.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary-dark mb-4">User Rights</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Users may request:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Access to their personal information</li>
                <li>Correction of any inaccurate data</li>
                <li>Deletion of their data (subject to legal/operational requirements)</li>
                <li>Export of their data in a standard format</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                To exercise these rights, please contact us using the information provided below.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-primary-dark mb-4">Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions or concerns regarding this Privacy Policy or your personal information, 
                please contact us at:
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

export default PrivacyPolicy;
