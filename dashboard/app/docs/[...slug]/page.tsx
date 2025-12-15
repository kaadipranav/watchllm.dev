import fs from "fs/promises";
import path from "path";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeStringify from "rehype-stringify";
import rehypePrettyCode from "rehype-pretty-code";
import matter from "gray-matter";

function getDocFilePath(slugParts: string[]): string {
  const baseDir = path.join(process.cwd(), "public", "docs");
  const safeParts = slugParts.filter(Boolean);
  const filePath = path.join(baseDir, ...safeParts) + ".md";
  return filePath;
}

export default async function DocPage({ params }: { params: { slug: string[] } }) {
  const slugParts = Array.isArray(params.slug) ? params.slug : [params.slug];
  const filePath = getDocFilePath(slugParts);

  let md = "# Not Found\n\nThe requested document could not be found.";
  try {
    md = await fs.readFile(filePath, "utf-8");
  } catch {
    // keep default md
  }

  const parsed = matter(md);
  const content = parsed.content || md;
  const title =
    (parsed.data?.title as string) ||
    (content.match(/^#\s+(.*)$/m) || [])[1] ||
    slugParts.join(" / ");

  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter, ["yaml", "toml"])
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: "wrap",
      properties: { className: ["anchor"] },
    })
    .use(rehypePrettyCode, {
      theme: "github-dark",
      keepBackground: false,
    })
    .use(rehypeStringify)
    .process(content);
  const html = result.toString();

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

      <div className="relative mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] text-premium-text-muted hover:border-white/[0.12]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Docs
          </Link>
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[0.7rem] text-premium-text-muted">
            {slugParts.join(" / ")}
          </div>
        </div>

        {/* Glass container */}
        <div className="relative rounded-2xl border border-white/[0.08] bg-premium-bg-elevated/70 p-6 backdrop-blur-xl shadow-[0_1px_12px_rgba(0,0,0,0.25)]">
          <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]" />
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-premium-text-primary">{title}</h1>
            <p className="mt-1 text-premium-text-secondary">Documentation</p>
          </div>

          {/* Markdown content */}
          <article
            className="prose prose-invert max-w-none prose-h2:text-white prose-h3:text-white prose-p:text-white/80 prose-code:text-emerald-300 prose-pre:bg-white/[0.05] prose-a:text-emerald-300 prose-strong:text-white/90"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  );
}
