"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    question: "How does semantic caching work?",
    answer:
      "Our semantic caching uses vector embeddings to understand the meaning of your prompts. When a similar prompt comes in, we return the cached response instead of making a new API call. This means even slightly different phrasings of the same question can hit the cache, saving you money.",
  },
  {
    question: "Will this affect my response quality?",
    answer:
      "No! Cached responses are exact matches from previous API calls. We only return cached responses when the semantic similarity is above 95%, ensuring you get high-quality responses. You can also adjust this threshold in your settings.",
  },
  {
    question: "How do I integrate WatchLLM?",
    answer:
      "Integration takes less than 2 minutes. Just change your OpenAI base URL from 'api.openai.com' to 'proxy.watchllm.dev' and add your WatchLLM API key. Your existing code works without any other changes.",
  },
  {
    question: "Which AI providers do you support?",
    answer:
      "We support OpenAI (GPT-3.5, GPT-4, GPT-4o), Anthropic (Claude 3), and Groq. All providers use the same OpenAI-compatible API format, so you can switch providers by just changing a header.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. We never store your prompt data on disk - everything is processed in memory. Cached responses are stored encrypted and automatically expire. We're SOC 2 compliant and use enterprise-grade security throughout.",
  },
  {
    question: "What happens if I exceed my rate limit?",
    answer:
      "If you exceed your rate limit, requests will receive a 429 response with a Retry-After header. We recommend implementing exponential backoff. Upgraded plans have higher rate limits, and you can also request custom limits.",
  },
  {
    question: "Can I use this for production apps?",
    answer:
      "Yes! WatchLLM is built on Cloudflare's global edge network, providing 99.9% uptime and low latency worldwide. Many production apps rely on our proxy to reduce costs and improve performance.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "Yes, we offer a 14-day money-back guarantee on all paid plans. If you're not satisfied, contact us for a full refund, no questions asked.",
  },
];

function FAQItem({ 
  faq, 
  isOpen, 
  onToggle,
  index 
}: { 
  faq: typeof faqs[0]; 
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}) {
  return (
    <motion.div
      className="group relative"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94] 
      }}
    >
      {/* Gradient border on hover */}
      <div className="absolute -inset-px rounded-xl bg-gradient-to-b from-white/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      
      <div className="relative rounded-xl border border-white/[0.06] bg-premium-bg-elevated/60 overflow-hidden">
        {/* Inner highlight */}
        <div className="absolute inset-0 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]" />
        
        <button
          className="relative flex w-full items-center justify-between px-5 py-4 text-left"
          onClick={onToggle}
        >
          <span className="pr-4 text-sm font-medium text-premium-text-primary">
            {faq.question}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-premium-text-muted transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>
        
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="overflow-hidden"
            >
              <div className="border-t border-white/[0.04] px-5 py-4">
                <p className="text-sm leading-relaxed text-premium-text-muted">
                  {faq.answer}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="relative py-24">
      <div className="container relative mx-auto px-4">
        {/* Section header */}
        <motion.div 
          className="mx-auto max-w-2xl text-center mb-12"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-premium-text-muted">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-premium-text-primary sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-base text-premium-text-secondary">
            Everything you need to know about WatchLLM.
          </p>
        </motion.div>

        {/* FAQ items */}
        <div className="mx-auto max-w-3xl space-y-3">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              faq={faq}
              index={index}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
