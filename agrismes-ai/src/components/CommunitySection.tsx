/**
 * CommunitySection Component
 * Links to community resources and sustainability initiatives
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Globe, Leaf, Shield, ArrowRight, 
  BookOpen, MessageCircle 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const COMMUNITY_LINKS = [
  {
    icon: Users,
    title: "For Buyers & Importers",
    description: "Access verified suppliers and quality assurance",
    href: "/buyers-importers",
    badge: null
  },
  {
    icon: Globe,
    title: "For SME Suppliers",
    description: "Learn export readiness and market access",
    href: "/starting-as-supplier-agent",
    badge: null
  },
  {
    icon: Leaf,
    title: "Climate Resilience",
    description: "Sustainable sourcing and climate adaptation",
    href: "/commodities-climate-resilience",
    badge: "New"
  },
  {
    icon: BookOpen,
    title: "Readiness Assessment",
    description: "Check your export readiness level",
    href: "/readiness-check",
    badge: null
  }
];

interface CommunitySectionProps {
  className?: string;
}

export function CommunitySection({ className = "" }: CommunitySectionProps) {
  const navigate = useNavigate();

  const handleChatWithAlex = () => {
    window.dispatchEvent(new CustomEvent("openChatWidget"));
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Our Community
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {COMMUNITY_LINKS.map((link, index) => (
          <button
            key={index}
            onClick={() => navigate(link.href)}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <link.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {link.title}
                </span>
                {link.badge && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {link.badge}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {link.description}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        ))}

        <div className="pt-3 border-t border-border">
          <Button 
            variant="outline" 
            className="w-full justify-center gap-2"
            onClick={handleChatWithAlex}
          >
            <MessageCircle className="h-4 w-4" />
            Chat with Alex AI
          </Button>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Get instant answers about trade, sourcing, and readiness
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
