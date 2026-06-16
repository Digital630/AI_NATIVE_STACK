import { useState, useEffect } from "react";
import { MapPin, User, Building2, Phone, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ALL_COUNTRIES, AFRICAN_SOURCE_COUNTRIES } from "@/utils/countries";

interface ProfileCompletionGateProps {
  userId: string;
  userEmail: string | null;
  onComplete: () => void;
  isOpen: boolean;
}

export function ProfileCompletionGate({ 
  userId, 
  userEmail,
  onComplete, 
  isOpen 
}: ProfileCompletionGateProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    country: "",
    company_name: "",
    phone_whatsapp: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.country) {
      toast.error("Please select your country");
      return;
    }

    if (!formData.full_name) {
      toast.error("Please enter your full name");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          email: userEmail,
          full_name: formData.full_name,
          country: formData.country,
          company_name: formData.company_name || null,
          phone_whatsapp: formData.phone_whatsapp || null,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success("Profile completed successfully!");
      onComplete();
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(error.message || "Failed to save profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Complete Your Profile
          </DialogTitle>
          <DialogDescription>
            Please complete your profile to submit listings and inquiries. 
            Your country is required for proper origin tracking.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="full_name"
                type="text"
                placeholder="Your full name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Country (Required) */}
          <div className="space-y-2">
            <Label htmlFor="country">Country (Origin) *</Label>
            <Select 
              value={formData.country} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, country: v }))}
            >
              <SelectTrigger>
                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="__separator_african" disabled className="font-semibold text-primary">
                  — East Africa —
                </SelectItem>
                {AFRICAN_SOURCE_COUNTRIES.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
                <SelectItem value="__separator_all" disabled className="font-semibold text-muted-foreground">
                  — All Countries —
                </SelectItem>
                {ALL_COUNTRIES.filter(c => !AFRICAN_SOURCE_COUNTRIES.includes(c)).map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This will be used as the origin country for your listings
            </p>
          </div>

          {/* Company Name (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name (Optional)</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="company_name"
                type="text"
                placeholder="Your company or organization"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>

          {/* WhatsApp (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="phone_whatsapp">WhatsApp / Phone (Optional)</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone_whatsapp"
                type="tel"
                placeholder="+255 XXX XXX XXX"
                value={formData.phone_whatsapp}
                onChange={(e) => setFormData(prev => ({ ...prev, phone_whatsapp: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full min-h-[48px]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save & Continue
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
