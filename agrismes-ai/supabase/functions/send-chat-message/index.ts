import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessageRequest {
  name: string;
  phone?: string;
  email: string;
  message: string;
  attachment?: {
    content: string;
    filename: string;
  };
}

// Message validation constants
const MIN_MESSAGE_LENGTH = 20;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_ATTACHMENT_SIZE = 7 * 1024 * 1024;

// Known disposable/temporary email domains (expanded list)
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

// Trusted email providers (major providers)
const TRUSTED_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com",
  "protonmail.com", "aol.com", "mail.com", "zoho.com", "gmx.com",
  "yandex.com", "live.com", "msn.com", "me.com", "mac.com",
  // African business domains
  "co.ke", "co.tz", "co.ug", "co.rw", "co.za", "com.ng", "com.gh", "com.et"
]);

interface EmailValidationResult {
  isValid: boolean;
  reason?: string;
  riskLevel: "low" | "medium" | "high";
}

function validateEmail(email: string): EmailValidationResult {
  const trimmedEmail = email.trim().toLowerCase();
  
  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, reason: "Invalid email format", riskLevel: "high" };
  }
  
  const [localPart, domain] = trimmedEmail.split("@");
  
  // Check for disposable email domains
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return { isValid: false, reason: "Disposable email addresses are not allowed", riskLevel: "high" };
  }
  
  // Check for suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(trimmedEmail)) {
      return { isValid: false, reason: "Email address appears suspicious", riskLevel: "high" };
    }
  }
  
  // Check local part length (too short or too long)
  if (localPart.length < 2) {
    return { isValid: false, reason: "Email local part too short", riskLevel: "medium" };
  }
  
  if (localPart.length > 64 || domain.length > 255) {
    return { isValid: false, reason: "Email address too long", riskLevel: "medium" };
  }
  
  // Check for trusted domains
  const isTrusted = TRUSTED_DOMAINS.has(domain) || 
    Array.from(TRUSTED_DOMAINS).some(td => domain.endsWith(`.${td}`));
  
  return { 
    isValid: true, 
    riskLevel: isTrusted ? "low" : "medium" 
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: true, emailSent: false, reason: "Email service not configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { Resend } = await import("https://esm.sh/resend@2.0.0");
    const resend = new Resend(resendApiKey);
    
    const { name, phone, email, message, attachment }: ChatMessageRequest = await req.json();

    console.log("[send-chat-message] submission received", {
      name,
      phone: phone ? "provided" : "not provided",
      email: email ? email.substring(0, 3) + "***" : "missing",
      messageLength: message?.length ?? 0,
      hasAttachment: !!attachment,
    });

    // Validate required fields
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // EMAIL VALIDATION - Fraud Detection
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      console.warn("[send-chat-message] Email validation failed", {
        email: email.substring(0, 3) + "***",
        reason: emailValidation.reason,
        riskLevel: emailValidation.riskLevel,
      });
      return new Response(
        JSON.stringify({ 
          error: emailValidation.reason || "Invalid email address",
          emailBlocked: true,
          riskLevel: emailValidation.riskLevel
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Log medium risk emails for monitoring
    if (emailValidation.riskLevel === "medium") {
      console.log("[send-chat-message] Medium risk email detected", {
        email: email.substring(0, 3) + "***",
      });
    }

    // Validate message length - minimum 20 characters
    if (message.trim().length < MIN_MESSAGE_LENGTH) {
      return new Response(
        JSON.stringify({ 
          error: "Message too short", 
          minLength: MIN_MESSAGE_LENGTH,
          promptUser: true 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate attachment size if provided
    if (attachment?.content && attachment.content.length > MAX_ATTACHMENT_SIZE) {
      console.warn("[send-chat-message] Attachment too large, skipping", {
        size: attachment.content.length,
        maxSize: MAX_ATTACHMENT_SIZE,
      });
      // Don't fail, just skip the attachment
    }

    // Trim message to maximum length if needed
    const userMessage = message.trim().substring(0, MAX_MESSAGE_LENGTH);

    // Clean email format - ONLY user-submitted fields
    const subject = attachment ? "New Inquiry – AgriSMES (with attachment)" : "New Inquiry – AgriSMES";
    
    // Phone/WhatsApp - show "Not provided" if empty
    const phoneDisplay = phone?.trim() || "Not provided";
    
    const textContent = `Name: ${name.trim()}

Phone / WhatsApp: ${phoneDisplay}

Email: ${email.trim()}

Message:
${userMessage}${attachment ? `

---
Attachment: ${attachment.filename} (see attached PDF)` : ""}`;

    const PRIMARY_INBOX = "lentachai@gmail.com";
    const SECONDARY_INBOX = "agrismes@gmail.com";

    const from = Deno.env.get("RESEND_FROM") ?? "AgriSMES <onboarding@resend.dev>";

    // Build attachments array if PDF provided and valid size
    const attachments: Array<{ content: string; filename: string }> = [];
    if (attachment?.content && attachment?.filename && attachment.content.length <= MAX_ATTACHMENT_SIZE) {
      attachments.push({
        content: attachment.content,
        filename: attachment.filename,
      });
      console.log("[send-chat-message] Including PDF attachment", {
        filename: attachment.filename,
        contentLength: attachment.content.length,
      });
    }

    const sendEmail = async (to: string[]) => {
      console.log("[send-chat-message] attempting send", { to, from, hasAttachment: attachments.length > 0 });
      const emailPayload: any = {
        from,
        to,
        subject,
        text: textContent,
        reply_to: email.trim(),
      };
      
      // Add attachments if any
      if (attachments.length > 0) {
        emailPayload.attachments = attachments;
      }
      
      const resp = await resend.emails.send(emailPayload);

      const error = (resp as any)?.error;
      const id = (resp as any)?.data?.id as string | undefined;
      return { resp, error, id };
    };

    // Primary goal: ALWAYS deliver to PRIMARY_INBOX.
    let to = [PRIMARY_INBOX, SECONDARY_INBOX];
    let result = await sendEmail(to);

    if (result.error) {
      const statusCode = (result.error as any)?.statusCode;
      const errName = (result.error as any)?.name;
      const errMsg = String((result.error as any)?.message ?? "");

      const isTestingRestriction =
        statusCode === 403 &&
        errName === "validation_error" &&
        errMsg.includes("only send testing emails");

      if (isTestingRestriction) {
        console.warn(
          "[send-chat-message] Resend testing restriction hit; retrying primary inbox only",
          { primary: PRIMARY_INBOX, blockedRecipient: SECONDARY_INBOX },
        );
        to = [PRIMARY_INBOX];
        result = await sendEmail(to);
      }
    }

    const resendError = result.error;
    const resendId = result.id;

    if (resendError) {
      console.error("Resend send failed:", resendError);
      return new Response(
        JSON.stringify({
          success: false,
          emailSent: false,
          error: "Email failed to send",
          to,
          from,
        }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    console.log(`Email accepted by provider. Resend id: ${resendId ?? "unknown"}`, {
      to,
      from,
      hasAttachment: attachments.length > 0,
    });

    return new Response(
      JSON.stringify({ success: true, emailSent: true, resendId, to, from, attachmentIncluded: attachments.length > 0 }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (error: any) {
    console.error("Error in send-chat-message function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
