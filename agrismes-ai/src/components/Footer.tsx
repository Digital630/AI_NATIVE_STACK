import { MessageCircle, Download } from "lucide-react";
import { Link } from "react-router-dom";
import agrismesLogo from "@/assets/agrismes-logo-v3.png";
import { DownloadAppModal } from "./DownloadAppModal";

const Footer = () => {
  return (
    <footer className="bg-primary-dark text-primary-foreground">
      {/* Disclaimer Section */}
      <div className="border-b border-primary/30">
        <div className="container-institutional py-8">
          <h3 className="text-lg font-semibold mb-4">Disclaimer</h3>
          <p className="text-primary-foreground/80 text-sm leading-relaxed max-w-4xl">
            AgriSMES is not a financial institution and does not provide loans, guarantees, or credit approvals. 
            All financing decisions are made independently by licensed financial institutions. 
            AgriSMES operates as an AI-powered trade readiness, market intelligence, and decision support platform.
          </p>
        </div>
      </div>

      {/* Footer Content */}
      <div className="container-institutional py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide">Company</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><a href="#" className="hover:text-primary-foreground transition-colors min-h-[44px] inline-block py-1">About AgriSMES</a></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide">Services</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><Link to="/services/matchmaking" className="hover:text-primary-foreground transition-colors min-h-[44px] inline-block py-1">Matchmaking</Link></li>
              <li><Link to="/risk-management" className="hover:text-primary-foreground transition-colors min-h-[44px] inline-block py-1">Risk Management</Link></li>
              <li><Link to="/services/market-reports" className="hover:text-primary-foreground transition-colors min-h-[44px] inline-block py-1">Market Reports</Link></li>
              <li><Link to="/the-gap" className="hover:text-primary-foreground transition-colors min-h-[44px] inline-block py-1">The Gap We Address</Link></li>
            </ul>
          </div>

          {/* Countries */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide">Countries</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li>Tanzania</li>
              <li>Uganda</li>
              <li>Benin</li>
              <li>Ivory Coast</li>
              <li>Ethiopia</li>
            </ul>
          </div>

          {/* Career */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide">Career</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><Link to="/careers" className="hover:text-primary-foreground transition-colors min-h-[44px] inline-block py-1">Careers</Link></li>
            </ul>
          </div>

          {/* Media & Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide">Media & Legal</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><Link to="/awards" className="hover:text-primary-foreground transition-colors min-h-[44px] inline-block py-1">Awards & Recognition</Link></li>
              <li><Link to="/gallery" className="hover:text-primary-foreground transition-colors min-h-[44px] inline-block py-1">Gallery</Link></li>
              <li><Link to="/terms-of-use" className="hover:text-primary-foreground transition-colors min-h-[44px] inline-block py-1">Terms of Use</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-primary-foreground transition-colors min-h-[44px] inline-block py-1">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide">Support</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><Link to="/download-center" className="hover:text-primary-foreground transition-colors min-h-[44px] inline-block py-1">Download Center</Link></li>
              <li><Link to="/faqs" className="hover:text-primary-foreground transition-colors min-h-[44px] inline-block py-1">FAQs</Link></li>
              <li><Link to="/sme-climate" className="hover:text-primary-foreground transition-colors min-h-[44px] inline-block py-1">SMEs & Climate Resilience</Link></li>
              <li><Link to="/unlock-services" className="hover:text-primary-foreground transition-colors min-h-[44px] inline-block py-1">Exclusive Services</Link></li>
              <li><Link to="/redeem-points" className="hover:text-primary-foreground transition-colors min-h-[44px] inline-block py-1">RewardFlow Points</Link></li>
              <li>
                <DownloadAppModal 
                  trigger={
                    <button className="hover:text-primary-foreground transition-colors min-h-[44px] inline-flex items-center gap-1 py-1 font-medium text-sm text-primary-foreground/80">
                      <Download className="h-3 w-3" />
                      Download App
                    </button>
                  }
                />
              </li>
            </ul>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-10 pt-8 border-t border-primary/30">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Logo - institutional presence at footer */}
            <div className="mb-6 md:mb-0">
              <img 
                src={agrismesLogo} 
                alt="AgriSMES - AI Agribusiness Decision Platform" 
                className="footer-logo brightness-0 invert mb-6"
                loading="lazy"
              />
              <p className="text-primary-foreground/70 text-sm">
                AI-Powered Market Intelligence & Trade Readiness Platform
              </p>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide">Contact AgriSMES</h4>
              <div className="space-y-3 text-sm text-primary-foreground/80">
                <p className="mb-3">Chat with Alex, for immediate guidance on trade readiness, commodities, and services.</p>
                <button
                  onClick={() => {
                    // Find and click the chat widget button
                    const chatButton = document.querySelector('[aria-label="Open chat"]') as HTMLButtonElement;
                    if (chatButton) {
                      chatButton.click();
                    }
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                  aria-label="Open live chat with Alex"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Open Live Chat →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="border-t border-primary/30 mt-8 pt-6">
          <div className="text-center mb-6">
            <p className="text-sm text-primary-foreground/80 mb-4">
              See how AgriSMES helps you in the agribusiness value chain.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                to="/services/matchmaking" 
                className="inline-flex items-center px-5 py-3 min-h-[44px] bg-white/10 text-primary-foreground rounded-md hover:bg-white/20 transition-colors text-sm font-medium"
              >
                Explore Matchmaking
              </Link>
              <Link 
                to="/risk-management" 
                className="inline-flex items-center px-5 py-3 min-h-[44px] bg-white/10 text-primary-foreground rounded-md hover:bg-white/20 transition-colors text-sm font-medium"
              >
                Risk Management
              </Link>
              <DownloadAppModal 
                trigger={
                  <button className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] bg-white/10 text-primary-foreground rounded-md hover:bg-white/20 transition-colors text-sm font-medium">
                    <Download className="h-4 w-4" />
                    Download App
                  </button>
                }
              />
            </div>
          </div>
        </div>

        {/* Institutional Statement */}
        <div className="border-t border-primary/30 mt-6 pt-6">
          <p className="text-xs text-primary-foreground/50 text-center mb-4">
            AgriSMES facilitates structured introductions, assessments, and trade readiness. It does not provide financing, guarantees, or legal advice.
          </p>
          <p className="text-xs text-primary-foreground/40 text-center mb-4">
            AgriSMES operates under an international governance framework. Platform governance and data handling align with applicable regulations depending on jurisdiction of registration and operation.
          </p>
          <p className="text-xs text-primary-foreground/40 text-center mb-4">
            An AgriSMES trade analyst reviews all listings and inquiries. Human oversight is maintained throughout.
          </p>
          <p className="text-sm text-primary-foreground/60 text-center">
            © {new Date().getFullYear()} AgriSMES. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
