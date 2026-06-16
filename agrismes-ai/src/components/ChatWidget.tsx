import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MessageCircle, X, Send, Loader2, ArrowRight, User, Bot, ThumbsUp, ThumbsDown, Camera, Paperclip, Image as ImageIcon, ScanLine, Mic, MicOff, Volume2, VolumeX, Scale, Droplets, ClipboardCheck } from "lucide-react";
import { useTypewriterPlaceholder } from "@/hooks/useTypewriterPlaceholder";
import { useRewardPoints } from "@/hooks/useRewardPoints";
import { useSmartTyping } from "@/hooks/useSmartTyping";
import { usePersonalizedInspiration } from "@/hooks/usePersonalizedInspiration";
import { useVisitorProfile } from "@/hooks/useVisitorProfile";
import { useVoiceOutput } from "@/hooks/useVoiceOutput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { trackChatOpened, trackMessageSent, trackChatClosed } from "@/utils/chatAnalytics";
import { RewardFlowMinimal, RewardFlowHeaderIndicator, InlineRewardFlowIcon } from "@/components/RewardFlowMinimal";
import { ChatFeedback } from "@/components/ChatFeedback";
import { ImageUploadAnalysis, AnalysisResultDisplay } from "@/components/ImageUploadAnalysis";
import { MoistureContentAnalysis } from "@/components/MoistureContentAnalysis";
import { WeightScaleAnalysis } from "@/components/WeightScaleAnalysis";
import { QualityControlAnalysis } from "@/components/QualityControlAnalysis";
import { QRCodeScanner } from "@/components/QRCodeScanner";
import { ExclusiveServicesUnlock } from "@/components/ExclusiveServicesUnlock";
import { ReferralShare, ReferralShareTrigger } from "@/components/ReferralShare";
import { EmojiPicker } from "@/components/EmojiPicker";
import { AdminCodeEntry } from "@/components/AdminCodeEntry";
import { ExploreListingsDrawer } from "@/components/ExploreListingsDrawer";

// Returning user bonus points
const RETURNING_USER_BONUS = 25;

const prefersReducedMotion = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

// Session key for one-time audio cue
const AUDIO_PLAYED_KEY = "agrismes_chat_audio_played";
// Session key for form completion tracking (reduces chat pulse)
const FORM_COMPLETED_KEY = "agrismes_form_completed";
// Session key for chat context persistence
const SESSION_CONTEXT_KEY = "agrismes_chat_context";
// Session key for visitor ID (anonymous, no personal identity)
const VISITOR_ID_KEY = "agrismes_visitor_id";
// Session key for chat session ID
const CHAT_SESSION_ID_KEY = "agrismes_chat_session_id";
// Session key for feedback shown tracking
const FEEDBACK_SHOWN_KEY = "agrismes_feedback_shown";
// Session key for high-intent signal tracking
const HIGH_INTENT_SIGNALS_KEY = "agrismes_high_intent_signals";

// Generate a random ID for visitor/session tracking
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

// Soft notification chime (very short, low volume)
const playNotificationChime = (isMobile: boolean) => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // Soft, pleasant frequency (C5 note - 523Hz)
    oscillator.frequency.value = 523;
    oscillator.type = "sine";
    
    // Very low volume - notification level, not alert
    const baseVolume = isMobile ? 0.03 : 0.05;
    gainNode.gain.setValueAtTime(baseVolume, audioCtx.currentTime);
    
    // Quick fade out for soft "tick" effect (~200ms total)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.2);
    
    // Cleanup
    setTimeout(() => {
      audioCtx.close();
    }, 300);
  } catch (e) {
    // Silently fail - audio is enhancement only
    console.debug("[ChatWidget] Audio cue failed:", e);
  }
};


interface SessionContext {
  role?: string;
  country?: string;
  commodity?: string;
  otherCommodity?: string;
  interestLevel?: string;
  detectedLanguage?: string;
  sourcePage?: string;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface TriageResponse {
  intent: string;
  commodity?: string;
  country?: string;
  guidanceResponse: string;
  suggestedQuestions: string[];
  routeToSection?: string;
  metadata: {
    hasSpecificCommodity: boolean;
    hasLocationInfo: boolean;
    isReadyForSubmission: boolean;
    detectedLanguage?: string;
    shouldEscalate?: boolean;
    escalationReason?: string;
  };
  sessionContext?: SessionContext;
}

// Language display names
const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  sw: "Kiswahili",
  fr: "Français",
  am: "አማርኛ",
  ar: "العربية",
};

type LanguageCode = "en" | "sw" | "fr" | "am" | "ar";

const detectLanguage = (text: string): LanguageCode => {
  const t = (text || "").trim();
  if (!t) return "en";
  // Arabic script detection
  if (/[\u0600-\u06FF\u0750-\u077F]/.test(t)) return "ar";
  // Ethiopic script (Amharic)
  if (/[\u1200-\u137F]/.test(t)) return "am";
  // French heuristics
  if (
    /[àâçéèêëîïôùûüÿœæ]/i.test(t) ||
    /\b(bonjour|merci|je|j'|vous|voudrais|acheter|livraison|exportation|marché)\b/i.test(t)
  ) {
    return "fr";
  }
  // Kiswahili heuristics
  if (/\b(habari|asante|tafadhali|ninataka|nina|soko|bei|usafirishaji|bidhaa)\b/i.test(t)) {
    return "sw";
  }
  return "en";
};

// Local-only fallback – used ONLY when backend call fails completely (network error, timeout)
// This keeps costs at zero for connectivity issues. Must NOT be generic.
// Includes [[EXPLORE_LISTINGS]] button so users have an actionable next step
const FALLBACK_REPLY: Record<LanguageCode, string> = {
  en: "I couldn't process that just now. Please try again, or browse available listings: [[EXPLORE_LISTINGS]]",
  sw: "Sikuweza kushughulikia hilo sasa hivi. Tafadhali jaribu tena, au angalia orodha zinazopatikana: [[EXPLORE_LISTINGS]]",
  fr: "Je n'ai pas pu traiter cela pour le moment. Veuillez réessayer, ou parcourez les annonces disponibles : [[EXPLORE_LISTINGS]]",
  am: "አሁን ያንን ማስኬድ አልቻልኩም። እባክዎ እንደገና ይሞክሩ ወይም ያሉትን ዝርዝሮች ይመልከቱ: [[EXPLORE_LISTINGS]]",
  ar: "لم أتمكن من معالجة ذلك الآن. يرجى المحاولة مرة أخرى، أو تصفح القوائم المتاحة: [[EXPLORE_LISTINGS]]",
};

// Max retries before showing fallback
const MAX_STREAM_RETRIES = 2;

// Fast-path greetings – saves credits for simple "Hi/Hello" first contact (AgriSMES-anchored)
const GREETING_REPLY: Record<LanguageCode, string> = {
  en: "Hello! I'm Alex from AgriSMES. Are you here to explore commodities, connect with buyers or suppliers, or learn about trade readiness?",
  sw: "Habari! Mimi ni Alex kutoka AgriSMES. Je, unataka kuchunguza bidhaa, kuwasiliana na wanunuzi au wauzaji, au kujifunza kuhusu utayari wa biashara?",
  fr: "Bonjour ! Je suis Alex d'AgriSMES. Vous souhaitez explorer des produits, vous connecter avec des acheteurs ou des fournisseurs, ou en savoir plus sur la préparation au commerce ?",
  am: "ሰላም! እኔ ከAgriSMES አሌክስ ነኝ። ምርቶችን ለመመርመር፣ ከገዢዎች ወይም አቅራቢዎች ጋር ለመገናኘት፣ ወይም ስለ ንግድ ዝግጁነት ለማወቅ ፈለጉ?",
  ar: "مرحباً! أنا أليكس من AgriSMES. هل تريد استكشاف السلع، أو التواصل مع المشترين أو الموردين، أو معرفة المزيد عن جاهزية التجارة؟",
};

const isSimpleGreeting = (raw: string): boolean => {
  const t = (raw || "").trim().toLowerCase();
  if (!t) return false;
  // Normalize punctuation/emoji-only greetings
  const cleaned = t.replace(/[!.,?\s]+/g, " ").trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  const greetingWords = new Set([
    "hi",
    "hey",
    "hello",
    "hallo",
    "habari",
    "salut",
    "bonjour",
    "salaam",
    "salam",
    "selam",
    "ሰላም",
    "سلام",
    "مرحبا",
  ]);
  const addressedTo = new Set(["alex", "agrismes", "agri", "sme"]);

  if (words.length === 1 && greetingWords.has(words[0])) return true;
  if (words.length === 2 && greetingWords.has(words[0]) && addressedTo.has(words[1])) return true;
  return false;
};

// Escalation reply – guides user to submit form (AgriSMES-anchored, not generic)
const ESCALATION_REPLY: Record<LanguageCode, string> = {
  en: "To have an AgriSMES trade analyst review your case, please submit your details below or continue chatting about commodities or market questions.",
  sw: "Ili mchambuzi wa biashara wa AgriSMES aone hali yako, tafadhali tuma maelezo yako hapa chini au endelea kuzungumza kuhusu bidhaa au maswali ya soko.",
  fr: "Pour qu'un analyste commercial AgriSMES examine votre dossier, veuillez soumettre vos coordonnées ci-dessous ou continuer à discuter des produits ou du marché.",
  am: "የAgriSMES የንግድ ተንታኝ ሁኔታዎን እንዲመለከት፣ እባክዎ ዝርዝሮችዎን ከታች ያስገቡ ወይም ስለ ምርቶች ወይም ስለ ገበያ ጥያቄዎች መወያየትዎን ይቀጥሉ።",
  ar: "لكي يراجع محلل التجارة في AgriSMES حالتك، يرجى تقديم بياناتك أدناه أو متابعة الحديث عن السلع أو أسئلة السوق.",
};

// Fast-path wellness reply – saves credits for "how are you" queries (AgriSMES-anchored)
const WELLNESS_REPLY: Record<LanguageCode, string> = {
  en: "I'm doing well, thank you! Are you exploring commodities like coffee, cashew, or cocoa today, or do you have a trade question?",
  sw: "Niko sawa, asante! Je, unachunguza bidhaa kama kahawa, korosho, au kakao leo, au una swali la biashara?",
  fr: "Je vais bien, merci ! Explorez-vous des produits comme le café, la noix de cajou ou le cacao aujourd'hui, ou avez-vous une question commerciale ?",
  am: "ደህና ነኝ፣ አመሰግናለሁ! ዛሬ እንደ ቡና፣ ካሹ፣ ወይም ኮኮዋ ያሉ ምርቶችን እያሰሱ ነው ወይስ የንግድ ጥያቄ አለዎት?",
  ar: "أنا بخير، شكراً! هل تستكشف سلعاً مثل القهوة أو الكاجو أو الكاكاو اليوم، أم لديك سؤال تجاري؟",
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

// Conversational input with typewriter placeholder animation and smart typing
interface ConversationalInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isAnalyzing: boolean;
  isOpen: boolean;
  onImageUpload?: () => void;
  sessionId?: string;
  visitorId?: string;
  onImageAnalysisComplete?: (analysis: any, imagePreview: string) => void;
  onMoistureAnalysisOpen?: () => void;
  onWeightScaleOpen?: () => void;
  onQualityControlOpen?: () => void;
  onDocumentAttach?: (file: File) => void;
  onScanQR?: () => void;
  showScanButton?: boolean;
}

function ConversationalInput({
  value,
  onChange,
  onSend,
  isAnalyzing,
  isOpen,
  onImageUpload,
  sessionId,
  visitorId,
  onImageAnalysisComplete,
  onMoistureAnalysisOpen,
  onWeightScaleOpen,
  onQualityControlOpen,
  onDocumentAttach,
  onScanQR,
  showScanButton = false,
}: ConversationalInputProps) {
  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Check for speech recognition support
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
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          onChange(value + (value ? ' ' : '') + finalTranscript);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please enable microphone permissions.');
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  const toggleVoice = useCallback(() => {
    if (!speechSupported) {
      toast.error('Voice input is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        toast.success('Listening... Speak now', { duration: 2000 });
      } catch (e) {
        console.error('Failed to start voice recognition:', e);
        toast.error('Failed to start voice input. Please try again.');
      }
    }
  }, [isListening, speechSupported, onChange, value]);
  const [isFocused, setIsFocused] = useState(false);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const {
    placeholder,
    handleInputFocus,
    handleInputBlur,
  } = useTypewriterPlaceholder({
    isActive: isOpen && !isFocused && !value.trim(),
    inputValue: value,
    onFocus: () => setIsFocused(true),
  });

  // Smart typing with autocorrect
  const smartTyping = useSmartTyping();

  // Handle input change with smart typing
  const handleChange = (newValue: string) => {
    onChange(newValue);
    smartTyping.handleInputChange(newValue);
  };

  // Apply suggestion
  const applySuggestion = (suggestion: { text: string; type: string }) => {
    const newValue = smartTyping.applySuggestion(value, suggestion as any);
    onChange(newValue);
    smartTyping.clearSuggestions();
  };

  // Handle keyboard for suggestions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      smartTyping.clearSuggestions();
      onSend();
    } else if (e.key === "Tab" && smartTyping.suggestions.length > 0) {
      e.preventDefault();
      applySuggestion(smartTyping.suggestions[0]);
    } else if (e.key === "Escape") {
      smartTyping.clearSuggestions();
    }
  };

  return (
    <div className="space-y-2 mb-4">
      {/* Suggestion strip */}
      <AnimatePresence>
        {smartTyping.suggestions.length > 0 && smartTyping.isEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="flex gap-1 px-1"
          >
            {smartTyping.suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => applySuggestion(suggestion)}
                className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                  suggestion.type === "correction"
                    ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                    : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {suggestion.text}
                {idx === 0 && <span className="ml-1 text-[10px] opacity-60">⇥</span>}
              </button>
            ))}
            <button
              onClick={smartTyping.toggleEnabled}
              className="ml-auto text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              title="Toggle autocorrect"
            >
              {smartTyping.isEnabled ? "✓ Auto" : "○ Auto"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file inputs */}
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && onDocumentAttach) {
            onDocumentAttach(file);
          }
          e.target.value = "";
        }}
        className="hidden"
        disabled={isAnalyzing}
      />

      {/* Input row - Expanding textarea like ChatGPT */}
      <div className="flex gap-2 items-end bg-muted/30 border border-border rounded-lg p-2.5">
        <div className="relative flex-1 min-w-0">
          <textarea
            value={value}
            onChange={(e) => {
              handleChange(e.target.value);
              // Auto-resize textarea
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                smartTyping.clearSuggestions();
                onSend();
                // Reset height after send
                (e.target as HTMLTextAreaElement).style.height = '48px';
              } else if (e.key === "Tab" && smartTyping.suggestions.length > 0) {
                e.preventDefault();
                applySuggestion(smartTyping.suggestions[0]);
              } else if (e.key === "Escape") {
                smartTyping.clearSuggestions();
              }
            }}
            onFocus={handleInputFocus}
            onBlur={() => {
              handleInputBlur();
              setIsFocused(false);
            }}
            placeholder={placeholder}
            disabled={isAnalyzing}
            rows={1}
            className="w-full min-h-[48px] max-h-[150px] text-base border-0 bg-background shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 rounded-md px-3 py-3 resize-none overflow-y-auto"
            style={{ height: '48px' }}
          />
          {/* Autocorrect toggle button (when no suggestions showing) */}
          {smartTyping.suggestions.length === 0 && value.length > 0 && (
            <button
              onClick={smartTyping.toggleEnabled}
              className={`absolute right-2 bottom-3 text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                smartTyping.isEnabled 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground bg-muted"
              }`}
              title={smartTyping.isEnabled ? "Autocorrect on" : "Autocorrect off"}
            >
              {smartTyping.isEnabled ? "Aa" : "Aa"}
            </button>
          )}
        </div>
        
        <Button
          type="button"
          size="icon"
          onClick={() => {
            smartTyping.clearSuggestions();
            onSend();
          }}
          disabled={isAnalyzing || !value.trim()}
          className="h-12 w-12 shrink-0"
        >
          {isAnalyzing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Organized Action Toolbar - below input */}
      <div className="flex items-center justify-between px-1">
        {/* Left side: Primary action buttons */}
        <div className="flex items-center gap-0.5">
          {/* Voice Input Button */}
          {speechSupported && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleVoice}
              disabled={isAnalyzing}
              className={`h-9 w-9 p-0 rounded-full transition-all ${
                isListening 
                  ? "bg-red-100 text-red-600 hover:bg-red-200 animate-pulse" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              title={isListening ? "Stop listening" : "Voice input"}
            >
              {isListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Camera Button - General Product Image Upload (NOT moisture test) */}
          {onImageAnalysisComplete && (
            <div className="flex items-center" title="General Product Photo (Quality, Readiness, Health Assessment)">
              <ImageUploadAnalysis
                onAnalysisComplete={onImageAnalysisComplete}
                onPointsAwarded={onImageUpload}
                sessionId={sessionId}
                visitorId={visitorId}
                disabled={isAnalyzing}
              />
            </div>
          )}
          
          {/* Document Attach button */}
          {onDocumentAttach && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => documentInputRef.current?.click()}
              disabled={isAnalyzing}
              className="h-9 w-9 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
              title="Attach document (PDF, DOC, TXT)"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          )}
          
          {/* Emoji Picker - positive emotional feedback emojis */}
          <div title="Add emoji for emotional feedback">
            <EmojiPicker 
              onEmojiSelect={(emoji) => onChange(value + emoji)}
              disabled={isAnalyzing}
            />
          </div>
        </div>

        {/* Right side: QR Scanner + Language indicator */}
        <div className="flex items-center gap-1.5">
          {/* QR Scanner button */}
          {showScanButton && onScanQR && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onScanQR}
              disabled={isAnalyzing}
              className="h-8 px-2 gap-1 text-xs text-muted-foreground hover:text-foreground"
              title="Scan reward QR code"
            >
              <ScanLine className="h-4 w-4" />
              <span className="hidden sm:inline">Scan</span>
            </Button>
          )}

          {/* Language indicator */}
          {smartTyping.detectedLanguage !== "en" && value.length > 3 && (
            <div className="text-[10px] text-muted-foreground px-1 bg-muted/50 rounded-full">
              {smartTyping.detectedLanguage.toUpperCase()}
            </div>
          )}

          {/* Voice listening indicator */}
          {isListening && (
            <div className="flex items-center gap-1 text-xs text-error bg-error/10 px-2 py-0.5 rounded-full animate-pulse">
              <span className="w-2 h-2 bg-error rounded-full animate-ping" />
              <span className="hidden sm:inline">Listening...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChatWidget() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [exploreListingsOpen, setExploreListingsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "", // Optional phone/WhatsApp
    email: "",
    message: "",
  });
  const [submittedName, setSubmittedName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Conversational AI state
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [sessionContext, setSessionContext] = useState<SessionContext>({});
  
  const [currentInput, setCurrentInput] = useState("");
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [generatingImage, setGeneratingImage] = useState<string | null>(null);
  
  // Admin lockout check function
  const checkAdminLockout = async (vid: string) => {
    try {
      // Generate simple device fingerprint
      const nav = navigator;
      const screen = window.screen;
      const fingerprint = [
        nav.userAgent,
        nav.language,
        screen.colorDepth,
        screen.width + "x" + screen.height,
        new Date().getTimezoneOffset(),
      ].join("|");
      let hash = 0;
      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      const deviceFingerprint = Math.abs(hash).toString(36);
      
      const response = await supabase.functions.invoke("admin-lockout-check", {
        body: { visitorId: vid, deviceFingerprint },
      });
      
      if (response.data?.locked) {
        setAdminIconLocked(true);
      }
    } catch (err) {
      console.debug("[ChatWidget] Admin lockout check failed:", err);
    }
  };
  
  // Image analysis state
  const [imageAnalysisResults, setImageAnalysisResults] = useState<Array<{
    analysis: any;
    imagePreview: string;
    timestamp: number;
  }>>([]);
  
  // Attached files state
  const [attachedFiles, setAttachedFiles] = useState<Array<{
    file: File;
    type: "document" | "screenshot";
    preview?: string;
  }>>([]);
  
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const formSectionRef = useRef<HTMLFormElement>(null);
  
  // Session tracking for intelligence logging
  const [chatSessionId, setChatSessionId] = useState<string>("");
  const [visitorId, setVisitorId] = useState<string>("");
  
  // RewardFlow state
  const rewardPoints = useRewardPoints(visitorId);
  const personalizedInspiration = usePersonalizedInspiration(visitorId);
  const visitorProfile = useVisitorProfile(visitorId);
  const voiceOutput = useVoiceOutput();
  const [rewardPanelOpen, setRewardPanelOpen] = useState(false);
  const [referralShareOpen, setReferralShareOpen] = useState(false);
  const [conversationStartTime, setConversationStartTime] = useState<number>(0);
  const [returningBonusAwarded, setReturningBonusAwarded] = useState(false);
  
  // Feedback state - show only once per session
  const [feedbackShownThisSession, setFeedbackShownThisSession] = useState(false);
  
  // High-intent signals tracking for adaptive feedback
  const [highIntentSignals, setHighIntentSignals] = useState<{
    askedAboutPrice: boolean;
    mentionedQuantity: boolean;
    mentionedDestination: boolean;
    submittedContactForm: boolean;
    providedPhone: boolean;
    reachedGoldOrHigher: boolean;
  }>({
    askedAboutPrice: false,
    mentionedQuantity: false,
    mentionedDestination: false,
    submittedContactForm: false,
    providedPhone: false,
    reachedGoldOrHigher: false,
  });
  
  // Micro-signal shown tracking (Layer 2 of RewardFlow discovery)
  const [microSignalShown, setMicroSignalShown] = useState(false);
  
  // Breathing animation state
  const [isHovering, setIsHovering] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const [isMobileBreathing, setIsMobileBreathing] = useState(false);
  const [formCompleted, setFormCompleted] = useState(false);
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioTriggeredRef = useRef(false);
  
  // PDF attachment state
  const [pdfAttachment, setPdfAttachment] = useState<{ content: string; filename: string } | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  
  // QR Scanner state
  const [showQRScanner, setShowQRScanner] = useState(false);
  
  // Weight Scale state
  const [showWeightScale, setShowWeightScale] = useState(false);
  
  // Moisture Analysis state
  const [showMoistureAnalysis, setShowMoistureAnalysis] = useState(false);
  
  // Quality Control Analysis state
  const [showQualityControl, setShowQualityControl] = useState(false);
  
  // Admin lockout state
  const [adminIconLocked, setAdminIconLocked] = useState(false);
  
  // Admin code entry dialog state
  const [showAdminCodeEntry, setShowAdminCodeEntry] = useState(false);
  const [isAdminVerified, setIsAdminVerified] = useState(
    typeof window !== "undefined" && localStorage.getItem("agrismes_admin_access") === "true"
  );

  // Initialize session and visitor IDs on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Get or create visitor ID (persists across sessions)
      let storedVisitorId = localStorage.getItem(VISITOR_ID_KEY);
      if (!storedVisitorId) {
        storedVisitorId = generateId();
        localStorage.setItem(VISITOR_ID_KEY, storedVisitorId);
      }
      setVisitorId(storedVisitorId);

      // Get or create session ID (new per session)
      let storedSessionId = sessionStorage.getItem(CHAT_SESSION_ID_KEY);
      if (!storedSessionId) {
        storedSessionId = generateId();
        sessionStorage.setItem(CHAT_SESSION_ID_KEY, storedSessionId);
      }
      setChatSessionId(storedSessionId);

      // Check if feedback was already shown this session
      const feedbackShown = sessionStorage.getItem(FEEDBACK_SHOWN_KEY) === "true";
      setFeedbackShownThisSession(feedbackShown);

      // Load high-intent signals from session
      try {
        const storedSignals = sessionStorage.getItem(HIGH_INTENT_SIGNALS_KEY);
        if (storedSignals) {
          setHighIntentSignals(JSON.parse(storedSignals));
        }
      } catch (e) {
        console.debug("[ChatWidget] Failed to load high-intent signals:", e);
      }

      // Load session context
      try {
        const savedContext = sessionStorage.getItem(SESSION_CONTEXT_KEY);
        if (savedContext) {
          setSessionContext(JSON.parse(savedContext));
        }
      } catch (e) {
        console.debug("[ChatWidget] Failed to load session context:", e);
      }
      
      // Check admin lockout status
      checkAdminLockout(storedVisitorId);
      
      // Listen for admin lockout events
      const handleAdminLockout = (e: CustomEvent) => {
        if (e.detail?.locked) {
          setAdminIconLocked(true);
        }
      };
      window.addEventListener("adminLockout", handleAdminLockout as EventListener);
      
      return () => {
        window.removeEventListener("adminLockout", handleAdminLockout as EventListener);
      };
    }
  }, []);

  // Save session context when it changes
  useEffect(() => {
    if (typeof window !== "undefined" && Object.keys(sessionContext).length > 0) {
      try {
        sessionStorage.setItem(SESSION_CONTEXT_KEY, JSON.stringify(sessionContext));
      } catch (e) {
        console.debug("[ChatWidget] Failed to save session context:", e);
      }
    }
  }, [sessionContext]);

  // Auto-scroll to bottom like ChatGPT - always show latest message
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isOpen) return;

    const scrollToBottom = () => {
      const el = conversationEndRef.current;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    };

    // Use requestAnimationFrame for smooth scrolling
    const raf = window.requestAnimationFrame(scrollToBottom);
    return () => window.cancelAnimationFrame(raf);
  }, [conversationHistory, streamingText, isAnalyzing, isOpen]);

  // Additional scroll effect for streaming text updates
  useEffect(() => {
    if (!isOpen || !streamingText) return;
    
    const el = conversationEndRef.current;
    if (el) {
      el.scrollIntoView({ behavior: "auto", block: "end" });
    }
  }, [streamingText, isOpen]);

  // Check if form was completed this session (reduces chat aggressiveness)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const completed = sessionStorage.getItem(FORM_COMPLETED_KEY) === "true";
      setFormCompleted(completed);
    }
  }, []);

  // Listen for form completion events from other pages
  useEffect(() => {
    const handleFormCompleted = () => {
      sessionStorage.setItem(FORM_COMPLETED_KEY, "true");
      setFormCompleted(true);
    };

    window.addEventListener("formCompleted", handleFormCompleted);
    return () => window.removeEventListener("formCompleted", handleFormCompleted);
  }, []);

  // Listen for openChatWidget events from service pages
  useEffect(() => {
    const handleOpenChatWidget = () => {
      setIsOpen(true);
      
      // Check for source page context
      const sourcePage = sessionStorage.getItem("agrismes_chat_source_page");
      if (sourcePage) {
        sessionStorage.removeItem("agrismes_chat_source_page");
        
        // Update session context with source for backend awareness
        setSessionContext((prev) => ({
          ...prev,
          sourcePage,
        }));
      }
      
      // CONTROL FIX: Use neutral placeholder instead of full greeting
      // This allows user-led conversation start and prevents duplicate openings
      if (conversationHistory.length === 0) {
        setConversationHistory([
          { role: "assistant", content: "I'm here when you're ready." }
        ]);
      }
    };

    window.addEventListener("openChatWidget", handleOpenChatWidget);
    return () => window.removeEventListener("openChatWidget", handleOpenChatWidget);
  }, [conversationHistory.length]);

  // Robust mobile detection for animation calibration
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkMobile = () => {
      const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
      const hasNoHover = window.matchMedia("(hover: none)").matches;
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobileBreathing(isCoarsePointer || hasNoHover || isSmallScreen);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // One-time audio cue on first user interaction
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Skip if already played this session, reduced motion, or chat already opened
    const alreadyPlayed = sessionStorage.getItem(AUDIO_PLAYED_KEY) === "true";
    if (alreadyPlayed || prefersReducedMotion() || isOpen) return;
    
    const isMobile = window.innerWidth < 768;
    
    const handleFirstInteraction = () => {
      // Double-check we haven't already triggered
      if (audioTriggeredRef.current) return;
      audioTriggeredRef.current = true;
      
      // Mark as played for this session
      sessionStorage.setItem(AUDIO_PLAYED_KEY, "true");
      
      // Small delay so it doesn't feel jarring with user action
      setTimeout(() => {
        playNotificationChime(isMobile);
      }, 800);
      
      // Remove listeners after triggering
      window.removeEventListener("scroll", handleFirstInteraction);
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };
    
    // Listen for first user interaction (browser policy compliance)
    window.addEventListener("scroll", handleFirstInteraction, { once: true, passive: true });
    window.addEventListener("click", handleFirstInteraction, { once: true });
    window.addEventListener("touchstart", handleFirstInteraction, { once: true, passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleFirstInteraction);
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, [isOpen]);

  // Listen for external requests to open the chat (e.g., from Readiness Check CTA)
  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
    };

    window.addEventListener("openChatWidget", handleOpenChat);
    return () => window.removeEventListener("openChatWidget", handleOpenChat);
  }, []);

  // Handle animation restart delay after closing chat + analytics tracking + returning user bonus
  useEffect(() => {
    if (isOpen) {
      // Stop animation when chat opens
      setShouldAnimate(false);
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }
      // Mark audio as played when user opens chat (never play after that)
      if (typeof window !== "undefined") {
        sessionStorage.setItem(AUDIO_PLAYED_KEY, "true");
        audioTriggeredRef.current = true;
      }
      // Track chat opened event
      trackChatOpened();
      // Award points for opening chat
      rewardPoints.awardPoints("chatOpen");
      
      // Award returning user bonus (once per day)
      if (visitorProfile.shouldAwardReturningBonus() && !returningBonusAwarded) {
        rewardPoints.awardPoints("simpleMessage", 5, "Welcome back bonus");
        visitorProfile.markReturningBonusAwarded();
        setReturningBonusAwarded(true);
      }
      
      // Set personalized greeting for returning users
      if (visitorProfile.isReturning && visitorProfile.shouldShowWelcomeBack && conversationHistory.length === 0) {
        const greeting = visitorProfile.getPersonalizedGreeting(undefined, rewardPoints.totalPoints);
        setConversationHistory([
          { role: "assistant", content: greeting.message }
        ]);
        visitorProfile.markWelcomeBackShown();
      }
    } else {
      // Track chat closed with duration
      trackChatClosed();
      
      // Restart animation after 20 second delay when chat closes (avoid annoyance)
      restartTimerRef.current = setTimeout(() => {
        setShouldAnimate(true);
      }, 20000);
    }

    return () => {
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }
    };
  }, [isOpen, visitorProfile.isReturning, visitorProfile.shouldShowWelcomeBack, returningBonusAwarded]);

  // Pause animation on hover/focus
  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);
  const handleFocus = () => setIsHovering(true);
  const handleBlur = () => setIsHovering(false);

  // Check reduced motion preference
  const reducedMotion = prefersReducedMotion();
  // Reduce animation if form was completed this session
  const animationEnabled = shouldAnimate && !isHovering && !isOpen && !reducedMotion && !formCompleted;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length > 100) {
      newErrors.name = "Name must be less than 100 characters";
    }
    
    // Phone is optional - validate format only if provided
    if (formData.phone.trim() && !/^[+\d\s()-]*$/.test(formData.phone.trim())) {
      newErrors.phone = "Please enter a valid phone number";
    } else if (formData.phone.trim().length > 30) {
      newErrors.phone = "Phone number must be less than 30 characters";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 20) {
      newErrors.message = "Message must be at least 20 characters";
    } else if (formData.message.trim().length > 2000) {
      newErrors.message = "Message must be less than 2000 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Stream chat response from edge function - OPTIMIZED FOR SPEED
  const streamChatResponse = useCallback(async (
    requestBody: any,
    onDelta: (text: string) => void,
    onDone: (fullText: string) => void,
    onError: (error: Error) => void,
    onFirstToken?: () => void // Callback when first token arrives
  ) => {
    const STREAM_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-stream`;
    
    // Balanced timeouts - fast enough for UX, long enough for AI to respond
    const CONNECT_TIMEOUT = 12000; // 12 seconds for connection
    const STREAM_TIMEOUT = 20000; // 20 seconds between chunks
    const FIRST_TOKEN_TIMEOUT = 15000; // 15s max wait for first token
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let connectTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let firstTokenTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let gotFirstToken = false;
    
    const clearAllTimeouts = () => {
      if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
      if (connectTimeoutId) { clearTimeout(connectTimeoutId); connectTimeoutId = null; }
      if (firstTokenTimeoutId) { clearTimeout(firstTokenTimeoutId); firstTokenTimeoutId = null; }
    };
    
    try {
      const controller = new AbortController();

      // If the request never returns headers, abort so UI doesn't hang.
      connectTimeoutId = setTimeout(() => {
        console.warn("[ChatWidget] Connect timeout - aborting request");
        controller.abort();
      }, CONNECT_TIMEOUT);

      const resp = await fetch(STREAM_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearAllTimeouts();

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${resp.status}`);
      }

      if (!resp.body) {
        throw new Error("No response body");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullText = "";

      // Set first-token timeout - fail fast if AI is too slow to start
      firstTokenTimeoutId = setTimeout(() => {
        if (!gotFirstToken) {
          console.warn("[ChatWidget] First token timeout - AI too slow, aborting");
          reader.cancel().catch(() => {});
          onError(new Error("AI response too slow"));
        }
      }, FIRST_TOKEN_TIMEOUT);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });
        
        // Clear first-token timeout once we start receiving data
        if (!gotFirstToken && textBuffer.length > 0) {
          gotFirstToken = true;
          if (firstTokenTimeoutId) { clearTimeout(firstTokenTimeoutId); firstTokenTimeoutId = null; }
          onFirstToken?.();
        }
        
        // Reset stream timeout on each chunk
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          console.warn("[ChatWidget] Stream stalled - forcing completion");
          reader.cancel().catch(() => {});
          onDone(fullText);
        }, STREAM_TIMEOUT);

        // Process line-by-line
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            clearAllTimeouts();
            onDone(fullText);
            return;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullText += content;
              onDelta(fullText);
            }
          } catch (parseError) {
            // If it looks like incomplete JSON (ends mid-string), wait for more
            // Otherwise, log and continue
            if (jsonStr.includes('"') && !jsonStr.endsWith('}')) {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
            console.debug("[ChatWidget] Skipping malformed SSE chunk:", jsonStr);
          }
        }
      }

      clearAllTimeouts();
      // Final flush - even if empty, ensure onDone is called
      onDone(fullText);
    } catch (err) {
      clearAllTimeouts();
      console.error("[ChatWidget] Stream error:", err);
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  // Send message to AI with streaming for instant response - with automatic retry
  const sendToAI = useCallback(async (message: string, retryCount = 0) => {
    setIsAnalyzing(true);
    setStreamingText(""); // Empty string shows "Alex is typing..." indicator
    
    const pagePath = typeof window !== "undefined" ? window.location.pathname : "/";
    const lang = detectLanguage(message);
    
    const requestBody = {
      message: message.trim(),
      name: formData.name.trim() || undefined,
      email: formData.email.trim() || undefined,
      conversationHistory,
      sessionContext,
      sessionId: chatSessionId,
      visitorId,
      pagePath,
      rewardLevel: rewardPoints.currentLevel,
      isReturningUser: visitorProfile.isReturning,
      daysSinceLastVisit: visitorProfile.daysSinceLastVisit,
      userPreferences: visitorProfile.profile ? {
        commoditiesInterested: visitorProfile.profile.commodities_interested,
        preferredLanguage: visitorProfile.profile.preferred_language,
        lastCommodityViewed: visitorProfile.profile.last_commodity_viewed,
      } : undefined,
    };

    await streamChatResponse(
      requestBody,
      // onDelta - update streaming text in real-time
      (fullText) => {
        setStreamingText(fullText + "▌"); // Show typing cursor
      },
      // onDone - finalize the response
      (fullText) => {
        setStreamingText(null);
        setIsAnalyzing(false);
        
        // If AI returned empty response, retry silently before falling back
        if (!fullText.trim() && retryCount < MAX_STREAM_RETRIES) {
          console.debug(`[ChatWidget] Empty response, retrying (${retryCount + 1}/${MAX_STREAM_RETRIES})`);
          setTimeout(() => sendToAI(message, retryCount + 1), 500);
          return;
        }
        
        // Use fallback only after retries exhausted
        const responseText = fullText.trim() || FALLBACK_REPLY[lang];
        
        setConversationHistory((prev) => [
          ...prev,
          { role: "assistant", content: responseText },
        ]);
        
        // Voice output: Speak Alex's response if enabled
        if (voiceOutput.voiceEnabled && fullText.trim()) {
          voiceOutput.speak(fullText);
        }
        
        // Update session context based on response content
        setSessionContext((prev) => ({
          ...prev,
          detectedLanguage: lang,
        }));
      },
      // onError - retry on transient errors before showing fallback
      (error) => {
        console.error(`[ChatWidget] Stream error (attempt ${retryCount + 1}):`, error);
        
        // Retry on network/timeout errors
        if (retryCount < MAX_STREAM_RETRIES) {
          console.debug(`[ChatWidget] Retrying after error (${retryCount + 1}/${MAX_STREAM_RETRIES})`);
          setTimeout(() => sendToAI(message, retryCount + 1), 800);
          return;
        }
        
        // All retries exhausted - show fallback
        setStreamingText(null);
        setIsAnalyzing(false);
        setConversationHistory((prev) => [
          ...prev,
          { role: "assistant", content: FALLBACK_REPLY[lang] },
        ]);
      },
      // onFirstToken - called when streaming actually starts
      () => {
        // First token received - AI is now typing
        console.debug("[ChatWidget] First token received");
      }
    );
  }, [formData.name, formData.email, conversationHistory, sessionContext, chatSessionId, visitorId, streamChatResponse, rewardPoints.currentLevel, visitorProfile.isReturning, visitorProfile.daysSinceLastVisit, visitorProfile.profile, voiceOutput]);

  // Track conversation start time for reminder logic
  useEffect(() => {
    if (isOpen && conversationStartTime === 0) {
      setConversationStartTime(Date.now());
    }
  }, [isOpen, conversationStartTime]);

  // Handle sending a conversational message
  const handleSendMessage = async () => {
    if (!currentInput.trim() || isAnalyzing) return;
    
    const userMessage = currentInput.trim();
    setCurrentInput("");
    
    // Detect language and track message analytics
    const detectedLang = detectLanguage(userMessage);
    trackMessageSent(detectedLang);
    
    // Detect high-intent signals in user message
    const detectHighIntentSignals = (message: string) => {
      const lowerMsg = message.toLowerCase();
      const priceKeywords = /\b(price|cost|quote|how much|usd|eur|dollar|pricing|rate|fob|cif)\b/i;
      const quantityKeywords = /\b(ton|kg|kilogram|mt|metric ton|container|quantity|volume|amount|tonnes)\b/i;
      const destinationKeywords = /\b(export|ship to|destination|deliver to|import to|buyer in|market in|europe|asia|usa|china|india|germany|netherlands|dubai)\b/i;
      
      const updates: Partial<typeof highIntentSignals> = {};
      if (priceKeywords.test(lowerMsg)) updates.askedAboutPrice = true;
      if (quantityKeywords.test(lowerMsg)) updates.mentionedQuantity = true;
      if (destinationKeywords.test(lowerMsg)) updates.mentionedDestination = true;
      
      if (Object.keys(updates).length > 0) {
        setHighIntentSignals(prev => {
          const newSignals = { ...prev, ...updates };
          sessionStorage.setItem(HIGH_INTENT_SIGNALS_KEY, JSON.stringify(newSignals));
          return newSignals;
        });
      }
    };
    
    detectHighIntentSignals(userMessage);
    
    // Award points based on message complexity (silent - no toast)
    const hasContext = Object.keys(sessionContext).length > 0;
    const pointsAction = rewardPoints.getMessagePoints(userMessage, hasContext);
    const isFirstMessage = conversationHistory.length === 0;
    
    // Award first message bonus (silent)
    if (isFirstMessage) {
      rewardPoints.awardPoints("firstMessage", 1, "First message bonus");
    }
    
    // Award message points (silent - no toast)
    rewardPoints.awardPoints(pointsAction, 1, `Message: ${userMessage.substring(0, 50)}...`);
    
    // Add user message to conversation
    setConversationHistory(prev => [...prev, {
      role: "user",
      content: userMessage,
    }]);

    // FAST PATH: greet instantly for simple openers (avoids perceived lag/cold-start)
    // BUT only on the FIRST greeting - subsequent greetings should get a continuation response
    const hasAlreadyGreeted = conversationHistory.some(
      msg => msg.role === "assistant" && 
      (msg.content.includes("Hello! I'm Alex from AgriSMES") || 
       msg.content.includes("Hi, I am Alex") || 
       msg.content.includes("Habari! Mimi ni Alex") ||
       msg.content.includes("Habari, mimi ni Alex") ||
       msg.content.includes("Bonjour ! Je suis Alex") ||
       msg.content.includes("Bonjour, je suis Alex") ||
       msg.content.includes("ሰላም! እኔ ከAgriSMES") ||
       msg.content.includes("ሰላም፣ እኔ ከAgriSMES") ||
       msg.content.includes("مرحباً! أنا أليكس") ||
       msg.content.includes("مرحباً، أنا أليكس"))
    );
    
    if (isSimpleGreeting(userMessage)) {
      if (hasAlreadyGreeted) {
        // Already greeted - use a continuation response instead of repeating (AgriSMES-anchored)
        const continuationReplies: Record<LanguageCode, string[]> = {
          en: ["Still here! Are you exploring commodities, or do you have a trade question?", "Ready when you are — ask about coffee, cashew, trade readiness, or Explore Listings.", "I'm listening! What commodity or service interests you?"],
          sw: ["Bado niko hapa! Unataka kuchunguza bidhaa, au una swali la biashara?", "Niko tayari — uliza kuhusu kahawa, korosho, au utayari wa biashara.", "Nasikiliza! Bidhaa gani au huduma inakuvutia?"],
          fr: ["Toujours là ! Explorez-vous des produits, ou avez-vous une question commerciale ?", "Prêt quand vous l'êtes — café, cajou, préparation au commerce.", "Je vous écoute ! Quel produit ou service vous intéresse ?"],
          am: ["እኔ እዚሁ ነኝ! ምርቶችን እያሰሱ ነው ወይስ የንግድ ጥያቄ አለዎት?", "ዝግጁ ነኝ — ስለ ቡና፣ ካሹ፣ ወይም የንግድ ዝግጁነት ይጠይቁ።", "እያዳመጥኩ ነው! ምን ምርት ወይም አገልግሎት ይፈልጋሉ?"],
          ar: ["لا زلت هنا! هل تستكشف سلعاً أم لديك سؤال تجاري؟", "جاهز — اسأل عن القهوة أو الكاجو أو جاهزية التجارة.", "أنا أستمع! ما هي السلعة أو الخدمة التي تهمك؟"],
        };
        const replies = continuationReplies[detectedLang];
        const quickReply = replies[Math.floor(Math.random() * replies.length)];
        setConversationHistory(prev => [...prev, { role: "assistant", content: quickReply }]);
        if (voiceOutput.voiceEnabled) {
          voiceOutput.speak(quickReply);
        }
        return;
      }
      
      // First greeting - use the full introduction
      const quickReply = GREETING_REPLY[detectedLang];
      setConversationHistory(prev => [...prev, { role: "assistant", content: quickReply }]);
      setSessionContext((prev) => ({
        ...prev,
        detectedLanguage: detectedLang,
      }));
      if (voiceOutput.voiceEnabled) {
        voiceOutput.speak(quickReply);
      }
      return;
    }
    
    // Fast-path for wellness queries ("how are you" in any language)
    if (isWellnessQuery(userMessage)) {
      const quickReply = WELLNESS_REPLY[detectedLang];
      setConversationHistory(prev => [...prev, { role: "assistant", content: quickReply }]);
      setSessionContext((prev) => ({
        ...prev,
        detectedLanguage: detectedLang,
      }));
      if (voiceOutput.voiceEnabled) {
        voiceOutput.speak(quickReply);
      }
      return;
    }
    
    // Get AI response
    await sendToAI(userMessage);
  };

  // Handle image analysis completion
  const handleImageAnalysisComplete = useCallback((analysis: any, imagePreview: string) => {
    // Add to analysis results
    setImageAnalysisResults(prev => [...prev, {
      analysis,
      imagePreview,
      timestamp: Date.now(),
    }]);
    
    // Create a summary message for the conversation
    const summaryMessage = `[Image Analysis Result]\n\nDetected: ${analysis.detectedCommodity || "Agricultural product"}\nConfidence: ${analysis.confidenceLevel}\n\nQuality: ${analysis.productQuality.assessment}\nMoisture: ${analysis.moistureContent.assessment}\nHarvest Readiness: ${analysis.harvestReadiness.assessment}\nHealth: ${analysis.heatStress.assessment}\n\nSummary: ${analysis.overallSummary}`;
    
    // Add as assistant message to conversation
    setConversationHistory(prev => [...prev, {
      role: "assistant",
      content: summaryMessage,
    }]);
    
    // Update session context with detected commodity
    if (analysis.detectedCommodity) {
      setSessionContext(prev => ({
        ...prev,
        commodity: analysis.detectedCommodity,
      }));
    }
  }, []);

  // Handle moisture content analysis completion - keep modal open to show certificate badge
  const handleMoistureAnalysisComplete = useCallback((result: any) => {
    // Do NOT close the modal - let user view the certificate badge results
    // Modal will close when user clicks "Close" or "Test Another"
    
    // Update session context with detected commodity
    if (result.commodity) {
      setSessionContext(prev => ({
        ...prev,
        commodity: result.commodity,
      }));
    }
    
    // Award points for moisture analysis
    rewardPoints.awardPoints("imageAnalyzed", 1, "Moisture content analyzed");
  }, [rewardPoints]);

  // Handle image upload points award
  const handleImageUploadPoints = useCallback(() => {
    rewardPoints.awardPoints("imageAnalyzed", 1, "Product image analyzed");
  }, [rewardPoints]);

  // Handle weight scale analysis completion
  const handleWeightScaleComplete = useCallback(() => {
    setShowWeightScale(false);
    rewardPoints.awardPoints("imageAnalyzed", 1, "Weight estimation completed");
  }, [rewardPoints]);
  
  // Handle document attachment
  const handleDocumentAttach = useCallback((file: File) => {
    setAttachedFiles(prev => [...prev, { file, type: "document" }]);
    toast.success(`Document attached: ${file.name}`);
    
    // Add to conversation as user message
    const attachmentMessage = `[Attached document: ${file.name}]`;
    setConversationHistory(prev => [...prev, { role: "user", content: attachmentMessage }]);
  }, []);
  
  // Handle submitting the form with context
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Validate message length - minimum 20 characters
    const userMessage = formData.message.trim();
    if (userMessage.length < 20) {
      setErrors(prev => ({ ...prev, message: "Please provide more details (at least 20 characters)" }));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const pageUrl = window.location.href;
      
      // Trim message to 2000 characters max
      const trimmedMessage = userMessage.substring(0, 2000);
      
      // Save to database
      const { error: dbError } = await supabase
        .from("chat_messages")
        .insert({
          name: formData.name.trim(),
          email: formData.email.trim(),
          message: trimmedMessage,
          page_url: pageUrl,
        });
      
      if (dbError) throw dbError;
      
      // Send email notification via edge function - ONLY user-submitted fields
      const { data, error: emailError } = await supabase.functions.invoke("send-chat-message", {
        body: {
          name: formData.name.trim(),
          phone: formData.phone.trim() || undefined, // Optional
          email: formData.email.trim(),
          message: trimmedMessage,
          // Include PDF attachment if provided
          attachment: pdfAttachment || undefined,
        },
      });
      
      // Handle minimum message length error from server
      if (emailError || (data && data.promptUser)) {
        if (data?.promptUser) {
          setErrors(prev => ({ ...prev, message: "Please provide more details (at least 20 characters)" }));
          setIsSubmitting(false);
          return;
        }
        console.error("Email notification failed:", emailError);
      }
      
      // Update chat_conversations with form submission data and quality tag
      if (chatSessionId) {
        const hasPhone = !!formData.phone.trim();
        await supabase
          .from("chat_conversations")
          .update({
            user_name: formData.name.trim(),
            user_email: formData.email.trim(),
            user_phone_whatsapp: formData.phone.trim() || null,
            submitted_contact_form: true,
            provided_whatsapp: hasPhone,
            quality_tag: "high_quality", // Form submission = high quality
            updated_at: new Date().toISOString(),
          })
          .eq("session_id", chatSessionId);
      }
      
      // Award form submission points (silent - no toast)
      rewardPoints.awardPoints("formSubmission", 1, "Contact form submitted");
      
      // Update high-intent signals for form submission
      const hasPhone = !!formData.phone.trim();
      setHighIntentSignals(prev => {
        const newSignals = { 
          ...prev, 
          submittedContactForm: true,
          providedPhone: hasPhone 
        };
        sessionStorage.setItem(HIGH_INTENT_SIGNALS_KEY, JSON.stringify(newSignals));
        return newSignals;
      });
      
      setSubmittedName(formData.name.trim());
      setIsSubmitted(true);
      setFormData({ name: "", phone: "", email: "", message: "" });
      setPdfAttachment(null); // Clear PDF attachment
      if (pdfInputRef.current) pdfInputRef.current.value = ""; // Reset file input
      setConversationHistory([]);
      setSessionContext({});
      // Clear session context from storage
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(SESSION_CONTEXT_KEY);
      }
      
    } catch (error) {
      console.error("Error submitting message:", error);
      toast.error("Failed to send message. Please try again or email us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };


  const resetForm = () => {
    setIsSubmitted(false);
    setSubmittedName("");
    setFormData({ name: "", phone: "", email: "", message: "" });
    setErrors({});
    setConversationHistory([]);
    setCurrentInput("");
    setSessionContext({});
    // Clear session context from storage
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(SESSION_CONTEXT_KEY);
    }
  };

  // Scroll to the contact form section within the chat
  const scrollToContactForm = useCallback(() => {
    if (formSectionRef.current) {
      formSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      // Focus the name input after scrolling
      const nameInput = document.getElementById("chat-name");
      if (nameInput) {
        setTimeout(() => nameInput.focus(), 400);
      }
    }
  }, []);

  // Generate commodity image
  const generateCommodityImage = useCallback(async (commodity: string) => {
    const normalizedCommodity = commodity.toLowerCase().trim();
    
    // Check if already generated
    if (generatedImages[normalizedCommodity]) {
      return generatedImages[normalizedCommodity];
    }
    
    setGeneratingImage(normalizedCommodity);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-commodity-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ commodity: normalizedCommodity }),
        }
      );
      
      if (!response.ok) {
        console.error("Image generation failed:", response.status);
        return null;
      }
      
      const data = await response.json();
      
      if (data.success && data.imageUrl) {
        setGeneratedImages(prev => ({
          ...prev,
          [normalizedCommodity]: data.imageUrl,
        }));
        return data.imageUrl;
      }
      
      return null;
    } catch (error) {
      console.error("Image generation error:", error);
      return null;
    } finally {
      setGeneratingImage(null);
    }
  }, [generatedImages, rewardPoints]);

  // Render message content with clickable AgriSMES links, [[GENERATE_IMAGE:commodity]] patterns, and [[REWARDFLOW_ICON]] inline icons
  const renderMessageWithLinks = useCallback((content: string) => {
    // First, handle image generation patterns
    const imagePattern = /\[\[GENERATE_IMAGE:([^\]]+)\]\]/gi;
    const imageMatches = [...content.matchAll(imagePattern)];
    
    // Process image requests
    imageMatches.forEach(match => {
      const commodity = match[1].trim().toLowerCase();
      if (!generatedImages[commodity] && generatingImage !== commodity) {
        generateCommodityImage(commodity);
      }
    });
    
    // Split content by AgriSMES (with or without brackets), image patterns, RewardFlow icon marker, and action buttons
    // Match: [[AgriSMES]], AgriSMES (standalone word), [[GENERATE_IMAGE:...]], [[REWARDFLOW_ICON]], [[EXPLORE_LISTINGS]], [[DOWNLOAD_APP]]
    const combinedPattern = /(\[\[AgriSMES\]\]|(?<![[\w])AgriSMES(?![[\w])|\[\[GENERATE_IMAGE:[^\]]+\]\]|\[\[REWARDFLOW_ICON\]\]|\[\[EXPLORE_LISTINGS\]\]|\[\[DOWNLOAD_APP\]\])/gi;
    const parts = content.split(combinedPattern);
    
    if (parts.length === 1 && !imageMatches.length) {
      // No special patterns found
      return content;
    }

    // Build elements with clickable links, images, inline RewardFlow icons, and action buttons
    return parts.map((part, index) => {
      // Check if this part is an AgriSMES link (with or without brackets)
      if (/^(\[\[AgriSMES\]\]|AgriSMES)$/i.test(part)) {
        return (
          <button
            key={`link-${index}`}
            type="button"
            onClick={scrollToContactForm}
            className="text-primary font-medium underline underline-offset-2 hover:text-primary/80 transition-colors"
          >
            AgriSMES
          </button>
        );
      }
      
      // Check if this part is the EXPLORE_LISTINGS action button
      if (/^\[\[EXPLORE_LISTINGS\]\]$/i.test(part)) {
        return (
          <a
            key={`explore-${index}`}
            href="/explore-listings"
            onClick={() => setIsOpen(false)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 my-1 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Explore Listings
          </a>
        );
      }
      
      // Check if this part is the DOWNLOAD_APP action button
      if (/^\[\[DOWNLOAD_APP\]\]$/i.test(part)) {
        return (
          <button
            key={`download-${index}`}
            type="button"
            onClick={() => {
              setIsOpen(false);
              navigate("/download-app");
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 my-1 bg-secondary text-secondary-foreground text-sm font-medium rounded-md hover:bg-secondary/90 transition-colors border border-border"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Download App
          </button>
        );
      }
      
      // Check if this part is the RewardFlow icon marker
      if (/^\[\[REWARDFLOW_ICON\]\]$/i.test(part)) {
        return (
          <InlineRewardFlowIcon
            key={`rewardflow-${index}`}
            level={rewardPoints.currentLevel}
            onClick={() => setRewardPanelOpen(true)}
            size="md"
            className="inline-flex align-middle mx-0.5"
          />
        );
      }
      
      // Check if this part is an image generation request
      const imageMatch = part.match(/^\[\[GENERATE_IMAGE:([^\]]+)\]\]$/i);
      if (imageMatch) {
        const commodity = imageMatch[1].trim().toLowerCase();
        const imageUrl = generatedImages[commodity];
        const isGenerating = generatingImage === commodity;
        
        return (
          <div key={`image-${index}`} className="my-3">
            {isGenerating ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating {commodity} image...</span>
              </div>
            ) : imageUrl ? (
              <div className="rounded-lg overflow-hidden border border-border">
                <img 
                  src={imageUrl} 
                  alt={`${commodity} commodity`}
                  className="w-full h-auto max-h-48 object-cover"
                  loading="lazy"
                />
                <div className="px-2 py-1 bg-muted/50 text-xs text-muted-foreground">
                  {commodity.charAt(0).toUpperCase() + commodity.slice(1)}
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm italic py-1">
                Image for {commodity} unavailable
              </div>
            )}
          </div>
        );
      }
      
      // Regular text
      return <span key={`text-${index}`}>{part}</span>;
    });
  }, [scrollToContactForm, generatedImages, generatingImage, generateCommodityImage, rewardPoints.currentLevel, setRewardPanelOpen, navigate]);

  const handleRouteClick = (section: string) => {
    setIsOpen(false);
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Hide on /ai-chat page (WebView embed has its own full-screen chat)
  if (location.pathname === "/ai-chat") {
    return null;
  }

  return (
    <>
      {/* Floating Chat Button with Pulse + Rest Animation */}
      <div className={`fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[9999] ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'} transition-all duration-200`}>
        {/* Outer ring pulse - only visible when animating (desktop only) */}
        {animationEnabled && !isMobileBreathing && (
          <span
            className="absolute inset-0 rounded-full bg-primary animate-[chat-ring-pulse_5s_ease-in-out_infinite]"
            aria-hidden="true"
          />
        )}
        
        {/* Main button */}
        <button
          onClick={() => {
            setShouldAnimate(false);
            setIsOpen(true);
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`relative flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3 md:px-5 md:py-3.5 rounded-full shadow-lg hover:bg-primary/90 transition-colors duration-200 ${
            animationEnabled
              ? (isMobileBreathing
                  ? "animate-[chat-pulse-mobile_8s_ease-in-out_infinite]"
                  : "animate-[chat-pulse-desktop_5s_ease-in-out_infinite]")
              : ""
          }`}
          aria-label="Open chat"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm md:text-base font-medium">Chat with us</span>
        </button>
      </div>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[9999] w-[calc(100vw-2rem)] max-w-lg bg-card border border-border rounded-lg shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary text-primary-foreground p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Admin Icon - Always visible, opens code entry or shows admin menu */}
                  <button
                    onClick={() => {
                      if (adminIconLocked) {
                        toast.error("Admin access temporarily locked. Try again later.");
                        return;
                      }
                      if (isAdminVerified) {
                        window.location.href = "/admin/chat-dashboard";
                      } else {
                        setShowAdminCodeEntry(true);
                      }
                    }}
                    className={`p-1.5 rounded transition-all ${
                      adminIconLocked 
                        ? "opacity-30 cursor-not-allowed" 
                        : isAdminVerified 
                          ? "bg-white/20 hover:bg-white/30 ring-1 ring-white/40" 
                          : "hover:bg-white/20"
                    }`}
                    title={adminIconLocked ? "Admin Access Locked" : isAdminVerified ? "Admin Dashboard" : "Admin Access (Click to login)"}
                  >
                    <span className={`text-sm font-bold ${isAdminVerified ? "text-white" : adminIconLocked ? "text-white/30" : "text-white/70"}`}>A</span>
                  </button>
                  <Bot className="w-5 h-5" />
                  <h3 className="font-semibold text-lg text-primary-foreground/70">Trade Readiness Desk</h3>
                </div>
                <div className="flex items-center gap-2">
                  {/* RewardFlow Header Indicator - R icon, level-colored with micro-signal */}
                  <RewardFlowHeaderIndicator
                    level={rewardPoints.currentLevel}
                    onClick={() => setRewardPanelOpen(!rewardPanelOpen)}
                    isLoaded={rewardPoints.isLoaded}
                    showCelebration={!!rewardPoints.lastLevelUp}
                    messageCount={conversationHistory.filter(m => m.role === "user").length}
                    conversationStartTime={conversationStartTime}
                  />
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      if (isSubmitted) resetForm();
                    }}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                    aria-label="Close chat"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-primary-foreground/90 mt-1">
                Ask agribusiness-related questions in your preferred language.
              </p>
            </div>

             {/* Body */}
             <div ref={chatBodyRef} className="p-4 max-h-[70vh] overflow-y-auto">
              {isSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="font-semibold text-lg text-foreground mb-2">
                    {(() => {
                      const nameParts = submittedName.trim().split(/\s+/);
                      const firstName = nameParts[0] || "";
                      const capitalizedFirst = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
                      return capitalizedFirst && /^[a-zA-Z\u00C0-\u024F'-]+$/.test(capitalizedFirst)
                        ? `Thank you, ${capitalizedFirst}.`
                        : "Thank you.";
                    })()}
                  </h4>
                  <p className="text-muted-foreground">
                    Your message has been received. An AgriSMES representative will review your inquiry and respond by email.
                  </p>
                  
                  {/* RewardFlow icon - visible after form submission */}
                  <button 
                    onClick={() => setRewardPanelOpen(true)}
                    className="flex items-center justify-center gap-2 mt-4 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer"
                    aria-label="View your RewardFlow status"
                  >
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">View your progress</span>
                    <InlineRewardFlowIcon
                      level={rewardPoints.currentLevel}
                      onClick={() => setRewardPanelOpen(true)}
                      size="md"
                    />
                  </button>
                  
                  <Button
                    onClick={resetForm}
                    variant="outline"
                    className="mt-4"
                  >
                    Send another message
                  </Button>
                  
                  {/* RewardFlow Panel - Always available for opening */}
                  <RewardFlowMinimal
                    points={rewardPoints.totalPoints}
                    level={rewardPoints.currentLevel}
                    messagesSent={rewardPoints.messagesSent}
                    nextLevel={rewardPoints.getNextLevel(rewardPoints.totalPoints)}
                    lastLevelUp={rewardPoints.lastLevelUp}
                    onClearLevelUp={rewardPoints.clearLevelUp}
                    isLoaded={rewardPoints.isLoaded}
                    onLevelCelebrated={rewardPoints.markLevelCelebrated}
                    hasLevelBeenCelebrated={rewardPoints.hasLevelBeenCelebrated}
                    shouldCelebrate={rewardPoints.shouldCelebrate}
                    conversationStartTime={conversationStartTime}
                    messageCount={conversationHistory.length}
                    isPanelOpen={rewardPanelOpen}
                    onPanelOpenChange={setRewardPanelOpen}
                    conversationMessages={conversationHistory}
                    visitorId={visitorId}
                  />
                </div>
              ) : (
                <>
                  {/* Conversation Mode */}
                  {conversationHistory.length > 0 ? (
                    <div className="space-y-3 mb-4">
                      {conversationHistory.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          {msg.role === "assistant" && (
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Bot className="w-4 h-4 text-primary" />
                            </div>
                          )}
                          <div
                            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                              msg.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            {msg.role === "assistant" ? renderMessageWithLinks(msg.content) : msg.content}
                          </div>
                          {msg.role === "user" && (
                            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-secondary-foreground" />
                            </div>
                          )}
                        </div>
                      ))}
                      {/* Show streaming response in real-time with "Alex is typing..." indicator */}
                      {(streamingText !== null || isAnalyzing) && (
                        <div className="flex gap-2 justify-start">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-primary" />
                          </div>
                          <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm bg-muted text-foreground">
                            {streamingText && streamingText.replace(/▌/g, '').trim() ? (
                              <span>{renderMessageWithLinks(streamingText.replace(/▌$/, ''))}<span className="animate-pulse ml-0.5">▊</span></span>
                            ) : (
                              <div className="flex items-center gap-2 text-muted-foreground py-1">
                                <span className="flex gap-1">
                                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </span>
                                <span className="text-xs font-medium">Alex is typing...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* ADAPTIVE FEEDBACK: show ONCE per session using Condition A OR Condition B */}
                      {(() => {
                        const userMessageCount = conversationHistory.filter(m => m.role === "user").length;
                        const hasMultipleAiResponses = conversationHistory.filter(m => m.role === "assistant").length >= 2;
                        const hasAnyAiResponse = conversationHistory.some(m => m.role === "assistant");
                        
                        // Check if user reached Gold level or higher (for high-intent signals)
                        const isGoldOrHigher = rewardPoints.currentLevel === "Gold" || 
                          rewardPoints.currentLevel === "Premium" || 
                          rewardPoints.currentLevel === "Platinum";
                        
                        // CONDITION A: Depth-based (5+ questions with multiple AI responses)
                        const conditionA = userMessageCount >= 5 && hasMultipleAiResponses;
                        
                        // CONDITION B: Value-based (3+ questions + any high-intent signal)
                        const hasHighIntentSignal = 
                          highIntentSignals.askedAboutPrice ||
                          highIntentSignals.mentionedQuantity ||
                          highIntentSignals.mentionedDestination ||
                          highIntentSignals.submittedContactForm ||
                          highIntentSignals.providedPhone ||
                          isGoldOrHigher;
                        const conditionB = userMessageCount >= 3 && hasAnyAiResponse && hasHighIntentSignal;
                        
                        // Show feedback if either condition is met AND not already shown
                        const shouldShowFeedback = (conditionA || conditionB) && 
                          !feedbackShownThisSession && 
                          !isAnalyzing && 
                          !streamingText;
                        
                        return shouldShowFeedback ? (
                          <ChatFeedback 
                            conversationId={chatSessionId}
                            visitorId={visitorId}
                            onFeedbackSubmitted={() => {
                              setFeedbackShownThisSession(true);
                              sessionStorage.setItem(FEEDBACK_SHOWN_KEY, "true");
                            }}
                            rewardLevel={rewardPoints.currentLevel}
                            onRewardIconClick={() => setRewardPanelOpen(true)}
                          />
                        ) : null;
                      })()}
                      
                      <div ref={conversationEndRef} className="h-1" />
                    </div>
                  ) : (
                    <>
                      {/* AI Disclosure & Guidance */}
                      <div className="bg-accent/50 border border-border rounded-md p-3 mb-4 text-sm text-muted-foreground space-y-2">
                        <p className="font-medium text-foreground flex items-center gap-2">
                          <Bot className="w-4 h-4" />
                          AI Market Intelligence Assistant
                        </p>
                        <p className="text-xs">
                          I can provide general information about agribusiness markets, trade readiness, and export requirements. For case-specific assessment, you may submit details or contact AgriSMES.
                        </p>
                        <p className="text-xs mt-2 pt-2 border-t border-border">
                          <strong>Note:</strong> AgriSMES does not provide instant approvals or financing decisions. All inquiries are reviewed by a representative.
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                          Conversations may be saved and analyzed solely to improve service quality, platform performance, and market understanding.
                        </p>
                      </div>
                    </>
                  )}

                  {/* RewardFlow Minimal - Non-intrusive, click-to-open */}
                  <RewardFlowMinimal
                    points={rewardPoints.totalPoints}
                    level={rewardPoints.currentLevel}
                    messagesSent={rewardPoints.messagesSent}
                    nextLevel={rewardPoints.getNextLevel(rewardPoints.totalPoints)}
                    lastLevelUp={rewardPoints.lastLevelUp}
                    onClearLevelUp={rewardPoints.clearLevelUp}
                    isLoaded={rewardPoints.isLoaded}
                    personalizedMessage={personalizedInspiration.message}
                    detectedSkill={personalizedInspiration.detectedSkill}
                    onLevelCelebrated={rewardPoints.markLevelCelebrated}
                    hasLevelBeenCelebrated={rewardPoints.hasLevelBeenCelebrated}
                    shouldCelebrate={rewardPoints.shouldCelebrate}
                    conversationStartTime={conversationStartTime}
                    messageCount={conversationHistory.length}
                    isPanelOpen={rewardPanelOpen}
                    onPanelOpenChange={setRewardPanelOpen}
                    conversationMessages={conversationHistory}
                    visitorId={visitorId}
                  />

                  {/* Digital Agri-Processing Tools Row + Exclusive Services - aligned on same line */}
                  <div className="flex items-center justify-between mb-3 gap-2">
                    {/* Left: Unlock Exclusive Services */}
                    {rewardPoints.totalPoints >= 100 && (
                      <ExclusiveServicesUnlock
                        visitorId={visitorId}
                        currentPoints={rewardPoints.totalPoints}
                        userLevel={rewardPoints.currentLevel}
                        onServiceUnlocked={(serviceName, pointsSpent) => {
                          toast.success(`Unlocked ${serviceName} using ${pointsSpent} points!`);
                        }}
                        onPointsDeducted={(newPoints) => {
                          // Points will be refreshed on next load
                        }}
                      />
                    )}
                    
                    {/* Right: Digital Agri-Processing Tools */}
                    <div className="flex items-center gap-1.5 ml-auto">
                      {/* Moisture Content Button - WhatsApp-style green */}
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setShowMoistureAnalysis(true)}
                        disabled={isAnalyzing}
                        className="h-9 px-3 rounded-full bg-whatsapp hover:bg-whatsapp-hover text-white shadow-md flex items-center gap-1.5 transition-all duration-200 hover:shadow-lg"
                        title="Moisture Analysis - Analyze moisture content"
                      >
                        <Droplets className="h-4 w-4" />
                        <span className="text-[11px] font-semibold">Moisture</span>
                      </Button>
                      
                      {/* Weight Scale Button - WhatsApp-style green */}
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setShowWeightScale(true)}
                        disabled={isAnalyzing}
                        className="h-9 px-3 rounded-full bg-whatsapp hover:bg-whatsapp-hover text-white shadow-md flex items-center gap-1.5 transition-all duration-200 hover:shadow-lg"
                        title="Weight Estimation - Estimate package weight in KGs"
                      >
                        <span className="text-[11px] font-bold">KGs</span>
                      </Button>
                      
                      {/* Quality Control Button - WhatsApp-style green */}
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setShowQualityControl(true)}
                        disabled={isAnalyzing}
                        className="h-9 px-3 rounded-full bg-whatsapp hover:bg-whatsapp-hover text-white shadow-md flex items-center gap-1.5 transition-all duration-200 hover:shadow-lg"
                        title="Quality Control - Mold detection, grading, color sorting"
                      >
                        <ClipboardCheck className="h-4 w-4" />
                        <span className="text-[11px] font-semibold">QC</span>
                      </Button>
                    </div>
                  </div>

                  {/* Conversational Input with Typewriter Placeholder and Image Upload */}
                  <ConversationalInput
                    value={currentInput}
                    onChange={setCurrentInput}
                    onSend={handleSendMessage}
                    isAnalyzing={isAnalyzing}
                    isOpen={isOpen}
                    onImageUpload={handleImageUploadPoints}
                    sessionId={chatSessionId}
                    visitorId={visitorId}
                    onImageAnalysisComplete={handleImageAnalysisComplete}
                    onMoistureAnalysisOpen={() => setShowMoistureAnalysis(true)}
                    onWeightScaleOpen={() => setShowWeightScale(true)}
                    onQualityControlOpen={() => setShowQualityControl(true)}
                    onDocumentAttach={handleDocumentAttach}
                    onScanQR={() => setShowQRScanner(true)}
                    showScanButton={rewardPoints.totalPoints >= 100}
                  />
                  
                  {/* Moisture Content Analysis */}
                  {showMoistureAnalysis && (
                    <div className="fixed inset-0 z-50 bg-background">
                      <MoistureContentAnalysis
                        onClose={() => setShowMoistureAnalysis(false)}
                        onAnalysisComplete={handleMoistureAnalysisComplete}
                        sessionId={chatSessionId}
                        visitorId={visitorId}
                      />
                    </div>
                  )}
                  
                  {/* Weight Scale Analysis */}
                  {showWeightScale && (
                    <div className="fixed inset-0 z-50 bg-background">
                      <WeightScaleAnalysis
                        onClose={() => setShowWeightScale(false)}
                        sessionId={chatSessionId}
                        visitorId={visitorId}
                      />
                    </div>
                  )}
                  
                  {/* Quality Control Analysis */}
                  {showQualityControl && (
                    <div className="fixed inset-0 z-50 bg-background">
                      <QualityControlAnalysis
                        onClose={() => setShowQualityControl(false)}
                        sessionId={chatSessionId}
                        visitorId={visitorId}
                      />
                    </div>
                  )}
                  
                  {/* QR Code Scanner */}
                  <QRCodeScanner
                    isOpen={showQRScanner}
                    onClose={() => setShowQRScanner(false)}
                    onScanSuccess={(url) => {
                      setShowQRScanner(false);
                      window.location.href = url;
                    }}
                  />
                  
                  {/* Admin Code Entry Dialog */}
                  <AdminCodeEntry
                    isOpen={showAdminCodeEntry}
                    onClose={() => setShowAdminCodeEntry(false)}
                    onAdminVerified={() => {
                      setIsAdminVerified(true);
                      toast.success("Admin access enabled!");
                    }}
                  />

                  {/* Referral Share Section - show after enough engagement */}
                  {conversationHistory.length >= 4 && rewardPoints.totalPoints >= 100 && (
                    <div className="mb-4">
                      {!referralShareOpen ? (
                        <ReferralShareTrigger onClick={() => setReferralShareOpen(true)} />
                      ) : (
                        <ReferralShare
                          isOpen={referralShareOpen}
                          onClose={() => setReferralShareOpen(false)}
                        />
                      )}
                    </div>
                  )}

                  {/* Divider */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        Or submit for human review
                      </span>
                    </div>
                  </div>

                  {/* Session Context Display */}
                  {Object.keys(sessionContext).length > 0 && (
                    <div className="bg-primary/5 border border-primary/20 rounded-md p-2 mb-4 text-xs">
                      <p className="font-medium text-primary mb-1">Context captured:</p>
                      <div className="flex flex-wrap gap-1">
                        {sessionContext.role && (
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">{sessionContext.role}</span>
                        )}
                        {sessionContext.country && (
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">{sessionContext.country}</span>
                        )}
                        {sessionContext.commodity && (
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">{sessionContext.commodity}</span>
                        )}
                        {sessionContext.detectedLanguage && sessionContext.detectedLanguage !== "en" && (
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">
                            {LANGUAGE_NAMES[sessionContext.detectedLanguage] || sessionContext.detectedLanguage}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Form */}
                  <form ref={formSectionRef} onSubmit={handleSubmit} className="space-y-4" id="chat-contact-form">
                    <div>
                      <Label htmlFor="chat-name" className="text-sm">Name *</Label>
                      <Input
                        id="chat-name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Your name"
                        className={errors.name ? "border-destructive" : ""}
                        disabled={isSubmitting}
                      />
                      {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <Label htmlFor="chat-phone" className="text-sm">Phone / WhatsApp (optional)</Label>
                      <Input
                        id="chat-phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+255 XXX XXX XXX"
                        className={errors.phone ? "border-destructive" : ""}
                        disabled={isSubmitting}
                        maxLength={30}
                      />
                      {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                    </div>

                    <div>
                      <Label htmlFor="chat-email" className="text-sm">Email *</Label>
                      <Input
                        id="chat-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your@email.com"
                        className={errors.email ? "border-destructive" : ""}
                        disabled={isSubmitting}
                      />
                      {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <Label htmlFor="chat-message" className="text-sm">
                        Message * <span className="text-muted-foreground font-normal">(min. 20 characters)</span>
                      </Label>
                      <Textarea
                        id="chat-message"
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Describe your commodity, current situation, and what you're looking to achieve..."
                        rows={4}
                        className={errors.message ? "border-destructive" : ""}
                        disabled={isSubmitting}
                      />
                      {errors.message && <p className="text-xs text-destructive mt-1">{errors.message}</p>}
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-muted-foreground">
                          {formData.message.length}/2000 characters
                        </p>
                      </div>
                    </div>

                    {/* Optional PDF Attachment */}
                    <div>
                      <Label htmlFor="chat-pdf-attachment" className="text-sm text-muted-foreground">
                        Optional: Attach conversation summary (PDF)
                      </Label>
                      <Input
                        id="chat-pdf-attachment"
                        ref={pdfInputRef}
                        type="file"
                        accept=".pdf"
                        className="bg-background cursor-pointer file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        disabled={isSubmitting}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file && file.type === "application/pdf") {
                            // Limit file size to 5MB
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error("PDF file must be less than 5MB");
                              e.target.value = "";
                              setPdfAttachment(null);
                              return;
                            }
                            // Read file as base64
                            const reader = new FileReader();
                            reader.onload = () => {
                              const base64 = (reader.result as string).split(",")[1];
                              setPdfAttachment({
                                content: base64,
                                filename: file.name,
                              });
                            };
                            reader.readAsDataURL(file);
                          } else if (file) {
                            toast.error("Please select a valid PDF file");
                            e.target.value = "";
                            setPdfAttachment(null);
                          } else {
                            setPdfAttachment(null);
                          }
                        }}
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Helps us understand your context faster and improves continuity. Max 5MB.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit for Review
                        </>
                      )}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Explore Listings Drawer - opens in front of users */}
      <ExploreListingsDrawer 
        open={exploreListingsOpen} 
        onOpenChange={setExploreListingsOpen} 
      />
    </>
  );
}
