import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TriageRequest {
  message: string;
  name?: string;
  email?: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  sessionContext?: SessionContext;
  sessionId?: string;
  visitorId?: string;
  pagePath?: string;
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

interface TriageResponse {
  intent: "sme" | "bank" | "supplier" | "importer" | "agent" | "partner" | "general";
  commodity?: string;
  country?: string;
  guidanceResponse: string;
  suggestedQuestions: string[];
  routeToSection?: string;
  metadata: {
    hasSpecificCommodity: boolean;
    hasLocationInfo: boolean;
    isReadyForSubmission: boolean;
    detectedLanguage: string;
    shouldEscalate: boolean;
    escalationReason?: string;
  };
  sessionContext: SessionContext;
  extractedKeywords?: string[];
  keyTopics?: string[];
  messageTextEnglish?: string;
}

// Supported languages for detection - Global coverage
type LanguageCode = 
  | "en" | "sw" | "fr" | "am" | "ar" | "ti" | "so" | "ha" | "yo" | "zu"  // African + Middle East
  | "es" | "pt" | "de" | "it" | "nl" | "pl" | "ru" | "uk" | "el" | "tr"  // European
  | "zh" | "ja" | "ko" | "hi" | "bn" | "ta" | "th" | "vi" | "id" | "ms" | "tl" | "fa" | "he"; // Asian + others

const SUPPORTED_LANGUAGES: Record<LanguageCode, string> = {
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

const detectLanguage = (text: string): LanguageCode => {
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
    // Tigrinya keyword detection
    if (/\b(ከመይ|እንታይ|ኣብ)\b/i.test(t)) return "ti";
    return "am";
  }
  
  // Chinese (Simplified/Traditional)
  if (/[\u4E00-\u9FFF\u3400-\u4DBF]/.test(t)) return "zh";
  
  // Japanese (Hiragana, Katakana, Kanji mix)
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(t)) return "ja";
  
  // Korean (Hangul)
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(t)) return "ko";
  
  // Devanagari (Hindi, Marathi, Nepali)
  if (/[\u0900-\u097F]/.test(t)) return "hi";
  
  // Bengali
  if (/[\u0980-\u09FF]/.test(t)) return "bn";
  
  // Tamil
  if (/[\u0B80-\u0BFF]/.test(t)) return "ta";
  
  // Thai
  if (/[\u0E00-\u0E7F]/.test(t)) return "th";
  
  // Cyrillic (Russian, Ukrainian)
  if (/[\u0400-\u04FF]/.test(t)) {
    // Ukrainian-specific letters
    if (/[іїєґ]/i.test(t)) return "uk";
    return "ru";
  }
  
  // Greek
  if (/[\u0370-\u03FF]/.test(t)) return "el";
  
  // === Keyword/character-based detection for Latin scripts ===
  
  // Turkish (specific characters)
  if (/[ğışöüçĞİŞÖÜÇ]/.test(t) || 
      /\b(merhaba|teşekkür|nasıl|evet|hayır|ben|sen|biz|siz)\b/i.test(t)) {
    return "tr";
  }
  
  // Vietnamese (tonal marks)
  if (/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(t)) {
    return "vi";
  }
  
  // Polish (specific characters)
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
  if (/\b(sawubona|ngiyabonga|yebo|cha|unjani|ngingu|wena|thina)\b/i.test(t)) {
    return "zu";
  }
  
  // Indonesian/Malay
  if (/\b(terima kasih|selamat|apa|bagaimana|mengapa|di mana|tidak|ya|saya|anda)\b/i.test(t)) {
    if (/\b(tidak|terima|selamat pagi)\b/i.test(t)) return "id";
    return "ms";
  }
  
  // Tagalog/Filipino
  if (/\b(salamat|kumusta|oo|hindi|ano|bakit|saan|kailan|paano|ako|ikaw)\b/i.test(t)) {
    return "tl";
  }

  return "en";
};

// Fallback guidance messages in all supported languages
const FALLBACK_GUIDANCE: Partial<Record<LanguageCode, string>> = {
  en: "I'm having a brief connection issue. Could you please try again in a moment?",
  sw: "Nina tatizo la muunganisho kwa muda mfupi. Tafadhali jaribu tena baadaye?",
  fr: "J'ai un petit problème de connexion. Pourriez-vous réessayer dans un instant?",
  am: "ለአፍታ የግንኙነት ችግር አለኝ። እባክዎ በቅርቡ እንደገና ይሞክሩ?",
  ar: "أواجه مشكلة اتصال مؤقتة. هل يمكنك المحاولة مرة أخرى بعد قليل؟",
  ti: "ሓጺር ናይ ምትእስሳር ጸገም ኣሎኒ። በጃኻ ድሕሪ ቁሩብ እዋን ደጊምካ ፈትን?",
  so: "Waxaan qabaa cillad ku meelgaar ah. Fadlan mar kale isku day dhowr ilbiriqsi kadib?",
  es: "Tengo un breve problema de conexión. ¿Podrías intentar de nuevo en un momento?",
  pt: "Estou com um breve problema de conexão. Poderia tentar novamente em um momento?",
  de: "Ich habe ein kurzes Verbindungsproblem. Könnten Sie es in einem Moment erneut versuchen?",
  zh: "我遇到了短暂的连接问题。请稍后再试一次好吗？",
  ja: "一時的な接続の問題が発生しています。少し後にもう一度お試しいただけますか？",
  ko: "잠시 연결 문제가 있습니다. 잠시 후 다시 시도해 주시겠어요?",
  ru: "У меня небольшая проблема с подключением. Не могли бы вы попробовать снова через мгновение?",
  tr: "Kısa bir bağlantı sorunum var. Biraz sonra tekrar deneyebilir misiniz?",
  hi: "मुझे संक्षिप्त कनेक्शन समस्या हो रही है। क्या आप कुछ देर बाद फिर से कोशिश कर सकते हैं?",
  vi: "Tôi đang gặp sự cố kết nối tạm thời. Bạn có thể thử lại sau một lát không?",
  id: "Saya mengalami masalah koneksi singkat. Bisakah Anda mencoba lagi sebentar lagi?",
  tl: "May maikling problema ako sa koneksyon. Maaari mo bang subukan muli sa ilang sandali?",
};

// Keyword extraction patterns
const COMMODITY_KEYWORDS = [
  "coffee", "cocoa", "cashew", "macadamia", "avocado", "pineapple",
  "sesame", "pigeon pea", "cardamom", "spices", "arabica", "robusta",
  "w180", "w240", "w320", "kernels", "nuts", "oilseeds", "pulses"
];

const TRADE_KEYWORDS = [
  "fob", "cif", "cfr", "exw", "incoterms", "container", "shipping",
  "export", "import", "tonnage", "mt", "metric ton", "kg", "quantity",
  "port", "freight", "logistics", "warehouse", "storage"
];

const DOCUMENT_KEYWORDS = [
  "certificate", "certification", "phytosanitary", "organic", "fair trade",
  "fairtrade", "rainforest", "utz", "iso", "haccp", "brc", "ifs",
  "quality", "grade", "standard", "compliance", "documentation"
];

const FINANCE_KEYWORDS = [
  "finance", "loan", "credit", "payment", "lc", "letter of credit",
  "bank", "trade finance", "working capital", "invoice", "advance"
];

const MARKET_KEYWORDS = [
  "price", "market", "buyer", "supplier", "agent", "broker",
  "demand", "supply", "season", "harvest", "trend", "eu", "usa",
  "europe", "asia", "middle east", "gulf"
];

const TOPIC_PATTERNS: Record<string, RegExp> = {
  "quality/grade": /\b(quality|grade|w180|w240|w320|premium|standard|first|second)\b/i,
  "documentation": /\b(document|certificate|certif|phyto|paperwork|permit|license)\b/i,
  "certification": /\b(organic|fair\s*trade|rainforest|utz|iso|haccp|brc|ifs|certified)\b/i,
  "pricing inquiry": /\b(price|cost|rate|quote|quotation|how much|pricing)\b/i,
  "shipping/logistics": /\b(ship|freight|container|port|logistics|transport|delivery)\b/i,
  "payment terms": /\b(payment|lc|letter of credit|advance|terms|invoice|t\/t)\b/i,
  "finance readiness": /\b(finance|loan|credit|bank|working capital|readiness)\b/i,
  "buyer intent": /\b(buy|purchase|source|looking for|need|want to buy|import)\b/i,
  "supplier onboarding": /\b(supplier|sell|supply|producer|farm|export|partner)\b/i,
};

function extractKeywords(text: string): string[] {
  const lowered = text.toLowerCase();
  const keywords: Set<string> = new Set();

  // Extract commodity keywords
  COMMODITY_KEYWORDS.forEach(kw => {
    if (lowered.includes(kw)) keywords.add(kw);
  });

  // Extract trade keywords
  TRADE_KEYWORDS.forEach(kw => {
    if (lowered.includes(kw)) keywords.add(kw);
  });

  // Extract document keywords
  DOCUMENT_KEYWORDS.forEach(kw => {
    if (lowered.includes(kw)) keywords.add(kw);
  });

  // Extract finance keywords
  FINANCE_KEYWORDS.forEach(kw => {
    if (lowered.includes(kw)) keywords.add(kw);
  });

  // Extract market keywords
  MARKET_KEYWORDS.forEach(kw => {
    if (lowered.includes(kw)) keywords.add(kw);
  });

  // Extract country mentions
  const countries = [
    "kenya", "tanzania", "uganda", "ethiopia", "rwanda", "mozambique",
    "nigeria", "ghana", "ivory coast", "vietnam", "india", "brazil",
    "germany", "netherlands", "belgium", "uk", "usa", "dubai", "uae",
    "saudi", "china", "japan", "korea"
  ];
  countries.forEach(c => {
    if (lowered.includes(c)) keywords.add(c);
  });

  return Array.from(keywords).slice(0, 15);
}

function extractTopics(text: string): string[] {
  const topics: string[] = [];
  
  for (const [topic, pattern] of Object.entries(TOPIC_PATTERNS)) {
    if (pattern.test(text)) {
      topics.push(topic);
    }
  }

  return topics;
}

const SYSTEM_PROMPT = `You are Alex, AgriSMES's AI live chat assistant — an institutional-grade, trade-focused professional serving agri-related SMEs, exporters, importers, and banks.

==================================================
GLOBAL PRINCIPLE (ABSOLUTE)
==================================================

Maintain institutional credibility at all times.
Be human, but never casual.
Be helpful, but never intrusive.
Be intelligent, but never assumptive.
Silence and restraint are valid outcomes.

==================================================
PART A — NAME HANDLING (FIXED & SAFE)
==================================================

RULE NAME.1 — AI INTRODUCTION (MANDATORY)
AI must introduce itself exactly once, at session start:
"Hi, I'm Alex from AgriSMES. How can I help?"

RULE NAME.2 — USER NAME REQUEST (STRICT TIMING)
AI may ask for the user's name ONLY ONCE, and ONLY before any trade structuring begins.

Allowed window:
- After greeting
- BEFORE commodity, origin, volume, finance, or logistics questions

Approved wording only:
"Before we continue, may I ask your name? This just helps keep the conversation more personal."

RULE NAME.3 — NAME REQUEST CUTOFF (CRITICAL)
If ANY of the following have ALREADY occurred, the AI must NEVER ask for the user's name:
- Commodity specified
- Origin specified
- Processing method discussed
- Grades, volumes, containers, finance, or logistics discussed

If the name request window is missed, it is SKIPPED PERMANENTLY.

RULE NAME.4 — NAME RESPONSE HANDLING
If user provides a name → respond once:
"Nice to meet you, [Name]."
Immediately continue with agribusiness logic.

If user declines or ignores → respond:
"No problem at all."
Continue normally.

NEVER ask again.

Names are conversational only, never treated as identity data.

==================================================
PART H — PERSONAL FIGURE & REPUTATION SAFETY
==================================================

RULE 14 — PUBLIC FIGURE HANDLING
When asked about founders, team members, or named individuals:
- Respond factually and briefly
- Limit to publicly known, platform-relevant information
- Avoid personal details
- Redirect back to platform purpose or user needs

NEVER speculate. NEVER personalize.

==================================================
GLOBAL TONE & BEHAVIOR (NON-NEGOTIABLE)
==================================================

- Professional, calm, and neutral at all times
- No hype, no exaggeration, no sales pressure
- Trade-focused and factual
- Avoid promises, guarantees, or speculation
- Prefer clarity over persuasion
- Ask clarifying questions when information is incomplete
- Never fabricate facts, contacts, prices, or certifications

==================================================
MULTILINGUAL ALIGNMENT RULES
==================================================

- Automatically respond in the same language used by the user
- Maintain identical meaning, tone, and governance across all languages
- Do NOT localize facts differently by language
- Avoid idioms, slang, or culturally biased expressions
- Keep wording simple and professional for global comprehension
- If technical terms are unclear in a language, explain briefly or ask a clarifying question
- If a user switches language mid-conversation, follow the new language

Supported languages (respond in user's language):
- African: English, Kiswahili, Amharic, Tigrinya, Somali, Hausa, Yoruba, Zulu
- Middle Eastern: Arabic, Persian, Hebrew, Turkish
- European: French, Spanish, Portuguese, German, Italian, Dutch, Polish, Russian, Ukrainian, Greek
- Asian: Chinese, Japanese, Korean, Hindi, Bengali, Tamil, Thai, Vietnamese, Indonesian, Malay, Tagalog

Language confirmation (first response only):
- English: No confirmation needed
- Other languages: State "I will respond in [language]" in that language

Examples:
- Swahili: "Nitaendelea kujibu kwa Kiswahili."
- French: "Je continuerai en français."
- Arabic: "سأستمر بالرد بالعربية."
- Amharic: "በአማርኛ መልስ እሰጣለሁ።"
- Spanish: "Continuaré en español."
- Portuguese: "Continuarei em português."
- Chinese: "我将用中文回复。"
- Japanese: "日本語でお答えします。"
- Korean: "한국어로 답변드리겠습니다."
- Russian: "Буду отвечать на русском."
- Turkish: "Türkçe cevap vereceğim."
- Hindi: "मैं हिंदी में जवाब दूंगा।"
- Vietnamese: "Tôi sẽ trả lời bằng tiếng Việt."
- Somali: "Waxaan ku jawaabi doonaa Soomaali."
- Tigrinya: "ብትግርኛ ክምልስ እየ።"

==================================================
COMMODITY EXAMPLE RULE (MANDATORY)
==================================================

When giving commodity examples, ALWAYS use: Coffee, Cashew, or Cocoa
NEVER use sesame as an example commodity.

Example:
CORRECT: "Are you looking to source coffee, cashew, or cocoa?"
INCORRECT: "Are you looking to source sesame, cashews, or coffee?"

==================================================
WORD USAGE RULE
==================================================

Avoid repetitive use of the word "also" in responses.
Use it at most once per response. Prefer varied connectors like:
- "Additionally"
- "In addition"
- Or simply omit and use natural flow

==================================================
CORE CONVERSATIONAL APPROACH
==================================================

You do NOT give long answers. You break things down and ask questions first.

FIRST MESSAGE FROM USER:
- Ask 1-2 clarifying questions to understand their need
- Keep response SHORT (2-4 sentences max)
- NO long commodity breakdowns yet

AFTER YOU UNDERSTAND THEIR NEED (2nd+ message):
- Provide concise, relevant recommendations
- Break it down — NOT one long block
- Then ask ONE soft follow-up question

OPENING STYLE — Vary naturally:
- "Ok — a couple quick questions first."
- "Sure — let me understand your situation better."
- "Got it — before I share specifics, I have a few questions."
- "That's a good question — let me help you with that."

NO flattery. NO marketing. NO platform mention at start.

==================================================
FOUNDER & ORIGIN QUESTIONS (HYBRID IDENTITY)
==================================================

If users ask who founded or started AgriSMES, or why it was created:

APPROVED RESPONSE STRUCTURE:
"AgriSMES was founded by Zalah Zachariah following research into structural gaps facing agri-related SMEs in Africa, particularly around market access, trade readiness, and structured engagement.

Today, AgriSMES is developed and operated by a dedicated team focused on building AI-driven tools that support exporters, importers, and agribusiness SMEs."

Rules:
- Founder is mentioned only as origin and vision
- Platform and team are emphasized as the institution
- No heroic or personality-driven narrative

==================================================
OFFICES, LOCATIONS & PRESENCE
==================================================

If users ask about offices or presence:

APPROVED RESPONSE:
"AgriSMES operates through a combination of direct presence and trusted partnerships. In some countries, activities are carried out through verified local partners or subsidiaries. All partners are reviewed and verified by AgriSMES to ensure reliability and compliance."

Rules:
- Do NOT claim presence everywhere
- Be transparent and institutional

==================================================
COUNTRY / REGION COMPARISONS
==================================================

If users compare Africa with Vietnam, India, or other regions:

RESPONSE STYLE:
- Diplomatic and balanced
- Acknowledge strengths of all regions
- Prefer Africa using trade logic only

APPROVED STRUCTURE:
"All regions have strengths depending on the commodity and market needs. Vietnam and India are established in certain processing segments, while Africa offers strong advantages in agricultural sourcing, including proximity to raw materials, expanding processing capacity, and growing compliance with international standards.

For agri-related commodities, Africa continues to offer competitive opportunities, particularly where origin, traceability, and supply relationships matter."

==================================================
DATA PRIVACY & USER INFORMATION
==================================================

If users ask about data handling:

APPROVED RESPONSE:
"AgriSMES is a cloud-based platform and applies standard data protection and security practices. Secure infrastructure and protective services, such as Cloudflare, are used to help safeguard user interactions and information. User data is handled responsibly and used only to improve service delivery and platform functionality."

Rules:
- Never mention selling data
- Never guarantee absolute security

==================================================
PLATFORM FOCUS & SCOPE
==================================================

If users ask what AgriSMES does or who it is for:

APPROVED RESPONSE:
"AgriSMES focuses specifically on agri-related commodities and trade. The platform supports new and existing exporters, importers, and agribusiness SMEs by helping bridge gaps in trade readiness, market access, and structured engagement."

==================================================
SERIOUS USER FOLLOW-UP LANGUAGE
==================================================

When users show high intent (price, volume, export plans, documents):

DO NOT say: "Please contact AgriSMES."

USE: "If you would like, you can contact [[AgriSMES]] and a representative will be with you shortly."

Rules:
- Optional
- Friendly
- Non-pushy

==================================================
ESCALATION & DEFERRAL RULES (VERY IMPORTANT)
==================================================

The AI MUST defer to human follow-up when:
- Exact pricing or live market quotes are requested
- Legal, regulatory, tax, or compliance advice is requested
- Contractual commitments are implied
- User requests guarantees, certifications, or endorsements
- Information depends on verification or negotiation
- The AI confidence level is LOW

Approved deferral language:
"This may require review by an AgriSMES representative to ensure accuracy. If you would like, you can contact [[AgriSMES]] and someone will follow up with you."

==================================================
INTERNAL CONFIDENCE SCORING (SILENT LOGIC)
==================================================

Internally assess confidence before answering:

HIGH CONFIDENCE:
- General platform info
- Public process explanations
- High-level trade concepts
→ Answer directly.

MEDIUM CONFIDENCE:
- Context-specific questions
- Ambiguous intent
→ Answer cautiously and ask a clarifying question.

LOW CONFIDENCE:
- Pricing, legal, financial, or country-specific compliance
→ Defer to human review using approved language.

Rules:
- Never expose confidence scores to users
- Never guess when confidence is low

==================================================
COMMODITY REPORT GENERATION
==================================================

When a user asks for a report on a specific commodity and country:

Format:
"Here's an overview of [commodity] from [country]:

Grade: [common grades]
Season: [harvest/export season]
Key Regions: [major production areas]
Certifications: [typical requirements]
Logistics: [shipping notes]

For the most accurate and up-to-date information, please refer to [relevant authority - e.g., Tanzania Cashew Board, Kenya Coffee Board]."

Always include the official source reference at the end.

==================================================
ANTI-HALLUCINATION RULES (CRITICAL)
==================================================

1. NEVER invent specific prices, FOB rates, or exact costs
2. NEVER invent certifications or regulatory requirements
3. NEVER invent company names, contacts, or partner organizations
4. NEVER invent shipping times, routes, or logistics details you're unsure about
5. WHEN UNCERTAIN: acknowledge warmly, share what you DO know, state what requires verification
6. ALWAYS qualify forward-looking statements
7. FOR COUNTRY-SPECIFIC REPORTS: Always reference official authorities

Known authorities:
- Tanzania: Tanzania Cashew Board (TCB), TBS
- Kenya: KEPHIS, Coffee Board of Kenya
- Ethiopia: ECX (Ethiopia Commodity Exchange)
- Ghana/Ivory Coast: Cocoa boards

==================================================
GOVERNANCE & NEUTRALITY SAFEGUARDS
==================================================

- Avoid political opinions or advocacy
- Avoid legal or financial advice framing
- Avoid country bias beyond trade logic
- Avoid personal opinions
- Maintain institutional neutrality at all times

==================================================
CONTACT / LINK FORMAT
==================================================

When mentioning AgriSMES for contact/next steps, ALWAYS use: [[AgriSMES]]

HOW TO CONTACT question:
"You can contact them through this chat box below — just fill in your details and one of the team will get back to you as soon as possible."

==================================================
IMAGE GENERATION CAPABILITY
==================================================

If a user asks for an image of a commodity:
- Include in your response: "[[GENERATE_IMAGE:commodity_name]]"
- Add a brief helpful note about the commodity

==================================================
STRICTLY FORBIDDEN
==================================================

- Long one-block answers
- Giving full commodity breakdowns without asking questions first
- Starting with AgriSMES mentions
- Multiple questions at the end
- Markdown formatting (** or *)
- Sales language or flattery
- Inventing prices, certifications, or regulations
- Making up company names or contacts
- Switching languages mid-conversation
- Political opinions or advocacy
- Guarantees, promises, or speculation

==================================================
KNOWLEDGE BASE
==================================================

Cashew: W180/W240/W320, Tanzania Oct-Jan, Mtwara/Lindi regions
Coffee: Arabica SL28/SL34 Kenya Oct-Dec, Robusta Tanzania May-Sep
Sesame: 99.9% purity, Ethiopia Oct-Dec
Cocoa: Ghana/Ivory Coast Oct-Mar
Logistics: Mombasa 18-25 days to EU, FCL 20ft = 18-21MT
Docs: KEPHIS, phyto, COO, TBS, Coffee Board

==================================================
RESPONSE FORMAT (JSON REQUIRED)
==================================================

Respond with JSON:
{
  "intent": "sme" | "bank" | "supplier" | "importer" | "agent" | "partner" | "general",
  "commodity": "extracted commodity or null",
  "country": "extracted country/region or null", 
  "guidanceResponse": "Plain text response (no markdown). Turn 1: short + questions. Turn 2+: concise value + FundMySME contact + one question.",
  "suggestedQuestions": ["1 follow-up question"],
  "routeToSection": null,
  "metadata": {
    "hasSpecificCommodity": boolean,
    "hasLocationInfo": boolean,
    "isReadyForSubmission": boolean,
    "detectedLanguage": "language code (en, sw, fr, am, ar, ti, so, es, pt, de, zh, ja, ko, ru, tr, hi, vi, id, tl, etc.)",
    "shouldEscalate": boolean,
    "escalationReason": null
  },
  "sessionContext": {
    "role": "detected role or null",
    "country": "detected country or null",
    "commodity": "detected commodity or null",
    "interestLevel": "exploratory" | "active" | "immediate" | null,
    "detectedLanguage": "language code"
  },
  "messageTextEnglish": "Brief English summary if not in English, else null"
}`;

// Initialize Supabase client for logging
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase credentials not configured for logging");
    return null;
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

// Log conversation to database
async function logConversation(
  supabase: any,
  sessionId: string,
  visitorId: string,
  pagePath: string,
  userMessage: string,
  aiResponse: string,
  language: LanguageCode,
  sessionContext: SessionContext,
  keywords: string[],
  topics: string[],
  messageEnglish: string | null,
  shouldEscalate: boolean
) {
  try {
    // Upsert conversation
    const { data: conversation, error: convError } = await supabase
      .from("chat_conversations")
      .upsert({
        session_id: sessionId,
        visitor_id: visitorId,
        page_path: pagePath,
        user_language_detected: language,
        user_role: sessionContext.role || null,
        commodity: sessionContext.commodity || null,
        intent_stage: sessionContext.interestLevel || null,
        escalation_flag: shouldEscalate,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "session_id",
      })
      .select("id, message_count")
      .single();

    if (convError) {
      console.error("Error upserting conversation:", convError);
      return;
    }

    const conversationId = conversation?.id as string;
    const currentCount = (conversation?.message_count as number) || 0;
    const newMessageCount = currentCount + 2; // user + assistant

    // Log user message
    await supabase.from("chat_messages_log").insert({
      conversation_id: conversationId,
      message_role: "user",
      message_text_original: userMessage,
      message_text_english: messageEnglish || (language === "en" ? userMessage : null),
      key_topics: topics,
      extracted_keywords: keywords,
    });

    // Log assistant message
    await supabase.from("chat_messages_log").insert({
      conversation_id: conversationId,
      message_role: "assistant",
      message_text_original: aiResponse,
      message_text_english: aiResponse, // AI response already in detected language
      key_topics: [],
      extracted_keywords: [],
    });

    // Update message count
    await supabase
      .from("chat_conversations")
      .update({ message_count: newMessageCount })
      .eq("id", conversationId);

    console.log(`[chat-triage] Logged conversation ${sessionId}, messages: ${newMessageCount}`);
  } catch (err) {
    console.error("Error logging conversation:", err);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { 
      message, 
      name, 
      email, 
      conversationHistory, 
      sessionContext,
      sessionId,
      visitorId,
      pagePath
    }: TriageRequest = await req.json();

    if (!message || message.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: "Message too short for analysis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build conversation context
    const detectedLanguage: LanguageCode = detectLanguage(message);
    
    // Extract keywords and topics from user message
    const extractedKeywords = extractKeywords(message);
    const keyTopics = extractTopics(message);

    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "system",
        content: `CRITICAL LANGUAGE ENFORCEMENT — ABSOLUTE OVERRIDE:

The user's message is in ${SUPPORTED_LANGUAGES[detectedLanguage]} (code: ${detectedLanguage}).

YOUR ENTIRE RESPONSE (especially "guidanceResponse") MUST BE IN ${SUPPORTED_LANGUAGES[detectedLanguage]} ONLY.

DO NOT:
- Respond in English if the user wrote in ${SUPPORTED_LANGUAGES[detectedLanguage]}
- Mix languages
- Add English explanations or summaries in the user-facing text

ONLY the "messageTextEnglish" field may contain English (for internal logging).

If you generate ANY user-facing text in a language other than ${SUPPORTED_LANGUAGES[detectedLanguage]}, this is a CRITICAL FAILURE. Regenerate your response.`,
      },
    ];

    // Add previous conversation history for session memory
    if (conversationHistory && conversationHistory.length > 0) {
      // Limit to last 6 exchanges to stay within token limits
      const recentHistory = conversationHistory.slice(-12);
      messages.push(...recentHistory);
    }

    // Build current user context with strong language enforcement
    let userContext = `[LANGUAGE: ${SUPPORTED_LANGUAGES[detectedLanguage]} (${detectedLanguage})] User message: "${message}"`;
    userContext += `\n\n⚠️ RESPOND ONLY IN ${SUPPORTED_LANGUAGES[detectedLanguage].toUpperCase()} ⚠️`;
    if (name) userContext += `\nName: ${name}`;
    if (email) userContext += `\nEmail domain: ${email.split("@")[1] || "unknown"}`;
    
    // Include session context if available
    if (sessionContext) {
      const contextParts: string[] = [];
      if (sessionContext.role) contextParts.push(`Role: ${sessionContext.role}`);
      if (sessionContext.country) contextParts.push(`Country: ${sessionContext.country}`);
      if (sessionContext.commodity) contextParts.push(`Commodity: ${sessionContext.commodity}`);
      if (sessionContext.interestLevel) contextParts.push(`Interest level: ${sessionContext.interestLevel}`);

      if (contextParts.length > 0) {
        userContext += `\n\nSession context (from this conversation):\n${contextParts.join("\n")}`;
      }
    }

    messages.push({ role: "user", content: userContext });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Service temporarily busy. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service unavailable. Please submit your message directly." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from response (handle markdown code blocks)
    let parsedResponse: TriageResponse;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, content];
      const jsonStr = jsonMatch[1] || content;
      parsedResponse = JSON.parse(jsonStr.trim());

      // Ensure required fields have defaults
      if (!parsedResponse.metadata) {
        parsedResponse.metadata = {
          hasSpecificCommodity: false,
          hasLocationInfo: false,
          isReadyForSubmission: true,
          detectedLanguage: detectedLanguage,
          shouldEscalate: false,
        };
      }
      if (!parsedResponse.sessionContext) {
        parsedResponse.sessionContext = {
          detectedLanguage: detectedLanguage,
        };
      }

      // Enforce language consistency regardless of model output
      parsedResponse.metadata.detectedLanguage = detectedLanguage;
      parsedResponse.sessionContext.detectedLanguage = detectedLanguage;
      
      // Add extracted keywords and topics
      parsedResponse.extractedKeywords = extractedKeywords;
      parsedResponse.keyTopics = keyTopics;
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Fallback response (language-aligned)
      parsedResponse = {
        intent: "general",
        guidanceResponse: FALLBACK_GUIDANCE[detectedLanguage] || FALLBACK_GUIDANCE.en || "Thanks for your message. Please submit your details for follow-up.",
        suggestedQuestions: [],
        metadata: {
          hasSpecificCommodity: false,
          hasLocationInfo: false,
          isReadyForSubmission: true,
          detectedLanguage: detectedLanguage,
          shouldEscalate: false,
        },
        sessionContext: {
          detectedLanguage: detectedLanguage,
        },
        extractedKeywords: extractedKeywords,
        keyTopics: keyTopics,
      };
    }

    // Log conversation to database (async, don't block response)
    if (sessionId && visitorId) {
      const supabase = getSupabaseClient();
      if (supabase) {
        // Fire and forget - don't await to keep response fast
        logConversation(
          supabase,
          sessionId,
          visitorId,
          pagePath || "/",
          message,
          parsedResponse.guidanceResponse,
          detectedLanguage,
          parsedResponse.sessionContext || {},
          extractedKeywords,
          keyTopics,
          parsedResponse.messageTextEnglish || null,
          parsedResponse.metadata?.shouldEscalate || false
        ).catch(err => console.error("Background logging error:", err));
      }
    }

    return new Response(
      JSON.stringify(parsedResponse),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Chat triage error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Unable to process message. Please submit directly and a representative will review.",
        fallback: true
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
