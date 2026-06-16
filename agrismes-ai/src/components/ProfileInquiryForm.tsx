import { useState } from "react";
import { Loader2, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const COMMODITIES = [
  "Coffee", "Cocoa", "Cashew", "Sesame", "Cardamom", 
  "Macadamia", "Avocado", "Pineapple", "Pigeon Pea", "Spices", "Other"
];

interface ProfileInquiryFormProps {
  profile: {
    full_name: string | null;
    company_name: string | null;
    phone_whatsapp: string | null;
    email: string | null;
  } | null;
  userEmail?: string;
}

export function ProfileInquiryForm({ profile, userEmail }: ProfileInquiryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [commodity, setCommodity] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commodity) {
      toast.error("Please select a commodity");
      return;
    }

    if (message.trim().length < 20) {
      toast.error("Please provide more details (at least 20 characters)");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("inquires").insert({
        full_name: profile?.full_name || "Unknown",
        email: profile?.email || userEmail || "no-email@provided.com",
        phone_number: profile?.phone_whatsapp || null,
        organization_name: profile?.company_name || null,
        commodity_type: commodity,
        short_message: message.trim(),
        source: "profile_inquiry",
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success("Inquiry submitted successfully!");
    } catch (error: any) {
      console.error("Error submitting inquiry:", error);
      toast.error(error.message || "Failed to submit inquiry");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="text-center">
        <CardContent className="pt-8 pb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Inquiry Submitted!
          </h3>
          <p className="text-muted-foreground mb-4">
            Our team will review your inquiry and get back to you soon.
          </p>
          <Button variant="outline" onClick={() => setIsSuccess(false)}>
            Submit Another Inquiry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Submit an Inquiry
        </CardTitle>
        <CardDescription>
          Let us know what you're looking for and we'll connect you with the right partners
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Contact Info Display */}
          {profile && (
            <div className="p-4 bg-muted rounded-lg mb-4">
              <p className="text-sm text-muted-foreground mb-1">
                <strong>From:</strong> {profile.full_name || "Your Name"} 
                {profile.company_name && ` (${profile.company_name})`}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Email:</strong> {profile.email || userEmail}
              </p>
            </div>
          )}

          {/* Commodity */}
          <div className="space-y-2">
            <Label htmlFor="commodity">Commodity of Interest *</Label>
            <Select value={commodity} onValueChange={setCommodity}>
              <SelectTrigger>
                <SelectValue placeholder="Select a commodity" />
              </SelectTrigger>
              <SelectContent>
                {COMMODITIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Your Inquiry (min 20 characters) *</Label>
            <Textarea
              id="message"
              placeholder="Describe what you're looking for: volumes, quality requirements, delivery timelines, etc."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px]"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/1000
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full min-h-[48px]"
            disabled={isSubmitting || !commodity || message.trim().length < 20}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Inquiry
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
