import React from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AlexChatCTAProps {
  className?: string;
}

/**
 * End-of-page CTA component that opens the chat widget
 * Used at the bottom of every public page
 */
export function AlexChatCTA({ className }: AlexChatCTAProps) {
  const openChat = () => {
    const chatButton = document.querySelector(
      '[aria-label="Open chat"], [aria-label="Close chat"], .chat-widget-trigger'
    ) as HTMLElement;
    if (chatButton) chatButton.click();
  };

  return (
    <section className={`py-12 md:py-16 bg-muted/30 border-t border-border ${className || ''}`}>
      <div className="container-institutional px-6 text-center">
        <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">
          Need more help?
        </h3>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-6 text-sm md:text-base">
          Chat with our customer service assistant Alex to discuss commodities, 
          quality control, exporter readiness, importer sourcing, or trade requirements.
        </p>
        <Button 
          onClick={openChat}
          size="lg"
          className="gap-2"
        >
          <MessageSquare className="h-5 w-5" />
          Chat with Alex
        </Button>
      </div>
    </section>
  );
}

export default AlexChatCTA;
