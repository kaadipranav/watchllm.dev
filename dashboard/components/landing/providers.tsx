"use client";

import { motion } from "framer-motion";

const providers = [
  { name: "OpenAI", logo: "openai" },
  { name: "Anthropic", logo: "anthropic" },
  { name: "Groq", logo: "groq" },
  { name: "Cohere", logo: "cohere" },
  { name: "AWS", logo: "aws" },
  { name: "Google", logo: "google" },
];

export function Providers() {
  return (
    <section className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Dovetail-style header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="text-sm font-medium text-premium-text-muted">
            Drop-in compatible with leading AI providers
          </p>
        </motion.div>
        
        {/* Dovetail/OpenAI-style logo strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-center gap-x-12 gap-y-8"
        >
          {providers.map((provider, index) => (
            <motion.div
              key={provider.name}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="group flex items-center justify-center"
            >
              <span className="text-xl font-semibold tracking-tight text-white/40 transition-all duration-300 group-hover:text-white/80">
                {provider.name}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
