import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ChevronDown, Menu, X, ArrowRight, ArrowLeft, BookOpen, UserPlus, LogIn } from "lucide-react";
import agrismesLogo from "@/assets/agrismes-logo.png";
import AIChatDiscoveryLine from "./AIChatDiscoveryLine";
import { GlossaryPanel } from "./GlossaryPanel";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "./ui/button";
import { AccountDrawer } from "./AccountDrawer";

// Explore More items with descriptions and learn links
const exploreMoreItems = [
  {
    name: "Commodities Supported",
    path: "/commodities-supported",
    description: "Coffee, cashew, cocoa, avocado & more.",
    learnLink: "/insights/platform-intelligence/trade-enablement",
  },
];

const rewardItems = [
  {
    name: "Risk Management",
    path: "/risk-management",
    description: "Learn how to manage trade and market risks.",
  },
];

// Platform Intelligence items (new section under Insights)
const platformIntelligenceItems = [
  { name: "Readiness Score", path: "/insights/platform-intelligence/readiness-score" },
  { name: "Quality Control", path: "/insights/platform-intelligence/quality-control" },
  { name: "Export Readiness", path: "/insights/platform-intelligence/export-readiness" },
  { name: "Trade Enablement", path: "/insights/platform-intelligence/trade-enablement" },
];

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commoditiesOpen, setCommoditiesOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [desktopCommoditiesOpen, setDesktopCommoditiesOpen] = useState(false);
  const [desktopInsightsOpen, setDesktopInsightsOpen] = useState(false);
  const [platformIntelOpen, setPlatformIntelOpen] = useState(false);
  const [mobilePlatformIntelOpen, setMobilePlatformIntelOpen] = useState(false);
  const commoditiesDropdownRef = useRef<HTMLDivElement>(null);
  const insightsDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  // Check if we can go back (not on homepage)
  const canGoBack = location.pathname !== "/" && location.key !== "default";

  const openChatWithTopic = (topic: string) => {
    setDesktopCommoditiesOpen(false);
    setMobileMenuOpen(false);
    sessionStorage.setItem('chatPrefillTopic', topic);
    setTimeout(() => {
      const chatButton = document.querySelector('[aria-label="Open chat"], [aria-label="Close chat"], .chat-widget-trigger') as HTMLElement;
      if (chatButton) chatButton.click();
    }, 100);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (commoditiesDropdownRef.current && !commoditiesDropdownRef.current.contains(event.target as Node)) {
        setDesktopCommoditiesOpen(false);
      }
      if (insightsDropdownRef.current && !insightsDropdownRef.current.contains(event.target as Node)) {
        setDesktopInsightsOpen(false);
        setPlatformIntelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50">
      <div className="container-institutional flex items-center h-full py-4 sm:py-5 md:py-5 lg:py-5 px-5 sm:px-6 md:px-8">
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col items-start flex-shrink-0">
            <Link to="/">
              <img src={agrismesLogo} alt="AgriSMES" className="h-9 w-auto" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 ml-auto">
            {/* Go Back Button - only show when not on homepage */}
            {canGoBack && (
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1 text-muted-foreground hover:text-primary font-medium transition-colors"
                aria-label="Go back to previous page"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}
            <Link 
              to="/" 
              className="text-foreground hover:text-primary font-medium transition-colors"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Home
            </Link>
            <a href="/#how-it-works" className="text-foreground hover:text-primary font-medium transition-colors">
              How It Works
            </a>
            
            {/* Explore More Dropdown - Enhanced with descriptions */}
            <div className="relative" ref={commoditiesDropdownRef}>
              <button
                onClick={() => {
                  setDesktopCommoditiesOpen(!desktopCommoditiesOpen);
                  setDesktopInsightsOpen(false);
                }}
                className="text-foreground hover:text-primary font-medium transition-colors flex items-center gap-1"
              >
                Explore More
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${desktopCommoditiesOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {desktopCommoditiesOpen && (
                <div className="absolute top-full left-0 mt-2 w-[380px] p-3 bg-background border border-border rounded-md shadow-lg z-50">
                  {exploreMoreItems.map((item) => (
                    <div key={item.path} className={`px-4 py-3 hover:bg-muted rounded-md transition-colors ${item.highlight ? 'bg-primary/5' : ''}`}>
                      <Link
                        to={item.path}
                        className="block text-sm text-foreground font-medium hover:text-primary"
                        onClick={() => setDesktopCommoditiesOpen(false)}
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      <Link
                        to={item.learnLink}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-1"
                        onClick={() => setDesktopCommoditiesOpen(false)}
                      >
                        Learn how this works <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  ))}
                  
                  <div className="border-t border-border my-2" />
                  
                  {rewardItems.map((item) => (
                    <div key={item.path} className="px-4 py-2.5 hover:bg-muted rounded-md transition-colors">
                      <Link
                        to={item.path}
                        className="block text-sm text-foreground hover:text-primary"
                        onClick={() => setDesktopCommoditiesOpen(false)}
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Insights Dropdown - Enhanced with Platform Intelligence */}
            <div className="relative" ref={insightsDropdownRef}>
              <button
                onClick={() => {
                  setDesktopInsightsOpen(!desktopInsightsOpen);
                  setDesktopCommoditiesOpen(false);
                }}
                className="text-foreground hover:text-primary font-medium transition-colors flex items-center gap-1"
              >
                Insights
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${desktopInsightsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {desktopInsightsOpen && (
                <div className="absolute top-full left-0 mt-2 w-[340px] p-3 bg-background border border-border rounded-md shadow-lg">
                  <Link
                    to="/who-for"
                    className="block px-4 py-2.5 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
                    onClick={() => setDesktopInsightsOpen(false)}
                  >
                    Who AgriSMES Is For
                  </Link>
                  <Link
                    to="/commodities/climate-resilience"
                    className="block px-4 py-2.5 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
                    onClick={() => setDesktopInsightsOpen(false)}
                  >
                    SMEs, Climate Resilience & Market Stability
                  </Link>
                  <Link
                    to="/the-gap"
                    className="block px-4 py-2.5 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
                    onClick={() => setDesktopInsightsOpen(false)}
                  >
                    The Gap AgriSMES Addresses
                  </Link>
                  
                  <div className="border-t border-border my-2" />
                  
                  {/* Platform Intelligence Section */}
                  <div className="px-4 py-2">
                    <button
                      onClick={() => setPlatformIntelOpen(!platformIntelOpen)}
                      className="flex items-center justify-between w-full text-sm font-medium text-foreground hover:text-primary"
                    >
                      Platform Intelligence
                      <ChevronDown className={`h-4 w-4 transition-transform ${platformIntelOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {platformIntelOpen && (
                      <div className="mt-2 pl-2 border-l-2 border-primary/20">
                        {platformIntelligenceItems.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className="block py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => {
                              setDesktopInsightsOpen(false);
                              setPlatformIntelOpen(false);
                            }}
                          >
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <GlossaryPanel 
              trigger={
                <button className="flex items-center gap-1 text-foreground hover:text-primary font-medium transition-colors">
                  <BookOpen className="h-4 w-4" />
                  Glossary
                </button>
              }
            />
            <AIChatDiscoveryLine />
            
            {/* Account Drawer or Auth Buttons */}
            {isAuthenticated ? (
              <AccountDrawer />
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/sign-in">
                  <Button variant="ghost" size="sm" className="min-h-[40px]">
                    <LogIn className="mr-1 h-4 w-4" />
                    Sign In
                  </Button>
                </Link>
                <Link to="/create-account">
                  <Button size="sm" className="min-h-[40px]">
                    <UserPlus className="mr-1 h-4 w-4" />
                    Create Account
                  </Button>
                </Link>
              </div>
            )}
            
            <a href="/#contact" className="btn-institutional text-sm">
              Contact Us
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg max-h-[80vh] overflow-y-auto">
          <nav className="container-institutional px-6 py-4 flex flex-col gap-4">
            {/* Mobile Go Back Button */}
            {canGoBack && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate(-1);
                }}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary font-medium py-2"
                aria-label="Go back to previous page"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </button>
            )}
            <Link
              to="/"
              className="text-foreground hover:text-primary font-medium py-2"
              onClick={() => {
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Home
            </Link>
            <a
              href="/#how-it-works"
              className="text-foreground hover:text-primary font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </a>
            
            {/* Mobile Explore More Submenu */}
            <div>
              <button
                className="flex items-center justify-between w-full text-foreground hover:text-primary font-medium py-2"
                onClick={() => {
                  setCommoditiesOpen(!commoditiesOpen);
                  setInsightsOpen(false);
                }}
              >
                Explore More
                <ChevronDown className={`h-4 w-4 transition-transform ${commoditiesOpen ? 'rotate-180' : ''}`} />
              </button>
              {commoditiesOpen && (
                <div className="pl-4 mt-2 flex flex-col gap-1 border-l border-border">
                  {exploreMoreItems.map((item) => (
                    <div key={item.path} className="py-2">
                      <Link
                        to={item.path}
                        className={`block text-sm ${item.highlight ? 'text-primary font-medium' : 'text-muted-foreground'} hover:text-primary`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">{item.description}</p>
                    </div>
                  ))}
                  <div className="border-t border-border my-1" />
                  {rewardItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="text-muted-foreground hover:text-primary py-2 text-sm"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Insights Submenu */}
            <div>
              <button
                className="flex items-center justify-between w-full text-foreground hover:text-primary font-medium py-2"
                onClick={() => {
                  setInsightsOpen(!insightsOpen);
                  setCommoditiesOpen(false);
                }}
              >
                Insights
                <ChevronDown className={`h-4 w-4 transition-transform ${insightsOpen ? 'rotate-180' : ''}`} />
              </button>
              {insightsOpen && (
                <div className="pl-4 mt-2 flex flex-col gap-2 border-l border-border">
                  <Link
                    to="/who-for"
                    className="text-muted-foreground hover:text-primary py-2 text-sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Who AgriSMES Is For
                  </Link>
                  <Link
                    to="/commodities/climate-resilience"
                    className="text-muted-foreground hover:text-primary py-2 text-sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    SMEs, Climate Resilience & Market Stability
                  </Link>
                  <Link
                    to="/the-gap"
                    className="text-muted-foreground hover:text-primary py-2 text-sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    The Gap AgriSMES Addresses
                  </Link>
                  
                  {/* Mobile Platform Intelligence */}
                  <div className="pt-2 border-t border-border">
                    <button
                      className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-primary py-1"
                      onClick={() => setMobilePlatformIntelOpen(!mobilePlatformIntelOpen)}
                    >
                      Platform Intelligence
                      <ChevronDown className={`h-3 w-3 transition-transform ${mobilePlatformIntelOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {mobilePlatformIntelOpen && (
                      <div className="pl-3 mt-1 border-l border-primary/20">
                        {platformIntelligenceItems.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className="block text-sm text-muted-foreground/80 hover:text-primary py-1.5"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <GlossaryPanel 
              trigger={
                <button className="flex items-center gap-2 text-foreground hover:text-primary font-medium py-2">
                  <BookOpen className="h-4 w-4" />
                  Glossary
                </button>
              }
            />
            <button
              className="text-primary hover:text-primary/80 font-medium py-2 text-left"
              onClick={() => {
                setMobileMenuOpen(false);
                const chatButton = document.querySelector('[aria-label="Open chat"], [aria-label="Close chat"], .chat-widget-trigger') as HTMLElement;
                if (chatButton) chatButton.click();
              }}
            >
              AgriSMES AI Live Chat
            </button>
            
            {/* Mobile Auth Section */}
            <div className="pt-4 border-t border-border space-y-2">
              {isAuthenticated ? (
                <div onClick={() => setMobileMenuOpen(false)}>
                  <AccountDrawer />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link to="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full min-h-[44px]">
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/create-account" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full min-h-[44px]">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Account
                    </Button>
                  </Link>
                </div>
              )}
            </div>
            
            <a
              href="/#contact"
              className="btn-institutional text-sm text-center py-3"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact Us
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
