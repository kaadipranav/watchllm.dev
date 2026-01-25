"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/lib/config";
import { 
  Building2, 
  Shield
} from "lucide-react";

const features = [
  {
    title: "Your Infrastructure",
    description: "Deploy entirely inside your VPC, on-prem, or private cloud"
  },
  {
    title: "Complete Data Isolation",
    description: "No data ever leaves your environment—prompts, logs, everything stays local"
  },
  {
    title: "Use Your Own Keys",
    description: "Works with your existing OpenAI, Anthropic, Azure, or other LLM API keys"
  },
  {
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
              className="p-5 rounded-lg bg-bg-surface/50 border border-border-subtle hover:border-border-default transition-colors"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
            >
              <h3 className="font-medium text-text-primary mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Pricing Card */}
        <motion.div
          className="max-w-3xl mx-auto mb-12 p-8 rounded-xl bg-bg-surface border border-border-subtle"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="text-center mb-6">
            <div className="text-3xl font-bold text-text-primary mb-2">
              Starting at $12,000/year
            </div>
            <p className="text-sm text-text-secondary">
              For up to 10 developers
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-6">
            {/* Includes */}
            <div>
              <h4 className="font-medium text-text-primary mb-3 text-sm">What&apos;s Included</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>
                  <span>All updates for 12 months</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>
                  <span>Email support (Standard tier)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>
                  <span>Offline license key</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>
                  <span>Docker Compose deployment</span>
                </li>
              </ul>
            </div>

            {/* Licensing */}
            <div>
              <h4 className="font-medium text-text-primary mb-3 text-sm">Licensing Options</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-accent-primary flex-shrink-0 mt-0.5">•</span>
                  <span>Per-developer (up to 10 included)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-primary flex-shrink-0 mt-0.5">•</span>
                  <span>Per-server (unlimited developers)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-primary flex-shrink-0 mt-0.5">•</span>
                  <span>Custom volume discounts available</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Support Tiers */}
          <div className="border-t border-border-subtle pt-6">
            <h4 className="font-medium text-text-primary mb-4 text-sm">Support Tiers</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-bg-primary/50 border border-border-subtle">
                <div className="font-medium text-text-primary mb-1 text-sm">Standard</div>
                <div className="text-xs text-text-secondary mb-2">Included</div>
                <p className="text-xs text-text-muted">Email support during business hours</p>
              </div>
              <div className="p-4 rounded-lg bg-bg-primary/50 border border-accent-primary/30">
                <div className="font-medium text-text-primary mb-1 text-sm">Premium</div>
                <div className="text-xs text-text-secondary mb-2">+$4,800/year</div>
                <p className="text-xs text-text-muted">Priority support with SLA</p>
              </div>
              <div className="p-4 rounded-lg bg-bg-primary/50 border border-border-subtle">
                <div className="font-medium text-text-primary mb-1 text-sm">Enterprise</div>
                <div className="text-xs text-text-secondary mb-2">Custom quote</div>
                <p className="text-xs text-text-muted">Dedicated support engineer</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Data isolation callout */}
        <motion.div
          className="max-w-2xl mx-auto mb-12 p-6 rounded-lg bg-bg-surface border border-border-subtle"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
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
              <p className="text-xs text-text-muted mt-2">
                Self-hosted deployment gives you complete control over data residency and compliance. Deploy WatchLLM in your SOC2, HIPAA, or ISO-certified infrastructure to meet your specific regulatory requirements.
              </p>
              <p className="text-xs text-green-400/70 mt-1 font-medium">
                Your infrastructure, your compliance posture. WatchLLM inherits whatever certifications your environment has.
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
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="min-w-[220px]"
          >
            <a href={`mailto:${APP_CONFIG.salesEmail}?subject=Schedule%20WatchLLM%20Enterprise%20Demo`}>
              Schedule Enterprise Demo
            </a>
          </Button>
          <p className="mt-4 text-sm text-text-muted">
            Get a personalized demo and custom quote for your team
          </p>
        </motion.div>
      </div>
    </section>
  );
}
