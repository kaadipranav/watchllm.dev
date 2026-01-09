import type { Metadata } from "next";
import fs from "fs/promises";
import path from "path";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import matter from "gray-matter";
import { cache } from "react";

function getDocFilePath(slugParts: string[]): string {
  const baseDir = path.join(process.cwd(), "public", "docs");
  const safeParts = slugParts.filter(Boolean);
  const filePath = path.join(baseDir, ...safeParts) + ".md";
  return filePath;
}

const readDocFile = cache(async (filePath: string) => {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch (error) {
    return null;
  }
});

const renderMarkdown = cache(async (content: string, slugKey: string) => {
  const parsed = matter(content);
  const body = (parsed.content || content).trim();
  const title =
    (parsed.data?.title as string) ||
    (body.match(/^#\s+(.*)$/m) || [])[1] ||
    slugKey;

  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter, ["yaml", "toml"])
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: "append",
      properties: { className: ["anchor"], ariaLabel: "Link to section" },
      content: {
        type: "element",
        tagName: "span",
        properties: { className: ["ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500"] },
        children: [{ type: "text", value: "#" }],
      },
    })
    .use(rehypePrettyCode, {
      theme: "github-dark",
      keepBackground: false,
    })
    .use(rehypeStringify)
    .process(body);

  return { html: result.toString(), title };
});

export async function generateMetadata(
  { params }: { params: { slug: string[] } }
): Promise<Metadata> {
  const slugParts = Array.isArray(params.slug) ? params.slug : [params.slug];
  const filePath = getDocFilePath(slugParts);
  const markdown = (await readDocFile(filePath)) || "# Not Found";
  const slugKey = slugParts.join(" / ");
  const { title } = await renderMarkdown(markdown, slugKey);
  const description = markdown.split("\n").find(line => !line.startsWith("#"))?.slice(0, 160) || "WatchLLM documentation";

  return {
    title: `${title} | WatchLLM Docs`,
    description,
    openGraph: {
      title: `${title} | WatchLLM Docs`,
      description,
      type: "article",
      url: `https://watchllm.dev/docs/${slugParts.join("/")}`,
      siteName: "WatchLLM",
      locale: "en_US",
      images: [
        {
          url: "https://watchllm.dev/watchllm_logo.png",
          width: 1200,
          height: 630,
          alt: "WatchLLM",
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary",
      title: `${title} | WatchLLM Docs`,
      description,
      creator: "@kaad_zz",
    },
  };
}

const navigation = [
  {
    title: "Getting Started",
    items: [
      { title: "Getting Started", href: "/docs/GETTING_STARTED" },
      { title: "Quick Start", href: "/docs/QUICK_START" },
      { title: "Deployment", href: "/docs/DEPLOYMENT" },
      { title: "Cheat Sheet", href: "/docs/CHEAT_SHEET" },
    ],
  },
  {
    title: "Guides & Concepts",
    items: [
      { title: "Architecture", href: "/docs/ARCHITECTURE" },
      { title: "Analytics Guide", href: "/docs/USAGE_ANALYTICS_GUIDE" },
      { title: "Code Examples", href: "/docs/EXAMPLES" },
    ],
  },
  {
    title: "API & Reference",
    items: [
      { title: "API Reference", href: "/docs/API" },
      { title: "Error Codes", href: "/docs/ERRORS" },
      { title: "Troubleshooting", href: "/docs/TROUBLESHOOTING" },
    ],
  },
];

export default async function DocPage({ params }: { params: { slug: string[] } }) {
  const slugParts = Array.isArray(params.slug) ? params.slug : [params.slug];
  const filePath = getDocFilePath(slugParts);
  const currentPath = `/docs/${slugParts.join("/")}`;

  const markdown =
    (await readDocFile(filePath)) || "# Not Found\n\nThe requested document could not be found.";
  const slugKey = slugParts.join(" / ");
  const { html, title } = await renderMarkdown(markdown, slugKey);

  return (
    <div className="relative min-h-screen bg-premium-bg-primary text-white selection:bg-indigo-500/30">
      {/* Cinematic Background Gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.06),transparent)]" />
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-br from-violet-500/5 via-transparent to-transparent blur-3xl opacity-40 mix-blend-screen" />
        <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-bl from-teal-500/5 via-transparent to-transparent blur-3xl opacity-40 mix-blend-screen" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 py-12">
          {/* Sidebar Navigation */}
          <aside className="w-full lg:w-64 flex-shrink-0 lg:sticky lg:top-12 lg:h-[calc(100vh-6rem)] overflow-y-auto pr-4 scrollbar-hide">
            <div className="space-y-2 mb-8">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm font-medium text-premium-text-muted hover:text-white transition-colors group"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Home
              </Link>
              <Link
                href="/docs"
                className="flex items-center gap-2 text-sm font-medium text-premium-text-muted hover:text-white transition-colors group pl-6"
              >
                <ArrowRight className="h-3 w-3" />
                Docs Overview
              </Link>
            </div>

            <nav className="space-y-8">
              {navigation.map((section) => (
                <div key={section.title}>
                  <h5 className="mb-3 text-xs font-semibold uppercase tracking-widest text-premium-text-muted/60 px-2">
                    {section.title}
                  </h5>
                  <ul className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = currentPath === item.href;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              "block rounded-lg px-3 py-2 text-sm transition-all duration-200",
                              isActive
                                ? "bg-indigo-500/10 text-indigo-400 font-medium ring-1 ring-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]"
                                : "text-premium-text-secondary hover:bg-white/5 hover:text-white"
                            )}
                          >
                            {item.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            <div className="max-w-4xl">
              <div className="mb-8">
                <nav className="mb-4 flex items-center gap-2 text-xs text-premium-text-muted">
                  <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
                  <span>/</span>
                  <span className="text-premium-text-secondary">{title}</span>
                </nav>
                <h1 className="text-4xl font-bold tracking-tight text-white mb-2">{title}</h1>
                <p className="text-lg text-premium-text-secondary">
                  Official WatchLLM documentation for {title.toLowerCase()}.
                </p>
                <div className="mt-8 h-px w-full bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
              </div>

              {/* Glass article container */}
              <div className="relative isolate">
                <div className="absolute -inset-x-4 -inset-y-4 z-[-1] rounded-3xl bg-white/[0.02] border border-white/[0.05] shadow-2xl backdrop-blur-sm lg:-inset-x-8 lg:-inset-y-8" />

                <article
                  className={cn(
                    "prose prose-invert max-w-none",
                    "prose-headings:scroll-mt-28 prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-white",
                    "prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6",
                    "prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4",
                    "prose-p:text-premium-text-secondary prose-p:leading-relaxed prose-p:mb-6",
                    "prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline prose-a:font-medium",
                    "prose-strong:text-white prose-strong:font-semibold",
                    "prose-code:text-indigo-300 prose-code:bg-indigo-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none",
                    "prose-pre:bg-premium-bg-elevated/50 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-pre:p-0",
                    "prose-ul:text-premium-text-secondary prose-li:my-2",
                    "prose-img:rounded-2xl prose-img:border prose-img:border-white/10",
                    "prose-a:anchor:no-underline prose-a:anchor:opacity-50 hover:prose-a:anchor:opacity-100"
                  )}
                  dangerouslySetInnerHTML={{ __html: html }}
                />

                {/* Footer Navigation */}
                <div className="mt-20 pt-8 border-t border-white/10 flex items-center justify-between text-sm text-premium-text-muted">
                  <p>© 2025 WatchLLM. All rights reserved.</p>
                  <div className="flex items-center gap-6">
                    <Link href="https://twitter.com/watchllm" className="hover:text-white transition-colors">Twitter</Link>
                    <Link href="https://github.com/watchllm" className="hover:text-white transition-colors">GitHub</Link>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Table of Contents (Right Sidebar - Optional/Future) */}
          <div className="hidden xl:block w-64 flex-shrink-0">
            <div className="sticky top-12">
              <h5 className="text-xs font-semibold uppercase tracking-widest text-premium-text-muted/60 mb-4">
                On this page
              </h5>
              {/* This could be dynamically populated from the HTML headings if we had a client component to parse it */}
              <div className="text-xs text-premium-text-muted italic">
                Scroll to explore the sections of this document.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
