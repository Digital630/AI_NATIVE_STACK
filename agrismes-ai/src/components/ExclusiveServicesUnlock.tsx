import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, 
  Unlock, 
  Sparkles, 
  Users, 
  FileText, 
  TrendingUp, 
  AlertTriangle,
  Loader2,
  X,
  Clock,
  Gift,
  Timer,
  ArrowRight,
  Shield,
  KeyRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminCodeEntry } from "@/components/AdminCodeEntry";

interface ServiceCatalogItem {
  id: string;
  service_key: string;
  service_name: string;
  description: string;
  points_required: number;
  access_minutes: number;
  is_active: boolean;
}

interface ActiveService {
  id: string;
  service_type: string;
  access_expires_at: string;
  access_minutes: number;
  points_spent: number;
}

interface ExclusiveServicesUnlockProps {
  visitorId: string;
  currentPoints: number;
  userLevel?: "none" | "Basic" | "Silver" | "Gold" | "Premium" | "Platinum";
  onServiceUnlocked: (serviceName: string, pointsSpent: number) => void;
  onPointsDeducted: (newPoints: number) => void;
}

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  matchmaking_basic: <Users className="w-5 h-5" />,
  matchmaking_extended: <Users className="w-5 h-5" />,
  trade_consultation: <FileText className="w-5 h-5" />,
  trade_consultation_premium: <FileText className="w-5 h-5" />,
  market_report_basic: <TrendingUp className="w-5 h-5" />,
  market_report_full: <TrendingUp className="w-5 h-5" />,
};

const SERVICE_CATEGORIES = {
  matchmaking: ["matchmaking_basic", "matchmaking_extended"],
  trade: ["trade_consultation", "trade_consultation_premium"],
  reports: ["market_report_basic", "market_report_full"],
};

// Level-based button styling to match RewardFlow icon colors
const getLevelButtonStyle = (level: ExclusiveServicesUnlockProps["userLevel"]) => {
  switch (level) {
    case "Basic":
      // AgriSMES green
      return "bg-primary text-primary-foreground hover:bg-primary/90";
    case "Silver":
      // Silver/gray
      return "bg-slate-400 text-white hover:bg-slate-500";
    case "Gold":
      // Gold color
      return "bg-amber-400 text-amber-950 hover:bg-amber-500";
    case "Premium":
      // Deep emerald green
      return "bg-emerald-600 text-white hover:bg-emerald-700";
    case "Platinum":
      // Platinum/silver-white
      return "bg-slate-200 text-slate-800 hover:bg-slate-300";
    default:
      // Default: AgriSMES green
      return "bg-primary text-primary-foreground hover:bg-primary/90";
  }
};

export function ExclusiveServicesUnlock({
  visitorId,
  currentPoints,
  userLevel = "Basic",
  onServiceUnlocked,
  onPointsDeducted,
}: ExclusiveServicesUnlockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"select" | "verify" | "success">("select");
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [activeServices, setActiveServices] = useState<ActiveService[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceCatalogItem | null>(null);
  const [pointsInput, setPointsInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fraudAttempts, setFraudAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showAdminDialog, setShowAdminDialog] = useState(false);

  const handleAdminAccess = () => {
    setIsOpen(false); // Close main dialog first
    setTimeout(() => setShowAdminDialog(true), 100); // Then open admin dialog
  };

  const handleAdminVerified = () => {
    setIsOpen(false);
    // Navigate to matchmaking with admin access
    window.location.href = "/services/matchmaking?admin=true";
    toast.success("Admin access granted! Redirecting to matchmaking...");
  };

  // Load services on mount
  useEffect(() => {
    loadServices();
    loadActiveServices();
  }, [visitorId]);

  // Fraud prevention: lock out after 5 failed attempts
  useEffect(() => {
    if (fraudAttempts >= 5) {
      setIsLocked(true);
      setTimeout(() => {
        setIsLocked(false);
        setFraudAttempts(0);
      }, 60000); // 1 minute lockout
    }
  }, [fraudAttempts]);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from("service_catalog")
        .select("*")
        .eq("is_active", true)
        .order("points_required", { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error("[ExclusiveServices] Load error:", err);
    }
  };

  const loadActiveServices = async () => {
    if (!visitorId) return;
    
    try {
      const { data } = await supabase
        .from("redeemed_services")
        .select("*")
        .eq("visitor_id", visitorId)
        .eq("is_active", true)
        .gte("access_expires_at", new Date().toISOString());

      setActiveServices(data || []);
    } catch (err) {
      console.error("[ExclusiveServices] Active services error:", err);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setStep("select");
    setError(null);
    setPointsInput("");
    setSelectedService(null);
    loadActiveServices();
  };

  const handleSelectService = (service: ServiceCatalogItem) => {
    // Check if service is already active
    const isActive = activeServices.some(a => a.service_type === service.service_key);
    if (isActive) {
      toast.info("This service is already active!");
      return;
    }

    setSelectedService(service);
    setStep("verify");
    setError(null);
    setPointsInput("");
    
    // Focus input after animation
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  // Validate points input - now accepts any number (not limited to 4 digits)
  const validatePointsInput = (value: string): boolean => {
    // Must be a valid number
    if (!/^\d+$/.test(value)) {
      return false;
    }
    
    const numValue = parseInt(value, 10);
    
    // Must be a positive number
    if (numValue <= 0) {
      return false;
    }
    
    return true;
  };

  const handleUnlock = async () => {
    if (!selectedService || !visitorId || isLocked) return;

    // Validate input format - now accepts any valid number representing points
    if (!validatePointsInput(pointsInput)) {
      setError("Please enter your RewardFlow points balance (e.g., 500)");
      setFraudAttempts(prev => prev + 1);
      return;
    }

    const enteredPoints = parseInt(pointsInput, 10);

    setIsValidating(true);
    setError(null);

    try {
      // FRAUD PREVENTION: Verify actual points from database
      const { data: pointsData, error: pointsError } = await supabase
        .from("reward_points")
        .select("total_points")
        .eq("visitor_id", visitorId)
        .maybeSingle();

      if (pointsError) throw pointsError;

      const actualPoints = pointsData?.total_points || 0;

      // Check if entered points match or are close to actual balance
      // Allow ±50 points variance for recent unsynced points
      const variance = Math.abs(enteredPoints - actualPoints);
      
      if (variance > 100) {
        setError("It seems there was an issue with your points entry. Please ensure you're entering valid points from your RewardFlow balance.");
        setFraudAttempts(prev => prev + 1);
        setIsValidating(false);
        return;
      }

      // Check if user has enough points
      if (actualPoints < selectedService.points_required) {
        setError(`Not enough points. You need ${selectedService.points_required} points, but you have ${actualPoints}.`);
        setIsValidating(false);
        return;
      }

      // Check if service is already active
      const isAlreadyActive = activeServices.some(
        a => a.service_type === selectedService.service_key
      );

      if (isAlreadyActive) {
        setError("This service is already active!");
        setIsValidating(false);
        return;
      }

      // Calculate access expiry
      const accessExpiresAt = new Date(
        Date.now() + selectedService.access_minutes * 60 * 1000
      );

      // Create redeemed service record
      const { error: insertError } = await supabase
        .from("redeemed_services")
        .insert({
          visitor_id: visitorId,
          service_type: selectedService.service_key,
          points_spent: selectedService.points_required,
          access_minutes: selectedService.access_minutes,
          access_expires_at: accessExpiresAt.toISOString(),
        });

      if (insertError) throw insertError;

      // Deduct points
      const newPoints = actualPoints - selectedService.points_required;
      const { error: updateError } = await supabase
        .from("reward_points")
        .update({ total_points: newPoints })
        .eq("visitor_id", visitorId);

      if (updateError) throw updateError;

      // Log points history
      await supabase.from("reward_points_history").insert({
        visitor_id: visitorId,
        action_type: "service_redemption",
        points_awarded: -selectedService.points_required,
        description: `Unlocked ${selectedService.service_name}`,
      });

      // Success!
      setStep("success");
      onPointsDeducted(newPoints);
      onServiceUnlocked(selectedService.service_name, selectedService.points_required);
      
      // Reload active services
      await loadActiveServices();

      toast.success(
        `🎉 Successfully unlocked "${selectedService.service_name}" for ${selectedService.access_minutes} minutes!`
      );

    } catch (err) {
      console.error("[ExclusiveServices] Unlock error:", err);
      setError("Failed to unlock service. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      return `${hours}h ${minutes % 60}m`;
    }

    return `${minutes}m ${seconds}s`;
  };

  const getServiceCategory = (serviceKey: string) => {
    if (SERVICE_CATEGORIES.matchmaking.includes(serviceKey)) return "Buyer/Seller Matchmaking";
    if (SERVICE_CATEGORIES.trade.includes(serviceKey)) return "Trade Assessment";
    if (SERVICE_CATEGORIES.reports.includes(serviceKey)) return "Market Reports";
    return "Exclusive Service";
  };

  const canAffordAnyService = services.some(s => currentPoints >= s.points_required);

  return (
    <>
      {/* Unlock Exclusive Services Button - Color matches user's RewardFlow level */}
      <Button
        size="sm"
        onClick={handleOpen}
        className={`gap-2 text-xs ${getLevelButtonStyle(userLevel)}`}
      >
        <Lock className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Unlock Exclusive Service</span>
        <span className="sm:hidden">Unlock</span>
      </Button>

      {/* Modal positioned above chat layer with high z-index */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto z-[9999]">
          {/* Admin Access Icon - Top Right (before close button) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAdminAccess();
            }}
            className="absolute top-3 right-12 h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-colors z-50"
            title="Admin Access"
          >
            <span className="text-[10px] font-bold">A</span>
          </button>

          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {step === "select" && (
                <>
                  <Gift className="w-5 h-5 text-primary" />
                  Exclusive Services
                </>
              )}
              {step === "verify" && (
                <>
                  <Shield className="w-5 h-5 text-primary" />
                  Confirm Points
                </>
              )}
              {step === "success" && (
                <>
                  <Sparkles className="w-5 h-5 text-primary" />
                  Service Unlocked!
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {step === "select" && (
                <>
                  Use your RewardFlow points to unlock exclusive AgriSMES services.
                  <span className="block mt-1 font-medium text-primary">
                    Your balance: {currentPoints} points
                  </span>
                </>
              )}
              {step === "verify" && (
                <>Enter your RewardFlow points balance to unlock this service.</>
              )}
              {step === "success" && (
                <>Your service is now active. Access it before time expires!</>
              )}
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {/* Step 1: Select Service */}
            {step === "select" && (
              <motion.div
                key="select"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {/* Active Services */}
                {activeServices.length > 0 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <p className="text-xs font-medium text-primary mb-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Active Services
                    </p>
                    <div className="space-y-2">
                      {activeServices.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-foreground">
                            {services.find(s => s.service_key === service.service_type)?.service_name}
                          </span>
                          <span className="text-primary flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            {formatTimeRemaining(service.access_expires_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Service Categories */}
                <div className="space-y-3">
                  {services.map((service) => {
                    const canAfford = currentPoints >= service.points_required;
                    const isActive = activeServices.some(
                      a => a.service_type === service.service_key
                    );

                    return (
                      <motion.button
                        key={service.id}
                        onClick={() => handleSelectService(service)}
                        disabled={!canAfford || isActive}
                        whileHover={canAfford && !isActive ? { scale: 1.02 } : {}}
                        whileTap={canAfford && !isActive ? { scale: 0.98 } : {}}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${
                          canAfford && !isActive
                            ? "border-primary/30 hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                            : "border-border opacity-60 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            canAfford ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          }`}>
                            {SERVICE_ICONS[service.service_key] || <Gift className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-medium text-sm text-foreground truncate">
                                {service.service_name}
                              </h4>
                              {isActive && (
                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {service.description}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-xs">
                              <span className={`font-medium ${canAfford ? "text-primary" : "text-muted-foreground"}`}>
                                {service.points_required} pts
                              </span>
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {service.access_minutes}min access
                              </span>
                            </div>
                          </div>
                          {canAfford && !isActive && (
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {!canAffordAnyService && (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Keep engaging to earn more points!</p>
                    <p className="text-xs mt-1">
                      Minimum {Math.min(...services.map(s => s.points_required))} points required
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2: Verify Points */}
            {step === "verify" && selectedService && (
              <motion.div
                key="verify"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Selected Service Preview */}
                <div className="bg-accent/50 rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {SERVICE_ICONS[selectedService.service_key] || <Gift className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{selectedService.service_name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {selectedService.points_required} pts • {selectedService.access_minutes}min
                      </p>
                    </div>
                  </div>
                </div>

                {isLocked ? (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
                    <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
                    <p className="text-sm text-destructive font-medium">
                      Too many failed attempts
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Please wait 1 minute before trying again.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Points Input - Now accepts any valid points number */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Enter your RewardFlow points balance
                      </label>
                      <Input
                        ref={inputRef}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={pointsInput}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                          setPointsInput(value);
                          setError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && pointsInput.length >= 2) {
                            handleUnlock();
                          }
                        }}
                        placeholder="e.g., 500"
                        className={`text-center text-2xl font-mono tracking-widest h-14 ${
                          error ? "border-destructive" : ""
                        }`}
                        disabled={isValidating}
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        You need at least {selectedService.points_required} points to unlock
                      </p>
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive"
                      >
                        <AlertTriangle className="w-4 h-4 inline mr-2" />
                        {error}
                      </motion.div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setStep("select")}
                        className="flex-1"
                        disabled={isValidating}
                      >
                        Back
                      </Button>
                      <Button
                        onClick={handleUnlock}
                        disabled={pointsInput.length < 1 || isValidating}
                        className="flex-1 gap-2"
                      >
                        {isValidating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <Unlock className="w-4 h-4" />
                            Unlock Service
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* Step 3: Success */}
            {step === "success" && selectedService && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4 space-y-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto"
                >
                  <Sparkles className="w-8 h-8 text-primary" />
                </motion.div>

                <div>
                  <h3 className="font-semibold text-lg">
                    You've unlocked {selectedService.service_name}!
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Please note: To proceed with any connection or service, you must 
                    <strong> schedule a meeting</strong> with FundMySME.
                  </p>
                </div>

                <div className="bg-accent/50 rounded-lg p-3 text-sm">
                  <p className="text-muted-foreground">
                    Points used: <span className="font-medium text-primary">{selectedService.points_required}</span>
                  </p>
                  <p className="text-muted-foreground mt-1">
                    Remaining balance: <span className="font-medium text-foreground">{currentPoints - selectedService.points_required}</span> points
                  </p>
                  <p className="text-muted-foreground mt-1 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    Access time: {selectedService.access_minutes} minutes
                  </p>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-muted-foreground">
                  <Shield className="w-4 h-4 text-primary inline mr-1" />
                  Contact details of buyers/sellers are managed by FundMySME for your security. 
                  Our team will facilitate introductions.
                </div>

                <div className="pt-2 space-y-2">
                  <Button
                    onClick={() => {
                      setIsOpen(false);
                      // Navigate to service page
                      const servicePath = getServicePath(selectedService.service_key);
                      if (servicePath) {
                        window.location.href = servicePath;
                      }
                    }}
                    className="w-full gap-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Access Service Now
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsOpen(false);
                    }}
                    className="w-full"
                  >
                    Continue Chatting
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Admin Code Entry Dialog */}
      <AdminCodeEntry
        isOpen={showAdminDialog}
        onClose={() => setShowAdminDialog(false)}
        onAdminVerified={handleAdminVerified}
      />
    </>
  );
}

function getServicePath(serviceKey: string): string {
  const paths: Record<string, string> = {
    matchmaking_basic: "/services/matchmaking",
    matchmaking_extended: "/services/matchmaking",
    trade_consultation: "/services/trade-assessment",
    trade_consultation_premium: "/services/trade-assessment",
    market_report_basic: "/services/market-reports",
    market_report_full: "/services/market-reports",
  };
  return paths[serviceKey] || "/";
}
