import React, { useState } from "react";
import jsPDF from "jspdf";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  Share2,
  Send,
  Loader2,
  MessageSquare,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface ConversationSubmitFormProps {
  isOpen: boolean;
  onClose: () => void;
  visitorId: string;
  messages: ConversationMessage[];
  points: number;
  level: string;
}

// Strip emojis and markers for clean PDF
const sanitizeText = (input: string): string => {
  let text = (input ?? "").replace(/\[\[REWARDFLOW_ICON\]\]/gi, "").trim();
  try {
    text = text.replace(/\p{Extended_Pictographic}/gu, "").replace(/[\uFE0F\u200D]/g, "");
  } catch {
    text = text.replace(/[\u{1F300}-\u{1FAFF}]/gu, "");
  }
  return text;
};

export function ConversationSubmitForm({
  isOpen,
  onClose,
  visitorId,
  messages,
  points,
  level,
}: ConversationSubmitFormProps) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = contact.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      toast.error("Please fill in name, email, and message");
      return;
    }

    if (!trimmedEmail.includes("@")) {
      toast.error("Please provide a valid email address");
      return;
    }

    if (trimmedMessage.length < 20) {
      toast.error("Message must be at least 20 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      // Build clean, professional PDF attachment
      const buildConversationPdfAttachment = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        const contentWidth = pageWidth - margin * 2;
        
        const now = new Date();
        const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
        const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
        const refNumber = `FMS-${Date.now().toString(36).toUpperCase().slice(-4)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        let y = margin;

        // Header background
        doc.setFillColor(248, 250, 252);
        doc.rect(0, 0, pageWidth, 40, "F");

        // Title
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text("AgriSMES Conversation Summary", margin, y + 8);

        // Subtitle
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text("Trade Readiness Desk - Informational Record", margin, y + 16);

        // Reference and date
        doc.text(`Reference: ${refNumber}`, margin, y + 28);
        doc.text(`Date: ${dateStr} at ${timeStr}`, pageWidth - margin - 60, y + 28);

        y = 50;

        // Divider line
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;

        // Transcript section header
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text("CONVERSATION TRANSCRIPT", margin, y);
        y += 10;

        // Messages
        doc.setFontSize(10);
        for (const msg of messages) {
          if (y > pageHeight - 50) {
            doc.addPage();
            y = margin;
          }

          const speaker = msg.role === "assistant" ? "Alex (AgriSMES)" : "User";
          const content = sanitizeText(msg.content);

          // Speaker label
          doc.setFont("helvetica", "bold");
          doc.setTextColor(msg.role === "assistant" ? 34 : 71, msg.role === "assistant" ? 87 : 85, msg.role === "assistant" ? 64 : 105);
          doc.text(`${speaker}:`, margin, y);
          y += 6;

          // Message content
          doc.setFont("helvetica", "normal");
          doc.setTextColor(51, 65, 85);
          const lines = doc.splitTextToSize(content, contentWidth);
          for (const line of lines) {
            if (y > pageHeight - 30) {
              doc.addPage();
              y = margin;
            }
            doc.text(line, margin, y);
            y += 5;
          }
          y += 6;
        }

        // Footer section
        if (y > pageHeight - 60) {
          doc.addPage();
          y = margin;
        }

        y += 5;
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;

        // RewardFlow Summary
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 59);
        doc.text("REWARDFLOW ENGAGEMENT SUMMARY", margin, y);
        y += 8;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        doc.text(`Level: ${level}  |  Points: ${points}`, margin, y);
        y += 12;

        // Disclaimer
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        const disclaimer = "This summary is informational only and does not represent approval, eligibility, certification, or endorsement by AgriSMES or any affiliated institution.";
        const disclaimerLines = doc.splitTextToSize(disclaimer, contentWidth);
        for (const line of disclaimerLines) {
          doc.text(line, margin, y);
          y += 4;
        }

        y += 4;
        doc.text(`© ${new Date().getFullYear()} AgriSMES — Trade Readiness Framework`, margin, y);

        const dataUrl = doc.output("dataurlstring");
        const base64 = dataUrl.split(",")[1] || "";
        return {
          content: base64,
          filename: `AgriSMES_Conversation_Summary_${new Date().toISOString().split("T")[0]}.pdf`,
        };
      };

      const pdfAttachment = buildConversationPdfAttachment();
      
      // Build plain text for database storage (without special chars)
      const conversationPlainText = messages
        .map((m) => `${m.role === "assistant" ? "Alex" : "User"}: ${sanitizeText(m.content)}`)
        .join("\n\n");

      // 1) Save inquiry (for lead capture / CRM)
      const { error: inquiryError } = await supabase.from("inquires").insert({
        full_name: trimmedName,
        email: trimmedEmail,
        phone_number: null,
        short_message: trimmedMessage,
        commodity_type: "General Trade Inquiry",
        source: "conversation_submit",
      });

      if (inquiryError) {
        console.error("[ConversationSubmitForm] Inquiry error:", inquiryError);
      }

      // 2) Save to internal inbox (Unlock Exclusive Services)
      const fullMessage = `
**Conversation Summary Submission**

Name: ${trimmedName}
Email: ${trimmedEmail}
Message: ${trimmedMessage}

---

**Attached Conversation Summary:**
Level: ${level} | Points: ${points}

${conversationPlainText.substring(0, 2000)}${conversationPlainText.length > 2000 ? "...[truncated]" : ""}
      `.trim();

      if (visitorId) {
        await supabase.from("admin_user_messages").insert({
          visitor_id: visitorId,
          sender_type: "user",
          message_text: fullMessage,
        });
      } else {
        console.warn("[ConversationSubmitForm] Missing visitorId; skipping admin inbox insert");
      }

      // 3) Email to operations inbox (clean fields + PDF attachment)
      const { error: emailError } = await supabase.functions.invoke("send-chat-message", {
        body: {
          name: trimmedName,
          email: trimmedEmail,
          message: trimmedMessage,
          attachment: pdfAttachment.content ? pdfAttachment : undefined,
        },
      });

      if (emailError) {
        console.error("[ConversationSubmitForm] Email send error:", emailError);
        toast.success("Submission saved. Email notification may be delayed.");
      } else {
        toast.success("Submission sent to AgriSMES team!");
      }

      onClose();
      setName("");
      setContact("");
      setMessage("");
    } catch (err) {
      console.error("[ConversationSubmitForm] Error:", err);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        // Radix calls onOpenChange(true) when opening.
        // If we call onClose on BOTH true/false, the dialog instantly closes.
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-md z-[10000]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Submit to AgriSMES
          </DialogTitle>
          <DialogDescription>
            Your conversation summary will be attached and sent to our team for review.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="submit-name">Name *</Label>
            <Input
              id="submit-name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="submit-contact">Email Address *</Label>
            <Input
              id="submit-contact"
              type="email"
              placeholder="your.email@example.com"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="submit-message">Message (min 20 chars) *</Label>
            <Textarea
              id="submit-message"
              placeholder="Write your request for the team (minimum 20 characters)..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[80px]"
              maxLength={500}
            />
          </div>

          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <p className="text-xs text-muted-foreground flex items-start gap-2">
              <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
              Your full conversation summary (Level: {level}, {points} points) will be automatically attached.
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim() || !contact.trim() || message.trim().length < 20}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit to AgriSMES
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Action bar for conversation summary
interface ConversationActionsBarProps {
  onCopy: () => void;
  onShare: () => void;
  onSubmit: () => void;
  isCopied: boolean;
}

export function ConversationActionsBar({
  onCopy,
  onShare,
  onSubmit,
  isCopied,
}: ConversationActionsBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border mb-4"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={onCopy}
        className="gap-1.5"
      >
        {isCopied ? (
          <>
            <Check className="w-4 h-4 text-emerald-500" />
            Copied
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            Copy
          </>
        )}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onShare}
        className="gap-1.5"
      >
        <Share2 className="w-4 h-4" />
        Share
      </Button>

      <Button
        size="sm"
        onClick={onSubmit}
        className="gap-1.5 ml-auto"
      >
        <Send className="w-4 h-4" />
        Submit
      </Button>
    </motion.div>
  );
}

// Share functionality
export async function shareConversation(text: string, title: string = "AgriSMES Conversation Summary") {
  // Try native share first (mobile)
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text: text.substring(0, 1000), // Limit for share
      });
      toast.success("Shared successfully!");
      return true;
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("[Share] Error:", err);
      }
    }
  }

  // Fallback: WhatsApp share
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text.substring(0, 1000))}`;
  window.open(whatsappUrl, "_blank");
  toast.success("Opening WhatsApp...");
  return true;
}

export default ConversationSubmitForm;
