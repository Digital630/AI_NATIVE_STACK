import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Users,
  ShoppingCart,
  Send,
  Loader2,
  CheckCircle,
  MapPin,
  DollarSign,
  FileText,
  User,
  Mail,
  Phone,
  Building2,
  ArrowLeft,
  X,
  Globe,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const COMMODITIES = [
  "Arabica Coffee",
  "Robusta Coffee",
  "Cashew Nuts",
  "Macadamia Nuts",
  "Avocado",
  "Cocoa",
  "Cardamom",
  "Sesame",
  "Pigeon Pea",
  "Pepper",
  "Turmeric",
  "Pineapple",
  "Other",
];

const REGIONS = [
  "East Africa",
  "Kenya",
  "Tanzania",
  "Uganda",
  "Ethiopia",
  "Rwanda",
  "West Africa",
  "South Africa",
  "Europe",
  "Middle East",
  "Asia",
  "North America",
  "South America",
];

const COUNTRIES = [
  "Kenya",
  "Tanzania",
  "Uganda",
  "Ethiopia",
  "Rwanda",
  "Burundi",
  "DRC",
  "Nigeria",
  "Ghana",
  "Ivory Coast",
  "Cameroon",
  "South Africa",
  "Mozambique",
  "Malawi",
  "Zambia",
  "Zimbabwe",
  "India",
  "Vietnam",
  "Indonesia",
  "Brazil",
  "Colombia",
  "Peru",
  "United States",
  "Germany",
  "Netherlands",
  "Belgium",
  "UAE",
  "Saudi Arabia",
  "China",
  "Japan",
  "Other",
];

interface CommodityListingFormProps {
  isOpen: boolean;
  onClose: () => void;
  visitorId: string;
  onListingSubmitted: () => void;
}

type ListingType = "buyer" | "seller" | "third_party";

interface FormData {
  listingType: ListingType;
  commodityName: string;
  otherCommodity: string;
  quantity: string;
  quantityUnit: string;
  preferredRegions: string[];
  priceRange: string;
  regionOfOrigin: string;
  description: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactCompany: string;
  country: string;
  isUrgent: boolean;
}

export function CommodityListingForm({
  isOpen,
  onClose,
  visitorId,
  onListingSubmitted,
}: CommodityListingFormProps) {
  const [step, setStep] = useState<"type" | "details" | "contact" | "success">("type");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    listingType: "buyer",
    commodityName: "",
    otherCommodity: "",
    quantity: "",
    quantityUnit: "MT",
    preferredRegions: [],
    priceRange: "",
    regionOfOrigin: "",
    description: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contactCompany: "",
    country: "",
    isUrgent: false,
  });

  const resetForm = () => {
    setStep("type");
    setFormData({
      listingType: "buyer",
      commodityName: "",
      otherCommodity: "",
      quantity: "",
      quantityUnit: "MT",
      preferredRegions: [],
      priceRange: "",
      regionOfOrigin: "",
      description: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      contactCompany: "",
      country: "",
      isUrgent: false,
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleTypeSelect = (type: ListingType) => {
    setFormData({ ...formData, listingType: type });
    setStep("details");
  };

  const toggleRegion = (region: string) => {
    const current = formData.preferredRegions;
    if (current.includes(region)) {
      setFormData({
        ...formData,
        preferredRegions: current.filter((r) => r !== region),
      });
    } else if (current.length < 5) {
      setFormData({
        ...formData,
        preferredRegions: [...current, region],
      });
    }
  };

  const canProceedToContact = () => {
    const commodity = formData.commodityName === "Other" 
      ? formData.otherCommodity 
      : formData.commodityName;
    return commodity.trim().length > 0;
  };

  const canSubmit = () => {
    // Third parties don't need contact details
    if (formData.listingType === "third_party") {
      return canProceedToContact();
    }
    return (
      canProceedToContact() &&
      formData.contactName.trim().length > 0 &&
      formData.contactEmail.trim().length > 0
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    setIsSubmitting(true);

    try {
      const commodity = formData.commodityName === "Other"
        ? formData.otherCommodity
        : formData.commodityName;

      // 1) Save to commodity_listings table
      const { data: listingData, error } = await supabase.from("commodity_listings").insert({
        visitor_id: visitorId,
        listing_type: formData.listingType,
        commodity_name: commodity,
        quantity: formData.quantity || null,
        quantity_unit: formData.quantityUnit,
        preferred_regions: formData.preferredRegions.length > 0 ? formData.preferredRegions : null,
        price_range: formData.priceRange || null,
        region_of_origin: formData.regionOfOrigin || null,
        origin_country: formData.listingType === "seller" ? formData.country : null,
        destination_country: formData.listingType === "buyer" ? formData.country : null,
        description: formData.description || null,
        contact_name: formData.listingType !== "third_party" ? formData.contactName : null,
        contact_email: formData.listingType !== "third_party" ? formData.contactEmail : null,
        contact_phone: formData.contactPhone || null,
        contact_company: formData.contactCompany || null,
        is_urgent: formData.isUrgent,
      }).select("id").single();

      if (error) throw error;

      // 2) Also save to admin_user_messages for Admin Inbox visibility
      const listingTypeLabel = formData.listingType === "buyer" ? "Buyer" : formData.listingType === "seller" ? "Seller" : "Third Party";
      const urgentLabel = formData.isUrgent ? "🚨 URGENT - " : "";
      const adminInboxMessage = `
**${urgentLabel}New ${listingTypeLabel} Listing Submitted**

Commodity: ${commodity}
Country: ${formData.country || "Not specified"}
Quantity: ${formData.quantity || "Not specified"} ${formData.quantityUnit}
${formData.listingType === "seller" ? `Region of Origin: ${formData.regionOfOrigin || "Not specified"}` : ""}
${formData.listingType === "seller" ? `Price Range: ${formData.priceRange || "Not specified"}` : ""}
${formData.listingType === "buyer" ? `Preferred Regions: ${formData.preferredRegions.join(", ") || "Not specified"}` : ""}
${formData.description ? `\nDescription: ${formData.description}` : ""}

---
**Contact Details (Admin Only):**
Name: ${formData.contactName || "Not provided"}
Email: ${formData.contactEmail || "Not provided"}
Phone: ${formData.contactPhone || "Not provided"}
Company: ${formData.contactCompany || "Not provided"}
      `.trim();

      await supabase.from("admin_user_messages").insert({
        visitor_id: visitorId,
        sender_type: "user",
        message_text: adminInboxMessage,
        listing_id: listingData?.id || null,
      });

      // 3) Send email notification to operations team
      if (formData.contactEmail) {
        await supabase.functions.invoke("send-chat-message", {
          body: {
            name: formData.contactName || "Listing Submission",
            email: formData.contactEmail,
            message: `New ${listingTypeLabel} listing for ${commodity}. Quantity: ${formData.quantity || "Not specified"} ${formData.quantityUnit}. ${formData.description || ""}`.trim(),
          },
        });
      }

      setStep("success");
      onListingSubmitted();
      
      toast.success("Your listing has been submitted successfully!");
    } catch (err) {
      console.error("[CommodityListingForm] Submit error:", err);
      toast.error("Failed to submit listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeConfig = (type: ListingType) => {
    switch (type) {
      case "buyer":
        return {
          icon: <ShoppingCart className="w-6 h-6" />,
          title: "I'm a Buyer",
          description: "Looking to purchase commodities",
          color: "text-primary",
          bg: "bg-primary/10",
        };
      case "seller":
        return {
          icon: <Package className="w-6 h-6" />,
          title: "I'm a Seller",
          description: "Have commodities for sale",
          color: "text-accent-foreground",
          bg: "bg-accent",
        };
      case "third_party":
        return {
          icon: <Users className="w-6 h-6" />,
          title: "Third Party",
          description: "General request or inquiry",
          color: "text-muted-foreground",
          bg: "bg-muted",
        };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === "type" && (
              <>
                <FileText className="w-5 h-5 text-primary" />
                Submit a Listing
              </>
            )}
            {step === "details" && (
              <>
                <Package className="w-5 h-5 text-primary" />
                Commodity Details
              </>
            )}
            {step === "contact" && (
              <>
                <User className="w-5 h-5 text-primary" />
                Contact Information
              </>
            )}
            {step === "success" && (
              <>
                <CheckCircle className="w-5 h-5 text-primary" />
                Listing Submitted!
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === "type" && "What type of listing would you like to create?"}
            {step === "details" && "Tell us about the commodity you're interested in."}
            {step === "contact" && "Provide your contact details for follow-up."}
            {step === "success" && "Your listing is now visible to other users."}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Step 1: Select Type */}
          {step === "type" && (
            <motion.div
              key="type"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3 mt-4"
            >
              {(["buyer", "seller", "third_party"] as ListingType[]).map((type) => {
                const config = getTypeConfig(type);
                return (
                  <motion.button
                    key={type}
                    onClick={() => handleTypeSelect(type)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${config.bg} ${config.color}`}>
                        {config.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{config.title}</h4>
                        <p className="text-sm text-muted-foreground">{config.description}</p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}

          {/* Step 2: Commodity Details */}
          {step === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 mt-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="sm" onClick={() => setStep("type")}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className={`px-2 py-1 rounded text-xs ${getTypeConfig(formData.listingType).bg} ${getTypeConfig(formData.listingType).color}`}>
                  {getTypeConfig(formData.listingType).title}
                </div>
              </div>

              {/* Commodity */}
              <div className="space-y-2">
                <Label>Commodity *</Label>
                <Select
                  value={formData.commodityName}
                  onValueChange={(v) => setFormData({ ...formData, commodityName: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select commodity" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMODITIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.commodityName === "Other" && (
                <div className="space-y-2">
                  <Label>Specify Commodity *</Label>
                  <Input
                    placeholder="Enter commodity name"
                    value={formData.otherCommodity}
                    onChange={(e) => setFormData({ ...formData, otherCommodity: e.target.value })}
                  />
                </div>
              )}

              {/* Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    placeholder="e.g., 50-100"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Select
                    value={formData.quantityUnit}
                    onValueChange={(v) => setFormData({ ...formData, quantityUnit: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MT">MT (Metric Tons)</SelectItem>
                      <SelectItem value="KG">KG (Kilograms)</SelectItem>
                      <SelectItem value="LBS">LBS (Pounds)</SelectItem>
                      <SelectItem value="Containers">Containers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Price Range (for sellers) */}
              {formData.listingType === "seller" && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Price Range (USD)
                  </Label>
                  <Input
                    placeholder="e.g., $2,000-$3,000/MT"
                    value={formData.priceRange}
                    onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
                  />
                </div>
              )}

              {/* Region of Origin (for sellers) */}
              {formData.listingType === "seller" && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Region of Origin
                  </Label>
                  <Select
                    value={formData.regionOfOrigin}
                    onValueChange={(v) => setFormData({ ...formData, regionOfOrigin: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Preferred Regions (for buyers) */}
              {formData.listingType === "buyer" && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Preferred Regions (select up to 5)
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {REGIONS.map((region) => (
                      <button
                        key={region}
                        type="button"
                        onClick={() => toggleRegion(region)}
                        className={`px-2 py-1 text-xs rounded-full border transition-all ${
                          formData.preferredRegions.includes(region)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:border-primary/50"
                        }`}
                      >
                        {region}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Country Field */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {formData.listingType === "buyer" ? "Buyer Country *" : formData.listingType === "seller" ? "Seller Country *" : "Country"}
                </Label>
                <Select
                  value={formData.country}
                  onValueChange={(v) => setFormData({ ...formData, country: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Urgent Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-accent/30">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${formData.isUrgent ? "text-destructive" : "text-muted-foreground"}`} />
                  <div>
                    <Label className="text-sm font-medium cursor-pointer">Mark as Urgent</Label>
                    <p className="text-xs text-muted-foreground">Needs immediate attention</p>
                  </div>
                </div>
                <Switch
                  checked={formData.isUrgent}
                  onCheckedChange={(checked) => setFormData({ ...formData, isUrgent: checked })}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Additional Details</Label>
                <Textarea
                  placeholder="Describe your requirements or offerings..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <Button
                className="w-full"
                onClick={() => setStep("contact")}
                disabled={!canProceedToContact()}
              >
                Continue
              </Button>
            </motion.div>
          )}

          {/* Step 3: Contact Information */}
          {step === "contact" && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 mt-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="sm" onClick={() => setStep("details")}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Contact Details</span>
              </div>

              {formData.listingType === "third_party" ? (
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    As a third party, contact details are optional. Your request will be visible to potential partners.
                  </p>
                </div>
              ) : (
                <div className="bg-accent/50 rounded-lg p-3 text-xs text-muted-foreground">
                  <strong>Privacy Notice:</strong> Your contact details are kept confidential and only visible to AgriSMES administrators.
                </div>
              )}

              {/* Name */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Full Name {formData.listingType !== "third_party" && "*"}
                </Label>
                <Input
                  placeholder="Your name"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  Email {formData.listingType !== "third_party" && "*"}
                </Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  Phone / WhatsApp
                </Label>
                <Input
                  type="tel"
                  placeholder="+1234567890"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </div>

              {/* Company */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  Company / Organization
                </Label>
                <Input
                  placeholder="Your company name"
                  value={formData.contactCompany}
                  onChange={(e) => setFormData({ ...formData, contactCompany: e.target.value })}
                />
              </div>

              <Button
                className="w-full gap-2"
                onClick={handleSubmit}
                disabled={!canSubmit() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Listing
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* Step 4: Success */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="w-8 h-8 text-primary" />
              </motion.div>

              <h3 className="font-semibold text-lg mb-2">Listing Submitted to AgriSMES!</h3>
              
              <p className="text-sm text-muted-foreground mb-4">
                Your listing has been successfully submitted to AgriSMES. Thank you for contributing to the community! 
                Our team will review your listing within 24-48 hours.
              </p>

              <div className="space-y-2">
                <Button onClick={handleClose} className="w-full">
                  Browse Listings
                </Button>
                <Button variant="outline" onClick={resetForm} className="w-full">
                  Submit Another Listing
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
