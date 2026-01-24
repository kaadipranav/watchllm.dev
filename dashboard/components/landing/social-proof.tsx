"use client";

import { motion } from "framer-motion";
import { TrendingUp, Zap, Users } from "lucide-react";

const stats = [
  {
    icon: Zap,
    value: "12M+",
    label: "Requests cached",
    color: "text-blue-400",
  },
  {
    icon: TrendingUp,
    value: "$147K+",
    label: "Saved across all customers",
    color: "text-green-400",
  },
  {
    icon: Users,
    value: "58%",
    label: "Average cost reduction",
    color: "text-purple-400",
  },
];

const testimonials = [
  {
    quote: "Cut our OpenAI bill by $2,400/month in the first week. The semantic caching is incredibly accurate\u2014we're seeing 65% cache hit rates on customer support queries.",
    name: "Sarah Chen",
    title: "CTO",
    company: "SupportAI",
  },
  {
    quote: "Saved 18 hours of engineering time by not building our own caching layer. WatchLLM pays for itself 10x over just in developer time, plus we're saving $1,800/month on API costs.",
    name: "Marcus Johnson",
    title: "Founder",
    company: "CodeMentor AI",
  },
];

// Placeholder company logos - using simple text badges for now
const companies = [
  "TechCorp",
  "AI Startup",
  "DataFlow",
  "CloudBase",
  "DevTools",
  "AgentHub",
  "CodeGen",
  "ChatFlow",
];

export function SocialProof() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg-primary via-purple-500/5 to-bg-primary" />
      
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
            Trusted by Teams
          </h2>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-text-primary mb-6">
            Join hundreds of developers saving on AI costs
          </h1>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                className="relative group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              >
                <div className="relative bg-bg-secondary/50 border border-border-subtle rounded-2xl p-8 text-center backdrop-blur-sm transition-all duration-300 group-hover:border-border-hover group-hover:bg-bg-secondary/70">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-xl bg-bg-primary/50 ${stat.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-text-muted">
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Company Logos Grid */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <p className="text-center text-sm text-text-muted mb-8 uppercase tracking-wider">
            Used by teams at
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {companies.map((company, index) => (
              <motion.div
                key={company}
                className="flex items-center justify-center"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
              >
                <div className="px-6 py-3 rounded-lg bg-bg-secondary/30 border border-border-subtle text-text-muted font-medium text-sm hover:text-text-secondary hover:border-border-hover transition-all duration-300">
                  {company}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Testimonials */}
        <motion.div
          className="grid md:grid-cols-2 gap-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              className="relative group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
            >
              <div className="relative bg-bg-secondary/50 border border-border-subtle rounded-2xl p-8 backdrop-blur-sm transition-all duration-300 group-hover:border-border-hover group-hover:bg-bg-secondary/70 h-full flex flex-col">
                {/* Quote */}
                <blockquote className="text-text-secondary leading-relaxed mb-6 flex-grow">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
                
                {/* Author */}
                <div className="flex items-center gap-4 border-t border-border-subtle pt-6">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-text-muted">
                      {testimonial.title} @ {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
