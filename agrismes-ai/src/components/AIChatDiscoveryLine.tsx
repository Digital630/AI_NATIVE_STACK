/**
 * AgriSMES AI Live Chat - Institutional Header Link
 * 
 * A simple, static navigation link that opens the AI chat widget.
 * Styled to match other header navigation items with CRDB green color.
 * No animation - treated as a standard guidance/support entry point.
 */
const AIChatDiscoveryLine = () => {
  const handleClick = () => {
    // Try to find and click the chat widget launcher
    const chatButton = document.querySelector('[aria-label="Open chat"], [aria-label="Close chat"], [aria-label="Chat with us"], .chat-widget-trigger') as HTMLElement;
    if (chatButton) {
      chatButton.click();
    }
  };

  return (
    <button
      onClick={handleClick}
      className="text-primary hover:text-primary/80 font-medium transition-colors cursor-pointer bg-transparent border-none outline-none whitespace-nowrap"
      aria-label="Open AgriSMES AI Live Chat for guidance"
    >
      AgriSMES AI Live Chat
    </button>
  );
};

export default AIChatDiscoveryLine;
