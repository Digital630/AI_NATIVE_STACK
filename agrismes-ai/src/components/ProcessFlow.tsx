import { useEffect, useRef, useState } from "react";

// Import process images
import smeIntakeImg from "@/assets/process-sme-intake.jpg";
import documentationImg from "@/assets/process-documentation.jpg";
import fieldStructuringImg from "@/assets/process-field-structuring.jpg";
import verificationImg from "@/assets/process-verification.jpg";
import tradeReadinessImg from "@/assets/process-trade-readiness.jpg";
import complianceImg from "@/assets/process-compliance.jpg";
import bankEngagementImg from "@/assets/process-bank-engagement.jpg";
import institutionalImg from "@/assets/process-institutional.jpg";

const steps = [
  {
    title: "SME Intake",
    image: smeIntakeImg,
  },
  {
    title: "Documentation & Assessment",
    image: documentationImg,
  },
  {
    title: "Field Structuring",
    image: fieldStructuringImg,
  },
  {
    title: "On-Ground Verification",
    image: verificationImg,
  },
  {
    title: "Trade Readiness",
    image: tradeReadinessImg,
  },
  {
    title: "Compliance & Standards",
    image: complianceImg,
  },
  {
    title: "Bank Engagement",
    image: bankEngagementImg,
  },
  {
    title: "Institutional Alignment",
    image: institutionalImg,
  },
];

const ProcessFlow = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="section-institutional bg-background">
      <div className="container-institutional">
        <h2 className="section-title text-center mb-12">Our Process</h2>
        
        {/* Process Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {steps.map((step, index) => (
            <div 
              key={index}
              className={`transition-all duration-700 ${
                isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="card-institutional p-0 overflow-hidden h-full">
                {/* Image */}
                <div className="aspect-[4/3] overflow-hidden">
                  <img 
                    src={step.image} 
                    alt={step.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Title */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-primary">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="text-sm md:text-base font-semibold text-foreground leading-tight">
                    {step.title}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessFlow;
