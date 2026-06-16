import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Briefcase, Mail, Users, Handshake } from "lucide-react";

const Careers = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-white">
        <div className="container-institutional py-12 md:py-16">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-dark mb-4">Careers</h1>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            Join our team and contribute to enabling SME trade readiness across Africa.
          </p>
          
          {/* Opportunities Section */}
          <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl">
            <div className="bg-muted/30 rounded-lg p-6 text-center border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-primary-dark mb-2">Open Roles</h3>
              <p className="text-sm text-muted-foreground">
                No open positions currently. Check back for updates.
              </p>
            </div>

            <div className="bg-muted/30 rounded-lg p-6 text-center border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Handshake className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-primary-dark mb-2">Partnerships</h3>
              <p className="text-sm text-muted-foreground">
                Interested in partnering with AgriSMES? Contact us.
              </p>
            </div>

            <div className="bg-muted/30 rounded-lg p-6 text-center border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-primary-dark mb-2">Volunteers</h3>
              <p className="text-sm text-muted-foreground">
                Support SME development through volunteer opportunities.
              </p>
            </div>
          </div>

          {/* Working at AgriSMES */}
          <div className="mb-12 max-w-3xl">
            <h2 className="text-xl font-semibold text-primary-dark mb-4">Working at AgriSMES</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                AgriSMES is dedicated to enabling SME growth and market access across Africa. 
                We work with financial institutions, trade partners, and SMEs to create opportunities 
                for sustainable business development.
              </p>
              <p>
                Our team operates across Tanzania, Uganda, Benin, Ivory Coast, and Ethiopia, 
                working to bridge the gap between SMEs and formal financing channels.
              </p>
            </div>
          </div>

          {/* Contact for Careers */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 max-w-3xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-primary-dark mb-2">Get in Touch</h3>
                <p className="text-muted-foreground mb-3">
                  Interested in joining our team, partnering, or volunteering? Send us a message:
                </p>
                <a 
                  href="mailto:lentachai@gmail.com?subject=Career%20Inquiry" 
                  className="text-primary hover:underline font-medium"
                >
                  lentachai@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Careers;