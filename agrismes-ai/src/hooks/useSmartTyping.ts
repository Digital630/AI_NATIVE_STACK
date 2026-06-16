/**
 * Smart Typing Hook
 * Provides autocorrect and suggestions in any language
 * Supports global languages including African, Asian, European, Middle Eastern
 */

import { useState, useCallback, useRef, useEffect } from "react";

interface Suggestion {
  text: string;
  type: "correction" | "alternate" | "prediction";
}

interface SmartTypingState {
  suggestions: Suggestion[];
  isLoading: boolean;
  isEnabled: boolean;
  detectedLanguage: string;
  languageName: string;
}

// Language codes and display names
export const SUPPORTED_LANGUAGES: Record<string, string> = {
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

// Comprehensive typo corrections for multiple languages
const COMMON_CORRECTIONS: Record<string, string> = {
  // === English common typos (transposed letters, missing letters) ===
  "teh": "the",
  "taht": "that",
  "adn": "and",
  "wiht": "with",
  "hte": "the",
  "yuo": "you",
  "waht": "what",
  "thsi": "this",
  "jsut": "just",
  "frmo": "from",
  "Frmo": "From",
  "fomr": "form",
  "fro": "for",
  "tow": "two",
  "fo": "of",
  "ti": "it",
  "ot": "to",
  "si": "is",
  "od": "do",
  "nad": "and",
  "hwo": "how",
  "seh": "she",
  "hsi": "his",
  "ehre": "here",
  "thier": "their",
  "recieve": "receive",
  "beleive": "believe",
  "occured": "occurred",
  "seperate": "separate",
  "definately": "definitely",
  "occassion": "occasion",
  "accomodate": "accommodate",
  "wich": "which",
  "woudl": "would",
  "shoudl": "should",
  "coudl": "could",
  "becuase": "because",
  "beacuse": "because",
  "htey": "they",
  "tehy": "they",
  "ahve": "have",
  "hvae": "have",
  "knwo": "know",
  "konw": "know",
  "abotu": "about",
  "abuot": "about",
  "peopel": "people",
  "poeple": "people",
  "wnat": "want",
  "wnated": "wanted",
  "thign": "thing",
  "thigns": "things",
  "soem": "some",
  "smoe": "some",
  "whne": "when",
  "wehn": "when",
  "nwo": "now",
  "nowe": "now",
  "liek": "like",
  "lkie": "like",
  "tiem": "time",
  "tmie": "time",
  "onyl": "only",
  "olny": "only",
  "beign": "being",
  "beng": "being",
  "oen": "one",
  "noe": "one",
  "yera": "year",
  "yaer": "year",
  "wya": "way",
  "wyas": "ways",
  "mroe": "more",
  "moer": "more",
  "siad": "said",
  "sya": "say",
  "sayd": "said",
  "amke": "make",
  "mkae": "make",
  "cna": "can",
  "catn": "can't",
  "gte": "get",
  "gto": "got",
  "nto": "not",
  "udner": "under",
  "uner": "under",
  "unti": "until",
  "untill": "until",
  "jstu": "just",
  "agian": "again",
  "agin": "again",
  "comign": "coming",
  "goign": "going",
  "doign": "doing",
  "seign": "seeing",
  "lookign": "looking",
  "thikn": "think",
  "thnk": "think",
  "fidn": "find",
  "fdin": "find",
  "givn": "given",
  "gievn": "given",
  "takign": "taking",
  "workign": "working",
  "needign": "needing",
  // Contractions
  "dont": "don't",
  "cant": "can't",
  "wont": "won't",
  "im": "I'm",
  "youre": "you're",
  "theyre": "they're",
  "thats": "that's",
  "whats": "what's",
  "hows": "how's",
  "ive": "I've",
  "weve": "we've",
  "doesnt": "doesn't",
  "didnt": "didn't",
  "couldnt": "couldn't",
  "wouldnt": "wouldn't",
  "shouldnt": "shouldn't",
  "isnt": "isn't",
  "wasnt": "wasn't",
  "werent": "weren't",
  "arent": "aren't",
  "hasnt": "hasn't",
  "havent": "haven't",
  "hadnt": "hadn't",
  "lets": "let's",
  "heres": "here's",
  "theres": "there's",
  "wheres": "where's",
  "itll": "it'll",
  "youll": "you'll",
  "theyll": "they'll",
  "welll": "we'll",
  "shelll": "she'll",
  "helll": "he'll",
  "wed": "we'd",
  "youd": "you'd",
  "theyd": "they'd",
  "hed": "he'd",
  "shed": "she'd",
  // Trade/business specific
  "shippin": "shipping",
  "shpping": "shipping",
  "exprot": "export",
  "exoprt": "export",
  "improt": "import",
  "imoport": "import",
  "commidity": "commodity",
  "comodity": "commodity",
  "coffe": "coffee",
  "cofee": "coffee",
  "cacao": "cocoa",
  "cashwe": "cashew",
  "casehw": "cashew",
  "seseme": "sesame",
  "semsae": "sesame",
  "avacado": "avocado",
  "avocodo": "avocado",
  "pineaple": "pineapple",
  "pineappe": "pineapple",
  "macademia": "macadamia",
  "cardamon": "cardamom",
  "contaner": "container",
  "contianer": "container",
  "warehuose": "warehouse",
  "warehosue": "warehouse",
  "logsitics": "logistics",
  "logistcis": "logistics",
  "documnet": "document",
  "docuemnt": "document",
  "certifcate": "certificate",
  "certificat": "certificate",
  "payemnt": "payment",
  "paymnet": "payment",
  "fianance": "finance",
  "finacne": "finance",
  "suppliar": "supplier",
  "suppleir": "supplier",
  "buyar": "buyer",
  "buyr": "buyer",
  "prics": "prices",
  "pirce": "price",
  "priecs": "prices",
  "quantiy": "quantity",
  "quanity": "quantity",
  "delivary": "delivery",
  "dleivery": "delivery",
  "qualiy": "quality",
  "qulaity": "quality",
  
  // === Spanish common typos ===
  "qe": "que",
  "xq": "porque",
  "tb": "también",
  "tmb": "también",
  "porq": "porque",
  "peor": "pero",
  "preo": "pero",
  "esot": "esto",
  "etso": "esto",
  "apra": "para",
  "paar": "para",
  "tien": "tiene",
  "itene": "tiene",
  "queiro": "quiero",
  "querio": "quiero",
  "necesit": "necesito",
  "necesiot": "necesito",
  "graicas": "gracias",
  "grcaias": "gracias",
  "comrpar": "comprar",
  "comprar_es": "comprar",
  "vendr": "vender",
  "prcie": "precio",
  "preico": "precio",
  "entrga": "entrega",
  "enrtega": "entrega",
  
  // === Portuguese common typos ===
  "vc": "você",
  "tbm": "também",
  "oq": "o que",
  "pq": "porque",
  "mto": "muito",
  "mt": "muito",
  "qdo": "quando",
  "qnd": "quando",
  "cmg": "comigo",
  "ctg": "contigo",
  "obrgado": "obrigado",
  "obrgada": "obrigada",
  "porfavor": "por favor",
  "poravor": "por favor",
  "precso": "preciso",
  "precsio": "preciso",
  "entregar_pt": "entregar",
  
  // === French common typos ===
  "ca": "ça",
  "cest": "c'est",
  "jai": "j'ai",
  "jsuis": "je suis",
  "jss": "je suis",
  "bcp": "beaucoup",
  "bq": "beaucoup",
  "pquoi": "pourquoi",
  "pcq": "parce que",
  "pck": "parce que",
  "slt": "salut",
  "bjr": "bonjour",
  "bsr": "bonsoir",
  "mrc": "merci",
  "mrci": "merci",
  "svp": "s'il vous plaît",
  "stp": "s'il te plaît",
  "avc": "avec",
  "avce": "avec",
  "poru": "pour",
  "puor": "pour",
  "dnas": "dans",
  "asn": "sans",
  "snas": "sans",
  "bienet": "bientôt",
  "aujordhui": "aujourd'hui",
  "aujourdhui": "aujourd'hui",
  "entrprise": "entreprise",
  "entreprsie": "entreprise",
  "produti": "produit",
  "porduit": "produit",
  "livrasion": "livraison",
  "livrason": "livraison",
  "paiemnt": "paiement",
  "paiment": "paiement",
  
  // === German common typos ===
  "udn": "und",
  "unt": "und",
  "nciht": "nicht",
  "nihct": "nicht",
  "dei": "die",
  "dre": "der",
  "dsa": "das",
  "hba": "hab",
  "hbae": "habe",
  "mti": "mit",
  "mite": "mit",
  "auhc": "auch",
  "acuh": "auch",
  "knan": "kann",
  "knann": "kann",
  "shcon": "schon",
  "scohn": "schon",
  "nru": "nur",
  "wnan": "wann",
  "danek": "danke",
  "dnake": "danke",
  "bitet": "bitte",
  "btite": "bitte",
  "liefeurng": "Lieferung",
  "Leiferung": "Lieferung",
  "Pries": "Preis",
  "Presi": "Preis",
  
  // === Swahili common typos ===
  "hbaari": "habari",
  "habair": "habari",
  "asnat": "asante",
  "asatne": "asante",
  "tfdahali": "tafadhali",
  "tafadhail": "tafadhali",
  "ninahtaka": "ninataka",
  "nintaka": "ninataka",
  "bdiaa": "bidhaa",
  "bidaha": "bidhaa",
  "beii": "bei",
  "soik": "soko",
  "skoo": "soko",
  
  // === Arabic transliteration common typos ===
  "shukrna": "shukran",
  "sukran": "shukran",
  "ahlna": "ahlan",
  "marahabah": "marhaba",
  "mrahba": "marhaba",
  "kifak": "keefak",
  "kifek": "keefak",
  "aiwa": "aywa",
  "naam": "na'am",
};

// Words/patterns to never autocorrect
const NEVER_CORRECT_PATTERNS = [
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // Email
  /^https?:\/\//, // URLs
  /^\+?[0-9\s\-()]+$/, // Phone numbers
  /^[A-Z][a-z]+(?:\s[A-Z][a-z]+)*$/, // Proper names (capitalized)
];

/**
 * Detect language from text using script analysis and keyword heuristics
 */
const detectLanguage = (text: string): { code: string; name: string } => {
  const t = (text || "").trim();
  if (!t) return { code: "en", name: "English" };
  
  // === Script-based detection (most reliable) ===
  
  // Arabic script (Arabic, Persian, Urdu)
  if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(t)) {
    // Persian-specific characters
    if (/[پچژگک]/.test(t)) return { code: "fa", name: "فارسی (Persian)" };
    return { code: "ar", name: "العربية (Arabic)" };
  }
  
  // Hebrew script
  if (/[\u0590-\u05FF]/.test(t)) return { code: "he", name: "עברית (Hebrew)" };
  
  // Ethiopic script (Amharic, Tigrinya)
  if (/[\u1200-\u137F]/.test(t)) {
    // Tigrinya has some unique characters, but mainly use keyword detection
    if (/\b(ከመይ|እንታይ|ኣብ)\b/i.test(t)) return { code: "ti", name: "ትግርኛ (Tigrinya)" };
    return { code: "am", name: "አማርኛ (Amharic)" };
  }
  
  // Chinese (Simplified/Traditional)
  if (/[\u4E00-\u9FFF\u3400-\u4DBF]/.test(t)) return { code: "zh", name: "中文 (Chinese)" };
  
  // Japanese (Hiragana, Katakana, Kanji mix)
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(t)) return { code: "ja", name: "日本語 (Japanese)" };
  
  // Korean (Hangul)
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(t)) return { code: "ko", name: "한국어 (Korean)" };
  
  // Devanagari (Hindi, Marathi, Nepali)
  if (/[\u0900-\u097F]/.test(t)) return { code: "hi", name: "हिन्दी (Hindi)" };
  
  // Bengali
  if (/[\u0980-\u09FF]/.test(t)) return { code: "bn", name: "বাংলা (Bengali)" };
  
  // Tamil
  if (/[\u0B80-\u0BFF]/.test(t)) return { code: "ta", name: "தமிழ் (Tamil)" };
  
  // Thai
  if (/[\u0E00-\u0E7F]/.test(t)) return { code: "th", name: "ไทย (Thai)" };
  
  // Cyrillic (Russian, Ukrainian)
  if (/[\u0400-\u04FF]/.test(t)) {
    // Ukrainian-specific letters
    if (/[іїєґ]/i.test(t)) return { code: "uk", name: "Українська (Ukrainian)" };
    return { code: "ru", name: "Русский (Russian)" };
  }
  
  // Greek
  if (/[\u0370-\u03FF]/.test(t)) return { code: "el", name: "Ελληνικά (Greek)" };
  
  // === Keyword/character-based detection for Latin scripts ===
  
  // Turkish (specific characters)
  if (/[ğışöüçĞİŞÖÜÇ]/.test(t) || 
      /\b(merhaba|teşekkür|nasıl|evet|hayır|ben|sen|biz|siz)\b/i.test(t)) {
    return { code: "tr", name: "Türkçe (Turkish)" };
  }
  
  // Vietnamese (tonal marks)
  if (/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(t)) {
    return { code: "vi", name: "Tiếng Việt (Vietnamese)" };
  }
  
  // Polish (specific characters)
  if (/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(t) ||
      /\b(dzień|dobry|cześć|dziękuję|tak|nie|jak|gdzie)\b/i.test(t)) {
    return { code: "pl", name: "Polski (Polish)" };
  }
  
  // Spanish
  if (/[¿¡ñÑ]/.test(t) ||
      /\b(hola|gracias|buenos|días|cómo|estás|qué|por favor|señor|señora)\b/i.test(t)) {
    return { code: "es", name: "Español (Spanish)" };
  }
  
  // Portuguese
  if (/[ãõÃÕ]/.test(t) ||
      /\b(olá|obrigado|obrigada|bom dia|como|você|muito|não|sim)\b/i.test(t)) {
    return { code: "pt", name: "Português (Portuguese)" };
  }
  
  // French
  if (/[àâçéèêëîïôùûüÿœæÀÂÇÉÈÊËÎÏÔÙÛÜŸŒÆ]/.test(t) ||
      /\b(bonjour|merci|je|j'|vous|comment|où|pourquoi|s'il vous plaît)\b/i.test(t)) {
    return { code: "fr", name: "Français (French)" };
  }
  
  // German
  if (/[äöüßÄÖÜ]/.test(t) ||
      /\b(guten|tag|danke|bitte|wie|geht|warum|hallo|morgen)\b/i.test(t)) {
    return { code: "de", name: "Deutsch (German)" };
  }
  
  // Italian
  if (/\b(ciao|grazie|buongiorno|buonasera|come|stai|perché|dove|quando)\b/i.test(t)) {
    return { code: "it", name: "Italiano (Italian)" };
  }
  
  // Dutch
  if (/\b(hallo|bedankt|goedemorgen|goedendag|hoe|gaat|waar|wanneer)\b/i.test(t)) {
    return { code: "nl", name: "Nederlands (Dutch)" };
  }
  
  // Kiswahili
  if (/\b(habari|asante|tafadhali|ninataka|nina|soko|bei|usafirishaji|bidhaa|jambo|karibu)\b/i.test(t)) {
    return { code: "sw", name: "Kiswahili" };
  }
  
  // Somali
  if (/\b(salaam|mahadsanid|sidee|waa|maxay|haa|maya|magaca|xaggee)\b/i.test(t)) {
    return { code: "so", name: "Soomaali (Somali)" };
  }
  
  // Hausa
  if (/\b(sannu|nagode|yaya|ina|mene|ne|ba|ko|a|kuma)\b/i.test(t)) {
    return { code: "ha", name: "Hausa" };
  }
  
  // Yoruba
  if (/[ẹọṣẸỌṢ]/.test(t) ||
      /\b(bawo|ẹ kú|ọjọ|daadaa|rara|bẹẹni|kilode)\b/i.test(t)) {
    return { code: "yo", name: "Yorùbá" };
  }
  
  // Indonesian/Malay
  if (/\b(terima kasih|selamat|apa|bagaimana|mengapa|di mana|tidak|ya|saya|anda)\b/i.test(t)) {
    // More Indonesian specific
    if (/\b(tidak|terima|selamat pagi)\b/i.test(t)) return { code: "id", name: "Bahasa Indonesia" };
    return { code: "ms", name: "Bahasa Melayu (Malay)" };
  }
  
  // Tagalog/Filipino
  if (/\b(salamat|kumusta|oo|hindi|ano|bakit|saan|kailan|paano|ako|ikaw)\b/i.test(t)) {
    return { code: "tl", name: "Tagalog (Filipino)" };
  }
  
  // Default to English
  return { code: "en", name: "English" };
};

// Check if text should not be corrected
const shouldSkipCorrection = (text: string): boolean => {
  return NEVER_CORRECT_PATTERNS.some(pattern => pattern.test(text));
};

// Get the last word from text
const getLastWord = (text: string): { word: string; startIndex: number } => {
  const trimmed = text.trimEnd();
  const lastSpaceIndex = trimmed.lastIndexOf(" ");
  const word = lastSpaceIndex === -1 ? trimmed : trimmed.slice(lastSpaceIndex + 1);
  const startIndex = lastSpaceIndex === -1 ? 0 : lastSpaceIndex + 1;
  return { word, startIndex };
};

export function useSmartTyping() {
  const [state, setState] = useState<SmartTypingState>({
    suggestions: [],
    isLoading: false,
    isEnabled: true,
    detectedLanguage: "en",
    languageName: "English",
  });

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastTextRef = useRef<string>("");

  // Toggle autocorrect
  const toggleEnabled = useCallback(() => {
    setState(prev => ({ ...prev, isEnabled: !prev.isEnabled, suggestions: [] }));
  }, []);

  // Clear suggestions
  const clearSuggestions = useCallback(() => {
    setState(prev => ({ ...prev, suggestions: [] }));
  }, []);

  // Apply a suggestion
  const applySuggestion = useCallback((text: string, suggestion: Suggestion): string => {
    const { word, startIndex } = getLastWord(text);
    if (!word) return text;
    
    // Replace the last word with the suggestion
    const prefix = text.slice(0, startIndex);
    const suffix = text.slice(startIndex + word.length);
    return prefix + suggestion.text + suffix;
  }, []);

  // Generate suggestions for current text
  const generateSuggestions = useCallback(async (text: string) => {
    if (!state.isEnabled || !text.trim()) {
      clearSuggestions();
      return;
    }

    const { word } = getLastWord(text);
    if (!word || word.length < 2) {
      clearSuggestions();
      return;
    }

    // Skip if text matches patterns that shouldn't be corrected
    if (shouldSkipCorrection(word)) {
      clearSuggestions();
      return;
    }

    // Detect language
    const { code, name } = detectLanguage(text);
    setState(prev => ({ ...prev, detectedLanguage: code, languageName: name }));

    const suggestions: Suggestion[] = [];

    // Check common corrections (fast, no API call)
    const lowerWord = word.toLowerCase();
    if (COMMON_CORRECTIONS[lowerWord]) {
      suggestions.push({
        text: COMMON_CORRECTIONS[lowerWord],
        type: "correction"
      });
    }

    setState(prev => ({ 
      ...prev, 
      suggestions: suggestions.slice(0, 3),
      isLoading: false 
    }));
  }, [state.isEnabled, clearSuggestions]);

  // Debounced input handler
  const handleInputChange = useCallback((text: string) => {
    if (!state.isEnabled) return;
    
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Don't process if text hasn't changed enough
    if (text === lastTextRef.current) return;
    lastTextRef.current = text;

    // Debounce to avoid too many calls
    debounceRef.current = setTimeout(() => {
      generateSuggestions(text);
    }, 300);
  }, [state.isEnabled, generateSuggestions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    ...state,
    toggleEnabled,
    clearSuggestions,
    applySuggestion,
    handleInputChange,
  };
}
