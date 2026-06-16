// build: v2
// Build: 2026-05-30T01:58:06Z â cache bust
import React from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 0,
  });
}
import { registerSW } from "virtual:pwa-register";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    __pwaDeferredPrompt?: BeforeInstallPromptEvent | null;
    __pwaListenersInstalled?: boolean;
    __pwaSwRegistered?: boolean;
  }
}

// Capture the install prompt ASAP (important when users navigate to /download after page load)
if (typeof window !== "undefined" && !window.__pwaListenersInstalled) {
  window.__pwaListenersInstalled = true;
  window.__pwaDeferredPrompt = null;

  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    window.__pwaDeferredPrompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event("pwa:deferredprompt"));
  });

  window.addEventListener("appinstalled", () => {
    window.__pwaDeferredPrompt = null;
    window.dispatchEvent(new Event("pwa:deferredprompt"));
  });
}

// Ensure SW registration runs in both preview + published builds
// Force refresh on version change for icon cache busting
if (typeof window !== "undefined" && !window.__pwaSwRegistered) {
  window.__pwaSwRegistered = true;
  
  // Unregister old service workers to force icon refresh
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      // Only unregister if there are stale registrations
      const shouldRefresh = registrations.some((reg) => {
        return reg.waiting || reg.installing;
      });
      
      if (shouldRefresh) {
        registrations.forEach((reg) => {
          reg.unregister().then(() => {
            console.log("SW unregistered for fresh install");
          });
        });
      }
    });
  }
  
  // registerSW({ immediate: true }); // disabled
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  <Analytics />
  <SpeedInsights />
  </React.StrictMode>
);
