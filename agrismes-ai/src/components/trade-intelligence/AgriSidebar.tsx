import { TrendingUp, useState } from "react";

import { TrendingUp, motion, AnimatePresence } from "framer-motion";
import agrismesLogo from "@/assets/agrismes-logo.png";
import { TrendingUp,
  PlusCircle,
  BarChart3,
  GitCompareArrows,
  MessageSquare,
  Bookmark,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Menu,
  X,
  Mail,
  Calculator,
} from "lucide-react";
import { TrendingUp, cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  section?: "primary" | "secondary";
}

const navItems: NavItem[] = [
  { id: "new-analysis", label: "New Analysis", icon: PlusCircle, section: "primary" },
  { id: "my-analyses", label: "My Analyses", icon: BarChart3, section: "primary" },
  { id: "compare-deals", label: "Compare Deals", icon: GitCompareArrows, section: "primary" },
  { id: "ask-agrismes", label: "Ask AGRISMES", icon: MessageSquare, section: "primary" },
  { id: "margin-calculator", label: "Margin Calc", icon: Calculator, section: "primary" },
  { id: "market-intelligence", label: "Market Prices", icon: TrendingUp, section: "primary" },
  { id: "saved", label: "Saved Items", icon: Bookmark, section: "secondary" },
  { id: "settings", label: "Settings", icon: Settings, section: "secondary" },
];

interface AgriSidebarProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

const WAITLIST_EMAIL = "lentachai@gmail.com";

export function AgriSidebar({ activeSection, onNavigate }: AgriSidebarProps) {
  
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [waitlistCopied, setWaitlistCopied] = useState(false);

  const primaryItems = navItems.filter((i) => i.section === "primary");
  const secondaryItems = navItems.filter((i) => i.section === "secondary");

  const handleNav = (id: string) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  const handleWaitlistCopy = async () => {
    try {
      await navigator.clipboard.writeText(WAITLIST_EMAIL);
    } catch {
      const el = document.createElement("textarea");
      el.value = WAITLIST_EMAIL;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setWaitlistCopied(true);
    setTimeout(() => setWaitlistCopied(false), 2500);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <button
        onClick={() => handleNav("new-analysis")}
        className="px-4 py-5 flex items-center border-b border-border shrink-0 hover:bg-accent/40 transition-colors w-full"
      >
        <img src={agrismesLogo} alt="AgriSMES" className={collapsed ? "h-6 w-auto object-contain" : "h-8 w-auto object-contain"} />
      </button>

      {/* Primary Nav */}
      <div className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {primaryItems.map((item) => (
          <SidebarButton
            key={item.id}
            item={item}
            active={activeSection === item.id}
            collapsed={collapsed}
            onClick={() => handleNav(item.id)}
          />
        ))}

        <div className="my-4 mx-2 border-t border-border" />

        {secondaryItems.map((item) => (
          <SidebarButton
            key={item.id}
            item={item}
            active={activeSection === item.id}
            collapsed={collapsed}
            onClick={() => handleNav(item.id)}
          />
        ))}
      </div>

      {/* Waitlist + Upgrade CTA */}
      <div className="px-3 pb-2 shrink-0">
        {collapsed ? (
          <div className="space-y-2">
            <button
              onClick={handleWaitlistCopy}
              className="w-full flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Join Waiting List"
            >
              <Mail className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleNav("upgrade")}
              className="w-full flex items-center justify-center p-2 rounded-lg bg-primary/10 hover:bg-primary/15 transition-colors"
              title="Upgrade Plan"
            >
              <Sparkles className="w-4 h-4 text-primary" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Join Waiting List */}
            <button
              onClick={handleWaitlistCopy}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            >
              <Mail className="w-4 h-4 shrink-0" />
              <span className="text-[13px]">{waitlistCopied ? "Email copied!" : "Join Waiting List"}</span>
            </button>

            {/* Upgrade CTA */}
            <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-medium text-foreground">Upgrade Plan</span>
              </div>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Unlock advanced trade intelligence
              </p>
              <button
                onClick={() => handleNav("upgrade")}
                className="mt-3 w-full text-[13px] font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg py-2 transition-colors"
              >
                View Plans
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Collapse toggle (desktop only) */}
      <div className="hidden md:block px-3 pb-3 pt-1 shrink-0">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-background border border-border text-foreground hover:bg-accent transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-50 bg-black/30"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="md:hidden fixed inset-y-0 left-0 z-50 w-[260px] bg-background border-r border-border shadow-lg"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 60 : 240 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="hidden md:flex flex-col fixed inset-y-0 left-0 z-40 bg-background border-r border-border"
      >
        <SidebarContent />
      </motion.aside>

      {/* Spacer for desktop layout */}
      <motion.div
        animate={{ width: collapsed ? 60 : 240 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="hidden md:block shrink-0"
      />
    </>
  );
}

function SidebarButton({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={cn(
        "w-full flex items-center gap-2.5 rounded-lg transition-all duration-150 text-left",
        collapsed ? "justify-center p-2.5" : "px-3 py-2.5",
        active
          ? "bg-accent text-foreground font-medium border-l-2 border-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
      )}
    >
      <Icon className={cn("shrink-0", collapsed ? "w-[18px] h-[18px]" : "w-4 h-4")} />
      {!collapsed && (
        <span className="text-[14px] truncate">{item.label}</span>
      )}
    </button>
  );
}
