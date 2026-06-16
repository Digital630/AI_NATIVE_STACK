import { useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is AgriSMES?",
    answer: "AgriSMES is an AI-enabled Trade Readiness and Market Access Framework. We help SMEs prepare to become bank-ready and provide access to global markets after financing approval. We are not a financial institution and do not provide loans, guarantees, or credit approvals."
  },
  {
    question: "Can AgriSMES guarantee funding?",
    answer: "No. AgriSMES does not guarantee funding, financing approval, or any specific outcome. All financing decisions are made independently by licensed financial institutions. Our role is to prepare SMEs to be bank-ready and improve their chances of obtaining financing."
  },
  {
    question: "What is the difference between importer vs exporter support?",
    answer: "For importers, we focus on supplier verification, quality assurance, payment security, and compliance with import regulations. For exporters, we focus on buyer verification, documentation readiness, logistics coordination, and payment terms. Both paths include trade readiness assessment and structured support."
  },
  {
    question: "How does Risk Management work?",
    answer: "Our Risk Management framework helps users identify common trade risks (fraud, quality issues, payment problems, logistics challenges) and provides due diligence checklists and practical guidance. Visit our Risk Management page for detailed information."
  },
  {
    question: "How is my data handled?",
    answer: "Your data is handled securely and used only for assessment and service purposes. We do not sell personal data. For full details, please review our Privacy Policy."
  },
  {
    question: "How do I contact the team?",
    answer: "You can reach us via email at lentachai@gmail.com or through the AgriSMES AI Live Chat on our website. Our team is available to answer your questions and provide support."
  },
  {
    question: "Who can apply to AgriSMES?",
    answer: "SMEs operating in Tanzania, Uganda, Benin, Ivory Coast, or Ethiopia can apply. We work with businesses across various sectors, including agriculture, manufacturing, and trade."
  },
  {
    question: "What information is required to apply?",
    answer: "Applicants typically need to provide business registration documents, financial statements, trade history, business plans, and relevant certifications. The specific requirements may vary based on the nature of your business and financing needs."
  },
  {
    question: "What happens after I submit my application?",
    answer: "Once you submit your application, our team reviews your documentation and assesses your trade readiness. If your profile meets the criteria, we prepare your documentation for presentation to licensed financial institutions."
  },
  {
    question: "How long does the process take?",
    answer: "The timeline varies depending on the completeness of your documentation and the complexity of your financing needs. Our team works efficiently to process applications, but we recommend allowing adequate time for thorough evaluation."
  },
  {
    question: "Is there a fee for using AgriSMES services?",
    answer: "Please contact us directly for information about service fees and any applicable charges. Our team will provide transparent information about costs involved in our trade readiness framework."
  },
  {
    question: "What types of financing can AgriSMES help me access?",
    answer: "We help SMEs access various types of trade financing, including working capital, export financing, and equipment financing. The specific options available depend on your business profile and the financial institutions we work with."
  },
  {
    question: "Which financial institutions does AgriSMES work with?",
    answer: "AgriSMES partners with licensed financial institutions across our operating countries. These partnerships enable us to present qualified SME applications for financing consideration."
  },
  {
    question: "Can I track my application status?",
    answer: "Yes, we keep applicants informed about their application status throughout the process. You can contact our team directly for updates on your application."
  }
];

const boundariesList = [
  "AgriSMES does not approve loans",
  "AgriSMES does not guarantee buyers or supply",
  "AgriSMES does not set prices",
  "AgriSMES does not replace legal or financial advisors"
];

const FAQs = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-white">
        <div className="container-institutional py-12 md:py-16">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-dark mb-4">Frequently Asked Questions</h1>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            Find answers to common questions about AgriSMES and our trade readiness framework.
          </p>
          
          <Accordion type="single" collapsible className="w-full max-w-4xl">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b border-border">
                <AccordionTrigger className="text-left text-foreground hover:text-primary py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* What AgriSMES Does Not Do - Boundaries Section */}
          <div className="mt-12 p-6 bg-muted/30 rounded-lg max-w-4xl border border-border">
            <h2 className="text-lg font-semibold text-primary-dark mb-4">What AgriSMES Does Not Do</h2>
            <ul className="space-y-2 text-muted-foreground text-sm">
              {boundariesList.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-muted-foreground/60">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Related Links */}
          <div className="mt-8 p-6 bg-primary/5 border border-primary/20 rounded-lg max-w-4xl">
            <h2 className="text-lg font-semibold text-primary-dark mb-4">Related Resources</h2>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link to="/risk-management" className="text-primary hover:underline">
                Risk Management
              </Link>
              <Link to="/privacy-policy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              <Link to="/terms-of-use" className="text-primary hover:underline">
                Terms of Use
              </Link>
              <Link to="/download-center" className="text-primary hover:underline">
                Download Center
              </Link>
            </div>
          </div>

          <div className="mt-8 p-6 bg-muted/30 rounded-lg max-w-4xl">
            <h2 className="text-lg font-semibold text-primary-dark mb-2">Still have questions?</h2>
            <p className="text-muted-foreground">
              Contact us at{" "}
              <a href="mailto:lentachai@gmail.com" className="text-primary hover:underline">
                lentachai@gmail.com
              </a>{" "}
              or use our AgriSMES AI Live Chat.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FAQs;