"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Activity, CheckCircle2 } from "lucide-react";

export default function StatusPage() {
  const lastUpdated = "January 25, 2026";

  const systems = [
    { name: "API Proxy", status: "Operational" },
    { name: "Dashboard", status: "Operational" },
    { name: "Analytics", status: "Operational" },
    { name: "Semantic Cache", status: "Operational" },
  ];

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
            <Activity className="h-8 w-8 text-violet-500" />
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Status</h1>
          </div>
          <p className="text-premium-text-muted text-sm mb-10">
            Current platform status and service health.
          </p>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 mb-8">
            <div className="flex items-center gap-2 text-emerald-400 mb-4">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">All systems operational</span>
            </div>
            <div className="grid gap-3">
              {systems.map((system) => (
                <div
                  key={system.name}
                  className="flex items-center justify-between text-sm text-premium-text-secondary"
                >
                  <span>{system.name}</span>
                  <span className="text-emerald-400">{system.status}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-premium-text-muted">
            Last updated: {lastUpdated}. For incident updates, contact support.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
