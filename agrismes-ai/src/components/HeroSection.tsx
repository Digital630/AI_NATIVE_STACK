import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Shield, Users } from "lucide-react";
import heroPortAI from "@/assets/hero-port-ai-container.jpg";

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center overflow-hidden">
      {/* Hero Background - Documentary Style Field Photography */}
      <div className="absolute inset-0">
        {/* Real photography background with lazy loading */}
        <img 
          src={heroPortAI}
          alt="AgriSMES field officers at shipping port with AI-powered market intelligence and container logistics"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          style={{
            animation: 'subtleZoom 30s ease-in-out infinite alternate',
          }}
        />
        
        {/* Dark overlay for text readability */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, hsl(145 65% 12% / 0.85) 0%, hsl(145 60% 15% / 0.75) 50%, hsl(145 55% 18% / 0.7) 100%)',
          }}
        />
        
        {/* Subtle vignette for depth */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, hsl(145 65% 8% / 0.5) 100%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container-institutional py-20 md:py-28 lg:py-32">
        <div className="max-w-4xl">
          {/* H1 - Primary headline for SEO */}
          <h1 
            className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 transition-all duration-1000 leading-tight ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            AgriSMES: Your Agribusiness Platform
          </h1>
          
          {/* H2 - Secondary headline */}
          <h2 
            className={`text-lg sm:text-xl md:text-2xl text-white/90 font-medium mb-6 transition-all duration-1000 delay-200 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Pre-Trade Readiness, Market Intelligence & Agricultural Scientific Analysis
          </h2>
          
          {/* Updated mission statement */}
          <p 
            className={`text-base sm:text-lg text-white/80 max-w-3xl leading-relaxed mb-8 transition-all duration-1000 delay-[400ms] ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Empowering farmers, institutions, and agri-supply chain actors to make informed, 
            data-driven decisions through AI-powered insights and market intelligence.
          </p>

          {/* Value proposition highlights - H3 level concepts */}
          <div 
            className={`grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 transition-all duration-1000 delay-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="flex items-center gap-3 text-white/80">
              <TrendingUp className="h-5 w-5 text-white/90 flex-shrink-0" aria-hidden="true" />
              <span className="text-sm sm:text-base">Real-Time Market Data</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <Shield className="h-5 w-5 text-white/90 flex-shrink-0" aria-hidden="true" />
              <span className="text-sm sm:text-base">Pre-Trade Readiness</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <Users className="h-5 w-5 text-white/90 flex-shrink-0" aria-hidden="true" />
              <span className="text-sm sm:text-base">Trusted Connections</span>
            </div>
          </div>

          {/* Mobile-friendly CTA - minimum 44x44px touch targets */}
          <div 
            className={`flex flex-col sm:flex-row gap-4 transition-all duration-1000 delay-600 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <Link 
              to="/services/matchmaking"
              className="inline-flex items-center justify-center gap-2 px-6 py-4 min-h-[44px] bg-white text-primary font-semibold rounded-lg hover:bg-white/90 transition-colors text-base sm:text-lg"
              aria-label="Explore listings to find and post agricultural products, buyers, and sellers"
            >
              Explore Listings
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>

          {/* Scroll indicator - hidden on mobile for cleaner above-fold */}
          <div 
            className={`mt-12 md:mt-16 transition-all duration-1000 delay-700 hidden sm:block ${
              isVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <div className="w-5 h-8 border-2 border-white/30 rounded-full flex items-start justify-center p-1">
                <div 
                  className="w-1 h-2 bg-white/50 rounded-full"
                  style={{ animation: 'scrollIndicator 2s ease-in-out infinite' }}
                />
              </div>
              <span>Scroll to explore</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade to white */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />

      {/* Inline keyframes for animations */}
      <style>{`
        @keyframes subtleZoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.05); }
        }
        
        @keyframes scrollIndicator {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(4px); opacity: 0.5; }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
