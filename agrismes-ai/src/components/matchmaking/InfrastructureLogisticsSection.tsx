import { Truck, Warehouse, Ship, ArrowRight, Package, MapPin } from "lucide-react";

export function InfrastructureLogisticsSection() {
  return (
    <section className="bg-card border border-border rounded-xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Truck className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Infrastructure & Logistics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Addressing storage, transport, and delivery challenges through coordination.
          </p>
        </div>
      </div>

      {/* How We Address Challenges */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="p-4 bg-accent/30 rounded-lg text-center">
          <Warehouse className="w-6 h-6 text-primary mx-auto mb-2" />
          <h3 className="text-sm font-medium text-foreground">Storage</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Connection to verified warehousing facilities when needed
          </p>
        </div>
        <div className="p-4 bg-accent/30 rounded-lg text-center">
          <Truck className="w-6 h-6 text-primary mx-auto mb-2" />
          <h3 className="text-sm font-medium text-foreground">Transport</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Coordination with logistics providers for domestic and export movement
          </p>
        </div>
        <div className="p-4 bg-accent/30 rounded-lg text-center">
          <Ship className="w-6 h-6 text-primary mx-auto mb-2" />
          <h3 className="text-sm font-medium text-foreground">Export</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Support for customs clearance and port handling requirements
          </p>
        </div>
      </div>

      {/* Goods Flow Diagram */}
      <div className="border border-border rounded-lg p-4 bg-muted/20">
        <h3 className="text-sm font-medium text-foreground mb-4 text-center">How Goods Flow From Producer to Buyer</h3>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
          {/* Producer */}
          <div className="flex flex-col items-center text-center px-2">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-1">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-medium text-foreground">Producer</span>
            <span className="text-[10px] text-muted-foreground">Farm/Cooperative</span>
          </div>

          <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
          <div className="sm:hidden text-muted-foreground">↓</div>

          {/* Collection */}
          <div className="flex flex-col items-center text-center px-2">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-1">
              <Package className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-xs font-medium text-foreground">Collection</span>
            <span className="text-[10px] text-muted-foreground">Aggregation Point</span>
          </div>

          <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
          <div className="sm:hidden text-muted-foreground">↓</div>

          {/* Warehouse */}
          <div className="flex flex-col items-center text-center px-2">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-1">
              <Warehouse className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-xs font-medium text-foreground">Storage</span>
            <span className="text-[10px] text-muted-foreground">Verified Warehouse</span>
          </div>

          <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
          <div className="sm:hidden text-muted-foreground">↓</div>

          {/* Transport */}
          <div className="flex flex-col items-center text-center px-2">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-1">
              <Truck className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-xs font-medium text-foreground">Transport</span>
            <span className="text-[10px] text-muted-foreground">Logistics Partner</span>
          </div>

          <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
          <div className="sm:hidden text-muted-foreground">↓</div>

          {/* Buyer */}
          <div className="flex flex-col items-center text-center px-2">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mb-1">
              <Ship className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xs font-medium text-foreground">Buyer</span>
            <span className="text-[10px] text-muted-foreground">Export/Local Market</span>
          </div>
        </div>
      </div>

      {/* Shared Infrastructure Note */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <p className="text-sm text-foreground">
          <strong>Shared Infrastructure:</strong> Smaller producers can share warehouse space and 
          transport costs through group aggregation. This makes logistics affordable even for 
          low-volume participants.
        </p>
      </div>
    </section>
  );
}
