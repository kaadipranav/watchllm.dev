"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Activity, 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  Bell, 
  Download, 
  Users,
  Zap
} from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "Live request monitoring",
    description: "WebSocket updates in real-time",
  },
  {
    icon: DollarSign,
    title: "Cost breakdown",
    description: "By endpoint, model, and project",
  },
  {
    icon: TrendingUp,
    title: "Cache hit rate trends",
    description: "Hourly, daily, monthly views",
  },
  {
    icon: BarChart3,
    title: "Token usage analytics",
    description: "With cost forecasting",
  },
  {
    icon: Bell,
    title: "Custom budget alerts",
    description: "Spending limits & notifications",
  },
  {
    icon: Download,
    title: "Export to CSV/JSON",
    description: "For accounting & analysis",
  },
  {
    icon: Users,
    title: "Team usage attribution",
    description: "Across all projects",
  },
];

export function AnalyticsDashboard() {
  return (
    <section id="analytics-dashboard" className="relative py-32 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg-secondary via-bg-primary to-bg-primary" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xs font-medium uppercase tracking-wider text-text-muted mb-4">
            Real-Time Analytics
          </h2>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-text-primary mb-6">
            See exactly where every dollar goes
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed">
            Your dashboard shows live request monitoring, cost breakdowns, and predictive analytics—powered by ClickHouse for instant insights at any scale.
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                className="relative group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
              >
                <div className="h-full bg-bg-surface border border-border-subtle rounded-xl p-6 transition-all duration-300 hover:border-border-hover hover:shadow-lg hover:shadow-white/5">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-accent-primary/10 border border-accent-primary/20">
                      <Icon className="h-5 w-5 text-accent-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-text-primary mb-1 text-sm">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-text-secondary">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4">
            <Button
              asChild
              size="lg"
              className="min-w-[200px]"
            >
              <Link href="/signup">
                <Zap className="mr-2 h-4 w-4" />
                Start Free Trial
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="min-w-[200px]"
            >
              <Link href="/dashboard">
                Try Interactive Demo
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-text-muted">
            No credit card required • Explore with simulated data
          </p>
        </motion.div>
      </div>
    </section>
  );
}
