import { useState } from "react";
import { ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CommodityInfo {
  overview: string;
  importance: string;
  useCases: string;
  productionSeasons: string;
  globalProducers: string;
  regionalProducers: string;
  demandTrend: string;
  growthDirection: string;
  demandDrivers: string;
  importingMarkets: string[];
  qualityNote: string;
  supplyNote: string;
  documentationNote: string;
}

interface CommodityItem {
  name: string;
  details: string | null;
  info: CommodityInfo;
}

interface CommodityCategory {
  category: string;
  items: CommodityItem[];
}

const commodityData: Record<string, CommodityInfo> = {
  "Cashew Kernels": {
    overview: "Cashew kernels are the edible seeds of the cashew tree (Anacardium occidentale), processed from raw cashew nuts through shelling, peeling, and grading.",
    importance: "Cashew is one of the most traded tree nuts globally, valued for its nutritional profile and versatility in food manufacturing and direct consumption.",
    useCases: "Snack foods, confectionery, bakery products, dairy alternatives, and culinary applications across consumer and industrial food sectors.",
    productionSeasons: "Primary harvest occurs between February and May in most producing regions, with processing extending throughout the year.",
    globalProducers: "Vietnam, India, Côte d'Ivoire, and Brazil are the leading global producers and processors.",
    regionalProducers: "Côte d'Ivoire, Tanzania, Guinea-Bissau, Mozambique, Nigeria, Benin, and Kenya represent significant production zones.",
    demandTrend: "Growing steadily, driven by health-conscious consumption patterns and expanding use in plant-based food products.",
    growthDirection: "Continued upward trajectory expected as snack and health food segments expand globally.",
    demandDrivers: "Rising health awareness, growth in plant-based diets, expansion of snack food industry, and increasing middle-class consumption in emerging markets.",
    importingMarkets: ["European Union", "United States", "United Arab Emirates", "India (for processing)", "China"],
    qualityNote: "Kernel grades (W180, W240, W320, W450) determine market positioning. Consistent sizing, color, and moisture content are critical.",
    supplyNote: "Reliable supply chains with predictable volumes and delivery schedules are essential for buyer relationships.",
    documentationNote: "Phytosanitary certificates, fumigation records, and quality certifications (organic, fair trade where applicable) support market access.",
  },
  "Macadamia": {
    overview: "Macadamia nuts are the seeds of Macadamia integrifolia and Macadamia tetraphylla trees, prized for their rich, buttery flavor and high oil content.",
    importance: "Considered a premium tree nut, macadamia commands higher prices in international markets due to limited global supply and specialized cultivation requirements.",
    useCases: "Premium snacks, chocolate confectionery, bakery products, ice cream, cosmetics, and gourmet culinary applications.",
    productionSeasons: "Harvest typically occurs between March and September, varying by hemisphere and specific growing region.",
    globalProducers: "Australia, South Africa, Kenya, and Hawaii (USA) are the primary global producers.",
    regionalProducers: "South Africa, Kenya, Malawi, and emerging production in Tanzania and Zimbabwe.",
    demandTrend: "Stable with upward pressure, constrained primarily by limited global supply rather than demand saturation.",
    growthDirection: "Supply-constrained growth expected as new plantations mature over multi-year timelines.",
    demandDrivers: "Premium positioning in health foods, growing Asian demand particularly in China and Japan, and specialty confectionery applications.",
    importingMarkets: ["United States", "China", "Japan", "European Union", "South Korea"],
    qualityNote: "Kernel recovery rates, oil content, and absence of insect damage determine pricing. Style 0-1 kernels command premium prices.",
    supplyNote: "Long tree maturation periods (5-7 years to first harvest) make supply consistency a key differentiator.",
    documentationNote: "Export permits, phytosanitary compliance, and traceability documentation are standard requirements.",
  },
  "Coffee": {
    overview: "Coffee beans are the seeds of Coffea plants, with Arabica and Robusta representing the two commercially significant species traded globally.",
    importance: "Coffee is one of the most valuable agricultural commodities in international trade, supporting millions of livelihoods across producing countries.",
    useCases: "Roasted coffee for consumer consumption, instant coffee manufacturing, specialty coffee markets, and food industry flavoring applications.",
    productionSeasons: "Arabica harvest typically occurs October through February in East Africa; Robusta harvest varies by region with multiple cycles possible.",
    globalProducers: "Brazil, Vietnam, Colombia, Indonesia, and Ethiopia are leading global producers.",
    regionalProducers: "Ethiopia, Uganda, Kenya, Tanzania, Rwanda, Burundi, and Côte d'Ivoire represent primary coffee-producing nations.",
    demandTrend: "Steady global growth, with specialty and sustainable coffee segments showing stronger expansion.",
    growthDirection: "Continued growth expected, particularly in emerging markets and specialty segments.",
    demandDrivers: "Expanding coffee culture in Asia, premiumization in mature markets, growth of specialty and single-origin demand, and café culture globalization.",
    importingMarkets: ["European Union (Germany, Italy, Belgium)", "United States", "Japan", "South Korea", "United Kingdom"],
    qualityNote: "Cup quality scores, bean size, moisture content, and defect counts determine market positioning and pricing.",
    supplyNote: "Consistent quality across seasons and reliable delivery schedules are essential for roaster relationships.",
    documentationNote: "ICO certificates of origin, phytosanitary certificates, and specialty certifications (Rainforest Alliance, UTZ, organic) support market access.",
  },
  "Cocoa": {
    overview: "Cocoa beans are the fermented and dried seeds of the cacao tree (Theobroma cacao), serving as the primary raw material for chocolate production.",
    importance: "Cocoa is a foundational commodity for the global confectionery industry, with significant economic importance for producing countries.",
    useCases: "Chocolate manufacturing, cocoa powder production, cocoa butter extraction, beverages, and cosmetic applications.",
    productionSeasons: "Main crop harvest occurs October through March; mid-crop harvest from May through August in West Africa.",
    globalProducers: "Côte d'Ivoire, Ghana, Ecuador, Cameroon, and Nigeria dominate global production.",
    regionalProducers: "Côte d'Ivoire, Ghana, Nigeria, Cameroon, and emerging production in Tanzania and Uganda.",
    demandTrend: "Growing steadily, driven by chocolate consumption in emerging markets and premiumization in mature markets.",
    growthDirection: "Upward trajectory expected with rising Asian consumption and sustainable cocoa demand.",
    demandDrivers: "Growing middle class in Asia, premium and dark chocolate trends, bean-to-bar movement, and sustainable sourcing requirements from major manufacturers.",
    importingMarkets: ["Netherlands", "United States", "Germany", "Belgium", "Malaysia (for processing)"],
    qualityNote: "Fermentation quality, bean count per 100g, moisture content, and absence of mold/off-flavors are critical quality parameters.",
    supplyNote: "Traceability and consistent fermentation protocols differentiate suppliers in sustainability-focused markets.",
    documentationNote: "Quality certificates, sustainability certifications (Fairtrade, Rainforest Alliance, UTZ), and phytosanitary documentation are standard requirements.",
  },
  "Sesame": {
    overview: "Sesame seeds are the small, oil-rich seeds of the Sesamum indicum plant, one of the oldest cultivated oilseed crops.",
    importance: "Sesame is valued for its high oil content, nutritional properties, and culinary applications across diverse food cultures.",
    useCases: "Cooking oil, tahini production, bakery toppings, confectionery, halva, and traditional food preparations across Asian and Middle Eastern cuisines.",
    productionSeasons: "Harvest typically occurs between September and November in most African producing regions.",
    globalProducers: "Sudan, India, Myanmar, Tanzania, and Nigeria are leading global producers.",
    regionalProducers: "Sudan, Ethiopia, Tanzania, Nigeria, Burkina Faso, and Mali represent significant production.",
    demandTrend: "Growing steadily, driven by health food trends and expanding Asian food culture globally.",
    growthDirection: "Continued growth expected with rising demand for plant-based oils and traditional food ingredients.",
    demandDrivers: "Health food industry expansion, Asian cuisine globalization, demand for non-GMO and organic options, and tahini/hummus market growth.",
    importingMarkets: ["China", "Japan", "Turkey", "South Korea", "European Union", "United States"],
    qualityNote: "Oil content, seed color, purity (absence of foreign matter), and moisture levels determine grading and pricing.",
    supplyNote: "Consistent seed quality and color uniformity across shipments are valued by processors.",
    documentationNote: "Phytosanitary certificates, fumigation records, and quality analysis certificates support trade requirements.",
  },
  "Pigeon Pea": {
    overview: "Pigeon pea (Cajanus cajan) is a perennial legume crop cultivated for its protein-rich seeds, an important pulse in global food systems.",
    importance: "Pigeon pea is a staple protein source in South Asian diets and increasingly relevant for food security and sustainable agriculture.",
    useCases: "Dal preparation, canned vegetables, flour production, animal feed, and nitrogen-fixing cover crop applications.",
    productionSeasons: "Harvest typically occurs between December and March, depending on planting season and variety.",
    globalProducers: "India, Myanmar, Malawi, Tanzania, and Kenya are significant global producers.",
    regionalProducers: "Tanzania, Malawi, Kenya, Mozambique, and Uganda represent primary pigeon pea production zones.",
    demandTrend: "Stable with growing interest, driven by protein security considerations and Indian import demand.",
    growthDirection: "Gradual growth expected as pulse consumption increases and protein diversification continues.",
    demandDrivers: "Indian dal consumption, vegetarian protein demand, food security initiatives, and sustainable agriculture promotion.",
    importingMarkets: ["India", "United Arab Emirates", "European Union", "United States"],
    qualityNote: "Seed size, color uniformity, moisture content, and absence of insect damage determine quality grades.",
    supplyNote: "Reliable volumes aligned with Indian import seasons strengthen supplier positioning.",
    documentationNote: "Phytosanitary certificates, fumigation records, and moisture analysis are standard documentation requirements.",
  },
  "Cardamom": {
    overview: "Cardamom refers to the aromatic seed pods of plants in the Elettaria (green) and Amomum (black) genera, among the world's most valuable spices by weight.",
    importance: "Cardamom commands premium prices due to labor-intensive harvesting and strong demand in Middle Eastern, South Asian, and European markets.",
    useCases: "Culinary spice, traditional beverages (coffee, tea), confectionery, pharmaceutical preparations, and perfumery.",
    productionSeasons: "Primary harvest occurs between August and February, with peak production varying by altitude and variety.",
    globalProducers: "Guatemala, India, Sri Lanka, and Tanzania are leading global producers.",
    regionalProducers: "Tanzania and emerging production in Uganda and Ethiopia, with potential for expansion in suitable highland areas.",
    demandTrend: "Strong and growing, with supply constraints maintaining price premiums.",
    growthDirection: "Upward trajectory expected, particularly for high-quality green cardamom in premium markets.",
    demandDrivers: "Middle Eastern coffee culture, Scandinavian bakery traditions, Indian culinary demand, and growing global interest in premium spices.",
    importingMarkets: ["Saudi Arabia", "United Arab Emirates", "India", "European Union", "United States"],
    qualityNote: "Pod color, oil content, size uniformity, and absence of splits/damage determine premium grading.",
    supplyNote: "Consistent quality and reliable supply of specific grades support long-term buyer relationships.",
    documentationNote: "Phytosanitary certificates, quality grade certificates, and origin documentation are standard requirements.",
  },
  "Spices": {
    overview: "Export-grade spices encompass a range of aromatic plant products including cloves, cinnamon, turmeric, ginger, pepper, and vanilla.",
    importance: "Spices represent high-value agricultural exports with established trade routes and premium positioning in international markets.",
    useCases: "Food flavoring, beverage production, pharmaceutical applications, cosmetics, and traditional medicine preparations.",
    productionSeasons: "Varies by spice type: cloves (September-January), vanilla (May-July curing), ginger (year-round with peak harvest), pepper (December-April).",
    globalProducers: "Indonesia, India, Vietnam, Madagascar, and Sri Lanka are major global spice producers.",
    regionalProducers: "Madagascar (vanilla, cloves), Tanzania (cloves, cardamom), Nigeria (ginger), and various East producers.",
    demandTrend: "Growing steadily across categories, with organic and sustainably-sourced products showing premium demand.",
    growthDirection: "Continued growth expected, driven by culinary globalization and health-conscious consumption.",
    demandDrivers: "Global cuisine diversification, health and wellness trends, natural flavor demand, and premiumization in food manufacturing.",
    importingMarkets: ["United States", "European Union", "Japan", "Middle East", "India"],
    qualityNote: "Essential oil content, moisture levels, cleanliness, and absence of contamination determine quality grades and pricing.",
    supplyNote: "Traceability, consistent grading, and reliable logistics are essential for spice trade relationships.",
    documentationNote: "Phytosanitary certificates, pesticide residue analysis, and quality certifications support market access.",
  },
  "Avocado": {
    overview: "Avocado is the fruit of Persea americana, cultivated for its nutritious flesh and increasingly important in global fresh produce trade.",
    importance: "Avocado has become one of the fastest-growing fruit categories in international trade, driven by health trends and culinary versatility.",
    useCases: "Fresh consumption, guacamole production, oil extraction, cosmetic applications, and food service industry.",
    productionSeasons: "Varies significantly by variety and region; Kenya exports March-September, South Africa April-October, Tanzania year-round with peaks.",
    globalProducers: "Mexico, Peru, Chile, Colombia, and Kenya are leading global producers and exporters.",
    regionalProducers: "Kenya, South Africa, Tanzania, Ethiopia, and emerging production in Rwanda and Mozambique.",
    demandTrend: "Strong growth, among the fastest-growing fruit categories globally over the past decade.",
    growthDirection: "Continued rapid growth expected, particularly in Asian markets and food service channels.",
    demandDrivers: "Health and wellness trends, social media influence on food culture, restaurant and food service demand, and growing Asian consumption.",
    importingMarkets: ["European Union (Netherlands, France, UK)", "United States", "China", "Japan", "Middle East"],
    qualityNote: "Fruit size, oil content, external appearance, and absence of damage determine grade classifications.",
    supplyNote: "Cold chain integrity, consistent ripeness management, and reliable supply windows are critical for fresh produce markets.",
    documentationNote: "GlobalGAP certification, phytosanitary certificates, and cold chain documentation are standard requirements.",
  },
  "Pineapple": {
    overview: "Pineapple (Ananas comosus) is a tropical fruit valued for its sweet-tart flavor, produced for both fresh consumption and processing.",
    importance: "Pineapple is a significant tropical fruit in international trade, with established processing and fresh export channels.",
    useCases: "Fresh consumption, canned products, juice production, dried fruit snacks, and food service applications.",
    productionSeasons: "Typically available year-round in tropical regions, with production peaks varying by specific location and variety.",
    globalProducers: "Costa Rica, Philippines, Thailand, Indonesia, and Brazil are leading global producers.",
    regionalProducers: "Ghana, Côte d'Ivoire, Kenya, Nigeria, and Cameroon represent significant production.",
    demandTrend: "Stable with moderate growth, driven by health trends and convenience food formats.",
    growthDirection: "Gradual growth expected, with organic and sustainably-sourced products showing premium positioning.",
    demandDrivers: "Health beverage trends, tropical flavor demand, dried fruit snack growth, and convenience food expansion.",
    importingMarkets: ["European Union (Belgium, Netherlands)", "United States", "Japan", "Middle East"],
    qualityNote: "Fruit size, sugar content (Brix levels), crown condition, and external appearance determine quality grades.",
    supplyNote: "Cold chain management and consistent ripeness at delivery are critical for fresh export channels.",
    documentationNote: "GlobalGAP certification, phytosanitary certificates, and residue-free documentation support market requirements.",
  },
};

const commodityCategories: CommodityCategory[] = [
  {
    category: "Tree Nuts & Kernels",
    items: [
      { name: "Cashew Kernels", details: "W180, W240, W320", info: commodityData["Cashew Kernels"] },
      { name: "Macadamia", details: null, info: commodityData["Macadamia"] },
    ],
  },
  {
    category: "Coffee & Cocoa",
    items: [
      { name: "Coffee", details: "Arabica and Robusta", info: commodityData["Coffee"] },
      { name: "Cocoa", details: null, info: commodityData["Cocoa"] },
    ],
  },
  {
    category: "Oilseeds & Pulses",
    items: [
      { name: "Sesame", details: null, info: commodityData["Sesame"] },
      { name: "Pigeon Pea", details: null, info: commodityData["Pigeon Pea"] },
    ],
  },
  {
    category: "Spices",
    items: [
      { name: "Cardamom", details: null, info: commodityData["Cardamom"] },
      { name: "Spices", details: "Export-grade varieties", info: commodityData["Spices"] },
    ],
  },
  {
    category: "Fresh Produce",
    items: [
      { name: "Avocado", details: null, info: commodityData["Avocado"] },
      { name: "Pineapple", details: null, info: commodityData["Pineapple"] },
    ],
  },
];

const CommodityInfoPanel = ({ info, name }: { info: CommodityInfo; name: string }) => {
  return (
    <div className="mt-4 pt-4 border-t border-border/50 space-y-5 text-sm">
      {/* 1. Commodity Overview */}
      <div>
        <h4 className="font-semibold text-foreground mb-2">Commodity Overview</h4>
        <p className="text-muted-foreground leading-relaxed">{info.overview}</p>
        <p className="text-muted-foreground leading-relaxed mt-2">{info.importance}</p>
        <p className="text-muted-foreground leading-relaxed mt-2"><span className="text-foreground/80">Typical uses:</span> {info.useCases}</p>
      </div>

      {/* 2. Production & Seasonality */}
      <div>
        <h4 className="font-semibold text-foreground mb-2">Production & Seasonality</h4>
        <p className="text-muted-foreground leading-relaxed"><span className="text-foreground/80">Seasons:</span> {info.productionSeasons}</p>
        <p className="text-muted-foreground leading-relaxed mt-1"><span className="text-foreground/80">Global producers:</span> {info.globalProducers}</p>
        <p className="text-muted-foreground leading-relaxed mt-1"><span className="text-foreground/80">Regional producers:</span> {info.regionalProducers}</p>
      </div>

      {/* 3. Global Market Demand */}
      <div>
        <h4 className="font-semibold text-foreground mb-2">Global Market Demand</h4>
        <p className="text-muted-foreground leading-relaxed"><span className="text-foreground/80">Demand trend:</span> {info.demandTrend}</p>
        <p className="text-muted-foreground leading-relaxed mt-1"><span className="text-foreground/80">Growth outlook:</span> {info.growthDirection}</p>
        <p className="text-muted-foreground leading-relaxed mt-1"><span className="text-foreground/80">Key drivers:</span> {info.demandDrivers}</p>
      </div>

      {/* 4. Major Importing Markets */}
      <div>
        <h4 className="font-semibold text-foreground mb-2">Major Importing Markets</h4>
        <p className="text-muted-foreground leading-relaxed">{info.importingMarkets.join(", ")}</p>
      </div>

      {/* 5. Market Considerations */}
      <div>
        <h4 className="font-semibold text-foreground mb-2">Market Considerations</h4>
        <p className="text-muted-foreground leading-relaxed"><span className="text-foreground/80">Quality:</span> {info.qualityNote}</p>
        <p className="text-muted-foreground leading-relaxed mt-1"><span className="text-foreground/80">Supply reliability:</span> {info.supplyNote}</p>
        <p className="text-muted-foreground leading-relaxed mt-1"><span className="text-foreground/80">Documentation:</span> {info.documentationNote}</p>
      </div>

      {/* 6. Positioning Note */}
      <div className="pt-3 border-t border-border/30">
        <p className="text-xs text-muted-foreground italic">
          This information is provided for general market context. Market access and engagement depend on quality, consistency, and readiness.
        </p>
      </div>
    </div>
  );
};

const CommodityItem = ({ item }: { item: CommodityItem }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li className="border-b border-border/30 last:border-b-0 pb-3 last:pb-0">
      <div>
        <span className="text-foreground font-medium text-sm">{item.name}</span>
        {item.details && (
          <p className="text-xs text-muted-foreground mt-0.5">{item.details}</p>
        )}
      </div>
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-2 transition-colors">
          <span>Learn more about this commodity</span>
          {isOpen ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CommodityInfoPanel info={item.info} name={item.name} />
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
};

const CommoditiesSection = () => {
  return (
    <section id="commodities" className="section-institutional">
      <div className="container-institutional">
        {/* Section Context - WHO / WHAT / NEXT */}
        <div className="mb-8 max-w-3xl">
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">For SMEs & Suppliers</p>
          <h2 className="section-title">Commodities Supported</h2>
          <p className="body-text">
            AgriSMES focuses on specific agricultural commodities where structured trade readiness can meaningfully 
            improve bank engagement. The commodities below represent current focus areas with established export demand.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {commodityCategories.map((category) => (
            <div key={category.category} className="card-institutional p-5">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mb-4 pb-3 border-b border-border">
                {category.category}
              </h3>
              <ul className="space-y-3">
                {category.items.map((item) => (
                  <CommodityItem key={item.name} item={item} />
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Next Step Guidance */}
        <div className="mt-10 p-6 bg-accent/30 border border-border rounded-lg max-w-3xl">
          <p className="text-sm font-medium text-foreground mb-2">Working with these commodities?</p>
          <p className="body-text">
            If you work with any of the commodities listed above, the next step is to describe your operation through our inquiry form.
            Include approximate volumes and current trade documentation status to help us assess trade readiness pathways.
          </p>
        </div>

      </div>
    </section>
  );
};

export default CommoditiesSection;
