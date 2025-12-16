"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    content: "Cut my OpenAI bill from $847 to $312/month. Paid for itself in 3 days. The semantic caching is like magic.",
    author: "Alex R.",
    role: "Indie Developer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
  },
  {
    content: "Using this for our agency's internal tools. The per-client cost breakdown is exactly what we needed for billing.",
    author: "Sarah K.",
    role: "CTO, Nexa AI",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
  },
  {
    content: "Setup took literally 2 minutes. Changed the baseURL and API key, and boom - instant latency drop.",
    author: "Davide M.",
    role: "Full Stack Engineer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Davide",
  },
];

export function Testimonials() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-xl text-center mb-16"
        >
          <p className="text-sm font-medium text-violet-400 mb-4">Testimonials</p>
          <h2 className="text-4xl font-bold tracking-tight text-premium-text-primary sm:text-5xl">
            Loved by <span className="text-gradient-accent">developers</span>
          </h2>
        </motion.div>

        {/* OpenAI-style testimonial cards */}
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.04]"
              >
                {/* Top shine */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <blockquote className="text-premium-text-secondary leading-relaxed">
                  &ldquo;{testimonial.content}&rdquo;
                </blockquote>
                <div className="mt-6 flex items-center gap-x-4">
                  <img
                    className="h-10 w-10 rounded-full bg-white/5 border border-white/[0.08]"
                    src={testimonial.avatar}
                    alt=""
                  />
                  <div>
                    <div className="font-semibold text-premium-text-primary">{testimonial.author}</div>
                    <div className="text-xs text-premium-text-muted">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
