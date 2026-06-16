import React, { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  Send, 
  Loader2, 
  Bot, 
  User, 
  ArrowLeft, 
  Camera, 
  Mic, 
  MicOff,
  Scale,
  Droplets,
  ClipboardCheck,
  Microscope
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useTypewriterPlaceholder } from "@/hooks/useTypewriterPlaceholder";
import { useSmartTyping } from "@/hooks/useSmartTyping";
import { MoistureContentAnalysis } from "@/components/MoistureContentAnalysis";
import { WeightScaleAnalysis } from "@/components/WeightScaleAnalysis";
import { QualityControlAnalysis } from "@/components/QualityControlAnalysis";
import { AnalysisHub } from "@/components/AnalysisHub";
import { EmojiPicker } from "@/components/EmojiPicker";
import { HumidityMoistureEstimate } from "@/components/HumidityMoistureEstimate";
import { KgUnitConverter } from "@/components/KgUnitConverter";
import agrismesLogo from "@/assets/agrismes-logo-v3.png";

// Session keys
const VISITOR_ID_KEY = "agrismes_visitor_id";
const CHAT_SESSION_ID_KEY = "agrismes_chat_session_id";
const SESSION_CONTEXT_KEY = "agrismes_chat_context";

const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface SessionContext {
  role?: string;
  country?: string;
  commodity?: string;
  otherCommodity?: string;
  interestLevel?: string;
  detectedLanguage?: string;
  sourcePage?: string;
}

type LanguageCode = "en" | "sw" | "fr" | "am" | "ar";

const detectLanguage = (text: string): LanguageCode => {
  const t = (text || "").trim();
  if (!t) return "en";
  if (/[\u0600-\u06FF\u0750-\u077F]/.test(t)) return "ar";
  if (/[\u1200-\u137F]/.test(t)) return "am";
  if (
    /[àâçéèêëîïôùûüÿœæ]/i.test(t) ||
    /\b(bonjour|merci|je|j'|vous|voudrais|acheter|livraison|exportation|marché)\b/i.test(t)
  ) {
    return "fr";
  }
  if (/\b(habari|asante|tafadhali|ninataka|nina|soko|bei|usafirishaji|bidhaa)\b/i.test(t)) {
    return "sw";
  }
  return "en";
};

const GREETING_REPLY: Record<LanguageCode, string> = {
  en: "Hi, I am Alex from AgriSMES. How can I help you today?",
  sw: "Habari, mimi ni Alex kutoka AgriSMES. Naweza kukusaidiaje leo?",
  fr: "Bonjour, je suis Alex de AgriSMES. Comment puis-je vous aider aujourd'hui ?",
  am: "ሰላም፣ እኔ ከAgriSMES አሌክስ ነኝ። ዛሬ እንዴት ልረዳዎ?",
  ar: "مرحباً، أنا أليكس من AgriSMES. كيف يمكنني مساعدتك اليوم؟",
};

// Fast-path wellness query detection (multilingual "how are you")
const WELLNESS_REPLY: Record<LanguageCode, string> = {
  en: "I'm doing well, thank you for asking! How can I help you today?",
  sw: "Niko sawa, asante kwa kuuliza! Naweza kukusaidia vipi leo?",
  fr: "Je vais bien, merci de demander! Comment puis-je vous aider aujourd'hui?",
  am: "ደህና ነኝ፣ ስለጠየቅከኝ አመሰግናለሁ! ዛሬ እንዴት ልረዳህ እችላለሁ?",
  ar: "أنا بخير، شكراً لسؤالك! كيف يمكنني مساعدتك اليوم؟",
};

const isWellnessQuery = (raw: string): boolean => {
  const t = (raw || "").trim().toLowerCase();
  if (!t) return false;
  
  // English patterns
  if (/\b(how are you|how're you|how r u|how do you do|how's it going|how are things)\b/i.test(t)) return true;
  
  // Arabic patterns
  if (/كيف حالك|كيفك|شلونك|ازيك|عامل ايه|كيف الحال/i.test(t)) return true;
  
  // French patterns
  if (/comment (ça va|allez-vous|vas-tu)|ça va|tu vas bien/i.test(t)) return true;
  
  // Swahili patterns
  if (/habari yako|u hali gani|vipi hali|hujambo/i.test(t)) return true;
  
  // Amharic patterns
  if (/እንዴት ነህ|እንዴት ነሽ|ደህና ነህ|ደህና ነሽ/i.test(t)) return true;
  
  // Spanish patterns
  if (/cómo estás|qué tal|cómo te va|cómo andas/i.test(t)) return true;
  
  // Portuguese patterns
  if (/como você está|tudo bem|como vai|como está/i.test(t)) return true;
  
  // German patterns
  if (/wie geht es|wie geht's|wie gehts/i.test(t)) return true;
  
  // Chinese patterns
  if (/你好吗|你怎么样|最近怎么样/i.test(t)) return true;
  
  // Hindi patterns
  if (/आप कैसे हैं|कैसे हो|कैसी हो/i.test(t)) return true;
  
  return false;
};

const isSimpleGreeting = (raw: string): boolean => {
  const t = (raw || "").trim().toLowerCase();
  if (!t) return false;
  const cleaned = t.replace(/[!.,?\s]+/g, " ").trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  const greetingWords = new Set([
    "hi", "hey", "hello", "hallo", "habari", "salut", "bonjour",
    "salaam", "salam", "selam", "ሰላም", "سلام", "مرحبا",
  ]);
  const addressedTo = new Set(["alex", "agrismes", "agri", "sme"]);
  if (words.length === 1 && greetingWords.has(words[0])) return true;
  if (words.length === 2 && greetingWords.has(words[0]) && addressedTo.has(words[1])) return true;
  return false;
};

export default function AiChat() {
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([
    { role: "assistant", content: "Hi, I'm Alex from AgriSMES. How can I assist you with agribusiness or commodities today?" }
  ]);
  const [sessionContext, setSessionContext] = useState<SessionContext>({});
  const [currentInput, setCurrentInput] = useState("");
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [visitorId, setVisitorId] = useState("");
  const [chatSessionId, setChatSessionId] = useState("");
  
  // Tool modals
  const [showMoistureAnalysis, setShowMoistureAnalysis] = useState(false);
  const [showWeightScale, setShowWeightScale] = useState(false);
  const [showQualityControl, setShowQualityControl] = useState(false);
  const [showAnalysisHub, setShowAnalysisHub] = useState(false);
  const [showHumidityEstimate, setShowHumidityEstimate] = useState(false);
  const [showKgConverter, setShowKgConverter] = useState(false);
  
  // Voice input
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Typewriter placeholder
  const [isFocused, setIsFocused] = useState(false);
  const { placeholder, handleInputFocus, handleInputBlur } = useTypewriterPlaceholder({
    isActive: !isFocused && !currentInput.trim(),
    inputValue: currentInput,
    onFocus: () => setIsFocused(true),
  });
  
  // Smart typing
  const smartTyping = useSmartTyping();

  // Initialize session
  useEffect(() => {
    if (typeof window !== "undefined") {
      let storedVisitorId = localStorage.getItem(VISITOR_ID_KEY);
      if (!storedVisitorId) {
        storedVisitorId = generateId();
        localStorage.setItem(VISITOR_ID_KEY, storedVisitorId);
      }
      setVisitorId(storedVisitorId);

      let storedSessionId = sessionStorage.getItem(CHAT_SESSION_ID_KEY);
      if (!storedSessionId) {
        storedSessionId = generateId();
        sessionStorage.setItem(CHAT_SESSION_ID_KEY, storedSessionId);
      }
      setChatSessionId(storedSessionId);

      try {
        const savedContext = sessionStorage.getItem(SESSION_CONTEXT_KEY);
        if (savedContext) {
          setSessionContext(JSON.parse(savedContext));
        }
      } catch (e) {
        console.debug("[AiChat] Failed to load session context:", e);
      }
    }
  }, []);

  // Speech recognition setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setCurrentInput(prev => prev + (prev ? ' ' : '') + finalTranscript);
        }
      };

      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = () => setIsListening(false);
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationHistory, streamingText]);

  // Save context
  useEffect(() => {
    if (typeof window !== "undefined" && Object.keys(sessionContext).length > 0) {
      sessionStorage.setItem(SESSION_CONTEXT_KEY, JSON.stringify(sessionContext));
    }
  }, [sessionContext]);

  const toggleVoice = useCallback(() => {
    if (!speechSupported) {
      toast.error('Voice input is not supported in this browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        toast.success('Listening...', { duration: 2000 });
      } catch (e) {
        toast.error('Failed to start voice input.');
      }
    }
  }, [isListening, speechSupported]);

  // Streaming chat response
  const streamChatResponse = useCallback(async (
    requestBody: any,
    onDelta: (text: string) => void,
    onDone: (fullText: string) => void,
    onError: (error: Error) => void,
    onFirstToken?: () => void
  ) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/chat-stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
        apikey: supabaseKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No reader available");

    const decoder = new TextDecoder();
    let accumulated = "";
    let buffer = "";
    let firstToken = true;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          onDone(accumulated);
          return;
        }
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.error) {
            onError(new Error(parsed.error));
            return;
          }
          if (parsed.delta) {
            if (firstToken) {
              firstToken = false;
              onFirstToken?.();
            }
            accumulated += parsed.delta;
            onDelta(accumulated);
          }
        } catch (e) {}
      }
    }
    onDone(accumulated);
  }, []);

  const sendToAI = useCallback(async (message: string) => {
    if (!message.trim()) return;

    const userMessage: ConversationMessage = { role: "user", content: message };
    setConversationHistory(prev => [...prev, userMessage]);
    setCurrentInput("");
    setIsAnalyzing(true);
    setStreamingText("");

    // Fast-path for greetings
    if (isSimpleGreeting(message)) {
      const lang = detectLanguage(message);
      const reply = GREETING_REPLY[lang];
      setStreamingText(null);
      setConversationHistory(prev => [...prev, { role: "assistant", content: reply }]);
      setIsAnalyzing(false);
      return;
    }

    // Fast-path for wellness queries ("how are you" in any language)
    if (isWellnessQuery(message)) {
      const lang = detectLanguage(message);
      const reply = WELLNESS_REPLY[lang];
      setStreamingText(null);
      setConversationHistory(prev => [...prev, { role: "assistant", content: reply }]);
      setIsAnalyzing(false);
      return;
    }

    const requestBody = {
      message,
      conversationHistory: conversationHistory.slice(-10),
      sessionContext,
      visitorId,
      sessionId: chatSessionId,
      pagePath: "/ai-chat",
      isWebViewEmbed: true,
    };

    try {
      await streamChatResponse(
        requestBody,
        (text) => setStreamingText(text),
        (fullText) => {
          setStreamingText(null);
          setConversationHistory(prev => [...prev, { role: "assistant", content: fullText }]);
          setIsAnalyzing(false);
        },
        (error) => {
          console.error("[AiChat] Stream error:", error);
          setStreamingText(null);
          setConversationHistory(prev => [...prev, { 
            role: "assistant", 
            content: "I apologize for the interruption. Could you please repeat your question?" 
          }]);
          setIsAnalyzing(false);
        }
      );
    } catch (err) {
      console.error("[AiChat] Error:", err);
      setStreamingText(null);
      setConversationHistory(prev => [...prev, { 
        role: "assistant", 
        content: "I'm experiencing technical difficulties. Please try again." 
      }]);
      setIsAnalyzing(false);
    }
  }, [conversationHistory, sessionContext, visitorId, chatSessionId, streamChatResponse]);

  const handleSend = () => {
    if (currentInput.trim() && !isAnalyzing) {
      sendToAI(currentInput.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setCurrentInput(prev => prev + emoji);
    textareaRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Compact Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
        <Link 
          to="/" 
          className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Back to Home"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <img 
          src={agrismesLogo} 
          alt="AgriSMES" 
          className="h-7 w-auto"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-foreground truncate">
            AgriSMES AI Live Chat (Alex)
          </h1>
          <p className="text-xs text-muted-foreground truncate">
            Agribusiness & commodities support
          </p>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {conversationHistory.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
          </motion.div>
        ))}

        {/* Streaming response */}
        <AnimatePresence>
          {streamingText !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-3 justify-start"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="max-w-[85%] rounded-xl px-4 py-3 bg-muted text-foreground">
                <p className="text-sm whitespace-pre-wrap break-words">
                  {streamingText || <span className="animate-pulse">●●●</span>}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading indicator */}
        {isAnalyzing && streamingText === "" && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-muted rounded-xl px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          </div>
        )}

        <div ref={conversationEndRef} />
      </div>

      {/* Tool Buttons */}
      <div className="px-4 py-2 border-t border-border bg-card/50 flex gap-2 overflow-x-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMoistureAnalysis(true)}
          className="shrink-0 gap-1.5 text-xs"
        >
          <Droplets className="w-3.5 h-3.5" />
          Moisture
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHumidityEstimate(true)}
          className="shrink-0 gap-1.5 text-xs bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700"
        >
          <Droplets className="w-3.5 h-3.5" />
          Get Moisture
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowWeightScale(true)}
          className="shrink-0 gap-1.5 text-xs"
        >
          <Scale className="w-3.5 h-3.5" />
          Weight
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowKgConverter(true)}
          className="shrink-0 gap-1.5 text-xs bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-700"
        >
          <Scale className="w-3.5 h-3.5" />
          KG Convert
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowQualityControl(true)}
          className="shrink-0 gap-1.5 text-xs"
        >
          <ClipboardCheck className="w-3.5 h-3.5" />
          QC
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAnalysisHub(true)}
          className="shrink-0 gap-1.5 text-xs bg-primary/5 border-primary/30 hover:bg-primary/10"
        >
          <Microscope className="w-3.5 h-3.5 text-primary" />
          <span className="text-primary">Analysis</span>
        </Button>
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-border bg-card shrink-0">
        <div className="flex gap-2 items-end">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={currentInput}
              onChange={(e) => {
                setCurrentInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={() => {
                handleInputBlur();
                setIsFocused(false);
              }}
              placeholder={placeholder}
              disabled={isAnalyzing}
              rows={1}
              className="w-full min-h-[44px] max-h-[120px] text-sm border border-border bg-background rounded-lg px-3 py-3 pr-20 resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
              style={{ height: '44px' }}
            />
            
            {/* Action buttons inside input */}
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <EmojiPicker 
                onEmojiSelect={handleEmojiSelect}
                disabled={isAnalyzing}
              />
              {speechSupported && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleVoice}
                  disabled={isAnalyzing}
                  className={`h-7 w-7 p-0 rounded-full ${
                    isListening ? "bg-red-100 text-red-600 animate-pulse" : "text-muted-foreground"
                  }`}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </Button>
              )}
            </div>
          </div>
          
          <Button
            onClick={handleSend}
            disabled={!currentInput.trim() || isAnalyzing}
            size="sm"
            className="h-11 w-11 p-0 rounded-lg shrink-0"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Tool Modals */}
      {showMoistureAnalysis && (
        <MoistureContentAnalysis
          onClose={() => setShowMoistureAnalysis(false)}
          onAnalysisComplete={(result) => {
            setConversationHistory(prev => [...prev, {
              role: "assistant",
              content: `Moisture analysis complete: ${result.moisturePercentage}% moisture detected for ${result.commodity}. ${result.recommendations?.[0] || ''}`
            }]);
            setShowMoistureAnalysis(false);
          }}
        />
      )}
      
      {showWeightScale && (
        <WeightScaleAnalysis
          onClose={() => setShowWeightScale(false)}
        />
      )}
      
      {showQualityControl && (
        <QualityControlAnalysis
          onClose={() => setShowQualityControl(false)}
          onAnalysisComplete={(result) => {
            setConversationHistory(prev => [...prev, {
              role: "assistant",
              content: `Quality control complete: Grade ${result.gradeAssessment.grade} - ${result.gradeAssessment.gradeDescription}. ${result.recommendations?.[0] || ''}`
            }]);
            setShowQualityControl(false);
          }}
        />
      )}
      
      {showAnalysisHub && (
        <AnalysisHub
          onClose={() => setShowAnalysisHub(false)}
        />
      )}

      {showHumidityEstimate && (
        <HumidityMoistureEstimate
          onClose={() => setShowHumidityEstimate(false)}
          onResult={(result) => {
            setConversationHistory(prev => [...prev, {
              role: "assistant",
              content: `🌡️ **Moisture Content Estimate** (${result.location}, ${result.country})\n\n• Humidity: ${result.humidity}%\n• Temperature: ${result.temperature}°C\n• Wind: ${result.windSpeed} km/h\n• Risk Level: ${result.moistureRisk.toUpperCase()}\n• Drying: ${result.dryingConditions}\n\n${result.recommendation}`
            }]);
          }}
        />
      )}

      {showKgConverter && (
        <KgUnitConverter
          onClose={() => setShowKgConverter(false)}
          onResult={(summary) => {
            setConversationHistory(prev => [...prev, {
              role: "assistant",
              content: `⚖️ **Weight Conversion:** ${summary}`
            }]);
          }}
        />
      )}
    </div>
  );
}
