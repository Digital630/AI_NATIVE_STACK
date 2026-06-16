import { Download, CheckCircle, Smartphone, Wifi, RefreshCw, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { PWAInstallButton } from "@/components/PWAInstallButton";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import agrismesAppLogo from "@/assets/agrismes-app-logo.png";

export default function DownloadApp() {
  const { isInstalled, hasNativePrompt } = usePWAInstall();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-12 md:py-20">
          <div className="container-institutional px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl shadow-lg bg-white flex items-center justify-center overflow-hidden p-2">
                  <img 
                    src={agrismesAppLogo} 
                    alt="AgriSMES" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Install AgriSMES
              </h1>
              <p className="text-lg text-muted-foreground mb-2">
                Trade Readiness & Market Access Platform
              </p>
              <p className="text-muted-foreground max-w-xl mx-auto mb-6">
                Install AgriSMES on your device for quick access to AI-powered analysis tools, quality control, and trade support — works offline too!
              </p>
              
              {/* PWA Install Button - Primary CTA */}
              <div className="flex justify-center">
                <PWAInstallButton size="lg" className="min-h-[48px] px-8" />
              </div>
            </div>
          </div>
        </section>

        {/* Installation Section */}
        <section className="py-12 md:py-16">
          <div className="container-institutional px-4 md:px-6">
            <div className="max-w-2xl mx-auto">
              
              {/* PWA Install Card - Primary */}
              <Card className="border-2 border-primary/50 mb-8">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                      {isInstalled ? (
                        <CheckCircle className="w-8 h-8 text-primary" />
                      ) : (
                        <Download className="w-8 h-8 text-primary" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {isInstalled ? "Already Installed" : "Install Web App"}
                      </CardTitle>
                      <CardDescription>
                        {isInstalled 
                          ? "AgriSMES is installed on your device" 
                          : "Works on all devices — no app store needed"
                        }
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <PWAInstallButton className="w-full" size="lg" />
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    Installs instantly • Works offline • Always up-to-date
                  </p>
                </CardContent>
              </Card>

              {/* Manual Installation Instructions */}
              {!hasNativePrompt && !isInstalled && (
                <Card className="mb-8 border-dashed">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Share className="w-5 h-5" />
                      Manual Installation
                    </CardTitle>
                    <CardDescription>
                      If the install button doesn't work, follow these steps:
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">1</span>
                        <div>
                          <p className="text-sm font-medium">On iPhone/iPad (Safari)</p>
                          <p className="text-xs text-muted-foreground">Tap Share icon → "Add to Home Screen"</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">2</span>
                        <div>
                          <p className="text-sm font-medium">On Android (Chrome)</p>
                          <p className="text-xs text-muted-foreground">Tap menu (⋮) → "Install app" or "Add to Home screen"</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">3</span>
                        <div>
                          <p className="text-sm font-medium">On Desktop (Chrome/Edge)</p>
                          <p className="text-xs text-muted-foreground">Click install icon in address bar or menu → "Install"</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* PWA Benefits */}
              <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
                Why Install AgriSMES?
              </h2>
              <div className="grid gap-4 md:grid-cols-3 mb-12">
                <div className="p-4 bg-card border border-border rounded-lg text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                    <Wifi className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">Works Offline</h3>
                  <p className="text-sm text-muted-foreground">
                    Access key features even without internet connection.
                  </p>
                </div>
                <div className="p-4 bg-card border border-border rounded-lg text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">Always Updated</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically gets the latest features and improvements.
                  </p>
                </div>
                <div className="p-4 bg-card border border-border rounded-lg text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">App-Like Experience</h3>
                  <p className="text-sm text-muted-foreground">
                    Full-screen, fast loading, just like a native app.
                  </p>
                </div>
              </div>

              {/* Features Preview */}
              <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
                What's Included
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-card border border-border rounded-lg">
                  <h3 className="font-medium text-foreground mb-2">AI Chat (Alex)</h3>
                  <p className="text-sm text-muted-foreground">
                    Get instant agribusiness support and commodity guidance from our AI assistant.
                  </p>
                </div>
                <div className="p-4 bg-card border border-border rounded-lg">
                  <h3 className="font-medium text-foreground mb-2">Quality Control</h3>
                  <p className="text-sm text-muted-foreground">
                    AI-assisted commodity grading and bio-risk detection for decision support.
                  </p>
                </div>
                <div className="p-4 bg-card border border-border rounded-lg">
                  <h3 className="font-medium text-foreground mb-2">Moisture Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Estimate moisture content in agricultural commodities using image analysis.
                  </p>
                </div>
                <div className="p-4 bg-card border border-border rounded-lg">
                  <h3 className="font-medium text-foreground mb-2">Weight Estimation</h3>
                  <p className="text-sm text-muted-foreground">
                    Get weight estimates for packaged commodities to support trade decisions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
