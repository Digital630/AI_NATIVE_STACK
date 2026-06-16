import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { validateEmail, isValidEmailFormat, type EmailValidationResult } from "@/utils/emailValidation";

const supportedCommodities = [
  "Cashew Kernels",
  "Coffee",
  "Cocoa",
  "Sesame",
  "Avocado",
  "Pineapple",
  "Cardamom",
  "Zanzibar Spices",
  "Other",
];

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const ContactSection = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formLoadedAt, setFormLoadedAt] = useState<number>(Date.now());
  const [emailValidation, setEmailValidation] = useState<EmailValidationResult | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    organization: "",
    commodity: "",
    country: "",
    email: "",
    phone: "",
    message: "",
    // Honeypot field - hidden from users
    website: "",
  });
  const [showOtherMessage, setShowOtherMessage] = useState(false);
  
  // PDF attachment state
  const [pdfAttachment, setPdfAttachment] = useState<{ content: string; filename: string } | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Track when form was loaded (for bot detection)
  useEffect(() => {
    setFormLoadedAt(Date.now());
  }, []);

  // Real-time email validation
  const handleEmailChange = (email: string) => {
    setFormData({ ...formData, email });
    
    // Only validate if user has typed something
    if (email.trim()) {
      // Debounce validation for better UX
      const result = validateEmail(email);
      setEmailValidation(result);
    } else {
      setEmailValidation(null);
    }
  };

  const handleCommodityChange = (value: string) => {
    setFormData({ ...formData, commodity: value });
    setShowOtherMessage(value === "Other");
  };

  // Validate phone format
  const isValidPhone = (phone: string): boolean => {
    if (!phone) return true;
    return phone.length <= 30 && /^[+\d\s()-]*$/.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    const fullName = formData.fullName.trim();
    if (!fullName || fullName.length < 2 || fullName.length > 100) {
      toast({
        title: "Invalid Name",
        description: "Please enter your full name (2-100 characters).",
        variant: "destructive",
      });
      return;
    }

    if (!formData.commodity) {
      toast({
        title: "Required Field",
        description: "Please select a commodity type.",
        variant: "destructive",
      });
      return;
    }

    const email = formData.email.trim().toLowerCase();
    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      toast({
        title: "Invalid Email",
        description: emailCheck.reason || "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidPhone(formData.phone)) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid phone number.",
        variant: "destructive",
      });
      return;
    }

    if (formData.message.length > 1000) {
      toast({
        title: "Message Too Long",
        description: "Please shorten your message to under 1000 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // First save to database via submit-inquiry function
      const response = await fetch(`${SUPABASE_URL}/functions/v1/submit-inquiry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          organization_name: formData.organization.trim() || null,
          commodity_type: formData.commodity,
          country_region: formData.country.trim() || null,
          email: email,
          phone_number: formData.phone.trim() || null,
          short_message: formData.message.trim() || null,
          // Anti-bot fields
          website: formData.website, // Honeypot
          form_loaded_at: formLoadedAt, // Timestamp check
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific error responses with generic messages
        if (response.status === 429) {
          toast({
            title: "Please Wait",
            description: "Too many submissions. Please wait a moment before trying again.",
            variant: "destructive",
          });
        } else if (response.status === 400) {
          // Validation error from server
          toast({
            title: "Validation Error",
            description: result.error || "Please check your information and try again.",
            variant: "destructive",
          });
        } else {
          // Generic error for all other cases
          toast({
            title: "Submission Failed",
            description: "Unable to submit your inquiry. Please try again later.",
            variant: "destructive",
          });
        }
        return;
      }

      // Send email notification with optional attachment via send-chat-message function
      const messageContent = formData.message.trim() 
        ? `[Inquiry Form]\n\nCommodity: ${formData.commodity}\nOrganization: ${formData.organization.trim() || "Not provided"}\nCountry: ${formData.country.trim() || "Not provided"}\n\nMessage:\n${formData.message.trim()}`
        : `[Inquiry Form]\n\nCommodity: ${formData.commodity}\nOrganization: ${formData.organization.trim() || "Not provided"}\nCountry: ${formData.country.trim() || "Not provided"}`;
      
      await supabase.functions.invoke("send-chat-message", {
        body: {
          name: fullName,
          phone: formData.phone.trim() || undefined,
          email: email,
          message: messageContent.length >= 20 ? messageContent : messageContent + " (inquiry submission)",
          attachment: pdfAttachment || undefined,
        },
      });

      // Also save to admin_user_messages for Admin Inbox visibility
      // Get or create visitor ID for tracking
      let visitorId = sessionStorage.getItem("agrismes_visitor_id");
      if (!visitorId) {
        visitorId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        sessionStorage.setItem("agrismes_visitor_id", visitorId);
      }

      const adminInboxMessage = `
**Contact Form Inquiry**

Name: ${fullName}
Email: ${email}
Phone: ${formData.phone.trim() || "Not provided"}
Organization: ${formData.organization.trim() || "Not provided"}
Commodity: ${formData.commodity}
Country/Region: ${formData.country.trim() || "Not provided"}

${formData.message.trim() ? `Message:\n${formData.message.trim()}` : ""}
${pdfAttachment ? "\n[PDF Attachment Included]" : ""}
      `.trim();

      await supabase.from("admin_user_messages").insert({
        visitor_id: visitorId,
        sender_type: "user",
        message_text: adminInboxMessage,
      });

      // Success message - bank-compliant, neutral confirmation
      toast({
        title: "Inquiry submitted successfully",
        description: "Your information has been successfully received and recorded. The AgriSMES team will review your submission in line with our internal assessment procedures. You will be contacted only if additional information or clarification is required.",
        duration: 12000,
      });

      // Reset form
      setFormData({
        fullName: "",
        organization: "",
        commodity: "",
        country: "",
        email: "",
        phone: "",
        message: "",
        website: "",
      });
      setShowOtherMessage(false);
      setEmailValidation(null);
      setPdfAttachment(null);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
      // Reset form load timestamp for next submission
      setFormLoadedAt(Date.now());
    } catch (error) {
      // Generic error - never expose internal details
      console.error("Form submission error");
      toast({
        title: "Submission Failed",
        description: "Unable to submit your inquiry. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="section-institutional section-accent">
      <div className="container-institutional">
        <h2 className="section-title">Contact AgriSMES</h2>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Quick Help Section */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-6">Need Immediate Assistance?</h3>
            
            <div className="card-institutional mb-8">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Chat with Alex, for immediate guidance on trade readiness, commodities, and services.
                </p>
                <button
                  onClick={() => {
                    const chatButton = document.querySelector('[aria-label="Open chat"]') as HTMLButtonElement;
                    if (chatButton) {
                      chatButton.click();
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  <MessageCircle className="h-4 w-4" />
                  Open Live Chat →
                </button>
                <p className="text-xs text-muted-foreground">
                  Get instant answers and earn RewardFlow points while chatting.
                </p>
              </div>
            </div>

          </div>

          {/* Inquiry Form */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-6">Applicant & Partner Inquiry Form</h3>
            
            {/* Alternative Help Notice */}
            <div className="mb-6 p-4 bg-accent/50 border border-border rounded-lg">
              <p className="font-bold text-foreground mb-2">Prefer instant answers?</p>
              <p className="text-sm text-muted-foreground mb-3">
                Chat with Alex, for immediate guidance on trade readiness, commodities, and services.
              </p>
              <button
                onClick={() => {
                  const chatButton = document.querySelector('[aria-label="Open chat"]') as HTMLButtonElement;
                  if (chatButton) {
                    chatButton.click();
                  }
                }}
                className="text-sm text-primary hover:underline font-medium inline-flex items-center gap-1"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Open Live Chat →
              </button>
            </div>

            <form onSubmit={handleSubmit} className="card-institutional space-y-5">
              {/* Honeypot field - hidden from users, visible to bots */}
              <div className="absolute -left-[9999px] opacity-0 pointer-events-none" aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input
                  type="text"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {/* Row 1: Full Name + Phone/WhatsApp (optional) */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    className="bg-background"
                    maxLength={100}
                    minLength={2}
                    required
                    aria-required="true"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone / WhatsApp (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+255 XXX XXX XXX"
                    className="bg-background"
                    maxLength={30}
                  />
                </div>
              </div>

              {/* Row 2: Email + Organization */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder="Enter your email"
                      className={`bg-background pr-10 ${
                        emailValidation && !emailValidation.isValid 
                          ? "border-destructive focus-visible:ring-destructive" 
                          : emailValidation?.isValid 
                            ? "border-green-500 focus-visible:ring-green-500" 
                            : ""
                      }`}
                      maxLength={254}
                      minLength={5}
                      required
                      aria-required="true"
                      aria-invalid={emailValidation ? !emailValidation.isValid : undefined}
                      aria-describedby={emailValidation && !emailValidation.isValid ? "email-error" : undefined}
                    />
                    {emailValidation && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {emailValidation.isValid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    )}
                  </div>
                  {emailValidation && !emailValidation.isValid && (
                    <p id="email-error" className="text-xs text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {emailValidation.reason}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization / SME Name</Label>
                  <Input
                    id="organization"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="Enter organization name"
                    className="bg-background"
                    maxLength={100}
                  />
                </div>
              </div>

              {/* Row 3: Commodity + Country */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="commodity">Commodity Type *</Label>
                  <Select value={formData.commodity} onValueChange={handleCommodityChange} required>
                    <SelectTrigger className="bg-background" aria-required="true">
                      <SelectValue placeholder="Select commodity" />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedCommodities.map((commodity) => (
                        <SelectItem key={commodity} value={commodity}>
                          {commodity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country / Region</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Enter your country"
                    className="bg-background"
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Short Message / Inquiry</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your inquiry..."
                  className="bg-background min-h-[100px]"
                  maxLength={1000}
                />
              </div>

              {/* Optional PDF Attachment */}
              <div className="space-y-2">
                <Label htmlFor="pdfAttachment" className="text-muted-foreground">
                  Optional: Attach your conversation summary (PDF)
                </Label>
                <Input
                  id="pdfAttachment"
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf"
                  className="bg-background cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  disabled={isSubmitting}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file && file.type === "application/pdf") {
                      // Limit file size to 5MB
                      if (file.size > 5 * 1024 * 1024) {
                        toast({
                          title: "File Too Large",
                          description: "PDF file must be less than 5MB",
                          variant: "destructive",
                        });
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
                      toast({
                        title: "Invalid File",
                        description: "Please select a valid PDF file",
                        variant: "destructive",
                      });
                      e.target.value = "";
                      setPdfAttachment(null);
                    } else {
                      setPdfAttachment(null);
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Attaching your conversation summary helps us understand your context faster. Max 5MB.
                </p>
              </div>

              {showOtherMessage && (
                <div className="bg-accent border border-border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    AgriSMES is currently engaging SMEs involved in the commodities listed above. 
                    Additional product categories may be considered in future phases.
                  </p>
                </div>
              )}

              <button 
                type="submit" 
                className="btn-institutional w-full sm:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {isSubmitting ? "Submitting..." : "Submit Inquiry"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
