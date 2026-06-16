import React from "react";
import { Shield, Eye, UserCheck, FileCheck, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

type TrustAnchorVariant = "review" | "privacy" | "integrity" | "oversight" | "scope";

interface TrustAnchorProps {
  variant: TrustAnchorVariant;
  className?: string;
  compact?: boolean;
}

const TRUST_ANCHORS: Record<TrustAnchorVariant, { icon: React.ReactNode; text: string }> = {
  review: {
    icon: <FileCheck className="w-4 h-4" />,
    text: "All listings are reviewed by AgriSMES before any introduction.",
  },
  privacy: {
    icon: <Shield className="w-4 h-4" />,
    text: "Direct contact is never shared without human verification.",
  },
  integrity: {
    icon: <Scale className="w-4 h-4" />,
    text: "AgriSMES prioritizes risk reduction and trade integrity.",
  },
  oversight: {
    icon: <UserCheck className="w-4 h-4" />,
    text: "An AgriSMES trade analyst reviews this.",
  },
  scope: {
    icon: <Eye className="w-4 h-4" />,
    text: "AgriSMES facilitates introductions — final terms remain between counterparties.",
  },
};

export function TrustAnchor({ variant, className, compact = false }: TrustAnchorProps) {
  const anchor = TRUST_ANCHORS[variant];

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
        <span className="text-primary/70">{anchor.icon}</span>
        <span>{anchor.text}</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg bg-accent/30 border border-border",
      className
    )}>
      <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0">
        {anchor.icon}
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {anchor.text}
      </p>
    </div>
  );
}

interface TrustAnchorGroupProps {
  variants: TrustAnchorVariant[];
  className?: string;
  compact?: boolean;
}

export function TrustAnchorGroup({ variants, className, compact = false }: TrustAnchorGroupProps) {
  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        {variants.map((variant) => (
          <TrustAnchor key={variant} variant={variant} compact />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {variants.map((variant) => (
        <TrustAnchor key={variant} variant={variant} />
      ))}
    </div>
  );
}

// Scope of Service component for liability boundaries
export function ScopeOfService({ className }: { className?: string }) {
  return (
    <div className={cn(
      "p-4 rounded-lg bg-muted/50 border border-border space-y-3",
      className
    )}>
      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Scale className="w-4 h-4 text-primary" />
        Scope of Service
      </h4>
      <ul className="text-xs text-muted-foreground space-y-2">
        <li className="flex items-start gap-2">
          <span className="text-primary mt-0.5">•</span>
          <span>AgriSMES facilitates structured introductions, assessments, and trade readiness.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-primary mt-0.5">•</span>
          <span>AgriSMES is not a party to commercial contracts unless explicitly stated.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-primary mt-0.5">•</span>
          <span>Final commercial terms remain between counterparties.</span>
        </li>
      </ul>
    </div>
  );
}

// Human Oversight indicator
export function HumanOversightBadge({ className }: { className?: string }) {
  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium",
      className
    )}>
      <UserCheck className="w-3 h-3" />
      <span>Human-reviewed</span>
    </div>
  );
}

// Data Ownership statement
export function DataOwnershipNotice({ className }: { className?: string }) {
  return (
    <div className={cn(
      "p-3 rounded-lg bg-accent/30 border border-border",
      className
    )}>
      <p className="text-xs text-muted-foreground">
        <strong className="text-foreground">Data Ownership:</strong> Users retain ownership of uploaded documents. 
        Documents are used solely for trade evaluation. Access is restricted to AgriSMES admin. 
        Retention follows internal compliance policy.
      </p>
    </div>
  );
}

// Governance Framework statement
export function GovernanceFramework({ className }: { className?: string }) {
  return (
    <div className={cn(
      "p-3 rounded-lg bg-muted/50 border border-border",
      className
    )}>
      <p className="text-xs text-muted-foreground">
        AgriSMES operates under an international governance framework. 
        Platform governance and data handling align with applicable regulations 
        depending on jurisdiction of registration and operation.
      </p>
    </div>
  );
}
