"use client";

import { motion } from "framer-motion";

const providers = [
  { name: "OpenAI", logo: "openai", byok: true },
  { name: "Anthropic", logo: "anthropic", byok: true },
  { name: "Groq", logo: "groq", byok: true },
  { name: "OpenRouter", logo: "openrouter", byok: false },
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
          <p className="text-sm font-medium text-text-muted">
            Bring Your Own Key (BYOK) support for direct API access
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
              <div className="flex flex-col items-center gap-2">
                <span className="text-xl font-semibold tracking-tight text-text-muted transition-colors duration-300 group-hover:text-text-secondary">
                  {provider.name}
                </span>
                {provider.byok && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-bg-elevated text-text-muted border border-border-subtle">
                    BYOK
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
