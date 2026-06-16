import { ClipboardCheck, BookOpen, HelpCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const qualityExpectations = [
  {
    title: "Product Grading",
    description: "Understanding quality grades (e.g., Grade 1, FAQ, Premium) and what buyers expect"
  },
  {
    title: "Moisture Content",
    description: "Acceptable moisture levels to prevent spoilage during storage and transport"
  },
  {
    title: "Packaging Standards",
    description: "Proper packaging requirements for different commodities and destinations"
  },
  {
    title: "Traceability",
    description: "Basic documentation showing where products come from and how they were handled"
  }
];

export function QualityStandardsSection() {
  const navigate = useNavigate();

  const handleOpenChat = () => {
    navigate("/");
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openChatWidget'));
    }, 500);
  };

  return (
    <section className="bg-card border border-border rounded-xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <ClipboardCheck className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Quality & Standards Support</h2>
          <p className="text-sm text-muted-foreground mt-1">
            We help you understand what buyers expect — in plain language.
          </p>
        </div>
      </div>

      {/* Common Expectations */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">Common Quality Expectations</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {qualityExpectations.map((item) => (
            <div key={item.title} className="p-3 bg-accent/30 rounded-lg">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How We Help */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">How We Help You Understand Standards</h3>
        </div>
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Clear explanations of quality requirements before you commit to any trade</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Guidance on achieving required standards for your specific commodity</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Access to AI-powered quality assessment tools (moisture, grade estimation)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Connection to inspection services when required</span>
          </li>
        </ul>
      </div>

      {/* Resources & Support */}
      <div className="border-t border-border pt-4">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Need Help Understanding Standards?</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleOpenChat} className="gap-1">
            Ask Alex (AI Chat)
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/insights/quality-control")}
            className="gap-1"
          >
            Quality Control Guide
            <ExternalLink className="w-3 h-3" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/download-center")}
            className="gap-1"
          >
            Download Resources
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </section>
  );
}
