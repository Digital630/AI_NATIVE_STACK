import { Ship, Warehouse, Sprout, FileCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import portsImage from "@/assets/trade-ports-shipping.jpg";
import warehouseImage from "@/assets/trade-warehousing.jpg";
import agricultureImage from "@/assets/trade-agriculture.jpg";
import documentationImage from "@/assets/trade-documentation.jpg";

const infrastructure = [
  { 
    icon: Ship, 
    label: "Ports & Shipping",
    description: "Container ports and cargo vessel operations",
    image: portsImage
  },
  { 
    icon: Warehouse, 
    label: "Warehousing & Logistics",
    description: "Storage facilities and handling operations",
    image: warehouseImage
  },
  { 
    icon: Sprout, 
    label: "Agriculture & Production",
    description: "Farms, harvesting, and primary processing",
    image: agricultureImage
  },
  { 
    icon: FileCheck, 
    label: "Trade Documentation",
    description: "Export documentation and inspection activities",
    image: documentationImage
  },
];

const TradeInfrastructureSection = () => {
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
    <section ref={sectionRef} className="section-institutional bg-background overflow-hidden">
      <div className="container-institutional">
        <div className="text-center mb-12">
          <h2 className="section-title">Trade Infrastructure</h2>
          <p className="body-text max-w-2xl mx-auto">
            Trade readiness is operational reality, not paperwork.
          </p>
        </div>

        {/* Infrastructure Grid with Images */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {infrastructure.map((item, index) => (
            <div
              key={index}
              className={`transition-all duration-700 ${
                isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="card-institutional overflow-hidden group hover:border-primary transition-colors duration-300">
                {/* Image */}
                <div className="aspect-video overflow-hidden">
                  <img 
                    src={item.image} 
                    alt={item.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                
                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                      <item.icon className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                    </div>
                    <h3 className="font-semibold text-foreground text-lg">{item.label}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Decorative Element */}
        <div 
          className={`mt-12 transition-all duration-1000 delay-500 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-6 text-sm text-muted-foreground font-medium">
                African Trade Network
              </span>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div 
          className={`mt-8 grid grid-cols-3 gap-4 md:gap-8 transition-all duration-700 delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="text-center">
            <div className="text-lg md:text-xl font-semibold text-primary">Various Regions</div>
            <div className="text-xs text-muted-foreground">Global Reach</div>
          </div>
          <div className="text-center">
            <div className="text-lg md:text-xl font-semibold text-primary">Agricultural</div>
            <div className="text-xs text-muted-foreground">Commodity Focus</div>
          </div>
          <div className="text-center">
            <div className="text-lg md:text-xl font-semibold text-primary">Export-Grade</div>
            <div className="text-xs text-muted-foreground">Quality Standard</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TradeInfrastructureSection;
