import { MapPin, Shield, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ALL_COUNTRIES, AFRICAN_SOURCE_COUNTRIES } from "@/utils/countries";
import { ACTOR_CATEGORIES, ActorCategory, getCategoryLabel } from "@/utils/actorCategories";

interface ServiceProviderFieldsProps {
  category: ActorCategory;
  formData: {
    serviceName: string;
    serviceType: string;
    serviceDescription: string;
    primaryCountry: string;
    coverageRegions: string;
    experience: string;
    certifications: string;
    capacity: string;
    isUrgent: boolean;
  };
  onChange: (data: Partial<ServiceProviderFieldsProps['formData']>) => void;
}

const SERVICE_TYPES: Record<string, string[]> = {
  agent: ["Buying Agent", "Selling Agent", "Trade Broker", "Commission Agent"],
  logistics: ["Freight Forwarding", "Shipping Agent", "Customs Broker", "Multimodal Transport"],
  warehouse: ["Cold Storage", "Dry Storage", "Bonded Warehouse", "Fumigation Facility"],
  quality_control: ["Pre-shipment Inspection", "Quality Testing", "Certification Services", "Lab Analysis"],
  finance: ["Trade Finance", "Letter of Credit", "Export Credit", "Insurance Services"],
  certification: ["Organic Certification", "Fair Trade", "Rainforest Alliance", "ISO Standards"],
  other_service: ["Consulting", "Documentation", "Legal Services", "Other"],
};

export function ServiceProviderFields({ category, formData, onChange }: ServiceProviderFieldsProps) {
  const categoryInfo = ACTOR_CATEGORIES[category];
  const serviceTypeOptions = SERVICE_TYPES[category] || SERVICE_TYPES.other_service;

  return (
    <div className="space-y-6">
      {/* Category Header */}
      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium text-foreground">{getCategoryLabel(category)}</p>
          <p className="text-sm text-muted-foreground">{categoryInfo?.description}</p>
        </div>
      </div>

      {/* Service Type */}
      <div className="space-y-2">
        <Label htmlFor="serviceType">Service Type *</Label>
        <Select value={formData.serviceType} onValueChange={(v) => onChange({ serviceType: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select service type" />
          </SelectTrigger>
          <SelectContent>
            {serviceTypeOptions.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Service Name */}
      <div className="space-y-2">
        <Label htmlFor="serviceName">Service / Company Name</Label>
        <Input
          id="serviceName"
          type="text"
          placeholder="e.g., East Africa Freight Solutions"
          value={formData.serviceName}
          onChange={(e) => onChange({ serviceName: e.target.value })}
        />
      </div>

      {/* Primary Country */}
      <div className="space-y-2">
        <Label htmlFor="primaryCountry">Country of Operation *</Label>
        <Select value={formData.primaryCountry} onValueChange={(v) => onChange({ primaryCountry: v })}>
          <SelectTrigger>
            <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Select your base country" />
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
      </div>

      {/* Coverage Regions/Ports */}
      <div className="space-y-2">
        <Label htmlFor="coverageRegions">Coverage (Regions / Ports)</Label>
        <Input
          id="coverageRegions"
          type="text"
          placeholder="e.g., Dar es Salaam, Mombasa, Kampala corridor"
          value={formData.coverageRegions}
          onChange={(e) => onChange({ coverageRegions: e.target.value })}
        />
      </div>

      {/* Service Description / Notes */}
      <div className="space-y-2">
        <Label htmlFor="serviceDescription">Service Description / Notes *</Label>
        <Textarea
          id="serviceDescription"
          placeholder="Describe your services, specializations, and what makes you stand out..."
          value={formData.serviceDescription}
          onChange={(e) => onChange({ serviceDescription: e.target.value })}
          className="min-h-[100px]"
          required
        />
      </div>

      {/* Experience */}
      <div className="space-y-2">
        <Label htmlFor="experience">Years of Experience</Label>
        <Select value={formData.experience} onValueChange={(v) => onChange({ experience: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select experience level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0-2">Less than 2 years</SelectItem>
            <SelectItem value="2-5">2-5 years</SelectItem>
            <SelectItem value="5-10">5-10 years</SelectItem>
            <SelectItem value="10+">10+ years</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Certifications */}
      <div className="space-y-2">
        <Label htmlFor="certifications">Certifications / Accreditations</Label>
        <Input
          id="certifications"
          type="text"
          placeholder="e.g., ISO certified, FIATA member, Licensed broker"
          value={formData.certifications}
          onChange={(e) => onChange({ certifications: e.target.value })}
        />
      </div>

      {/* Availability Toggle */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-amber-500" />
          <div>
            <p className="font-medium text-foreground">Available Immediately</p>
            <p className="text-sm text-muted-foreground">
              Mark if you can take on new clients immediately
            </p>
          </div>
        </div>
        <Switch 
          checked={formData.isUrgent} 
          onCheckedChange={(checked) => onChange({ isUrgent: checked })}
        />
      </div>
    </div>
  );
}
