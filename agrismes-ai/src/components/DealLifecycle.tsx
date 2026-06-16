import React from "react";
import { 
  Clock, 
  Search, 
  Users, 
  Calendar, 
  MessageSquare, 
  CheckCircle, 
  Archive,
  AlertCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type DealStatus = 
  | "inquiry_received"
  | "under_review"
  | "match_identified"
  | "meeting_scheduled"
  | "in_negotiation"
  | "closed"
  | "archived";

interface DealStatusConfig {
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  userVisible: boolean;
}

const DEAL_STATUSES: Record<DealStatus, DealStatusConfig> = {
  inquiry_received: {
    label: "Inquiry Received",
    description: "Your inquiry has been received and logged.",
    icon: <Clock className="w-4 h-4" />,
    color: "bg-muted text-muted-foreground",
    userVisible: true,
  },
  under_review: {
    label: "Under Review",
    description: "An AgriSMES trade analyst is reviewing your request.",
    icon: <Search className="w-4 h-4" />,
    color: "bg-primary/10 text-primary",
    userVisible: true,
  },
  match_identified: {
    label: "Match Identified",
    description: "A potential match has been identified for your request.",
    icon: <Users className="w-4 h-4" />,
    color: "bg-primary/20 text-primary",
    userVisible: true,
  },
  meeting_scheduled: {
    label: "Meeting Scheduled",
    description: "A meeting with AgriSMES has been scheduled.",
    icon: <Calendar className="w-4 h-4" />,
    color: "bg-accent text-accent-foreground",
    userVisible: true,
  },
  in_negotiation: {
    label: "In Progress",
    description: "Discussions are ongoing.",
    icon: <MessageSquare className="w-4 h-4" />,
    color: "bg-primary text-primary-foreground",
    userVisible: true,
  },
  closed: {
    label: "Completed",
    description: "This inquiry has been completed.",
    icon: <CheckCircle className="w-4 h-4" />,
    color: "bg-green-500/10 text-green-600",
    userVisible: true,
  },
  archived: {
    label: "Archived",
    description: "This inquiry has been archived.",
    icon: <Archive className="w-4 h-4" />,
    color: "bg-muted text-muted-foreground",
    userVisible: false,
  },
};

interface DealStatusBadgeProps {
  status: DealStatus;
  showDescription?: boolean;
  className?: string;
}

export function DealStatusBadge({ status, showDescription = false, className }: DealStatusBadgeProps) {
  const config = DEAL_STATUSES[status];
  
  if (!config.userVisible) return null;

  return (
    <div className={cn("space-y-1", className)}>
      <Badge variant="outline" className={cn("gap-1.5", config.color)}>
        {config.icon}
        <span>{config.label}</span>
      </Badge>
      {showDescription && (
        <p className="text-xs text-muted-foreground">{config.description}</p>
      )}
    </div>
  );
}

// Timeline view for deal progression
interface DealTimelineProps {
  currentStatus: DealStatus;
  className?: string;
}

export function DealTimeline({ currentStatus, className }: DealTimelineProps) {
  const visibleStatuses = Object.entries(DEAL_STATUSES)
    .filter(([_, config]) => config.userVisible)
    .map(([key]) => key as DealStatus);
  
  const currentIndex = visibleStatuses.indexOf(currentStatus);

  return (
    <div className={cn("space-y-3", className)}>
      <h4 className="text-sm font-medium text-foreground">Deal Progress</h4>
      <div className="relative">
        {visibleStatuses.map((status, index) => {
          const config = DEAL_STATUSES[status];
          const isCompleted = index < currentIndex;
          const isCurrent = status === currentStatus;
          
          return (
            <div key={status} className="flex items-start gap-3 pb-4 last:pb-0">
              {/* Timeline connector */}
              <div className="relative flex flex-col items-center">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                  isCompleted ? "bg-primary text-primary-foreground" :
                  isCurrent ? "bg-primary/20 text-primary ring-2 ring-primary" :
                  "bg-muted text-muted-foreground"
                )}>
                  {isCompleted ? <CheckCircle className="w-3.5 h-3.5" /> : config.icon}
                </div>
                {index < visibleStatuses.length - 1 && (
                  <div className={cn(
                    "w-0.5 h-full min-h-[24px] mt-1",
                    isCompleted ? "bg-primary" : "bg-border"
                  )} />
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p className={cn(
                  "text-sm font-medium",
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                )}>
                  {config.label}
                </p>
                {isCurrent && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {config.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Review cycle indicator
interface ReviewCycleIndicatorProps {
  nextReviewHours?: number;
  className?: string;
}

export function ReviewCycleIndicator({ nextReviewHours = 24, className }: ReviewCycleIndicatorProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2",
      className
    )}>
      <Clock className="w-3.5 h-3.5" />
      <span>
        Listings are reviewed in cycles. Next review window in approximately {nextReviewHours} hours.
      </span>
    </div>
  );
}

// High interest warning
interface HighInterestNoticeProps {
  className?: string;
}

export function HighInterestNotice({ className }: HighInterestNoticeProps) {
  return (
    <div className={cn(
      "flex items-start gap-2 text-xs bg-accent/30 border border-border rounded-lg px-3 py-2",
      className
    )}>
      <AlertCircle className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
      <span className="text-muted-foreground">
        High-interest listings may expire. Priority is given to verified, complete submissions.
      </span>
    </div>
  );
}
