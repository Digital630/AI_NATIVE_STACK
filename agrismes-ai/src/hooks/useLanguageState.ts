/**
 * Global Language State Hook
 * Manages user language detection, switching, and persistence per session
 * Follows the 2-consecutive-message switching rule
 */

import { useState, useCallback, useRef, useEffect } from "react";

export type SupportedLanguage = 
  | "en" | "sw" | "fr" | "am" | "ar" | "ti" | "so" | "ha" | "yo" | "zu"
  | "fa" | "he" | "tr" | "es" | "pt" | "de" | "it" | "nl" | "pl" | "ru" | "uk" | "el"
  | "zh" | "ja" | "ko" | "hi" | "bn" | "ta" | "th" | "vi" | "id" | "ms" | "tl";

// All supported languages with display names
export const GLOBAL_LANGUAGES: Record<SupportedLanguage, string> = {
  // African languages
  en: "English",
  sw: "Kiswahili",
  am: "አማርኛ (Amharic)",
  ti: "ትግርኛ (Tigrinya)",
  so: "Soomaali (Somali)",
  ha: "Hausa",
  yo: "Yorùbá",
  zu: "isiZulu",
  // Middle Eastern
  ar: "العربية (Arabic)",
  fa: "فارسی (Persian)",
  he: "עברית (Hebrew)",
  tr: "Türkçe (Turkish)",
  // European
  fr: "Français (French)",
  es: "Español (Spanish)",
  pt: "Português (Portuguese)",
  de: "Deutsch (German)",
  it: "Italiano (Italian)",
  nl: "Nederlands (Dutch)",
  pl: "Polski (Polish)",
  ru: "Русский (Russian)",
  uk: "Українська (Ukrainian)",
  el: "Ελληνικά (Greek)",
  // Asian
  zh: "中文 (Chinese)",
  ja: "日本語 (Japanese)",
  ko: "한국어 (Korean)",
  hi: "हिन्दी (Hindi)",
  bn: "বাংলা (Bengali)",
  ta: "தமிழ் (Tamil)",
  th: "ไทย (Thai)",
  vi: "Tiếng Việt (Vietnamese)",
  id: "Bahasa Indonesia",
  ms: "Bahasa Melayu (Malay)",
  tl: "Tagalog (Filipino)",
};

// Language detection function - comprehensive global support
export function detectLanguage(text: string): SupportedLanguage {
  const t = (text || "").trim();
  if (!t) return "en";
  
  // === Script-based detection (most reliable) ===
  
  // Arabic script (Arabic, Persian, Urdu)
  if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(t)) {
    // Persian-specific characters
    if (/[پچژگک]/.test(t)) return "fa";
    return "ar";
  }
  
  // Hebrew script
  if (/[\u0590-\u05FF]/.test(t)) return "he";
  
  // Ethiopic script (Amharic, Tigrinya)
  if (/[\u1200-\u137F]/.test(t)) {
    if (/\b(ከመይ|እንታይ|ኣብ)\b/i.test(t)) return "ti";
    return "am";
  }
  
  // Chinese (Simplified/Traditional)
  if (/[\u4E00-\u9FFF\u3400-\u4DBF]/.test(t)) return "zh";
  
  // Japanese (Hiragana, Katakana, Kanji mix)
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(t)) return "ja";
  
  // Korean (Hangul)
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(t)) return "ko";
  
  // Devanagari (Hindi)
  if (/[\u0900-\u097F]/.test(t)) return "hi";
  
  // Bengali
  if (/[\u0980-\u09FF]/.test(t)) return "bn";
  
  // Tamil
  if (/[\u0B80-\u0BFF]/.test(t)) return "ta";
  
  // Thai
  if (/[\u0E00-\u0E7F]/.test(t)) return "th";
  
  // Cyrillic (Russian, Ukrainian)
  if (/[\u0400-\u04FF]/.test(t)) {
    if (/[іїєґ]/i.test(t)) return "uk";
    return "ru";
  }
  
  // Greek
  if (/[\u0370-\u03FF]/.test(t)) return "el";
  
  // === Keyword/character-based detection for Latin scripts ===
  
  // Turkish
  if (/[ğışöüçĞİŞÖÜÇ]/.test(t) || 
      /\b(merhaba|teşekkür|nasıl|evet|hayır|ben|sen|biz|siz)\b/i.test(t)) {
    return "tr";
  }
  
  // Vietnamese
  if (/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(t)) {
    return "vi";
  }
  
  // Polish
  if (/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(t) ||
      /\b(dzień|dobry|cześć|dziękuję|tak|nie|jak|gdzie)\b/i.test(t)) {
    return "pl";
  }
  
  // Spanish
  if (/[¿¡ñÑ]/.test(t) ||
      /\b(hola|gracias|buenos|días|cómo|estás|qué|por favor|señor|señora)\b/i.test(t)) {
    return "es";
  }
  
  // Portuguese
  if (/[ãõÃÕ]/.test(t) ||
      /\b(olá|obrigado|obrigada|bom dia|como|você|muito|não|sim)\b/i.test(t)) {
    return "pt";
  }
  
  // French
  if (/[àâçéèêëîïôùûüÿœæÀÂÇÉÈÊËÎÏÔÙÛÜŸŒÆ]/.test(t) ||
      /\b(bonjour|merci|je|j'|vous|comment|où|pourquoi|s'il vous plaît)\b/i.test(t)) {
    return "fr";
  }
  
  // German
  if (/[äöüßÄÖÜ]/.test(t) ||
      /\b(guten|tag|danke|bitte|wie|geht|warum|hallo|morgen)\b/i.test(t)) {
    return "de";
  }
  
  // Italian
  if (/\b(ciao|grazie|buongiorno|buonasera|come|stai|perché|dove|quando)\b/i.test(t)) {
    return "it";
  }
  
  // Dutch
  if (/\b(hallo|bedankt|goedemorgen|goedendag|hoe|gaat|waar|wanneer)\b/i.test(t)) {
    return "nl";
  }
  
  // Kiswahili
  if (/\b(habari|asante|tafadhali|ninataka|nina|soko|bei|usafirishaji|bidhaa|jambo|karibu)\b/i.test(t)) {
    return "sw";
  }
  
  // Somali
  if (/\b(salaam|mahadsanid|sidee|waa|maxay|haa|maya|magaca|xaggee)\b/i.test(t)) {
    return "so";
  }
  
  // Hausa
  if (/\b(sannu|nagode|yaya|ina|mene|ne|ba|ko|kuma)\b/i.test(t)) {
    return "ha";
  }
  
  // Yoruba
  if (/[ẹọṣẸỌṢ]/.test(t) ||
      /\b(bawo|ẹ kú|ọjọ|daadaa|rara|bẹẹni|kilode)\b/i.test(t)) {
    return "yo";
  }
  
  // Zulu
  if (/\b(sawubona|ngiyabonga|yebo|cha|kanjani|kuphi|nini)\b/i.test(t)) {
    return "zu";
  }
  
  // Indonesian/Malay
  if (/\b(terima kasih|selamat|apa|bagaimana|mengapa|di mana|tidak|ya|saya|anda)\b/i.test(t)) {
    if (/\b(tidak|terima|selamat pagi)\b/i.test(t)) return "id";
    return "ms";
  }
  
  // Tagalog
  if (/\b(salamat|kumusta|oo|hindi|ano|bakit|saan|kailan|paano|ako|ikaw)\b/i.test(t)) {
    return "tl";
  }
  
  return "en";
}

const SESSION_LANGUAGE_KEY = "agrismes_user_language";
const CONSECUTIVE_COUNT_KEY = "agrismes_lang_consecutive";

interface LanguageState {
  currentLanguage: SupportedLanguage;
  languageName: string;
  consecutiveCount: number;
  lastDetectedLanguage: SupportedLanguage;
}

export function useLanguageState(visitorId: string) {
  const [state, setState] = useState<LanguageState>({
    currentLanguage: "en",
    languageName: "English",
    consecutiveCount: 0,
    lastDetectedLanguage: "en",
  });

  // Load persisted language on mount
  useEffect(() => {
    if (typeof window !== "undefined" && visitorId) {
      try {
        const saved = sessionStorage.getItem(`${SESSION_LANGUAGE_KEY}_${visitorId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setState(prev => ({
            ...prev,
            currentLanguage: parsed.currentLanguage || "en",
            languageName: GLOBAL_LANGUAGES[parsed.currentLanguage as SupportedLanguage] || "English",
          }));
        }
      } catch (e) {
        console.debug("[useLanguageState] Failed to load language:", e);
      }
    }
  }, [visitorId]);

  // Persist language changes
  const persistLanguage = useCallback((lang: SupportedLanguage) => {
    if (typeof window !== "undefined" && visitorId) {
      try {
        sessionStorage.setItem(`${SESSION_LANGUAGE_KEY}_${visitorId}`, JSON.stringify({
          currentLanguage: lang,
          updatedAt: Date.now(),
        }));
      } catch (e) {
        console.debug("[useLanguageState] Failed to persist language:", e);
      }
    }
  }, [visitorId]);

  // Process user message and update language state
  // Implements: 2-consecutive-message switching rule
  const processMessage = useCallback((message: string): SupportedLanguage => {
    const detectedLang = detectLanguage(message);
    
    setState(prev => {
      // If same as current language, keep it
      if (detectedLang === prev.currentLanguage) {
        return {
          ...prev,
          consecutiveCount: 0,
          lastDetectedLanguage: detectedLang,
        };
      }
      
      // If different language, check consecutive count
      if (detectedLang === prev.lastDetectedLanguage) {
        // Same as last detected (but different from current)
        const newCount = prev.consecutiveCount + 1;
        
        // If 2 consecutive messages in new language, switch
        if (newCount >= 2) {
          persistLanguage(detectedLang);
          return {
            currentLanguage: detectedLang,
            languageName: GLOBAL_LANGUAGES[detectedLang],
            consecutiveCount: 0,
            lastDetectedLanguage: detectedLang,
          };
        }
        
        return {
          ...prev,
          consecutiveCount: newCount,
          lastDetectedLanguage: detectedLang,
        };
      }
      
      // New different language, reset counter
      return {
        ...prev,
        consecutiveCount: 1,
        lastDetectedLanguage: detectedLang,
      };
    });
    
    return detectedLang;
  }, [persistLanguage]);

  // Force set language (e.g., from first message)
  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setState({
      currentLanguage: lang,
      languageName: GLOBAL_LANGUAGES[lang],
      consecutiveCount: 0,
      lastDetectedLanguage: lang,
    });
    persistLanguage(lang);
  }, [persistLanguage]);

  // Get display name for a language code
  const getLanguageName = useCallback((code: SupportedLanguage): string => {
    return GLOBAL_LANGUAGES[code] || "English";
  }, []);

  return {
    ...state,
    processMessage,
    setLanguage,
    getLanguageName,
    detectLanguage,
  };
}
