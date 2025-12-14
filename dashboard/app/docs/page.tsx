"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function DocsIndexPage() {
  const docs = [
    {
      title: "Quickstart",
      description: "Get up and running in minutes",
      href: "/docs/quickstart.md",
    },
    {
      title: "API Reference",
      description: "Endpoints, parameters, and responses",
      href: "/docs/api-reference.md",
    },
    {
      title: "Examples",
      description: "Node, Python, cURL usage snippets",
      href: "/docs/examples.md",
    },
    {
      title: "Error Guide",
      description: "Common errors and how to fix them",
      href: "/docs/errors.md",
    },
  ];

  const guides = [
    { title: "Getting Started", href: "/docs/guides/getting-started.md" },
    { title: "Creating Projects", href: "/docs/guides/creating-projects.md" },
    { title: "Managing API Keys", href: "/docs/guides/managing-api-keys.md" },
    { title: "Understanding Caching", href: "/docs/guides/understanding-caching.md" },
    { title: "Upgrading Plans", href: "/docs/guides/upgrading-plans.md" },
  ];

  return (
    <div className="min-h-screen bg-premium-bg-primary text-premium-text-primary">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-premium-text-muted">Documentation</p>
          <h1 className="text-4xl font-bold">WatchLLM Docs</h1>
          <p className="text-premium-text-secondary">
            Learn how to integrate the caching proxy, manage projects and keys, and understand analytics.
          </p>
        </header>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          {docs.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group rounded-xl border border-white/[0.06] bg-premium-bg-elevated p-5 transition-colors hover:border-white/[0.1]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-premium-text-secondary">{item.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-premium-text-muted transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-semibold">Guides</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {guides.map((g) => (
              <Link
                key={g.title}
                href={g.href}
                className="rounded-lg border border-white/[0.06] bg-premium-bg-primary px-4 py-3 text-sm text-premium-text-secondary hover:border-white/[0.1]"
              >
                {g.title}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12 space-y-3">
          <h2 className="text-xl font-semibold">Developer Docs</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Link href="/ARCHITECTURE.md" className="rounded-lg border border-white/[0.06] bg-premium-bg-primary px-4 py-3 text-sm text-premium-text-secondary hover:border-white/[0.1]">
              Architecture
            </Link>
            <Link href="/DEPLOYMENT.md" className="rounded-lg border border-white/[0.06] bg-premium-bg-primary px-4 py-3 text-sm text-premium-text-secondary hover:border-white/[0.1]">
              Deployment
            </Link>
            <Link href="/docs/TECH_STACK.md" className="rounded-lg border border-white/[0.06] bg-premium-bg-primary px-4 py-3 text-sm text-premium-text-secondary hover:border-white/[0.1]">
              Tech Stack
            </Link>
            <Link href="/docs/API.md" className="rounded-lg border border-white/[0.06] bg-premium-bg-primary px-4 py-3 text-sm text-premium-text-secondary hover:border-white/[0.1]">
              API (Detailed)
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
