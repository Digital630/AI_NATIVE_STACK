import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Lock,
  Unlock,
  Users,
  FileText,
  TrendingUp,
  Shield,
  ArrowRight,
  MessageSquare,
  Clock,
  Gift,
  CheckCircle,
  Eye,
  EyeOff,
  Inbox,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  KeyRound,
  LogOut,
  Settings,
  BarChart3,
  List,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { TrustAnchorGroup, ScopeOfService, GovernanceFramework, DataOwnershipNotice } from "@/components/TrustAnchor";
import { ChatCTABlock } from "@/components/LiveChatCTA";
import { ReviewCycleIndicator } from "@/components/DealLifecycle";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserMessagingBox } from "@/components/UserMessagingBox";
import { 
  AITradeDecisionRoom, 
  calculateTradeReadiness, 
  generateAIBriefings 
} from "@/components/AITradeDecisionRoom";
import { MarketInsightsPanel } from "@/components/MarketInsightsPanel";
import { AdminCodeEntry } from "@/components/AdminCodeEntry";

const VISITOR_ID_KEY = "agrismes_visitor_id";

interface ServiceCatalogItem {
  id: string;
  service_key: string;
  service_name: string;
  description: string | null;
  points_required: number;
  access_minutes: number;
  is_active: boolean;
}

interface AdminMessage {
  id: string;
  visitor_id: string;
  sender_type: string;
  message_text: string;
  is_read: boolean;
  created_at: string;
  listing_id: string | null;
}
const SERVICE_CONFIG: Record<string, { icon: React.ReactNode; path: string }> = {
  matchmaking_basic: { icon: <Users className="w-6 h-6" />, path: "/services/matchmaking" },
  matchmaking_extended: { icon: <Users className="w-6 h-6" />, path: "/services/matchmaking" },
  trade_consultation: { icon: <FileText className="w-6 h-6" />, path: "/services/trade-assessment" },
  trade_consultation_premium: { icon: <FileText className="w-6 h-6" />, path: "/services/trade-assessment" },
  market_report_basic: { icon: <TrendingUp className="w-6 h-6" />, path: "/services/market-reports" },
  market_report_full: { icon: <TrendingUp className="w-6 h-6" />, path: "/services/market-reports" },
};

export default function UnlockExclusiveServices() {
  const navigate = useNavigate();
  const [visitorId, setVisitorId] = useState("");
  const [currentPoints, setCurrentPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<ServiceCatalogItem[]>([]);
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceCatalogItem | null>(null);
  const [pointsInput, setPointsInput] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Trade Decision Room state
  const [messageCount, setMessageCount] = useState(0);
  const [hasSubmittedListing, setHasSubmittedListing] = useState(false);
  
  // Admin inbox state
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([]);
  const [adminInboxLoading, setAdminInboxLoading] = useState(false);
  const [adminInboxExpanded, setAdminInboxExpanded] = useState(true);
  
  // Admin login dialog state
  const [showAdminLoginDialog, setShowAdminLoginDialog] = useState(false);

  useEffect(() => {
    loadServices();
    const storedVisitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (storedVisitorId) {
      setVisitorId(storedVisitorId);
      loadPoints(storedVisitorId);
      loadUserEngagement(storedVisitorId);
    } else {
      setIsLoading(false);
    }
    
    // Check admin access
    const adminAccess = localStorage.getItem("agrismes_admin_access") === "true";
    setIsAdmin(adminAccess);
    if (adminAccess) {
      loadAdminMessages();
    }
  }, []);

  const loadUserEngagement = async (vid: string) => {
    try {
      // Get message count from chat conversations
      const { data: chatData } = await supabase
        .from("chat_conversations")
        .select("message_count")
        .eq("visitor_id", vid)
        .maybeSingle();
      
      setMessageCount(chatData?.message_count || 0);

      // Check if user has submitted listings
      const { count } = await supabase
        .from("commodity_listings")
        .select("*", { count: "exact", head: true })
        .eq("visitor_id", vid);
      
      setHasSubmittedListing((count || 0) > 0);
    } catch (err) {
      console.error("[UnlockServices] Engagement load error:", err);
    }
  };

  const loadAdminMessages = async () => {
    setAdminInboxLoading(true);
    try {
      // Use server-side edge function to bypass RLS for admin access.
      // Authorized by the signed admin session token (not a hardcoded code).
      const response = await supabase.functions.invoke("admin-messages", {
        body: {
          action: "list",
          adminToken: localStorage.getItem("agrismes_admin_token") || "",
        },
      });

      if (response.error) throw response.error;
      
      if (response.data?.success) {
        setAdminMessages((response.data.messages as AdminMessage[]) || []);
      } else {
        console.error("[UnlockServices] Admin messages error:", response.data?.error);
        setAdminMessages([]);
      }
    } catch (err) {
      console.error("[UnlockServices] Admin messages load error:", err);
      setAdminMessages([]);
    } finally {
      setAdminInboxLoading(false);
    }
  };

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
      console.error("[UnlockServices] Services load error:", err);
    }
  };

  const loadPoints = async (vid: string) => {
    try {
      const { data } = await supabase
        .from("reward_points")
        .select("total_points")
        .eq("visitor_id", vid)
        .maybeSingle();

      setCurrentPoints(data?.total_points || 0);
    } catch (err) {
      console.error("[UnlockServices] Points load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlockClick = (service: ServiceCatalogItem) => {
    setSelectedService(service);
    setUnlockDialogOpen(true);
    setPointsInput("");
    setError(null);
  };

  const getServicePath = (serviceKey: string): string => {
    return SERVICE_CONFIG[serviceKey]?.path || "/services/matchmaking";
  };

  const getServiceIcon = (serviceKey: string): React.ReactNode => {
    return SERVICE_CONFIG[serviceKey]?.icon || <Gift className="w-6 h-6" />;
  };

  const handleUnlock = async () => {
    if (!selectedService || !visitorId) return;

    // Now accepts any valid number, not limited to 4 digits
    if (!/^\d+$/.test(pointsInput) || parseInt(pointsInput, 10) <= 0) {
      setError("Please enter a valid points number");
      return;
    }

    const enteredPoints = parseInt(pointsInput, 10);
    setIsValidating(true);
    setError(null);

    try {
      // Verify actual points
      const { data: pointsData } = await supabase
        .from("reward_points")
        .select("total_points")
        .eq("visitor_id", visitorId)
        .maybeSingle();

      const actualPoints = pointsData?.total_points || 0;
      const variance = Math.abs(enteredPoints - actualPoints);

      if (variance > 100) {
        setError("Points verification failed. Please check your RewardFlow balance.");
        setIsValidating(false);
        return;
      }

      if (actualPoints < selectedService.points_required) {
        setError(`Not enough points. You need ${selectedService.points_required} points.`);
        setIsValidating(false);
        return;
      }

      // Navigate to service page
      setUnlockDialogOpen(false);
      toast.success(`Access granted to ${selectedService.service_name}!`);
      navigate(getServicePath(selectedService.service_key));
    } catch (err) {
      console.error("[UnlockServices] Error:", err);
      setError("Verification failed. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const openChat = () => {
    navigate("/");
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openChatWidget'));
    }, 300);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container-institutional py-12 px-4 sm:px-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto text-center mb-12"
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl bg-primary/10">
              <Lock className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Unlock Exclusive Services
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Access verified trade listings, assessments, and market intelligence. 
            Contact details are protected and facilitated by AgriSMES.
          </p>
          {!isLoading && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Gift className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  Your balance: {currentPoints} points
                </span>
              </div>
              
              {/* Admin Access Button */}
              {!isAdmin ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdminLoginDialog(true)}
                  className="gap-2 border-primary/30 text-primary hover:bg-primary/5"
                >
                  <KeyRound className="w-4 h-4" />
                  Admin Access
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-primary font-medium px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 flex items-center gap-1.5">
                    <Shield className="w-3 h-3" />
                    Admin Mode
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      localStorage.removeItem("agrismes_admin_access");
                      localStorage.removeItem("agrismes_admin_token");
                      setIsAdmin(false);
                      setAdminMessages([]);
                      toast.success("Admin session ended");
                    }}
                    className="gap-1.5 text-muted-foreground hover:text-foreground h-8 px-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout
                  </Button>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Admin Control Panel - Only visible to admins */}
        {isAdmin && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.02 }}
            className="max-w-4xl mx-auto mb-8"
          >
            <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/30 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Admin Control Panel
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Button
                  variant="outline"
                  className="flex-col h-auto py-4 gap-2 border-primary/20 hover:bg-primary/5"
                  onClick={() => navigate("/admin/chat-dashboard")}
                >
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <span className="text-xs">Chat Dashboard</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex-col h-auto py-4 gap-2 border-primary/20 hover:bg-primary/5"
                  onClick={() => navigate("/admin/chat-intelligence")}
                >
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <span className="text-xs">Chat Intelligence</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex-col h-auto py-4 gap-2 border-primary/20 hover:bg-primary/5"
                  onClick={() => navigate("/services/matchmaking")}
                >
                  <List className="w-5 h-5 text-primary" />
                  <span className="text-xs">Manage Listings</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex-col h-auto py-4 gap-2 border-primary/20 hover:bg-primary/5"
                  onClick={() => loadAdminMessages()}
                >
                  <Inbox className="w-5 h-5 text-primary" />
                  <span className="text-xs">Refresh Inbox</span>
                </Button>
              </div>
            </div>
          </motion.section>
        )}

        {/* Admin Inbox - Only visible to admins */}
        {isAdmin && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 }}
            className="max-w-4xl mx-auto mb-12"
          >
            <div className="bg-card border border-primary/30 rounded-2xl overflow-hidden shadow-lg">
              <button
                onClick={() => setAdminInboxExpanded(!adminInboxExpanded)}
                className="w-full p-4 sm:p-6 flex items-center justify-between bg-primary/5 hover:bg-primary/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Inbox className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      Admin Inbox
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                        {adminMessages.length}
                      </span>
                    </h2>
                    <p className="text-xs text-muted-foreground">All form submissions (Contact, Listings, Chat Summaries)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      loadAdminMessages();
                    }}
                    className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-4 h-4 text-muted-foreground ${adminInboxLoading ? "animate-spin" : ""}`} />
                  </button>
                  {adminInboxExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {adminInboxExpanded && (
                <div className="border-t border-border">
                  {adminInboxLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : adminMessages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No submissions yet</p>
                      <p className="text-xs mt-1">Form submissions will appear here</p>
                    </div>
                  ) : (
                    <div className="max-h-[500px] overflow-y-auto divide-y divide-border">
                      {adminMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-4 hover:bg-muted/50 transition-colors ${!msg.is_read ? "bg-primary/5" : ""}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  msg.sender_type === "admin" 
                                    ? "bg-primary/10 text-primary" 
                                    : "bg-muted text-muted-foreground"
                                }`}>
                                  {msg.sender_type === "admin" ? "Admin" : "User"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(msg.created_at).toLocaleString()}
                                </span>
                                {!msg.is_read && msg.sender_type === "user" && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        await supabase.functions.invoke("admin-messages", {
                                          body: {
                                            action: "markRead",
                                            adminToken: localStorage.getItem("agrismes_admin_token") || "",
                                            messageId: msg.id,
                                          },
                                        });
                                        loadAdminMessages();
                                      } catch (err) {
                                        console.error("Mark read error:", err);
                                      }
                                    }}
                                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                    Mark read
                                  </button>
                                )}
                                {msg.is_read && msg.sender_type === "user" && (
                                  <span className="flex items-center gap-1 text-xs text-primary">
                                    <CheckCircle className="w-3 h-3" />
                                    Read
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                                {msg.message_text}
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                {msg.listing_id && (
                                  <span>Listing: {msg.listing_id.slice(0, 8)}...</span>
                                )}
                                <span>Visitor: {msg.visitor_id.slice(0, 12)}...</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* User Messaging Box - Visible to all users (for their own messages) */}
        {visitorId && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 }}
            className="max-w-4xl mx-auto mb-12"
          >
            <UserMessagingBox visitorId={visitorId} />
          </motion.section>
        )}

        {/* AI Trade Decision Room - NEW SECTION AT TOP */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="max-w-4xl mx-auto mb-12"
        >
          {(() => {
            const hasVerifiedPoints = currentPoints >= 500;
            const { stage, reviewLikelihood } = calculateTradeReadiness(
              messageCount,
              hasSubmittedListing,
              hasVerifiedPoints
            );
            const briefings = generateAIBriefings(stage);

            return (
              <AITradeDecisionRoom
                stage={stage}
                primaryRisk={briefings.primaryRisk}
                reviewLikelihood={reviewLikelihood}
                doBriefing={briefings.doBriefing}
                dontBriefing={briefings.dontBriefing}
                nextBestAction={briefings.nextBestAction}
                messageCount={messageCount}
                hasSubmittedListing={hasSubmittedListing}
              />
            );
          })()}
        </motion.section>

        {/* Market Insights Panel - AI-powered commodity intelligence */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="max-w-4xl mx-auto mb-12"
        >
          <MarketInsightsPanel />
        </motion.section>

        {/* Why Protected */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-4xl mx-auto mb-12"
        >
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Why Contact Details Are Protected
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
                  <EyeOff className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground text-sm">Privacy First</h3>
                  <p className="text-xs text-muted-foreground">
                    Contact details are never exposed without verification
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground text-sm">Spam Prevention</h3>
                  <p className="text-xs text-muted-foreground">
                    RewardFlow filters low-quality inquiries
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground text-sm">Facilitated Deals</h3>
                  <p className="text-xs text-muted-foreground">
                    AgriSMES manages introductions professionally
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground text-sm">Verified Listings</h3>
                  <p className="text-xs text-muted-foreground">
                    All listings reviewed before publication
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Available Services */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto mb-12"
        >
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Available Exclusive Services
          </h2>
          <div className="grid gap-4">
            {services.map((service, idx) => {
              const canAfford = currentPoints >= service.points_required;

              return (
                <motion.div
                  key={service.service_key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className={`bg-card border rounded-xl p-5 transition-all ${
                    canAfford 
                      ? "border-primary/30 hover:shadow-lg hover:shadow-primary/5" 
                      : "border-border opacity-70"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl shrink-0 ${
                      canAfford ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {getServiceIcon(service.service_key)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">{service.service_name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
                      <div className="flex items-center gap-4 text-xs">
                        <span className={`font-bold ${canAfford ? "text-primary" : "text-muted-foreground"}`}>
                          {service.points_required} points
                        </span>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {service.access_minutes}min access
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleUnlockClick(service)}
                      disabled={!canAfford}
                      className="shrink-0"
                    >
                      {canAfford ? (
                        <>
                          <Unlock className="w-4 h-4 mr-2" />
                          Unlock
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          {service.points_required - currentPoints} more pts
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Trust Anchors */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto mb-12"
        >
          <TrustAnchorGroup variants={["review", "privacy", "integrity"]} />
        </motion.section>

        {/* Scope of Service */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-4xl mx-auto mb-8"
        >
          <ScopeOfService />
        </motion.section>

        {/* Time-based Scarcity & Governance */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="max-w-4xl mx-auto mb-8 space-y-4"
        >
          <ReviewCycleIndicator nextReviewHours={24} />
          <GovernanceFramework />
          <DataOwnershipNotice />
        </motion.section>

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <ChatCTABlock 
            title="Need More Points?"
            description="Engage with our AI Trade Analyst Alex to earn RewardFlow points through meaningful trade discussions."
          />
        </motion.section>
      </main>

      <Footer />

      {/* Unlock Dialog */}
      <Dialog open={unlockDialogOpen} onOpenChange={setUnlockDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlock className="w-5 h-5 text-primary" />
              Unlock with RewardFlow
            </DialogTitle>
            <DialogDescription>
              Enter your RewardFlow points balance to unlock access.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {selectedService && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {getServiceIcon(selectedService.service_key)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{selectedService.service_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedService.points_required} points required</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="points">Your RewardFlow Points Balance</Label>
              <Input
                id="points"
                type="text"
                maxLength={6}
                placeholder="e.g., 500"
                value={pointsInput}
                onChange={(e) => setPointsInput(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-widest font-mono"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button
              onClick={handleUnlock}
              disabled={isValidating || pointsInput.length < 1}
              className="w-full"
            >
              {isValidating ? "Verifying..." : "Unlock Service"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Points are verified against your RewardFlow balance
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Login Dialog */}
      <AdminCodeEntry
        isOpen={showAdminLoginDialog}
        onClose={() => setShowAdminLoginDialog(false)}
        onAdminVerified={() => {
          setIsAdmin(true);
          loadAdminMessages();
          toast.success("Admin access granted!");
        }}
      />
    </div>
  );
}
