// Email validation utility - mirrors server-side validation in send-chat-message edge function

// Known disposable/temporary email domains
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "tempmail.com", "throwaway.email", "guerrillamail.com", "mailinator.com",
  "10minutemail.com", "temp-mail.org", "fakeinbox.com", "trashmail.com",
  "yopmail.com", "sharklasers.com", "guerrillamail.info", "grr.la",
  "guerrillamail.biz", "guerrillamail.de", "guerrillamail.net", "guerrillamail.org",
  "spam4.me", "getairmail.com", "mohmal.com", "tempail.com", "tmpmail.org",
  "tmpmail.net", "dispostable.com", "mailcatch.com", "tempr.email",
  "discard.email", "discardmail.com", "spamgourmet.com", "mytrashmail.com",
  "mailnesia.com", "maildrop.cc", "getnada.com", "emailondeck.com",
  "temp.email", "fakemailgenerator.com", "throwawaymail.com", "mintemail.com",
  "tempinbox.com", "mailsac.com", "burnermail.io", "inboxkitten.com"
]);

// Suspicious email patterns
const SUSPICIOUS_PATTERNS = [
  /^test[@.]/, /^fake[@.]/, /^spam[@.]/, /^noreply[@.]/,
  /^admin[@.].*@(?!agrismes|gmail|yahoo|outlook|hotmail)/i,
  /[0-9]{6,}@/, // Many consecutive numbers
  /^[a-z]{1,2}[0-9]+@/i, // Very short name + numbers
];

export interface EmailValidationResult {
  isValid: boolean;
  reason?: string;
  riskLevel: "low" | "medium" | "high";
}

/**
 * Validates an email address for format, disposable domains, and suspicious patterns
 */
export function validateEmail(email: string): EmailValidationResult {
  const trimmedEmail = email.trim().toLowerCase();
  
  // Empty check
  if (!trimmedEmail) {
    return { isValid: false, reason: "Email is required", riskLevel: "high" };
  }
  
  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, reason: "Please enter a valid email format", riskLevel: "high" };
  }
  
  const [localPart, domain] = trimmedEmail.split("@");
  
  // Check for disposable email domains
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return { 
      isValid: false, 
      reason: "Temporary email addresses are not accepted. Please use a permanent email.", 
      riskLevel: "high" 
    };
  }
  
  // Check for suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(trimmedEmail)) {
      return { 
        isValid: false, 
        reason: "This email address appears invalid. Please use a valid email.", 
        riskLevel: "high" 
      };
    }
  }
  
  // Check local part length
  if (localPart.length < 2) {
    return { 
      isValid: false, 
      reason: "Email address is too short", 
      riskLevel: "medium" 
    };
  }
  
  if (localPart.length > 64 || domain.length > 255) {
    return { 
      isValid: false, 
      reason: "Email address is too long", 
      riskLevel: "medium" 
    };
  }
  
  // Check length constraints
  if (trimmedEmail.length < 5 || trimmedEmail.length > 254) {
    return { 
      isValid: false, 
      reason: "Email length is invalid", 
      riskLevel: "medium" 
    };
  }
  
  return { isValid: true, riskLevel: "low" };
}

/**
 * Quick format check for real-time validation (less strict)
 */
export function isValidEmailFormat(email: string): boolean {
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmedEmail) && trimmedEmail.length >= 5 && trimmedEmail.length <= 254;
}
