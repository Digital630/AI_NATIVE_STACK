import { Shield, CheckCircle, Star, Users, TrendingUp, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const credibilityIndicators = [
  {
    icon: CheckCircle,
    title: "Delivery Consistency",
    description: "Track record of fulfilling commitments on time and as agreed"
  },
  {
    icon: Users,
    title: "References & Referrals",
    description: "Recommendations from previous trade partners or cooperatives"
  },
  {
    icon: TrendingUp,
    title: "Engagement History",
    description: "Active participation and responsiveness on the platform"
  },
  {
    icon: Award,
    title: "Quality Track Record",
    description: "Consistent product quality based on past transactions"
  }
];

const trustBuildingSteps = [
  {
    step: 1,
    title: "Create Your Profile",
    description: "No formal records required. Start with basic information about you or your group."
  },
  {
    step: 2,
    title: "Share References",
    description: "Provide contacts who can vouch for you — local leaders, past buyers, or cooperative members."
  },
  {
    step: 3,
    title: "Submit Samples",
    description: "When possible, share product samples to demonstrate quality standards."
  },
  {
    step: 4,
    title: "Build Engagement",
    description: "Respond promptly and follow through on commitments to grow your reputation."
  }
];

export function TrustVerificationSection() {
  return (
    <section className="bg-card border border-border rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Trust & Verification</h2>
          <p className="text-sm text-muted-foreground mt-1">
            We assess participants based on practical credibility — not formal credit histories or audited financials.
          </p>
        </div>
      </div>

      {/* Key Message */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <p className="text-sm text-foreground">
          <strong>No bank statements or formal audits required.</strong> We understand that many 
          smallholders and agribusinesses operate outside formal banking systems. Our verification 
          focuses on real-world indicators of reliability.
        </p>
      </div>

      {/* Credibility Indicators */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">What We Consider</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {credibilityIndicators.map((indicator) => (
            <div 
              key={indicator.title}
              className="flex items-start gap-3 p-3 bg-accent/30 rounded-lg"
            >
              <indicator.icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">{indicator.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{indicator.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How to Build Credibility */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">How to Build Credibility Over Time</h3>
        <div className="space-y-3">
          {trustBuildingSteps.map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Levels (Illustrative) */}
      <div className="border-t border-border pt-4">
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
          <Star className="w-3 h-3" />
          Illustrative Trust Levels
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
            New Participant
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-accent text-foreground">
            Verified Profile
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
            Established Trader
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-2 italic">
          These levels are illustrative. Your credibility grows with each successful engagement.
        </p>
      </div>
    </section>
  );
}
