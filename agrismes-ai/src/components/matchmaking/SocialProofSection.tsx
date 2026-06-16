import { Quote, Users, CheckCircle, TrendingUp } from "lucide-react";

const testimonials = [
  {
    quote: "I was worried buyers wouldn't take me seriously as a small farmer. AgriSMES helped me connect with a cooperative, and together we reached an exporter who needed exactly what we grow.",
    attribution: "Smallholder farmer, East Africa",
    type: "scale"
  },
  {
    quote: "My biggest fear was non-payment. The platform helped us agree on payment-on-delivery terms for the first transaction. Now we've completed three trades with the same buyer.",
    attribution: "Cooperative leader",
    type: "trust"
  },
  {
    quote: "I didn't have formal business records. AgriSMES accepted references from my local agricultural officer and past buyers. That's how I started building my profile.",
    attribution: "Individual trader",
    type: "accessibility"
  }
];

const progressIndicators = [
  { label: "Active Listings", value: "100+", icon: TrendingUp },
  { label: "Verified Participants", value: "250+", icon: CheckCircle },
  { label: "Countries Represented", value: "5+", icon: Users }
];

export function SocialProofSection() {
  return (
    <section className="bg-card border border-border rounded-xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Quote className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">From Our Community</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Experiences from small and mid-scale participants.
          </p>
        </div>
      </div>

      {/* Testimonials */}
      <div className="grid gap-4 sm:grid-cols-3">
        {testimonials.map((item, index) => (
          <div 
            key={index}
            className="bg-accent/30 rounded-lg p-4 flex flex-col"
          >
            <Quote className="w-4 h-4 text-primary/40 mb-2" />
            <p className="text-sm text-foreground flex-1 italic">
              "{item.quote}"
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              — {item.attribution}
            </p>
          </div>
        ))}
      </div>

      {/* Progress Indicators */}
      <div className="border-t border-border pt-4">
        <div className="flex flex-wrap justify-center gap-6">
          {progressIndicators.map((item) => (
            <div key={item.label} className="text-center">
              <div className="flex items-center justify-center gap-1 text-primary">
                <item.icon className="w-4 h-4" />
                <span className="text-xl font-bold">{item.value}</span>
              </div>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-3 italic">
          These are indicative figures, not guarantees of outcomes.
        </p>
      </div>

      {/* Trust-Focused Note */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
        <p className="text-sm text-foreground">
          Every participant starts somewhere. Your credibility grows with each 
          positive engagement — regardless of your starting scale.
        </p>
      </div>
    </section>
  );
}
