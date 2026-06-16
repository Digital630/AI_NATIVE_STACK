import { useState, useCallback, useRef, useEffect } from "react";

interface VoiceOutputState {
  isSpeaking: boolean;
  isSupported: boolean;
  isPaused: boolean;
  voiceEnabled: boolean;
}

interface UseVoiceOutputReturn extends VoiceOutputState {
  speak: (text: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  toggleVoice: () => void;
  setVoiceEnabled: (enabled: boolean) => void;
}

// Storage key for voice preference
const VOICE_ENABLED_KEY = "agrismes_voice_output_enabled";

// Clean text for speech (remove markdown, links, etc.)
const cleanTextForSpeech = (text: string): string => {
  return text
    // Remove markdown links [text](url)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove markdown bold/italic
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    // Remove image generation tags
    .replace(/\[\[GENERATE_IMAGE:[^\]]+\]\]/g, "")
    // Remove emoji clusters at start
    .replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]+/u, "")
    // Remove URLs
    .replace(/https?:\/\/[^\s]+/g, "")
    // Remove multiple spaces
    .replace(/\s+/g, " ")
    // Remove special characters that sound awkward
    .replace(/[•●○◆◇★☆]/g, "")
    .trim();
};

// Get appropriate voice for language
const getVoiceForLanguage = (text: string, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
  // Detect language hints
  const isSwahili = /\b(habari|asante|tafadhali|nina|soko|bidhaa)\b/i.test(text);
  const isFrench = /\b(bonjour|merci|je|vous|marché|exportation)\b/i.test(text);
  const isArabic = /[\u0600-\u06FF]/.test(text);
  const isAmharic = /[\u1200-\u137F]/.test(text);

  // Try to find language-specific voice
  let preferredLang = "en";
  if (isSwahili) preferredLang = "sw";
  else if (isFrench) preferredLang = "fr";
  else if (isArabic) preferredLang = "ar";
  else if (isAmharic) preferredLang = "am";

  // Find matching voice
  const langVoice = voices.find(v => 
    v.lang.toLowerCase().startsWith(preferredLang) && 
    !v.name.toLowerCase().includes("compact")
  );

  if (langVoice) return langVoice;

  // Fallback to English voices with preference for natural sounding ones
  const preferredVoices = [
    "Google UK English Male",
    "Google UK English Female", 
    "Microsoft David",
    "Microsoft Mark",
    "Alex",
    "Daniel",
    "Samantha",
  ];

  for (const name of preferredVoices) {
    const found = voices.find(v => v.name.includes(name));
    if (found) return found;
  }

  // Return first English voice or any voice
  return voices.find(v => v.lang.startsWith("en")) || voices[0] || null;
};

export function useVoiceOutput(): UseVoiceOutputReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voiceEnabled, setVoiceEnabledState] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check for speech synthesis support
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true);
      
      // Load saved preference
      const saved = localStorage.getItem(VOICE_ENABLED_KEY);
      setVoiceEnabledState(saved === "true");

      // Load voices
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices.length > 0) {
          setVoices(availableVoices);
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;

      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!isSupported || !voiceEnabled) return;

    // Stop any current speech
    window.speechSynthesis.cancel();

    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText) return;

    // Split long text into chunks for better performance
    const maxLength = 200;
    const sentences = cleanedText.match(/[^.!?]+[.!?]+/g) || [cleanedText];
    
    let currentChunk = "";
    const chunks: string[] = [];
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxLength) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    if (currentChunk) chunks.push(currentChunk.trim());

    // Speak first chunk immediately
    if (chunks.length === 0) return;

    const speakChunk = (index: number) => {
      if (index >= chunks.length) {
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[index]);
      utteranceRef.current = utterance;

      // Configure voice settings
      const selectedVoice = getVoiceForLanguage(chunks[index], voices);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.rate = 0.95; // Slightly slower for clarity
      utterance.pitch = 1.0;
      utterance.volume = 0.9;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => speakChunk(index + 1);
      utterance.onerror = (e) => {
        console.debug("[VoiceOutput] Speech error:", e.error);
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    };

    speakChunk(0);
  }, [isSupported, voiceEnabled, voices]);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, []);

  const pause = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  const toggleVoice = useCallback(() => {
    const newValue = !voiceEnabled;
    setVoiceEnabledState(newValue);
    localStorage.setItem(VOICE_ENABLED_KEY, String(newValue));
    
    if (!newValue) {
      // Stop speaking when disabled
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    }
  }, [voiceEnabled]);

  const setVoiceEnabled = useCallback((enabled: boolean) => {
    setVoiceEnabledState(enabled);
    localStorage.setItem(VOICE_ENABLED_KEY, String(enabled));
    
    if (!enabled) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isSpeaking,
    isSupported,
    isPaused,
    voiceEnabled,
    speak,
    stop,
    pause,
    resume,
    toggleVoice,
    setVoiceEnabled,
  };
}
