import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, CheckCircle } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-premium-bg-primary px-4 pb-28 pt-28">
      <div className="pointer-events-none absolute inset-0 opacity-90">
        <div className="absolute -left-16 top-0 h-96 w-96 rounded-full bg-[radial-gradient(circle,_rgba(16,185,129,0.2),_transparent)] blur-3xl" />
        <div className="absolute right-[-6rem] top-6 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,_rgba(99,102,241,0.28),_transparent)] blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-premium-bg-primary via-premium-bg-primary/85 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.02),_transparent_45%),radial-gradient(ellipse_at_bottom_left,_rgba(255,255,255,0.02),_transparent_45%)]" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-16 lg:flex-row lg:items-center">
        <div className="max-w-2xl space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-premium-border-subtle/70 bg-premium-bg-secondary/50 px-4 py-2 text-[0.65rem] uppercase tracking-[0.5em] text-premium-text-muted shadow-premium-sm">
            <Zap className="h-4 w-4 text-premium-accent" />
            One URL swap → 70% savings
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight text-premium-text-primary sm:text-5xl lg:text-[3.6rem]">
              Cut LLM costs by 70%.
              <span className="ml-2 bg-gradient-to-r from-premium-accent via-premium-accent/85 to-premium-accent/60 bg-clip-text text-transparent">
                Keep responses instant.
              </span>
            </h1>
            <p className="text-lg text-premium-text-secondary sm:text-xl">
              Drop-in proxy for OpenAI, Claude, and Groq with a global semantic cache. Sub-50ms cache hits, enterprise security, zero refactors.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link href="/signup">
              <Button className="rounded-premium-xl bg-gradient-to-r from-premium-accent via-premium-accent/90 to-premium-accent/70 px-7 py-3 text-lg font-semibold text-white shadow-glow-accent transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_32px_rgba(139,92,246,0.35)]">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#pricing">
              <Button
                variant="outline"
                className="rounded-premium-xl border border-premium-border-subtle/80 px-7 py-3 text-lg font-semibold text-premium-text-primary transition duration-200 hover:-translate-y-0.5 hover:border-premium-accent/70 hover:text-white hover:shadow-[0_0_28px_rgba(139,92,246,0.25)]"
              >
                View Pricing
              </Button>
            </Link>
            <div className="flex flex-wrap items-center gap-3 text-sm text-premium-text-muted">
              <CheckCircle className="h-4 w-4 text-premium-success" /> No credit card
              <CheckCircle className="h-4 w-4 text-premium-success" /> OpenAI-compatible
              <CheckCircle className="h-4 w-4 text-premium-success" /> SOC2-ready
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Free Requests", value: "50K" },
              { label: "Latency", value: "< 50ms" },
              { label: "Providers", value: "OpenAI +" },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-premium-xl border border-premium-border-subtle/80 bg-premium-bg-elevated px-5 py-4 text-center shadow-premium-sm transition duration-200 hover:-translate-y-0.5 hover:border-premium-accent/60 hover:shadow-premium-md"
              >
                <p className="text-[0.65rem] uppercase tracking-[0.4em] text-premium-text-muted">
                  {metric.label}
                </p>
                <p className="text-2xl font-semibold text-premium-text-primary">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass relative w-full max-w-xl space-y-5 rounded-premium-2xl border border-premium-border-subtle bg-premium-bg-elevated/90 p-6 shadow-premium-xl backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm uppercase tracking-[0.35em] text-premium-text-muted">
              <span className="h-2 w-2 rounded-full bg-premium-success animate-pulse" />
              Live Edge
            </div>
            <Badge className="rounded-full bg-premium-bg-secondary px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-premium-text-muted">
              99.9% up
            </Badge>
          </div>

          <div className="overflow-hidden rounded-premium-xl border border-premium-border-subtle/80 bg-premium-bg-primary/85 shadow-premium-md">
            <div className="flex items-center gap-2 border-b border-premium-border-subtle/60 px-4 py-2 text-premium-text-muted">
              <span className="text-xs">● ● ●</span>
              <span className="text-[0.7rem] uppercase tracking-[0.3em]">Edge Proxy</span>
            </div>
            <pre className="px-4 py-4 text-sm text-premium-text-secondary">
{`const client = new WatchLLM({
  apiKey: process.env.WATCHLLM_KEY,
  provider: "openai",
  baseURL: "https://api.watchllm.com/v1",
});`}
            </pre>
          </div>

          <div className="grid gap-4 rounded-premium-xl border border-premium-border-subtle/70 bg-premium-bg-primary/70 p-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[{ label: "Cache hit", value: "68%" }, { label: "Regions", value: "240+" }, { label: "Avg RT", value: "47ms" }].map((item) => (
                <div
                  key={item.label}
                  className="rounded-premium-lg bg-premium-bg-elevated/70 px-3 py-3 text-premium-text-secondary shadow-premium-sm"
                >
                  <p className="text-[0.65rem] uppercase tracking-[0.35em] text-premium-text-muted">{item.label}</p>
                  <p className="text-lg font-semibold text-premium-text-primary">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-premium-lg border border-premium-border-subtle/60 bg-premium-bg-elevated/70 px-4 py-3 text-xs text-premium-text-muted uppercase tracking-[0.3em]">
              <span>Global semantic cache</span>
              <span>OpenAI / Claude / Groq</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
