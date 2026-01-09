"use client";

import Link from "next/link";
import { ArrowRight, Book, Code, Terminal, Zap, Shield, Layout, FileText, Cpu, Server, ArrowLeft, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DocsIndexPage() {
  const categories = [
    {
      title: "Getting Started",
      description: "Everything you need to get WatchLLM up and running in your project.",
      items: [
        {
          title: "Getting Started",
          description: "Complete beginner's guide from signup to first cached request.",
          href: "/docs/GETTING_STARTED",
          icon: Zap,
          color: "bg-emerald-500/10 text-emerald-500",
        },
        {
          title: "Quick Start",
          description: "2-minute integration guide for experienced developers.",
          href: "/docs/QUICK_START",
          icon: Zap,
          color: "bg-yellow-500/10 text-yellow-500",
        },
        {
          title: "Deployment",
          description: "Step-by-step production deployment guide.",
          href: "/docs/DEPLOYMENT",
          icon: Server,
          color: "bg-blue-500/10 text-blue-500",
        },
        {
          title: "Cheat Sheet",
          description: "Quick reference for SDKs and CLI commands.",
          href: "/docs/CHEAT_SHEET",
          icon: FileText,
          color: "bg-cyan-500/10 text-cyan-500",
        },
      ],
    },
    {
      title: "Guides & Concepts",
      description: "Deep dive into how WatchLLM handles semantic caching and analytics.",
      items: [
        {
          title: "Architecture",
          description: "Understanding the edge proxy system design.",
          href: "/docs/ARCHITECTURE",
          icon: Layout,
          color: "bg-indigo-500/10 text-indigo-500",
        },
        {
          title: "Analytics Guide",
          description: "Mastering cost savings and performance metrics.",
          href: "/docs/USAGE_ANALYTICS_GUIDE",
          icon: Book,
          color: "bg-purple-500/10 text-purple-500",
        },
        {
          title: "Code Examples",
          description: "Boilerplate for JS, Python, and cURL.",
          href: "/docs/EXAMPLES",
          icon: Code,
          color: "bg-cyan-500/10 text-cyan-500",
        },
      ],
    },
    {
      title: "API & Reference",
      description: "Technical specifications and error resolution guides.",
      items: [
        {
          title: "API Reference",
          description: "Detailed endpoint and parameter specs.",
          href: "/docs/API",
          icon: Terminal,
          color: "bg-pink-500/10 text-pink-500",
        },
        {
          title: "Error Codes",
          description: "Troubleshoot common integration issues.",
          href: "/docs/ERRORS",
          icon: Shield,
          color: "bg-red-500/10 text-red-500",
        },
        {
          title: "Troubleshooting",
          description: "Connectivity and performance debugging.",
          href: "/docs/TROUBLESHOOTING",
          icon: Shield,
          color: "bg-emerald-500/10 text-emerald-500",
        },
      ],
    },
  ];

  return (
    <div className="relative min-h-screen bg-premium-bg-primary text-white selection:bg-indigo-500/30">
      {/* Cinematic Background Gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.06),transparent)]" />
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-violet-500/5 via-transparent to-transparent blur-3xl opacity-40 mix-blend-screen" />
        <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-bl from-teal-500/5 via-transparent to-transparent blur-3xl opacity-40 mix-blend-screen" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8 py-12 sm:py-16">
        {/* Back Button */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-premium-text-muted hover:text-white transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-20">
          {/* Hero Section */}
          <div className="lg:w-1/3">
            <div className="sticky top-12">
              {/* Robot Illustration */}
              <div className="mb-8 rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-xl">
                <img 
                  src="/illustrations/taxi-robot-searching-for-information-on-website.svg"
                  alt="AI Documentation Search"
                  className="w-full h-auto"
                />
              </div>
              
              <div className="mb-6 inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400 backdrop-blur-sm">
                <span>Developer Hub</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-white mb-6">
                Build faster. <br />
                Save more.
              </h1>
              <p className="text-lg text-premium-text-secondary mb-8">
                Welcome to WatchLLM documentation. Here you&apos;ll find everything you need to implement semantic caching at the edge.
              </p>

              <div className="grid gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex items-center gap-4 group hover:bg-white/[0.05] transition-colors cursor-pointer">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Join Discord</p>
                    <p className="text-xs text-premium-text-muted">Get help from community</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex items-center gap-4 group hover:bg-white/[0.05] transition-colors cursor-pointer">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Security Policy</p>
                    <p className="text-xs text-premium-text-muted">How we handle your data</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="lg:w-2/3 space-y-16">
            {categories.map((category) => (
              <div key={category.title}>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">{category.title}</h2>
                  <p className="text-premium-text-secondary">{category.description}</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {category.items.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-all duration-200 hover:bg-white/[0.05] hover:border-white/20 hover:shadow-xl hover:shadow-indigo-500/5"
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110", item.color)}>
                          <item.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">
                              {item.title}
                            </h3>
                            <ArrowRight className="h-4 w-4 text-premium-text-muted transition-transform group-hover:translate-x-1 group-hover:text-indigo-400" />
                          </div>
                          <p className="text-xs text-premium-text-secondary leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {/* Featured Post / Announcement */}
            <div className="rounded-3xl border border-indigo-500/20 bg-indigo-500/5 p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Cpu className="h-32 w-32" />
              </div>
              <div className="relative z-10">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">New Feature</span>
                <h3 className="text-2xl font-bold text-white mt-2 mb-4">Semantic A/B Testing</h3>
                <p className="text-premium-text-secondary mb-6 max-w-lg">
                  Compare performance and cost between different LLM providers in real-time. Automatically route requests to the most efficient variant.
                </p>
                <Link
                  href="/docs/EXAMPLES"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  View Example Implementation <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
