import { useCountUp } from "@/hooks/useCountUp";

interface StatItem {
  value: number;
  suffix: string;
  label: string;
}

const stats: StatItem[] = [
  { value: 30, suffix: "+", label: "SMEs Structured" },
  { value: 5, suffix: "+", label: "Countries of Operation" },
  { value: 100, suffix: "+", label: "Trade Assessments" },
];

const StatCounter = ({ value, suffix, label }: StatItem) => {
  const { count, elementRef, displayValue } = useCountUp({
    end: value,
    suffix,
    duration: 2500,
  });

  return (
    <div ref={elementRef} className="text-center px-6 md:px-12">
      <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-2">
        {displayValue}
      </div>
      <div className="text-sm md:text-base text-muted-foreground font-medium">
        {label}
      </div>
    </div>
  );
};

const ProofStrip = () => {
  return (
    <section className="bg-accent border-y border-border py-10 md:py-14">
      <div className="container-institutional">
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-4 lg:gap-0 divide-y md:divide-y-0 md:divide-x divide-border">
          {stats.map((stat, index) => (
            <StatCounter key={index} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProofStrip;
