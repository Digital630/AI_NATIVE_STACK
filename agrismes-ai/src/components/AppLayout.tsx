import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AgriSidebar } from "@/components/trade-intelligence/AgriSidebar";
import { UpgradePlanModal } from "@/components/UpgradePlanModal";

export default function AppLayout() {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const pathToSection: Record<string, string> = {
    "/": "new-analysis",
    "/intelligence": "new-analysis",
    "/ask": "ask-agrismes",
    "/analysis/history": "my-analyses",
    "/analysis/compare": "compare-deals",
    "/saved": "saved",
    "/settings": "settings",
    "/margin-calculator": "margin-calculator",
    "/market": "market-intelligence",
  };

  const activeSection = pathToSection[location.pathname] || "new-analysis";

  const handleNavigate = (id: string) => {
    const sectionToPath: Record<string, string> = {
      "new-analysis": "/",
      "ask-agrismes": "/ask",
      "my-analyses": "/analysis/history",
      "compare-deals": "/analysis/compare",
      saved: "/saved",
      settings: "/settings",
      upgrade: "__modal__",
      "margin-calculator": "/margin-calculator",
      "market-intelligence": "/market",
    };

    if (id === "upgrade") {
      setUpgradeOpen(true);
      return;
    }

    const path = sectionToPath[id] || "/";
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AgriSidebar activeSection={activeSection} onNavigate={handleNavigate} />
      <div className="flex-1 flex flex-col min-h-screen">
        <Outlet />
      </div>
      <UpgradePlanModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}
