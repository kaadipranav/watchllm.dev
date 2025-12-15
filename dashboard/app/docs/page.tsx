"use client";

import Link from "next/link";
import { ArrowRight, Book, Code, Terminal, Zap, Shield, Layout, FileText, Cpu, Server } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DocsIndexPage() {
  const categories = [
    {
      title: "Getting Started",
      items: [
        {
          title: "Quick Start",
          description: "Deploy and start saving in 48 hours.",
          href: "/docs/QUICK_START",
          icon: Zap,
          color: "text-yellow-400",
          gradient: "from-yellow-400/20 to-orange-500/20",
        },
        {
          title: "Executive Summary",
          description: "The high-level strategy and vision.",
          href: "/docs/EXECUTIVE_SUMMARY",
          icon: FileText,
          color: "text-blue-400",
          gradient: "from-blue-400/20 to-indigo-500/20",
        },
        {
          title: "Context & Strategy",
          description: "Why this works and who it is for.",
          href: "/docs/CONTEXT",
          icon: Book,
          color: "text-purple-400",
          gradient: "from-purple-400/20 to-pink-500/20",
        },
      ],
    },
    {
      title: "Architecture & Tech",
      items: [
        {
          title: "Tech Stack",
          description: "The $0/month student pack stack.",
          href: "/docs/TECH_STACK",
          icon: Server,
          color: "text-emerald-400",
          gradient: "from-emerald-400/20 to-teal-500/20",
        },
        {
          title: "System Design",
          description: "Deep dive into the proxy internals.",
          href: "/docs/SYSTEM",
          icon: Cpu,
          color: "text-cyan-400",
          gradient: "from-cyan-400/20 to-blue-500/20",
        },
        {
          title: "Architecture",
          description: "High-level system diagrams.",
          href: "/docs/ARCHITECTURE",
          icon: Layout,
          color: "text-indigo-400",
          gradient: "from-indigo-400/20 to-violet-500/20",
        },
      ],
    },
    {
      title: "API & Reference",
      items: [
        {
          title: "API Reference",
          description: "Complete endpoint documentation.",
          href: "/docs/API",
          icon: Terminal,
          color: "text-pink-400",
          gradient: "from-pink-400/20 to-rose-500/20",
        },
        {
          title: "Deployment",
          description: "How to ship to production.",
          href: "/docs/DEPLOYMENT",
          icon: Shield,
          color: "text-red-400",
          gradient: "from-red-400/20 to-orange-500/20",
        },
      ],
    },
  ];

  return (
    <div className="relative min-h-screen bg-premium-bg-primary text-white selection:bg-indigo-500/30">
      {/* Cinematic Background Gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.06),transparent)]" />

        {/* Static gradient orbs - Purple Teel mix as requested */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-violet-500/5 via-transparent to-transparent blur-3xl opacity-40 mix-blend-screen" />
        <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-bl from-teal-500/5 via-transparent to-transparent blur-3xl opacity-40 mix-blend-screen" />

        <div className="absolute top-[10%] left-[10%] h-[600px] w-[600px] rounded-full bg-purple-500/5 blur-[120px] mix-blend-screen" />
        <div className="absolute top-[10%] right-[10%] h-[600px] w-[600px] rounded-full bg-teal-500/5 blur-[120px] mix-blend-screen" />

        {/* Noise overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-24">
          <div className="mb-6 inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-sm font-medium text-indigo-400 backdrop-blur-sm">
            <span>Documentation v1.0</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/50 pb-2">
            Build Faster. Save Money.
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-400">
            Everything you need to integrate WatchLLM, optimize your AI costs, and build a profitable API wrapper business.
          </p>
        </div>

        {/* Documentation Categories */}
        <div className="space-y-20">
          {categories.map((category) => (
            <section key={category.title}>
              <h2 className="text-2xl font-semibold leading-10 text-white mb-8 flex items-center gap-3">
                <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                {category.title}
                <span className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
              </h2>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {category.items.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="group relative isolate flex flex-col justify-between rounded-3xl bg-white/5 px-8 py-8 ring-1 ring-white/10 transition-all duration-300 hover:ring-white/20 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 overflow-hidden"
                  >
                    {/* Hover Gradient */}
                    <div className={cn(
                      "absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-br",
                      item.gradient
                    )} />

                    <div className="flex items-center justify-between gap-x-4">
                      <div className={cn("p-2.5 rounded-xl bg-white/5 ring-1 ring-white/10", item.color)}>
                        <item.icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-500 transition-transform duration-300 group-hover:-rotate-45 group-hover:text-white" />
                    </div>

                    <div className="mt-6">
                      <h3 className="text-lg font-semibold leading-6 text-white group-hover:text-white transition-colors">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-gray-400 group-hover:text-gray-300 transition-colors">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Support Section */}
        <div className="mt-32 rounded-3xl bg-white/5 px-6 py-12 sm:px-12 lg:px-16 ring-1 ring-white/10 relative overflow-hidden text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-transparent to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Need help?</h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-400">
            Join our community of developers saving thousands on API costs.
          </p>
          <div className="mt-8 flex justify-center gap-x-6">
            <Link
              href="https://discord.gg/watchllm"
              className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all"
            >
              Join Discord
            </Link>
            <Link
              href="mailto:support@watchllm.dev"
              className="rounded-full bg-white/10 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/20 ring-1 ring-white/10 transition-all"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
