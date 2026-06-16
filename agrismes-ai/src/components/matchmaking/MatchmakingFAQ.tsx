import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "How do I create and submit a listing?",
    answer: "Click the 'Submit a Listing' button on this page. You'll choose whether you're a buyer, seller, or other supply chain actor. Then provide details about your commodity, quantity, and contact information. Your listing will be reviewed by AgriSMES within 24-48 hours before becoming visible."
  },
  {
    question: "How do I filter and find matching buyers or sellers?",
    answer: "Use the search bar to search by commodity name, company, or region. Use the filter buttons (All, Buyers, Sellers, Third Party) to narrow results. Each listing shows the commodity, quantity, origin country, and preferred regions to help you find the right match."
  },
  {
    question: "How does AgriSMES help with pre-trade readiness?",
    answer: "AgriSMES assesses your trade readiness through AI-enabled tools, market intelligence, and documentation guidance. We help you align with bank-acceptable standards, quality requirements, and traceability processes before connecting you with verified trade partners."
  },
  {
    question: "What is the role of AI in listings and market intelligence?",
    answer: "Our AI analyzes market trends, commodity prices, and trade patterns to provide real-time intelligence. It helps match buyers with sellers based on commodity, location, and trade preferences. AI also assists with quality assessments and moisture content analysis for agricultural products."
  },
  {
    question: "Do I need formal financial records to join?",
    answer: "No. You don't need audited financials, bank statements, or formal credit history. We assess credibility through references, engagement history, and track record — not formal documents."
  },
  {
    question: "What if I'm a very small producer?",
    answer: "You're welcome here. There are no minimum volume requirements. Small-scale farmers can participate individually or join groups/cooperatives to access larger market opportunities."
  },
  {
    question: "How do I know buyers/sellers are trustworthy?",
    answer: "All listings are reviewed by AgriSMES before publication. We check references and engagement history. However, we recommend you always conduct your own due diligence before finalizing any trade."
  },
  {
    question: "What if something goes wrong with a trade?",
    answer: "You can report concerns through our incident reporting system. Our team will review the situation and can mediate discussions. Final resolution remains between trading parties, but we're here to help."
  },
  {
    question: "Do I need collateral or land titles?",
    answer: "No. Creating a profile and participating in listings requires no collateral, land titles, or prior bank relationships."
  },
  {
    question: "How are payment risks handled?",
    answer: "We encourage structured payment terms and can help facilitate discussions about payment security. However, AgriSMES doesn't process payments or guarantee transactions. Payment arrangements are between trading parties."
  },
  {
    question: "What quality standards are expected?",
    answer: "Standards vary by commodity and buyer. We help you understand requirements upfront and offer AI tools for quality assessment. Our team can explain what's needed in plain language before you commit."
  },
  {
    question: "Can I participate as part of a group or cooperative?",
    answer: "Absolutely. Groups, cooperatives, and aggregators are encouraged. Collective participation can help smaller producers access buyers who need larger volumes."
  },
  {
    question: "Is there any cost to create a listing?",
    answer: "Creating a basic listing is free. Some premium features may require earning engagement points through platform participation. Contact us for details on specific services."
  },
  {
    question: "How long does verification take?",
    answer: "Initial listing review typically takes 24-48 hours. Building credibility is ongoing — each successful engagement strengthens your profile over time."
  },
  {
    question: "Can I mark my listing as urgent?",
    answer: "Yes. When submitting a listing, you can toggle the 'Urgent' option to indicate that you need immediate attention. Urgent listings are prioritized in our review process and displayed with an urgent badge."
  }
];

export function MatchmakingFAQ() {
  return (
    <section className="bg-card border border-border rounded-xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <HelpCircle className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Frequently Asked Questions</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Common questions about listings, trust, risk, and getting started.
          </p>
        </div>
      </div>

      {/* FAQ Accordion */}
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`faq-${index}`} className="border-b border-border last:border-0">
            <AccordionTrigger className="text-left text-sm text-foreground hover:text-primary py-3">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-3">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
