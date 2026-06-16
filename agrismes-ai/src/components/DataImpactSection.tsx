import { useEffect, useRef, useState } from "react";
import { XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Tooltip, RadialBarChart, RadialBar } from "recharts";
import { motion, useInView } from "framer-motion";
import { TrendingUp, Users, FileCheck, Globe, Zap, Target, BarChart3 } from "lucide-react";

const readinessCompositionData = [
  { name: "Operational Readiness", value: 35, icon: Zap },
  { name: "Financial Structuring", value: 25, icon: BarChart3 },
  { name: "Documentation & Compliance", value: 20, icon: FileCheck },
  { name: "Market Alignment", value: 20, icon: Globe },
];

const capacityGrowthData = [
  { year: "Year 1", index: 100, growth: 0 },
  { year: "Year 2", index: 145, growth: 45 },
  { year: "Year 3", index: 210, growth: 110 },
  { year: "Year 4", index: 295, growth: 195 },
  { year: "Year 5", index: 380, growth: 280 },
];

const impactMetrics = [
  { label: "SMEs Structured", value: 150, suffix: "+", icon: Users },
  { label: "Trade Readiness Rate", value: 87, suffix: "%", icon: Target },
  { label: "Capacity Growth", value: 280, suffix: "%", icon: TrendingUp },
];

const COLORS = [
  "hsl(var(--primary))",
  "hsl(145 50% 45%)",
  "hsl(150 40% 55%)",
  "hsl(155 35% 65%)",
];

const AnimatedCounter = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return <span ref={ref}>{count}{suffix}</span>;
};

const DataImpactSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="py-16 md:py-24 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/3" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>
      
      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="container-institutional relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Data-Driven Insights</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            A Scalable SME Enablement Model
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Structured methodology delivering measurable capacity growth through operational discipline, financial clarity, and documentation integrity.
          </p>
        </motion.div>

        {/* Impact Metrics Strip */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-3 gap-4 mb-12"
        >
          {impactMetrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100" />
              <div className="relative p-6 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/30 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <metric.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                  <AnimatedCounter value={metric.value} suffix={metric.suffix} />
                </div>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-10">
          
          {/* Enhanced Pie Chart */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative p-6 rounded-2xl border border-border/50 bg-card/90 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    Trade Readiness Composition
                  </h3>
                  <p className="text-xs text-muted-foreground">Post-Assessment Analysis</p>
                </div>
              </div>
              
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {COLORS.map((color, i) => (
                        <linearGradient key={i} id={`pieGradient${i}`} x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor={color} stopOpacity={1} />
                          <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie
                      data={readinessCompositionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={50}
                      dataKey="value"
                      stroke="hsl(var(--background))"
                      strokeWidth={3}
                      animationBegin={0}
                      animationDuration={1500}
                    >
                      {readinessCompositionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`url(#pieGradient${index})`} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value}%`, '']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.75rem',
                        fontSize: '0.875rem',
                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legend with Icons */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                {readinessCompositionData.map((item, index) => (
                  <motion.div 
                    key={item.name} 
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-default"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ background: COLORS[index] }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {item.name}: <span className="font-semibold text-foreground">{item.value}%</span>
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Enhanced Area Chart */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative p-6 rounded-2xl border border-border/50 bg-card/90 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    Projected Capacity Growth
                  </h3>
                  <p className="text-xs text-muted-foreground">5-Year AgriSMES Framework</p>
                </div>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={capacityGrowthData} margin={{ left: 0, right: 20, top: 10, bottom: 10 }}>
                    <defs>
                      <linearGradient id="capacityGradientNew" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                        <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0.15}/>
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02}/>
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                    <XAxis 
                      dataKey="year" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => v}
                      domain={[0, 400]}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}`, 'Capacity Index']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.75rem',
                        fontSize: '0.875rem',
                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)'
                      }}
                      labelStyle={{ fontWeight: 600, marginBottom: '0.25rem' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="index" 
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      fill="url(#capacityGradientNew)"
                      filter="url(#glow)"
                      animationDuration={2000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex items-center justify-between mt-4 p-3 rounded-lg bg-primary/5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 bg-primary rounded-full"></div>
                  <span className="text-xs text-muted-foreground">Capacity Index (Base: 100)</span>
                </div>
                <span className="text-xs font-semibold text-primary">+280% over 5 years</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Analytical Summary - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl" />
          <div className="relative p-8 rounded-2xl border border-primary/20 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/20">
                <FileCheck className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Analytical Summary</h3>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Methodology</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  AgriSMES applies a structured trade-readiness methodology focusing on operational discipline, financial clarity, and documentation integrity.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Growth Model</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The model emphasizes compounding capacity growth, enabling SMEs to progressively meet higher trade, compliance, and financial thresholds over time.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Projections</h4>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  Trajectory reflects internal benchmarking based on structured assessment, field verification, and iterative readiness improvement.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DataImpactSection;
