import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";

interface Prefs {
  currency: string;
  unit: string;
  defaultModel: string;
}

const DEFAULTS: Prefs = { currency: "USD", unit: "MT", defaultModel: "gpt-5.3" };

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem("agrismes_prefs");
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);

  useEffect(() => {
    localStorage.setItem("agrismes_prefs", JSON.stringify(prefs));
  }, [prefs]);

  return (
    <>
      <Helmet><title>Settings — AGRISMES</title></Helmet>
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-xl font-semibold text-foreground mb-6">Settings</h1>

        <div className="space-y-6">
          <div className="rounded-xl border border-border p-5">
            <h2 className="text-sm font-medium text-foreground mb-4">Preferences</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-1.5">Preferred Currency</label>
                <select
                  value={prefs.currency}
                  onChange={(e) => setPrefs((p) => ({ ...p, currency: e.target.value }))}
                  className="w-full max-w-xs px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="KES">KES (KSh)</option>
                  <option value="TZS">TZS (TSh)</option>
                  <option value="UGX">UGX (USh)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="AED">AED (د.إ)</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground block mb-1.5">Weight Unit</label>
                <select
                  value={prefs.unit}
                  onChange={(e) => setPrefs((p) => ({ ...p, unit: e.target.value }))}
                  className="w-full max-w-xs px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="MT">Metric Tons (MT)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="lbs">Pounds (lbs)</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground block mb-1.5">Default AI Model</label>
                <select
                  value={prefs.defaultModel}
                  onChange={(e) => setPrefs((p) => ({ ...p, defaultModel: e.target.value }))}
                  className="w-full max-w-xs px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="gpt-5.3">GPT 5.3 (OpenAI)</option>
                  <option value="gemini-2.5">Gemini 2.5 Flash (Google)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border p-5">
            <h2 className="text-sm font-medium text-foreground mb-2">About</h2>
            <p className="text-sm text-muted-foreground">AGRISMES — AI Agribusiness Trade Intelligence Engine</p>
            <p className="text-[12px] text-muted-foreground/60 mt-1">Version 1.0 MVP</p>
          </div>
        </div>
      </div>
    </>
  );
}
