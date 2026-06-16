/**
 * Non-invasive chat analytics for internal engagement analysis.
 * Tracks anonymized chat events without storing transcripts.
 */

// Session storage keys for analytics
const CHAT_ANALYTICS_KEY = "agrismes_chat_analytics";

interface ChatAnalyticsData {
  chatOpenedAt: number | null;
  firstMessageSentAt: number | null;
  messageCount: number;
  languageDetected: string | null;
}

// Get or initialize analytics data for current session
const getAnalyticsData = (): ChatAnalyticsData => {
  if (typeof window === "undefined") {
    return { chatOpenedAt: null, firstMessageSentAt: null, messageCount: 0, languageDetected: null };
  }
  
  try {
    const stored = sessionStorage.getItem(CHAT_ANALYTICS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    // Silently fail
  }
  
  return { chatOpenedAt: null, firstMessageSentAt: null, messageCount: 0, languageDetected: null };
};

// Save analytics data to session storage
const saveAnalyticsData = (data: ChatAnalyticsData): void => {
  if (typeof window === "undefined") return;
  
  try {
    sessionStorage.setItem(CHAT_ANALYTICS_KEY, JSON.stringify(data));
  } catch (e) {
    // Silently fail
  }
};

// Send analytics event (non-blocking, fire-and-forget)
const sendAnalyticsEvent = (eventName: string, properties: Record<string, any>): void => {
  if (typeof window === "undefined") return;
  
  // Use sendBeacon for non-blocking delivery (or fallback to console for now)
  // This can be extended to send to an analytics endpoint
  console.debug(`[ChatAnalytics] ${eventName}:`, properties);
  
  // Dispatch custom event for external analytics listeners
  try {
    window.dispatchEvent(new CustomEvent("chatAnalyticsEvent", {
      detail: { eventName, properties, timestamp: Date.now() }
    }));
  } catch (e) {
    // Silently fail
  }
};

/**
 * Track when chat widget is opened
 */
export const trackChatOpened = (): void => {
  const data = getAnalyticsData();
  const now = Date.now();
  
  // Only track first open per session
  if (!data.chatOpenedAt) {
    data.chatOpenedAt = now;
    saveAnalyticsData(data);
    
    sendAnalyticsEvent("chat_opened", {
      timestamp: now,
      page: typeof window !== "undefined" ? window.location.pathname : "/",
    });
  }
};

/**
 * Track when user sends a message
 * Returns whether this was the first message
 */
export const trackMessageSent = (language: string): boolean => {
  const data = getAnalyticsData();
  const now = Date.now();
  const isFirstMessage = data.messageCount === 0;
  
  data.messageCount += 1;
  
  // Track first message specifically
  if (isFirstMessage) {
    data.firstMessageSentAt = now;
    
    sendAnalyticsEvent("chat_first_message_sent", {
      timestamp: now,
      language,
      page: typeof window !== "undefined" ? window.location.pathname : "/",
    });
  }
  
  // Update language detection (use latest detected)
  data.languageDetected = language;
  
  saveAnalyticsData(data);
  
  // Also emit message count update
  sendAnalyticsEvent("chat_message_count", {
    count: data.messageCount,
  });
  
  // Emit language detection if it changed
  sendAnalyticsEvent("chat_language_detected", {
    language,
  });
  
  return isFirstMessage;
};

/**
 * Track chat duration when widget is closed
 */
export const trackChatClosed = (): void => {
  const data = getAnalyticsData();
  
  if (data.chatOpenedAt) {
    const durationSeconds = Math.round((Date.now() - data.chatOpenedAt) / 1000);
    
    sendAnalyticsEvent("chat_duration_seconds", {
      duration: durationSeconds,
      messageCount: data.messageCount,
      languageDetected: data.languageDetected,
      hadConversation: data.messageCount > 0,
    });
  }
};

/**
 * Get current analytics summary for internal use
 */
export const getChatAnalyticsSummary = (): {
  chatOpened: boolean;
  firstMessageSent: boolean;
  messageCount: number;
  languageDetected: string | null;
  durationSeconds: number;
} => {
  const data = getAnalyticsData();
  const durationSeconds = data.chatOpenedAt 
    ? Math.round((Date.now() - data.chatOpenedAt) / 1000) 
    : 0;
  
  return {
    chatOpened: data.chatOpenedAt !== null,
    firstMessageSent: data.firstMessageSentAt !== null,
    messageCount: data.messageCount,
    languageDetected: data.languageDetected,
    durationSeconds,
  };
};

/**
 * Reset analytics for new session (optional, for testing)
 */
export const resetChatAnalytics = (): void => {
  if (typeof window === "undefined") return;
  
  try {
    sessionStorage.removeItem(CHAT_ANALYTICS_KEY);
  } catch (e) {
    // Silently fail
  }
};
