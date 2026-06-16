import { Download, CheckCircle, Smartphone, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

interface PWAInstallButtonProps {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
}

export function PWAInstallButton({ 
  variant = "default", 
  size = "default",
  className = "",
  showLabel = true 
}: PWAInstallButtonProps) {
  const { hasNativePrompt, isInstalled, promptInstall } = usePWAInstall();
  const [showInstructions, setShowInstructions] = useState(false);

  const handleInstall = async () => {
    // If native prompt is available, use it
    if (hasNativePrompt) {
      const success = await promptInstall();
      if (success) {
        toast.success("AgriSMES installed successfully! Find it on your home screen.");
      }
    } else {
      // Show manual instructions for browsers without native prompt
      setShowInstructions(true);
    }
  };

  // Already installed - show success state
  if (isInstalled) {
    return (
      <Button 
        variant="ghost" 
        size={size} 
        className={`gap-2 text-primary ${className}`}
        disabled
      >
        <CheckCircle className="w-4 h-4" />
        {showLabel && "App Installed"}
      </Button>
    );
  }

  return (
    <>
      <Button 
        variant={variant} 
        size={size} 
        className={`gap-2 ${className}`}
        onClick={handleInstall}
      >
        {hasNativePrompt ? (
          <Download className="w-4 h-4" />
        ) : (
          <Smartphone className="w-4 h-4" />
        )}
        {showLabel && "Install App"}
      </Button>

      {/* Manual instructions dialog for unsupported browsers */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share className="h-5 w-5" />
              Install AgriSMES
            </DialogTitle>
            <DialogDescription>
              Follow these steps to add AgriSMES to your home screen
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex gap-3 p-3 bg-muted rounded-lg">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">1</span>
                <div>
                  <p className="text-sm font-medium">iPhone / iPad (Safari)</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tap the <strong>Share</strong> icon (square with arrow) at the bottom of Safari, then tap <strong>"Add to Home Screen"</strong>
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 p-3 bg-muted rounded-lg">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">2</span>
                <div>
                  <p className="text-sm font-medium">Android (Chrome)</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tap the <strong>menu icon</strong> (⋮) at the top right, then tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 p-3 bg-muted rounded-lg">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">3</span>
                <div>
                  <p className="text-sm font-medium">Desktop (Chrome / Edge)</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Click the <strong>install icon</strong> in the address bar or go to menu and click <strong>"Install AgriSMES"</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => setShowInstructions(false)}
            className="w-full"
          >
            Got it!
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
