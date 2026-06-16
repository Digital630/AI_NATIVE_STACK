import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Clock, Award, Check, X, Loader2, ArrowLeft, Timer, Sparkles, Users, FileText, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import rewardflowIcon from "@/assets/rewardflow-icon.png";

interface ServiceCatalogItem {
  id: string;
  service_key: string;
  service_name: string;
  description: string;
  points_required: number;
  access_minutes: number;
  is_active: boolean;
}

interface TokenData {
  id: string;
  visitor_id: string;
  token: string;
  points_at_creation: number;
  level_at_creation: string;
  is_redeemed: boolean;
  expires_at: string;
}

interface ActiveService {
  id: string;
  service_type: string;
  access_expires_at: string;
  access_minutes: number;
}

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  matchmaking_basic: <Users className="w-6 h-6" />,
  matchmaking_extended: <Users className="w-6 h-6" />,
  trade_consultation: <FileText className="w-6 h-6" />,
  trade_consultation_premium: <FileText className="w-6 h-6" />,
  market_report_basic: <TrendingUp className="w-6 h-6" />,
  market_report_full: <TrendingUp className="w-6 h-6" />,
};

export default function RedeemRewards() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(true);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [activeServices, setActiveServices] = useState<ActiveService[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRedeeming, setIsRedeeming] = useState<string | null>(null);
  const [currentPoints, setCurrentPoints] = useState(0);

  useEffect(() => {
    if (!token) {
      setError("No redemption token provided. Please scan a valid QR code.");
      setIsLoading(false);
      return;
    }

    loadTokenData();
  }, [token]);

  const loadTokenData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate token
      const { data: tokenResult, error: tokenError } = await supabase
        .from("redemption_tokens")
        .select("*")
        .eq("token", token)
        .maybeSingle();

      if (tokenError) throw tokenError;

      if (!tokenResult) {
        setError("Invalid or expired redemption token.");
        setIsLoading(false);
        return;
      }

      // Check if token is expired
      if (new Date(tokenResult.expires_at) < new Date()) {
        setError("This redemption token has expired. Please generate a new one.");
        setIsLoading(false);
        return;
      }

      setTokenData(tokenResult);

      // Get current points from reward_points table
      const { data: pointsData } = await supabase
        .from("reward_points")
        .select("total_points")
        .eq("visitor_id", tokenResult.visitor_id)
        .maybeSingle();

      setCurrentPoints(pointsData?.total_points || tokenResult.points_at_creation);

      // Load service catalog
      const { data: servicesData, error: servicesError } = await supabase
        .from("service_catalog")
        .select("*")
        .eq("is_active", true)
        .order("points_required", { ascending: true });

      if (servicesError) throw servicesError;
      setServices(servicesData || []);

      // Load active services for this visitor
      const { data: activeData } = await supabase
        .from("redeemed_services")
        .select("*")
        .eq("visitor_id", tokenResult.visitor_id)
        .eq("is_active", true)
        .gte("access_expires_at", new Date().toISOString());

      setActiveServices(activeData || []);
    } catch (err) {
      console.error("[Redeem] Load error:", err);
      setError("Failed to load redemption data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const redeemService = async (service: ServiceCatalogItem) => {
    if (!tokenData) return;

    if (currentPoints < service.points_required) {
      toast.error(`Not enough points. You need ${service.points_required} points.`);
      return;
    }

    setIsRedeeming(service.id);

    try {
      const accessExpiresAt = new Date(Date.now() + service.access_minutes * 60 * 1000);

      // Insert redeemed service
      const { error: insertError } = await supabase
        .from("redeemed_services")
        .insert({
          visitor_id: tokenData.visitor_id,
          service_type: service.service_key,
          points_spent: service.points_required,
          access_minutes: service.access_minutes,
          access_expires_at: accessExpiresAt.toISOString(),
        });

      if (insertError) throw insertError;

      // Deduct points
      const newPoints = currentPoints - service.points_required;
      await supabase
        .from("reward_points")
        .update({ total_points: newPoints })
        .eq("visitor_id", tokenData.visitor_id);

      setCurrentPoints(newPoints);

      // Reload active services
      await loadTokenData();

      toast.success(
        `🎉 Successfully unlocked "${service.service_name}" for ${service.access_minutes} minutes!`
      );
    } catch (err) {
      console.error("[Redeem] Service error:", err);
      toast.error("Failed to redeem service. Please try again.");
    } finally {
      setIsRedeeming(null);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading redemption page...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Redemption Error</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-accent/5 to-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <img
              src={rewardflowIcon}
              alt="RewardFlow"
              className="h-6 w-6"
              style={{ filter: "sepia(1) saturate(5) hue-rotate(90deg) brightness(0.9)" }}
            />
            <span className="font-semibold text-foreground">RewardFlow</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Congratulations Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-primary via-primary/90 to-accent rounded-2xl p-6 mb-8 text-primary-foreground relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-20 -right-20 w-60 h-60 border-[40px] border-primary-foreground/30 rounded-full"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-10 -left-10 w-40 h-40 border-[30px] border-primary-foreground/20 rounded-full"
            />
          </div>
          <div className="relative z-10 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="text-5xl mb-3"
            >
              🎉
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">Congratulations!</h1>
            <p className="text-lg opacity-90 mb-4">
              You have earned <span className="font-bold text-3xl mx-1">{currentPoints}</span> points!
            </p>
            <p className="text-sm opacity-80">
              Unlock exclusive AgriSMES services like discounted trade assessments, buyer/seller matchmaking, and premium market reports!
            </p>
          </div>
        </motion.div>

        {/* Points Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-primary/10 via-card to-accent/10 rounded-2xl p-6 border border-border mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Your Points Balance</p>
              <p className="text-4xl font-bold text-primary">{currentPoints}</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Award className="w-5 h-5 text-primary" />
              <span className="font-medium text-primary">{tokenData?.level_at_creation}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Use your points to unlock exclusive AgriSMES services below. Points are refreshed as you continue engaging.
          </p>
        </motion.div>

        {/* Active Services */}
        {activeServices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Your Active Services
            </h2>
            <div className="space-y-3">
              {activeServices.map((service) => (
                <div
                  key={service.id}
                  className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      {SERVICE_ICONS[service.service_type] || <Gift className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {services.find(s => s.service_key === service.service_type)?.service_name || service.service_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {service.access_minutes} minute access
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-primary">
                    <Timer className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {formatTimeRemaining(service.access_expires_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Available Services */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Available Services
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {services.map((service) => {
              const canAfford = currentPoints >= service.points_required;
              const isActive = activeServices.some(a => a.service_type === service.service_key);

              return (
                <motion.div
                  key={service.id}
                  whileHover={{ scale: canAfford && !isActive ? 1.02 : 1 }}
                  className={`bg-card border rounded-xl p-5 transition-all ${
                    canAfford && !isActive
                      ? "border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                      : "border-border opacity-70"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      canAfford ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {SERVICE_ICONS[service.service_key] || <Gift className="w-6 h-6" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">{service.service_name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${canAfford ? "text-primary" : "text-muted-foreground"}`}>
                            {service.points_required}
                          </span>
                          <span className="text-xs text-muted-foreground">points</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{service.access_minutes}min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => redeemService(service)}
                    disabled={!canAfford || isActive || isRedeeming === service.id}
                    className="w-full mt-4"
                    variant={canAfford && !isActive ? "default" : "secondary"}
                  >
                    {isRedeeming === service.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Unlocking...
                      </>
                    ) : isActive ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Active
                      </>
                    ) : canAfford ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Unlock Now
                      </>
                    ) : (
                      `Need ${service.points_required - currentPoints} more points`
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* How to Earn More Points */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-accent/30 rounded-xl p-6 border border-border"
        >
          <h3 className="font-semibold text-foreground mb-3">💡 How to Earn More Points</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Ask meaningful trade-related questions (+15 pts)</li>
            <li>• Upload product images for analysis (+25 pts)</li>
            <li>• Submit contact forms (+50 pts)</li>
            <li>• Provide detailed inquiries with commodity context (+30 pts)</li>
          </ul>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/")}
          >
            Continue Engaging
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
