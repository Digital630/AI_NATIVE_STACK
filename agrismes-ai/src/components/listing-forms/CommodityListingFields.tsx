import { MapPin, AlertTriangle, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ALL_COUNTRIES, AFRICAN_SOURCE_COUNTRIES, COMMON_DESTINATION_COUNTRIES } from "@/utils/countries";

const COMMODITIES = [
  "Coffee", "Cocoa", "Cashew", "Sesame", "Cardamom", 
  "Macadamia", "Avocado", "Pineapple", "Pigeon Pea", "Spices", "Other"
];

const INCOTERMS = ["FOB", "CIF", "EXW", "CFR", "DAP", "DDP"];

interface CommodityListingFieldsProps {
  isBuyer: boolean;
  formData: {
    commodityName: string;
    quantity: string;
    quantityUnit: string;
    originCountry: string;
    destinationCountry: string;
    portOfLoading: string;
    portOfDestination: string;
    incoterm: string;
    gradeType: string;
    description: string;
    isUrgent: boolean;
  };
  onChange: (data: Partial<CommodityListingFieldsProps['formData']>) => void;
}

export function CommodityListingFields({ isBuyer, formData, onChange }: CommodityListingFieldsProps) {
  return (
    <div className="space-y-6">
      {/* Commodity */}
      <div className="space-y-2">
        <Label htmlFor="commodity">Commodity *</Label>
        <Select value={formData.commodityName} onValueChange={(v) => onChange({ commodityName: v })}>
          <SelectTrigger>
            <Package className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Select a commodity" />
          </SelectTrigger>
          <SelectContent>
            {COMMODITIES.map((commodity) => (
              <SelectItem key={commodity} value={commodity}>
                {commodity}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grade/Type (for sellers) or Type/Spec (for buyers) */}
      <div className="space-y-2">
        <Label htmlFor="gradeType">{isBuyer ? "Type / Specification" : "Grade / Type"}</Label>
        <Input
          id="gradeType"
          type="text"
          placeholder={isBuyer ? "e.g., Arabica AA, organic preferred" : "e.g., Grade A, AA, or Organic"}
          value={formData.gradeType}
          onChange={(e) => onChange({ gradeType: e.target.value })}
        />
      </div>

      {/* Quantity */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity {isBuyer ? "Needed" : "Available"}</Label>
          <Input
            id="quantity"
            type="text"
            placeholder="e.g., 500"
            value={formData.quantity}
            onChange={(e) => onChange({ quantity: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <Select value={formData.quantityUnit} onValueChange={(v) => onChange({ quantityUnit: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MT">Metric Tons (MT)</SelectItem>
              <SelectItem value="KG">Kilograms (KG)</SelectItem>
              <SelectItem value="bags">Bags</SelectItem>
              <SelectItem value="containers">Containers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Country */}
      <div className="space-y-2">
        <Label htmlFor="country">{isBuyer ? "Your Country" : "Country of Origin"}</Label>
        <Select 
          value={isBuyer ? formData.destinationCountry : formData.originCountry} 
          onValueChange={(v) => onChange(isBuyer ? { destinationCountry: v } : { originCountry: v })}
        >
          <SelectTrigger>
            <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="__separator_priority" disabled className="font-semibold text-primary">
              — {isBuyer ? "Common Markets" : "East Africa"} —
            </SelectItem>
            {(isBuyer ? COMMON_DESTINATION_COUNTRIES : AFRICAN_SOURCE_COUNTRIES).map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
            <SelectItem value="__separator_all" disabled className="font-semibold text-muted-foreground">
              — All Countries —
            </SelectItem>
            {ALL_COUNTRIES.filter(c => 
              !(isBuyer ? COMMON_DESTINATION_COUNTRIES : AFRICAN_SOURCE_COUNTRIES).includes(c)
            ).map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Port */}
      <div className="space-y-2">
        <Label htmlFor="port">{isBuyer ? "Port of Destination *" : "Port of Loading"}</Label>
        <Input
          id="port"
          type="text"
          placeholder={isBuyer ? "e.g., Rotterdam, Hamburg, Antwerp" : "e.g., Dar es Salaam, Mombasa"}
          value={isBuyer ? formData.portOfDestination : formData.portOfLoading}
          onChange={(e) => onChange(isBuyer ? { portOfDestination: e.target.value } : { portOfLoading: e.target.value })}
          required={isBuyer}
        />
      </div>

      {/* Incoterm */}
      <div className="space-y-2">
        <Label htmlFor="incoterm">Incoterm</Label>
        <Select value={formData.incoterm} onValueChange={(v) => onChange({ incoterm: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select Incoterm" />
          </SelectTrigger>
          <SelectContent>
            {INCOTERMS.map((term) => (
              <SelectItem key={term} value={term}>
                {term}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {formData.incoterm === "FOB" && "Free On Board - Seller delivers to port, buyer pays shipping"}
          {formData.incoterm === "CIF" && "Cost, Insurance & Freight - Seller pays shipping and insurance"}
          {formData.incoterm === "EXW" && "Ex Works - Buyer arranges all transport from seller's location"}
        </p>
      </div>

      {/* Description / Notes */}
      <div className="space-y-2">
        <Label htmlFor="description">{isBuyer ? "Notes / Requirements *" : "Additional Details"}</Label>
        <Textarea
          id="description"
          placeholder={isBuyer 
            ? "Describe your requirements, quality expectations, timeline..." 
            : "Describe your product, quality specifications, availability..."
          }
          value={formData.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className="min-h-[100px]"
          required={isBuyer}
        />
      </div>

      {/* Urgent Toggle */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <div>
            <p className="font-medium text-foreground">Mark as Urgent</p>
            <p className="text-sm text-muted-foreground">
              Urgent listings are highlighted for immediate attention
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
