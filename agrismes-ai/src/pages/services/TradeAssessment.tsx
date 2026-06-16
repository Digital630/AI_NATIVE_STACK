import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  Timer,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ClipboardCheck,
  Package,
  Globe,
  ShieldCheck,
  FileCheck,
  TrendingUp,
  Download,
  RefreshCw,
  MessageSquare,
  Calendar,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const VISITOR_ID_KEY = "agrismes_visitor_id";

interface AssessmentData {
  businessName: string;
  country: string;
  commodity: string;
  exportExperience: string;
  currentChallenges: string;
  targetMarkets: string;
  certifications: string[];
  annualVolume: string;
}

const CERTIFICATIONS = [
  "Global GAP",
  "Organic",
  "Fair Trade",
  "Rainforest Alliance",
  "ISO 22000",
  "HACCP",
  "BRC",
  "None",
];

export default function TradeAssessment() {
  const navigate = useNavigate();
  const [visitorId, setVisitorId] = useState("");
  const [activeService, setActiveService] = useState<{
    expires_at: string;
    access_minutes: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const [formData, setFormData] = useState<AssessmentData>({
    businessName: "",
    country: "",
    commodity: "",
    exportExperience: "",
    currentChallenges: "",
    targetMarkets: "",
    certifications: [],
    annualVolume: "",
  });

  useEffect(() => {
    const storedVisitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (storedVisitorId) {
      setVisitorId(storedVisitorId);
      checkAccess(storedVisitorId);
    } else {
      setIsLoading(false);
      setIsExpired(true);
    }
  }, []);

  useEffect(() => {
    if (!activeService) return;

    const interval = setInterval(() => {
      const now = new Date();
      const expiry = new Date(activeService.expires_at);
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining("Session Expired");
        clearInterval(interval);
        return;
      }

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeService]);

  const checkAccess = async (vid: string) => {
    try {
      const { data } = await supabase
        .from("redeemed_services")
        .select("*")
        .eq("visitor_id", vid)
        .in("service_type", ["trade_consultation", "trade_consultation_premium"])
        .eq("is_active", true)
        .gte("access_expires_at", new Date().toISOString())
        .order("access_expires_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setActiveService({
          expires_at: data[0].access_expires_at,
          access_minutes: data[0].access_minutes,
        });
      } else {
        setIsExpired(true);
      }
    } catch (err) {
      console.error("[TradeAssessment] Access check error:", err);
      setIsExpired(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCertificationToggle = (cert: string) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter((c) => c !== cert)
        : [...prev.certifications, cert],
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setIsComplete(true);
    setIsSubmitting(false);
    toast.success("Assessment submitted! Our team will review and contact you.");
  };

  const progress = (step / 4) * 100;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (isExpired && !isComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Session Expired</h1>
          <p className="text-muted-foreground mb-6">
            Your trade assessment session has ended. Would you like to redeem more points for another session?
          </p>
          <div className="space-y-3">
            <Button onClick={() => navigate("/")} className="w-full gap-2">
              <RefreshCw className="w-4 h-4" />
              Earn More Points
            </Button>
            <Button variant="outline" onClick={() => navigate("/")} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleContactAgriSMES = () => {
    navigate("/");
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openChatWidget'));
    }, 500);
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </motion.div>
          <h1 className="text-2xl font-semibold mb-2">Assessment Complete!</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for completing the Trade Readiness Assessment. To receive your 
            personalized report, please <strong>schedule a meeting with AgriSMES</strong>.
          </p>
          <div className="bg-accent/50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium mb-2">What happens next?</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                AgriSMES schedules a consultation meeting
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                Our trade experts analyze your profile
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                Personalized recommendations discussed via call
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <Button onClick={handleContactAgriSMES} className="w-full gap-2">
              <MessageSquare className="w-4 h-4" />
              Contact AgriSMES for Guidance
            </Button>
            <Button variant="outline" onClick={() => navigate("/")} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Timer */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Exit
            </Button>
            
            <h1 className="font-semibold hidden sm:block">Trade Assessment</h1>

            <motion.div
              animate={
                parseInt(timeRemaining.split(":")[0]) <= 2
                  ? { scale: [1, 1.05, 1] }
                  : {}
              }
              transition={{ repeat: Infinity, duration: 1 }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                parseInt(timeRemaining.split(":")[0]) <= 2
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary"
              }`}
            >
              <Timer className="w-4 h-4" />
              <span className="font-mono font-medium">{timeRemaining}</span>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Step {step} of 4</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step 1: Business Info */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClipboardCheck className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Business Information</h2>
              <p className="text-muted-foreground text-sm">
                Tell us about your agribusiness
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Business/Cooperative Name *</Label>
                <Input
                  value={formData.businessName}
                  onChange={(e) =>
                    setFormData({ ...formData, businessName: e.target.value })
                  }
                  placeholder="e.g., Kilimanjaro Coffee Cooperative"
                />
              </div>

              <div>
                <Label>Country *</Label>
                <Input
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  placeholder="e.g., Tanzania"
                />
              </div>

              <div>
                <Label>Primary Commodity *</Label>
                <Input
                  value={formData.commodity}
                  onChange={(e) =>
                    setFormData({ ...formData, commodity: e.target.value })
                  }
                  placeholder="e.g., Arabica Coffee"
                />
              </div>
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={
                !formData.businessName ||
                !formData.country ||
                !formData.commodity
              }
              className="w-full"
            >
              Continue
            </Button>
          </motion.div>
        )}

        {/* Step 2: Export Experience */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Export Experience</h2>
              <p className="text-muted-foreground text-sm">
                Help us understand your trade background
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Export Experience *</Label>
                <Textarea
                  value={formData.exportExperience}
                  onChange={(e) =>
                    setFormData({ ...formData, exportExperience: e.target.value })
                  }
                  placeholder="Describe your current or past export activities..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Target Markets *</Label>
                <Input
                  value={formData.targetMarkets}
                  onChange={(e) =>
                    setFormData({ ...formData, targetMarkets: e.target.value })
                  }
                  placeholder="e.g., Europe, Middle East, Asia"
                />
              </div>

              <div>
                <Label>Annual Volume (MT)</Label>
                <Input
                  value={formData.annualVolume}
                  onChange={(e) =>
                    setFormData({ ...formData, annualVolume: e.target.value })
                  }
                  placeholder="e.g., 50-100"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!formData.exportExperience || !formData.targetMarkets}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Certifications */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Certifications</h2>
              <p className="text-muted-foreground text-sm">
                Select all certifications you currently hold
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {CERTIFICATIONS.map((cert) => (
                <button
                  key={cert}
                  onClick={() => handleCertificationToggle(cert)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    formData.certifications.includes(cert)
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center ${
                        formData.certifications.includes(cert)
                          ? "bg-primary border-primary"
                          : "border-border"
                      }`}
                    >
                      {formData.certifications.includes(cert) && (
                        <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                      )}
                    </div>
                    <span className="text-sm">{cert}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(4)} className="flex-1">
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Challenges & Review */}
        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileCheck className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Final Details</h2>
              <p className="text-muted-foreground text-sm">
                Tell us about your challenges
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Current Challenges *</Label>
                <Textarea
                  value={formData.currentChallenges}
                  onChange={(e) =>
                    setFormData({ ...formData, currentChallenges: e.target.value })
                  }
                  placeholder="What are the main obstacles you face in exporting your commodities?"
                  rows={4}
                />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-accent/50 rounded-lg p-4 space-y-2 text-sm">
              <h4 className="font-medium">Assessment Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                <span>Business:</span>
                <span className="text-foreground">{formData.businessName}</span>
                <span>Commodity:</span>
                <span className="text-foreground">{formData.commodity}</span>
                <span>Markets:</span>
                <span className="text-foreground">{formData.targetMarkets}</span>
                <span>Certifications:</span>
                <span className="text-foreground">
                  {formData.certifications.length > 0
                    ? formData.certifications.join(", ")
                    : "None"}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.currentChallenges || isSubmitting}
                className="flex-1 gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Submit Assessment
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
