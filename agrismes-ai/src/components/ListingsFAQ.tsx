/**
 * ListingsFAQ Component
 * Frequently asked questions for the Explore Listings section
 */

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "How do I submit a listing?",
    answer: "Create a free account, then click 'Submit Listing' to post your buy or sell inquiry. Your listing will appear after admin review. Contact details are kept private until a match is made."
  },
  {
    question: "What does 'Verified' mean?",
    answer: "Verified listings have been reviewed and approved by our team. We check that the information is complete and the contact details are valid. This doesn't guarantee transaction success but adds a layer of trust."
  },
  {
    question: "How long does approval take?",
    answer: "Most listings are reviewed within 24-48 hours. Urgent listings are prioritized. You'll receive a notification in your profile once your listing status changes."
  },
  {
    question: "What are the shipping terms (FOB, CIF)?",
    answer: "FOB (Free On Board) means the seller covers costs until goods are loaded on the ship. CIF (Cost, Insurance, Freight) means the seller also pays shipping and insurance to destination. Look for the info icons next to these terms for detailed explanations."
  },
  {
    question: "What is MOQ and why is it important?",
    answer: "MOQ (Minimum Order Quantity) is the smallest amount a buyer will accept. This exists because international shipping has fixed costs that make small orders uneconomical. A 20ft container holds ~18-20 MT, which is why many MOQs start there."
  },
  {
    question: "How do I contact a buyer/seller?",
    answer: "Contact details are hidden to protect privacy. Create an account and submit an inquiry through the platform. If there's a potential match, our team will facilitate the introduction."
  },
  {
    question: "What certifications are needed for export?",
    answer: "Basic exports require phytosanitary certificates and business registration. Premium markets may require organic, Fair Trade, or other sustainability certifications. Our AI assistant Alex can guide you on specific requirements."
  },
  {
    question: "How are prices determined?",
    answer: "The live market prices shown are monthly benchmarks from the World Bank Pink Sheet. Actual transaction prices depend on quality, quantity, certifications, and negotiation between parties."
  }
];

interface ListingsFAQProps {
  className?: string;
  compact?: boolean;
}

export function ListingsFAQ({ className = "", compact = false }: ListingsFAQProps) {
  const items = compact ? FAQ_ITEMS.slice(0, 4) : FAQ_ITEMS;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-primary" />
          Frequently Asked Questions
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Accordion type="single" collapsible className="w-full">
          {items.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-sm text-left hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
