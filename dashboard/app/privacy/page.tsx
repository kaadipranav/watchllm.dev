"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  const lastUpdated = "December 21, 2024";

  return (
    <div className="min-h-screen bg-[hsl(222_47%_4%)] text-premium-text-primary px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-premium-text-muted hover:text-white transition-colors mb-12"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            Privacy Policy
          </h1>
          <p className="text-premium-text-muted text-sm mb-12">
            Last updated: {lastUpdated}
          </p>

          <div className="prose prose-invert max-w-none space-y-8 text-premium-text-secondary leading-relaxed text-sm sm:text-base">
            <section>
              <h2 className="text-white text-xl font-semibold mb-4">1. Introduction</h2>
              <p>
                WatchLLM (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) respects your privacy and is committed to protecting it through our compliance with this policy. This policy describes the types of information we may collect from you or that you may provide when you visit the website watchllm.dev (our &quot;Website&quot;) and our practices for collecting, using, maintaining, protecting, and disclosing that information.
              </p>
            </section>

            <section>
              <h2 className="text-white text-xl font-semibold mb-4">2. Data We Process</h2>
              <p>
                As a developer tool and API proxy, WatchLLM processes information in two capacities:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong>Account Data:</strong> Information you provide to create an account, such as your email address and name.</li>
                <li><strong>Proxy Data:</strong> Requests and responses handled by our proxy. By default, metadata about these requests (model, token count, latency) is stored to provide you with analytics.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white text-xl font-semibold mb-4">3. Semantic Caching & Content</h2>
              <p>
                For our Semantic Caching feature, we store vector embeddings of your prompts. These embeddings are mathematical representations of the text and do not contain the raw text itself, unless you explicitly enable caching of fully-formed responses. You can manage your data retention and caching policies in your project settings.
              </p>
            </section>

            <section>
              <h2 className="text-white text-xl font-semibold mb-4">4. Data Security</h2>
              <p>
                We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure. All data is encrypted in transit using industry-standard TLS.
              </p>
            </section>

            <section>
              <h2 className="text-white text-xl font-semibold mb-4">5. Contact Information</h2>
              <p>
                To ask questions or comment about this privacy policy and our privacy practices, contact us at: <a href="mailto:support@watchllm.com" className="text-violet-400 hover:underline">support@watchllm.com</a>.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
