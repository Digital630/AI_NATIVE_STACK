import { useState, useEffect } from "react";
import { 
  MapPin, Truck, Shield, FileCheck, Anchor, Package, Building2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ALL_COUNTRIES, AFRICAN_SOURCE_COUNTRIES } from "@/utils/countries";
import { USER_TYPES, UserType } from "@/utils/userTypes";

interface ServiceListingFormProps {
  userType: UserType;
  formData: {
    serviceName: string;
    serviceDescription: string;
    coverageCountries: string[];
    primaryCountry: string;
    experience: string;
    certifications: string;
    capacity: string;
    isUrgent: boolean;
  };
  onChange: (data: Partial<ServiceListingFormProps['formData']>) => void;
}

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  clearance_agent: <FileCheck className="h-5 w-5" />,
  freight_forwarder: <Anchor className="h-5 w-5" />,
  stuffing_agent: <Package className="h-5 w-5" />,
  insurance_company: <Shield className="h-5 w-5" />,
  inspection_company: <FileCheck className="h-5 w-5" />,
  transportation_company: <Truck className="h-5 w-5" />,
};

const SERVICE_FIELDS: Record<string, {
  nameLabel: string;
  namePlaceholder: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  capacityLabel: string;
  capacityPlaceholder: string;
  certificationsLabel: string;
  certificationsPlaceholder: string;
}> = {
  clearance_agent: {
    nameLabel: "Clearance Service Name",
    namePlaceholder: "e.g., Premium Customs Clearance Services",
    descriptionLabel: "Services Offered",
    descriptionPlaceholder: "Describe your customs clearance services, documentation handling, import/export expertise...",
    capacityLabel: "Monthly Capacity (shipments)",
    capacityPlaceholder: "e.g., 50+ shipments/month",
    certificationsLabel: "Licenses & Certifications",
    certificationsPlaceholder: "Licensed customs broker, TRA certified, etc.",
  },
  freight_forwarder: {
    nameLabel: "Freight Forwarding Service",
    namePlaceholder: "e.g., East Africa Freight Solutions",
    descriptionLabel: "Forwarding Services",
    descriptionPlaceholder: "Describe your freight forwarding capabilities, routes, partnerships...",
    capacityLabel: "Monthly TEU Capacity",
    capacityPlaceholder: "e.g., 100+ TEUs/month",
    certificationsLabel: "Certifications & Memberships",
    certificationsPlaceholder: "FIATA member, IATA certified, etc.",
  },
  stuffing_agent: {
    nameLabel: "Stuffing Service Name",
    namePlaceholder: "e.g., Professional Container Stuffing",
    descriptionLabel: "Stuffing Services",
    descriptionPlaceholder: "Describe container loading services, warehouse facilities, handling capabilities...",
    capacityLabel: "Daily Container Capacity",
    capacityPlaceholder: "e.g., 10+ containers/day",
    certificationsLabel: "Quality Certifications",
    certificationsPlaceholder: "ISO certified, port authority licensed, etc.",
  },
  insurance_company: {
    nameLabel: "Insurance Service Name",
    namePlaceholder: "e.g., Cargo Protection Insurance",
    descriptionLabel: "Insurance Products",
    descriptionPlaceholder: "Describe cargo insurance, marine insurance, trade credit insurance offerings...",
    capacityLabel: "Coverage Limit",
    capacityPlaceholder: "e.g., Up to $5M per shipment",
    certificationsLabel: "Regulatory Licenses",
    certificationsPlaceholder: "Insurance regulatory authority license, etc.",
  },
  inspection_company: {
    nameLabel: "Inspection Service Name",
    namePlaceholder: "e.g., Quality Assurance Inspections",
    descriptionLabel: "Inspection Services",
    descriptionPlaceholder: "Describe quality inspection, pre-shipment inspection, certification services...",
    capacityLabel: "Inspection Capacity",
    capacityPlaceholder: "e.g., 20+ inspections/week",
    certificationsLabel: "Accreditations",
    certificationsPlaceholder: "ISO 17020 accredited, SGS partner, etc.",
  },
  transportation_company: {
    nameLabel: "Transportation Service Name",
    namePlaceholder: "e.g., Regional Cargo Transport",
    descriptionLabel: "Transport Services",
    descriptionPlaceholder: "Describe fleet capabilities, routes covered, cargo types handled...",
    capacityLabel: "Fleet Capacity",
    capacityPlaceholder: "e.g., 50+ trucks available",
    certificationsLabel: "Licenses & Permits",
    certificationsPlaceholder: "Transport license, cross-border permits, etc.",
  },
};

export function ServiceListingForm({ userType, formData, onChange }: ServiceListingFormProps) {
  const fields = SERVICE_FIELDS[userType] || SERVICE_FIELDS.clearance_agent;
  const userTypeInfo = USER_TYPES[userType];
  const icon = SERVICE_ICONS[userType] || <Building2 className="h-5 w-5" />;

  return (
    <div className="space-y-6">
      {/* Service Type Header */}
      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          {icon}
        </div>
        <div>
          <p className="font-medium text-foreground">{userTypeInfo?.label || "Service Provider"}</p>
          <p className="text-sm text-muted-foreground">{userTypeInfo?.description}</p>
        </div>
      </div>

      {/* Service Name */}
      <div className="space-y-2">
        <Label htmlFor="serviceName">{fields.nameLabel} *</Label>
        <Input
          id="serviceName"
          type="text"
          placeholder={fields.namePlaceholder}
          value={formData.serviceName}
          onChange={(e) => onChange({ serviceName: e.target.value })}
          required
        />
      </div>

      {/* Primary Country of Operation */}
      <div className="space-y-2">
        <Label htmlFor="primaryCountry">Primary Country of Operation *</Label>
        <Select 
          value={formData.primaryCountry} 
          onValueChange={(value) => onChange({ primaryCountry: value })}
        >
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

      {/* Service Description */}
      <div className="space-y-2">
        <Label htmlFor="serviceDescription">{fields.descriptionLabel} *</Label>
        <Textarea
          id="serviceDescription"
          placeholder={fields.descriptionPlaceholder}
          value={formData.serviceDescription}
          onChange={(e) => onChange({ serviceDescription: e.target.value })}
          className="min-h-[120px]"
          required
        />
      </div>

      {/* Experience */}
      <div className="space-y-2">
        <Label htmlFor="experience">Years of Experience</Label>
        <Select 
          value={formData.experience} 
          onValueChange={(value) => onChange({ experience: value })}
        >
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

      {/* Capacity */}
      <div className="space-y-2">
        <Label htmlFor="capacity">{fields.capacityLabel}</Label>
        <Input
          id="capacity"
          type="text"
          placeholder={fields.capacityPlaceholder}
          value={formData.capacity}
          onChange={(e) => onChange({ capacity: e.target.value })}
        />
      </div>

      {/* Certifications */}
      <div className="space-y-2">
        <Label htmlFor="certifications">{fields.certificationsLabel}</Label>
        <Textarea
          id="certifications"
          placeholder={fields.certificationsPlaceholder}
          value={formData.certifications}
          onChange={(e) => onChange({ certifications: e.target.value })}
          className="min-h-[80px]"
        />
      </div>

      {/* Urgent Toggle */}
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
