import { Users, MapPin, FileCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const activities = [
  {
    icon: Users,
    title: "SME Owners",
    description: "Direct engagement with agricultural producers and suppliers",
  },
  {
    icon: MapPin,
    title: "Field Coordinators",
    description: "On-ground verification and operational support",
  },
  {
    icon: FileCheck,
    title: "Quality Inspection",
    description: "Standards compliance and documentation verification",
  },
];

const FieldPresenceSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="section-institutional bg-accent">
      <div className="container-institutional">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div 
            className={`transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            }`}
          >
            <h2 className="section-title">Field Operations</h2>
            <p className="body-text mb-8">
              We work directly with SMEs in the field. Operations, documents, and data 
              are verified before banks engage.
            </p>

            <div className="space-y-6">
              {activities.map((activity, index) => (
                <div 
                  key={index}
                  className={`flex items-start gap-4 transition-all duration-500 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                  style={{ transitionDelay: `${index * 150 + 300}ms` }}
                >
                  <div className="w-10 h-10 flex-shrink-0 bg-primary rounded-lg flex items-center justify-center">
                    <activity.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{activity.title}</h3>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div 
            className={`transition-all duration-700 delay-200 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
            }`}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 rounded-lg transform rotate-3"></div>
              <div className="relative bg-primary-light border border-border rounded-lg p-8 md:p-12">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-background rounded-lg p-6 shadow-sm border border-border">
                    <div className="text-2xl font-bold text-primary mb-1">100%</div>
                    <div className="text-xs text-muted-foreground">Field Verified</div>
                  </div>
                  <div className="bg-background rounded-lg p-6 shadow-sm border border-border">
                    <div className="text-2xl font-bold text-primary mb-1">5+</div>
                    <div className="text-xs text-muted-foreground">Countries Active</div>
                  </div>
                  <div className="bg-background rounded-lg p-6 shadow-sm border border-border">
                    <div className="text-2xl font-bold text-primary mb-1">Direct</div>
                    <div className="text-xs text-muted-foreground">SME Engagement</div>
                  </div>
                  <div className="bg-background rounded-lg p-6 shadow-sm border border-border">
                    <div className="text-2xl font-bold text-primary mb-1">Real</div>
                    <div className="text-xs text-muted-foreground">Operations</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FieldPresenceSection;
