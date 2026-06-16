import { useState, useEffect } from "react";
import { Smartphone, Monitor, Apple, Chrome, Download, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

// Analytics tracking function
const trackPWAEvent = (eventName: string, properties?: Record<string, any>) => {
  console.log("PWA_TRACK:", eventName, properties);
  
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", eventName, {
      event_category: "PWA",
      ...properties,
    });
  }
  
  if (typeof window !== "undefined" && (window as any).trackAgriSMESEvent) {
    (window as any).trackAgriSMESEvent(eventName, properties);
  }
};

// Device detection helpers
const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isMobile = /Mobi|Android/i.test(ua);
  const isChrome = /Chrome/i.test(ua) && !/Edge|Edg/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/Chrome/i.test(ua);
  
  return { isIOS, isAndroid, isMobile, isChrome, isSafari };
};

interface DownloadAppModalProps {
  trigger: React.ReactNode;
}

export function DownloadAppModal({ trigger }: DownloadAppModalProps) {
  const { hasNativePrompt, isInstalled, promptInstall } = usePWAInstall();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<ReturnType<typeof getDeviceInfo> | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    setDeviceInfo(getDeviceInfo());
  }, []);

  const handleNativeInstall = async () => {
    if (!deviceInfo) return;
    
    setIsLoading(true);
    trackPWAEvent("download_button_clicked", {
      device_type: deviceInfo.isMobile ? "mobile" : "desktop",
      has_native_prompt: hasNativePrompt,
    });

    try {
      const success = await promptInstall();
      if (success) {
        toast.success("AgriSMES installed successfully!", { duration: 5000 });
        trackPWAEvent("pwa_install_accepted", { device_type: deviceInfo.isMobile ? "mobile" : "desktop" });
        setOpen(false);
      } else {
        trackPWAEvent("pwa_install_dismissed", { device_type: deviceInfo.isMobile ? "mobile" : "desktop" });
      }
    } catch (error) {
      console.error("PWA install error:", error);
      trackPWAEvent("pwa_install_error", { error: String(error) });
    }
    setIsLoading(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && deviceInfo) {
      trackPWAEvent("install_instructions_shown", { 
        platform: deviceInfo.isIOS ? "ios" : deviceInfo.isAndroid ? "android" : "desktop" 
      });
    }
  };

  // If already installed, show success state
  if (isInstalled) {
    return (
      <Button variant="ghost" size="sm" disabled className="gap-2">
        <CheckCircle className="w-4 h-4" />
        App Installed
      </Button>
    );
  }

  // Shared content for both Dialog and Drawer
  const ModalContent = () => (
    <div className="space-y-4 py-4">
      {/* Native Install Button - Show if available */}
      {hasNativePrompt && (
        <div className="mb-4">
          <Button 
            onClick={handleNativeInstall} 
            disabled={isLoading}
            className="w-full gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isLoading ? "Installing..." : "Install Now"}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Click above for instant installation
          </p>
        </div>
      )}

      {/* iOS/Safari Instructions */}
      {deviceInfo?.isIOS && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Apple className="h-4 w-4" />
            iPhone / iPad (Safari)
          </div>
          <div className="space-y-2">
            <div className="flex gap-3 p-3 bg-muted rounded-lg">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">1</span>
              <div>
                <p className="text-sm font-medium">Tap the Share button</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Look for the <strong>square with an arrow pointing up</strong> at the bottom of Safari
                </p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-muted rounded-lg">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">2</span>
              <div>
                <p className="text-sm font-medium">Tap "Add to Home Screen"</p>
                <p className="text-xs text-muted-foreground mt-0.5">Scroll through the options to find it</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-muted rounded-lg">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">3</span>
              <div>
                <p className="text-sm font-medium">Tap "Add" to confirm</p>
                <p className="text-xs text-muted-foreground mt-0.5">AgriSMES will appear on your home screen</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Android Instructions */}
      {deviceInfo?.isAndroid && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Chrome className="h-4 w-4" />
            Android (Chrome)
          </div>
          <div className="space-y-2">
            <div className="flex gap-3 p-3 bg-muted rounded-lg">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">1</span>
              <div>
                <p className="text-sm font-medium">Tap the menu (⋮)</p>
                <p className="text-xs text-muted-foreground mt-0.5">Located at the top right corner</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-muted rounded-lg">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">2</span>
              <div>
                <p className="text-sm font-medium">Tap "Install app" or "Add to Home screen"</p>
                <p className="text-xs text-muted-foreground mt-0.5">The option may vary by browser version</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-muted rounded-lg">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">3</span>
              <div>
                <p className="text-sm font-medium">Confirm installation</p>
                <p className="text-xs text-muted-foreground mt-0.5">AgriSMES will be added to your home screen</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Instructions */}
      {!deviceInfo?.isMobile && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Monitor className="h-4 w-4" />
            Desktop Browser
          </div>
          <div className="space-y-2">
            <div className="flex gap-3 p-3 bg-muted rounded-lg">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">1</span>
              <div>
                <p className="text-sm font-medium">Look for the install icon</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  In Chrome/Edge: Look for a <strong>⊕</strong> or install icon in the address bar
                </p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-muted rounded-lg">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">2</span>
              <div>
                <p className="text-sm font-medium">Click "Install" or use browser menu</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Go to Menu → "Install AgriSMES" or "Create shortcut"
                </p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-muted rounded-lg">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">3</span>
              <div>
                <p className="text-sm font-medium">Confirm installation</p>
                <p className="text-xs text-muted-foreground mt-0.5">AgriSMES will open as a standalone desktop app</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Benefits reminder */}
      <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Benefits:</strong> Faster loading, offline access, native app experience, and direct access from your home screen.
        </p>
      </div>
    </div>
  );

  // Use Drawer on mobile for better UX (slides up from bottom)
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>
          {trigger}
        </DrawerTrigger>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Install AgriSMES
            </DrawerTitle>
            <DrawerDescription>
              Add AgriSMES to your home screen for the best experience
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 overflow-y-auto">
            <ModalContent />
          </div>
          <div className="p-4 pt-0">
            <Button variant="outline" onClick={() => setOpen(false)} className="w-full">
              Got it!
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Use Dialog on desktop
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            Install AgriSMES
          </DialogTitle>
          <DialogDescription>
            Add AgriSMES to your home screen for the best experience
          </DialogDescription>
        </DialogHeader>

        <ModalContent />

        <Button variant="outline" onClick={() => setOpen(false)} className="w-full">
          Got it!
        </Button>
      </DialogContent>
    </Dialog>
  );
}
