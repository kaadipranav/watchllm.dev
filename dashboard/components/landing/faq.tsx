"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
      "Integration takes less than 2 minutes. Just change your OpenAI base URL from 'api.openai.com' to 'api.watchllm.com' and add your WatchLLM API key. Your existing code works without any other changes.",
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

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about WatchLLM
          </p>
        </div>

        {/* FAQ List */}
        <div className="mx-auto max-w-3xl space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-lg border bg-card"
            >
              <button
                className="flex w-full items-center justify-between p-4 text-left"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-medium">{faq.question}</span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform",
                    openIndex === index && "rotate-180"
                  )}
                />
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all",
                  openIndex === index ? "max-h-96" : "max-h-0"
                )}
              >
                <p className="px-4 pb-4 text-muted-foreground">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
