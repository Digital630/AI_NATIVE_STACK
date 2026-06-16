import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Users,
  ShoppingCart,
  Truck,
  Shield,
  Building2,
  Ship,
  FileCheck,
  ClipboardCheck,
  Search,
  Handshake,
  UserCheck,
  Send,
  Loader2,
  CheckCircle,
  ArrowLeft,
  Upload,
  X,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { TrustAnchor, HumanOversightBadge } from "@/components/TrustAnchor";
import { IntentCommitmentSignals, IntentCommitmentData } from "@/components/IntentCommitmentSignals";

// Expanded listing categories
const LISTING_CATEGORIES = [
  { key: "buyer", label: "Buyer", icon: ShoppingCart, description: "Looking to purchase commodities" },
  { key: "seller", label: "Seller", icon: Package, description: "Have commodities for sale" },
  { key: "third_party", label: "Third Party", icon: Users, description: "General trade inquiry" },
  { key: "logistics_provider", label: "Logistics Provider", icon: Truck, description: "Freight, warehousing, distribution" },
  { key: "insurance_provider", label: "Insurance Provider", icon: Shield, description: "Cargo, trade, credit insurance" },
  { key: "bank_financial", label: "Bank / Financial Institution", icon: Building2, description: "Trade finance, LC, working capital" },
  { key: "transportation", label: "Transportation Company", icon: Ship, description: "Shipping, trucking, air freight" },
  { key: "customs_clearance", label: "Customs / Clearance Agent", icon: FileCheck, description: "Import/export clearance" },
  { key: "container_stuffing", label: "Container Stuffing Agent", icon: ClipboardCheck, description: "Container packing, consolidation" },
  { key: "inspection", label: "Inspection Company", icon: Search, description: "Quality, quantity verification" },
  { key: "broker", label: "Broker", icon: Handshake, description: "Trade intermediary" },
  { key: "consultant", label: "Consultant", icon: UserCheck, description: "Trade advisory, compliance" },
];

const COMMODITIES = [
  "Arabica Coffee", "Robusta Coffee", "Cashew Nuts", "Macadamia Nuts",
  "Avocado", "Cocoa", "Cardamom", "Sesame", "Pigeon Pea", "Pepper",
  "Turmeric", "Pineapple", "Other",
];

const REGIONS = [
  "East Africa", "Kenya", "Tanzania", "Uganda", "Ethiopia", "Rwanda",
  "West Africa", "South Africa", "Europe", "Middle East", "Asia",
  "North America", "South America",
];

// Category-specific field configurations
const CATEGORY_FIELDS: Record<string, {
  showCommodity: boolean;
  showQuantity: boolean;
  showPrice: boolean;
  showRegions: boolean;
  showServices: boolean;
  showCertifications: boolean;
  showCapacity: boolean;
  documentRequired: boolean;
  documentLabel?: string;
}> = {
  buyer: { showCommodity: true, showQuantity: true, showPrice: false, showRegions: true, showServices: false, showCertifications: false, showCapacity: false, documentRequired: false },
  seller: { showCommodity: true, showQuantity: true, showPrice: true, showRegions: true, showServices: false, showCertifications: true, showCapacity: false, documentRequired: false },
  third_party: { showCommodity: true, showQuantity: false, showPrice: false, showRegions: true, showServices: false, showCertifications: false, showCapacity: false, documentRequired: false },
  logistics_provider: { showCommodity: false, showQuantity: false, showPrice: false, showRegions: true, showServices: true, showCertifications: true, showCapacity: true, documentRequired: true, documentLabel: "Company Registration" },
  insurance_provider: { showCommodity: false, showQuantity: false, showPrice: false, showRegions: true, showServices: true, showCertifications: true, showCapacity: false, documentRequired: true, documentLabel: "License/Registration" },
  bank_financial: { showCommodity: false, showQuantity: false, showPrice: false, showRegions: true, showServices: true, showCertifications: true, showCapacity: false, documentRequired: true, documentLabel: "Banking License" },
  transportation: { showCommodity: false, showQuantity: false, showPrice: false, showRegions: true, showServices: true, showCertifications: true, showCapacity: true, documentRequired: false },
  customs_clearance: { showCommodity: false, showQuantity: false, showPrice: false, showRegions: true, showServices: true, showCertifications: true, showCapacity: false, documentRequired: true, documentLabel: "Customs License" },
  container_stuffing: { showCommodity: false, showQuantity: false, showPrice: false, showRegions: true, showServices: true, showCertifications: false, showCapacity: true, documentRequired: false },
  inspection: { showCommodity: false, showQuantity: false, showPrice: false, showRegions: true, showServices: true, showCertifications: true, showCapacity: false, documentRequired: true, documentLabel: "Accreditation Certificate" },
  broker: { showCommodity: true, showQuantity: false, showPrice: false, showRegions: true, showServices: true, showCertifications: false, showCapacity: false, documentRequired: false },
  consultant: { showCommodity: false, showQuantity: false, showPrice: false, showRegions: true, showServices: true, showCertifications: true, showCapacity: false, documentRequired: false },
};

interface ExpandedListingFormProps {
  isOpen: boolean;
  onClose: () => void;
  visitorId: string;
  onListingSubmitted: () => void;
}

export function ExpandedListingForm({
  isOpen,
  onClose,
  visitorId,
  onListingSubmitted,
}: ExpandedListingFormProps) {
  const [step, setStep] = useState<"category" | "commitment" | "details" | "contact" | "success">("category");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [intentData, setIntentData] = useState<IntentCommitmentData | null>(null);
  const [formData, setFormData] = useState({
    commodityName: "",
    otherCommodity: "",
    quantity: "",
    quantityUnit: "MT",
    preferredRegions: [] as string[],
    priceRange: "",
    description: "",
    services: "",
    certifications: "",
    capacity: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contactCompany: "",
    contactAddress: "",
    // Buyer-specific fields
    quantityFrequency: "",
    incoterms: "",
    paymentMethod: "",
    destinationCountry: "",
    priceRangeMin: "",
    priceRangeMax: "",
    // Seller-specific fields
    commodityGrade: "",
    monthlyCapacity: "",
    priceExpectation: "",
    paymentTerms: "",
    originCountry: "",
  });
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const resetForm = () => {
    setStep("category");
    setSelectedCategory("");
    setIntentData(null);
    setFormData({
      commodityName: "",
      otherCommodity: "",
      quantity: "",
      quantityUnit: "MT",
      preferredRegions: [],
      priceRange: "",
      description: "",
      services: "",
      certifications: "",
      capacity: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      contactCompany: "",
      contactAddress: "",
      quantityFrequency: "",
      incoterms: "",
      paymentMethod: "",
      destinationCountry: "",
      priceRangeMin: "",
      priceRangeMax: "",
      commodityGrade: "",
      monthlyCapacity: "",
      priceExpectation: "",
      paymentTerms: "",
      originCountry: "",
    });
    setAttachedFile(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCategorySelect = (key: string) => {
    setSelectedCategory(key);
    // Go to commitment step before details
    setStep("commitment");
  };

  const handleIntentComplete = (data: IntentCommitmentData) => {
    setIntentData(data);
    setStep("details");
  };

  const toggleRegion = (region: string) => {
    const current = formData.preferredRegions;
    if (current.includes(region)) {
      setFormData({ ...formData, preferredRegions: current.filter(r => r !== region) });
    } else if (current.length < 5) {
      setFormData({ ...formData, preferredRegions: [...current, region] });
    }
  };

  const getCategoryConfig = () => CATEGORY_FIELDS[selectedCategory] || CATEGORY_FIELDS.buyer;

  const canProceedToContact = () => {
    const config = getCategoryConfig();
    if (config.showCommodity) {
      const commodity = formData.commodityName === "Other" ? formData.otherCommodity : formData.commodityName;
      if (!commodity.trim()) return false;
    }
    return true;
  };

  const canSubmit = () => {
    const config = getCategoryConfig();
    // Service providers need contact details
    const needsContact = selectedCategory !== "third_party";
    if (needsContact && (!formData.contactName.trim() || !formData.contactEmail.trim())) {
      return false;
    }
    if (config.documentRequired && !attachedFile) {
      return false;
    }
    return canProceedToContact();
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    setIsSubmitting(true);

    try {
      const config = getCategoryConfig();
      const commodity = formData.commodityName === "Other"
        ? formData.otherCommodity
        : formData.commodityName;

      // Build description with all relevant fields
      let fullDescription = formData.description || "";
      if (config.showServices && formData.services) {
        fullDescription += `\n\nServices: ${formData.services}`;
      }
      if (config.showCertifications && formData.certifications) {
        fullDescription += `\n\nCertifications: ${formData.certifications}`;
      }
      if (config.showCapacity && formData.capacity) {
        fullDescription += `\n\nCapacity: ${formData.capacity}`;
      }

      const { error } = await supabase.from("commodity_listings").insert({
        visitor_id: visitorId,
        listing_type: selectedCategory,
        commodity_name: config.showCommodity ? commodity : selectedCategory.replace(/_/g, " "),
        quantity: formData.quantity || null,
        quantity_unit: formData.quantityUnit,
        preferred_regions: formData.preferredRegions.length > 0 ? formData.preferredRegions : null,
        price_range: formData.priceRange || null,
        description: fullDescription || null,
        contact_name: formData.contactName || null,
        contact_email: formData.contactEmail || null,
        contact_phone: formData.contactPhone || null,
        contact_company: formData.contactCompany || null,
      });

      if (error) throw error;

      setStep("success");
      onListingSubmitted();
      toast.success("Listing submitted successfully!");
    } catch (err) {
      console.error("[ExpandedListingForm] Submit error:", err);
      toast.error("Failed to submit listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryInfo = (key: string) => LISTING_CATEGORIES.find(c => c.key === key);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === "category" && (
              <>
                <Package className="w-5 h-5 text-primary" />
                Submit a Listing
              </>
            )}
            {step === "details" && (
              <>
                {getCategoryInfo(selectedCategory)?.icon && 
                  React.createElement(getCategoryInfo(selectedCategory)!.icon, { className: "w-5 h-5 text-primary" })}
                {getCategoryInfo(selectedCategory)?.label} Details
              </>
            )}
            {step === "contact" && (
              <>
                <UserCheck className="w-5 h-5 text-primary" />
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
            {step === "category" && "Select your listing category"}
            {step === "details" && "Provide details about your offering or requirements"}
            {step === "contact" && "Your contact details (visible only to AgriSMES admin)"}
            {step === "success" && "Your listing will be reviewed by our team"}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Step 1: Category Selection */}
          {step === "category" && (
            <motion.div
              key="category"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-2 mt-4 max-h-[50vh] overflow-y-auto"
            >
              {LISTING_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => handleCategorySelect(cat.key)}
                  className="w-full p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left flex items-center gap-3"
                >
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <cat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground text-sm">{cat.label}</h4>
                    <p className="text-xs text-muted-foreground">{cat.description}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}

          {/* Step 2: Intent Commitment */}
          {step === "commitment" && (
            <motion.div
              key="commitment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mt-4"
            >
              <IntentCommitmentSignals
                onComplete={handleIntentComplete}
                onSkip={() => setStep("category")}
                initialData={intentData || undefined}
                isSubmitting={false}
              />
            </motion.div>
          )}

          {/* Step 3: Details */}
          {step === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 mt-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="sm" onClick={() => setStep("category")}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="px-2 py-1 rounded text-xs bg-primary/10 text-primary">
                  {getCategoryInfo(selectedCategory)?.label}
                </div>
                <HumanOversightBadge className="ml-auto" />
              </div>

              {getCategoryConfig().showCommodity && (
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
                  {formData.commodityName === "Other" && (
                    <Input
                      placeholder="Specify commodity"
                      value={formData.otherCommodity}
                      onChange={(e) => setFormData({ ...formData, otherCommodity: e.target.value })}
                    />
                  )}
                </div>
              )}

              {getCategoryConfig().showQuantity && (
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
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MT">MT (Metric Tons)</SelectItem>
                        <SelectItem value="KG">KG (Kilograms)</SelectItem>
                        <SelectItem value="Containers">Containers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {getCategoryConfig().showPrice && (
                <div className="space-y-2">
                  <Label>Price Range (USD)</Label>
                  <Input
                    placeholder="e.g., $2,000-$3,000/MT"
                    value={formData.priceRange}
                    onChange={(e) => setFormData({ ...formData, priceRange: e.target.value })}
                  />
                </div>
              )}

              {getCategoryConfig().showServices && (
                <div className="space-y-2">
                  <Label>Services Offered *</Label>
                  <Textarea
                    placeholder="Describe the services you provide..."
                    value={formData.services}
                    onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground flex items-start gap-1">
                    <Info className="w-3 h-3 mt-0.5 shrink-0" />
                    Be specific about your capabilities and service areas
                  </p>
                </div>
              )}

              {getCategoryConfig().showCertifications && (
                <div className="space-y-2">
                  <Label>Certifications / Licenses</Label>
                  <Input
                    placeholder="e.g., ISO 9001, IATA, Licensed Broker"
                    value={formData.certifications}
                    onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                  />
                </div>
              )}

              {getCategoryConfig().showCapacity && (
                <div className="space-y-2">
                  <Label>Capacity / Coverage</Label>
                  <Input
                    placeholder="e.g., 500 MT/month, 10 containers/week"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  />
                </div>
              )}

              {getCategoryConfig().showRegions && (
                <div className="space-y-2">
                  <Label>Operating Regions (select up to 5)</Label>
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

              <div className="space-y-2">
                <Label>Additional Details</Label>
                <Textarea
                  placeholder="Any other relevant information..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
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

          {/* Step 3: Contact */}
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
                <TrustAnchor variant="privacy" compact />
              </div>

              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  placeholder="Your name"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Phone / WhatsApp</Label>
                <Input
                  placeholder="+254..."
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Company / Organization</Label>
                <Input
                  placeholder="Company name"
                  value={formData.contactCompany}
                  onChange={(e) => setFormData({ ...formData, contactCompany: e.target.value })}
                />
              </div>

              {getCategoryConfig().documentRequired && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    {getCategoryConfig().documentLabel} *
                    <span className="text-xs text-muted-foreground">(Required for verification)</span>
                  </Label>
                  {!attachedFile ? (
                    <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to upload document</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => setAttachedFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                      <FileCheck className="w-4 h-4 text-primary" />
                      <span className="text-sm text-foreground flex-1 truncate">{attachedFile.name}</span>
                      <Button variant="ghost" size="sm" onClick={() => setAttachedFile(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={!canSubmit() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
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
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Listing Submitted!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                An AgriSMES trade analyst will review your listing. 
                Approved listings become visible in Exclusive Services.
              </p>
              <div className="space-y-3 mb-4">
                <TrustAnchor variant="review" />
                <TrustAnchor variant="oversight" compact />
              </div>
              <p className="text-xs text-muted-foreground mb-4 bg-muted/50 rounded-lg p-3">
                <strong>Data Ownership:</strong> You retain ownership of all submitted information. 
                Your listing is used solely for trade evaluation and is visible only to AgriSMES admin.
              </p>
              <Button onClick={handleClose}>Close</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
