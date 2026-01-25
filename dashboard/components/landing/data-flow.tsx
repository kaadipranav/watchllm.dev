"use client";

import { motion } from "framer-motion";
import { Activity, Database, Zap, BarChart3, Bug, GitBranch, Info } from "lucide-react";

type DataFlowStep = {
  icon: any;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  metrics?: string[];
  tooltip?: string;
};

const dataFlowSteps: DataFlowStep[] = [
  {
    icon: Zap,
    title: "Your Request",
    description: "AI request sent through WatchLLM proxy",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  {
    icon: Database,
    title: "Semantic Cache Check",
    description: "Vectorized and matched against cached responses",
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    metrics: ["40-70% hit rate*", "~50ms response time"],
    tooltip: "*Hit rate varies by use case - typical range for production apps. This measures % of requests that are cache hits, not matching accuracy.",
  },
  {
    icon: Activity,
    title: "Observability Logging",
    description: "Every request logged with cost, latency, tokens",
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    metrics: ["100% coverage", "Real-time tracking"],
  },
  {
    icon: Bug,
    title: "Agent Debugging",
    description: "Multi-step workflows tracked with context",
    color: "from-orange-500 to-red-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    metrics: ["Step-by-step traces", "Decision history"],
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Real-time insights on savings and performance",
    color: "from-yellow-500 to-orange-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
    metrics: ["Cost attribution", "ROI tracking"],
  },
];

export function DataFlow() {
  return (
    <section id="data-flow" className="relative py-32 overflow-hidden bg-gradient-to-b from-bg-primary to-bg-secondary">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xs font-medium uppercase tracking-wider text-text-muted mb-4">
            Complete Request Lifecycle
          </h2>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-text-primary mb-6">
            From request to insights
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed">
            Every AI request flows through our optimized pipeline, automatically tracked and analyzed for maximum savings and visibility.
          </p>
        </motion.div>

        {/* Flow visualization */}
        <div className="relative">
          {/* Desktop: Horizontal flow */}
          <div className="hidden lg:block">
            <div className="flex items-start justify-between gap-6">
              {dataFlowSteps.map((step, index) => (
                <div key={index} className="flex-1 relative">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="relative"
                  >
                    {/* Icon */}
                    <div className={`mx-auto w-16 h-16 rounded-xl ${step.bgColor} border ${step.borderColor} flex items-center justify-center mb-4`}>
                      <div className={`bg-gradient-to-br ${step.color} bg-clip-text`}>
                        <step.icon className="w-8 h-8 text-transparent" style={{
                          WebkitTextFillColor: 'transparent',
                          backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`,
                          backgroundClip: 'text',
                        }} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="text-center">
                      <h3 className="text-sm font-semibold text-text-primary mb-2">{step.title}</h3>
                      <p className="text-xs text-text-secondary mb-3">{step.description}</p>
                      
                      {/* Metrics */}
                      {step.metrics && (
                        <div className="space-y-1">
                          {step.metrics.map((metric, i) => (
                            <div 
                              key={i} 
                              className="inline-block px-2 py-0.5 rounded-full bg-bg-primary border border-border-subtle text-[10px] text-text-muted mx-1"
                              title={step.tooltip || undefined}
                            >
                              {metric}
                            </div>
                          ))}
                          {step.tooltip && (
                            <div className="mt-2 text-[9px] text-text-muted/70 italic max-w-[200px] mx-auto">
                              <Info className="w-3 h-3 inline mr-1" />
                              {step.tooltip}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Arrow between steps */}
                  {index < dataFlowSteps.length - 1 && (
                    <div className="absolute top-8 -right-3 transform">
                      <svg className="w-6 h-6 text-border-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: Vertical flow */}
          <div className="lg:hidden space-y-6">
            {dataFlowSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <div className={`p-6 rounded-xl ${step.bgColor} border ${step.borderColor}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg ${step.bgColor} border ${step.borderColor} flex items-center justify-center flex-shrink-0`}>
                      <step.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-text-primary mb-1">{step.title}</h3>
                      <p className="text-sm text-text-secondary mb-3">{step.description}</p>
                      
                      {step.metrics && (
                        <div className="flex flex-wrap gap-2">
                          {step.metrics.map((metric, i) => (
                            <div 
                              key={i} 
                              className="px-2 py-1 rounded-full bg-bg-primary border border-border-subtle text-xs text-text-muted"
                              title={step.tooltip || undefined}
                            >
                              {metric}
                            </div>
                          ))}
                          {step.tooltip && (
                            <div className="w-full mt-1 text-[10px] text-text-muted/70 italic">
                              <Info className="w-3 h-3 inline mr-1" />
                              {step.tooltip}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Arrow between steps */}
                {index < dataFlowSteps.length - 1 && (
                  <div className="flex justify-center my-2">
                    <svg className="w-6 h-6 text-border-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Metrics Clarification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 max-w-3xl mx-auto"
        >
          <div className="bg-bg-elevated/50 border border-border-subtle rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-accent-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm text-text-secondary">
                <p className="font-medium text-text-primary mb-2">Understanding Cache Metrics</p>
                <ul className="space-y-1 text-xs">
                  <li><strong className="text-text-primary">Match Accuracy (&gt;95%):</strong> How well we identify semantically similar queries</li>
                  <li><strong className="text-text-primary">Hit Rate (40-70%):</strong> Percentage of requests that are cache hits (varies by use case)</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
