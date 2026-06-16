import { Users, UserCheck, Building2, Sprout, ArrowRight } from "lucide-react";

const participantTypes = [
  {
    icon: Sprout,
    title: "Individual Smallholders",
    description: "Farmers with any volume can participate — there are no minimum scale requirements"
  },
  {
    icon: Users,
    title: "Cooperatives & Groups",
    description: "Farmer groups and cooperatives can list collectively to reach larger buyers"
  },
  {
    icon: Building2,
    title: "Aggregators & Processors",
    description: "Businesses that consolidate from multiple sources are welcome"
  },
  {
    icon: UserCheck,
    title: "Individual Traders",
    description: "Independent traders and small exporters can connect with verified partners"
  }
];

export function ScaleFlexibilitySection() {
  return (
    <section className="bg-card border border-border rounded-xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Everyone Is Welcome</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Whether you're a smallholder, cooperative, aggregator, or processor — you can participate.
          </p>
        </div>
      </div>

      {/* Key Message */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <p className="text-sm text-foreground">
          <strong>No minimum scale requirements.</strong> We believe every producer, regardless of size, 
          deserves access to structured markets. Small-scale farmers are not just welcome — they're valued.
        </p>
      </div>

      {/* Participant Types */}
      <div className="grid gap-3 sm:grid-cols-2">
        {participantTypes.map((type) => (
          <div 
            key={type.title}
            className="flex items-start gap-3 p-3 bg-accent/30 rounded-lg"
          >
            <type.icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">{type.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Aggregation Visual */}
      <div className="border border-border rounded-lg p-4 bg-accent/20">
        <h3 className="text-sm font-medium text-foreground mb-3">How Aggregation Works</h3>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
          <div className="flex flex-col items-center p-2">
            <div className="flex -space-x-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs border-2 border-card">👤</div>
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs border-2 border-card">👤</div>
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs border-2 border-card">👤</div>
            </div>
            <span className="text-xs text-muted-foreground">Individual Farmers</span>
          </div>
          
          <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
          <div className="sm:hidden text-muted-foreground text-xs">↓</div>
          
          <div className="flex flex-col items-center p-2">
            <div className="w-10 h-10 rounded-lg bg-primary/30 flex items-center justify-center mb-1">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Cooperative/Group</span>
          </div>
          
          <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
          <div className="sm:hidden text-muted-foreground text-xs">↓</div>
          
          <div className="flex flex-col items-center p-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center mb-1">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Market Access</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Small producers can pool resources and reach buyers who need larger volumes.
        </p>
      </div>

      {/* Inclusive Language Banner */}
      <div className="text-center text-sm text-muted-foreground bg-muted/30 rounded-lg py-3 px-4">
        "Whether you farm one hectare or manage a large cooperative, 
        you belong here."
      </div>
    </section>
  );
}
