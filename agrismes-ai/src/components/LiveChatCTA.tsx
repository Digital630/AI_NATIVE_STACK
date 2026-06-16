import React from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LiveChatCTAProps {
  variant?: "default" | "prominent" | "inline" | "minimal";
  text?: string;
  className?: string;
}

export function LiveChatCTA({ 
  variant = "default", 
  text = "Discuss this with Alex now",
  className 
}: LiveChatCTAProps) {
  const navigate = useNavigate();

  const handleOpenChat = () => {
    // If not on home page, navigate first
    if (window.location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("openChatWidget"));
      }, 500);
    } else {
      window.dispatchEvent(new CustomEvent("openChatWidget"));
    }
  };

  if (variant === "prominent") {
    return (
      <Button
        onClick={handleOpenChat}
        size="lg"
        className={cn("gap-2 text-base", className)}
      >
        <MessageSquare className="w-5 h-5" />
        {text}
        <ArrowRight className="w-4 h-4" />
      </Button>
    );
  }

  if (variant === "inline") {
    return (
      <button
        onClick={handleOpenChat}
        className={cn(
          "inline-flex items-center gap-1 text-primary hover:text-primary/80 font-medium transition-colors",
          className
        )}
      >
        <MessageSquare className="w-4 h-4" />
        {text}
      </button>
    );
  }

  if (variant === "minimal") {
    return (
      <button
        onClick={handleOpenChat}
        className={cn(
          "text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-2 hover:underline",
          className
        )}
      >
        {text}
      </button>
    );
  }

  return (
    <Button
      onClick={handleOpenChat}
      variant="outline"
      className={cn("gap-2", className)}
    >
      <MessageSquare className="w-4 h-4" />
      {text}
    </Button>
  );
}

// Continue in Live Chat - alternative phrasing
export function ContinueInChatCTA({ className }: { className?: string }) {
  return (
    <LiveChatCTA
      variant="default"
      text="Continue in Live Chat"
      className={className}
    />
  );
}

// Section-specific CTA block
interface ChatCTABlockProps {
  title?: string;
  description?: string;
  className?: string;
}

export function ChatCTABlock({ 
  title = "Need Guidance?",
  description = "Our AI assistant Alex can help you navigate this section and answer your questions.",
  className 
}: ChatCTABlockProps) {
  return (
    <div className={cn(
      "bg-primary/5 border border-primary/20 rounded-xl p-4 md:p-6",
      className
    )}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <LiveChatCTA variant="prominent" text="Discuss with Alex" />
      </div>
    </div>
  );
}
