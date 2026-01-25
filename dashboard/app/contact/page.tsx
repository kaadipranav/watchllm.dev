"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Mail } from "lucide-react";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setStatus("sent");
      event.currentTarget.reset();
    } catch (error) {
      setStatus("error");
    }
  };

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
            <Mail className="h-8 w-8 text-violet-500" />
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Contact</h1>
          </div>
          <p className="text-premium-text-muted text-sm mb-10">
            Tell us about your use case. We respond within one business day.
          </p>

          <form onSubmit={handleSubmit} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-premium-text-secondary">Name</label>
                <input
                  name="name"
                  required
                  className="w-full rounded-md border border-white/[0.08] bg-transparent px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-premium-text-secondary">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-md border border-white/[0.08] bg-transparent px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-400"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-premium-text-secondary">Company</label>
              <input
                name="company"
                className="w-full rounded-md border border-white/[0.08] bg-transparent px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-400"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-premium-text-secondary">Message</label>
              <textarea
                name="message"
                required
                rows={5}
                className="w-full rounded-md border border-white/[0.08] bg-transparent px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-400"
              />
            </div>

            <button
              type="submit"
              disabled={status === "sending"}
              className="inline-flex items-center justify-center rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-60"
            >
              {status === "sending" ? "Sending..." : "Submit"}
            </button>

            {status === "sent" && (
              <p className="text-sm text-emerald-400">Thanks! We&apos;ll reach out soon.</p>
            )}
            {status === "error" && (
              <p className="text-sm text-red-400">Something went wrong. Please try again.</p>
            )}
          </form>

          <p className="text-xs text-premium-text-muted mt-6">
            Prefer email? Reach us at <a className="text-violet-400 hover:underline" href="mailto:support@watchllm.dev">support@watchllm.dev</a>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
