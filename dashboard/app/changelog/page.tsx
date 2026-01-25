"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, History } from "lucide-react";

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-[hsl(222_47%_4%)] text-premium-text-primary px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-4xl">
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
          <div className="flex items-center gap-3 mb-4">
            <History className="h-8 w-8 text-violet-500" />
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Changelog</h1>
          </div>
          <p className="text-premium-text-muted text-sm mb-10">
            Product updates and improvements across WatchLLM.
          </p>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 mb-8">
            <p className="text-sm text-premium-text-secondary">
              View the complete product update history in our public changelog.
            </p>
            <a
              href="https://github.com/kaadipranav/WATCHLLM/blob/main/docs/CHANGELOG.md"
              target="_blank"
              rel="noreferrer"
              className="inline-flex mt-4 text-sm text-violet-400 hover:underline"
            >
              Read full changelog →
            </a>
          </div>

          <div className="text-xs text-premium-text-muted">
            Updated regularly. For release notifications, follow us on GitHub.
          </div>
        </motion.div>
      </div>
    </div>
  );
}
