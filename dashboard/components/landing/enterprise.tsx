"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/lib/config";
import { 
  Building2, 
  Shield, 
  Server, 
  Lock, 
  Headphones 
} from "lucide-react";

const features = [
  {
    icon: Server,
    title: "Your Infrastructure",
    description: "Deploy entirely inside your VPC, on-prem, or private cloud"
  },
  {
    icon: Shield,
    title: "Complete Data Isolation",
    description: "No data ever leaves your environment—prompts, logs, everything stays local"
  },
  {
    icon: Lock,
    title: "Use Your Own Keys",
    description: "Works with your existing OpenAI, Anthropic, Azure, or other LLM API keys"
  },
  {
    icon: Headphones,
    title: "Enterprise Support",
    description: "Annual license with optional dedicated support and SLAs"
  }
];

export function Enterprise() {
  return (
    <section id="enterprise" className="relative py-32 overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg-surface/30 to-transparent" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/20 mb-6">
            <Building2 className="w-4 h-4 text-accent-primary" />
            <span className="text-sm font-medium text-accent-primary">Enterprise</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-text-primary mb-6">
            Self-Hosted Deployment
          </h2>
          
          <p className="text-lg text-text-secondary leading-relaxed">
            Deploy WatchLLM entirely inside your infrastructure. 
            No data leaves your environment. Works with your existing LLM providers.
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="flex gap-4 p-6 rounded-lg bg-bg-surface/50 border border-border-subtle hover:border-border-default transition-colors"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-accent-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-medium text-text-primary mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-muted">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Data isolation callout */}
        <motion.div
          className="max-w-2xl mx-auto mb-12 p-6 rounded-lg bg-bg-surface border border-border-subtle"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Shield className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h4 className="font-medium text-text-primary mb-2">
                Complete Data Isolation
              </h4>
              <p className="text-sm text-text-secondary">
                In self-hosted mode, WatchLLM does not receive, store, or process any of your data. 
                All prompts, responses, logs, and analytics remain entirely within your infrastructure.
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="min-w-[180px]"
          >
            <a href={`mailto:${APP_CONFIG.salesEmail}?subject=WatchLLM Enterprise Inquiry`}>
              Contact Us
            </a>
          </Button>
          <p className="mt-4 text-sm text-text-muted">
            Annual enterprise license • No pricing listed
          </p>
        </motion.div>
      </div>
    </section>
  );
}
