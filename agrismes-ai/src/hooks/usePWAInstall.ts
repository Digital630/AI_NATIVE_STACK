import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const getGlobalPrompt = () => (window as any).__pwaDeferredPrompt as BeforeInstallPromptEvent | null;

    // Check if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check for iOS standalone mode
    if ((navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    // If the prompt was captured earlier (e.g., on / then user navigates to /download), read it.
    setDeferredPrompt(getGlobalPrompt());

    const syncDeferredPrompt = () => {
      setDeferredPrompt(getGlobalPrompt());
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("pwa:deferredprompt", syncDeferredPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("pwa:deferredprompt", syncDeferredPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error("PWA install error:", error);
      return false;
    }
  }, [deferredPrompt]);

  // hasNativePrompt tells us if the browser supports native install
  const hasNativePrompt = deferredPrompt !== null;

  return {
    hasNativePrompt,
    isInstalled,
    promptInstall
  };
}
