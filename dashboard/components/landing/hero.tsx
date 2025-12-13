import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, CheckCircle } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-premium-bg-primary/80 px-4 pb-24 pt-20">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute -right-32 top-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(139,92,246,0.35),_transparent)] blur-3xl" />
        <div className="absolute left-0 top-32 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(16,185,129,0.25),_transparent)] blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-premium-bg-primary/0 via-premium-bg-primary to-premium-bg-primary" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 lg:flex-row">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-premium-border-subtle bg-premium-bg-secondary/40 px-4 py-1 text-xs uppercase tracking-[0.5em] text-premium-text-muted">
            <Zap className="h-4 w-4 text-premium-accent" />
            Save 40-70% on AI costs
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight text-premium-text-primary sm:text-5xl lg:text-6xl">
              Slash your AI spend with premium semantic caching
            </h1>
            <p className="text-lg text-premium-text-secondary sm:text-xl">
              WatchLLM proxies your OpenAI, Claude, and Groq requests across a secure, globally cached
              edge network—no SDK changes required.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link href="/signup">
              <Button className="rounded-premium-xl bg-gradient-to-r from-premium-accent to-premium-accent/80 px-6 py-3 text-lg font-semibold text-white shadow-glow-accent">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#pricing">
              <Button
                variant="outline"
                className="rounded-premium-xl border border-premium-border-subtle px-6 py-3 text-lg font-semibold text-premium-text-primary"
              >
                View Pricing
              </Button>
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Free Requests", value: "50K" },
              { label: "Latency", value: "< 50ms" },
              { label: "Providers", value: "OpenAI +" },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-premium-xl border border-premium-border-subtle bg-premium-bg-elevated px-4 py-3 text-center shadow-premium-sm"
              >
                <p className="text-xs uppercase tracking-[0.4em] text-premium-text-muted">
                  {metric.label}
                </p>
                <p className="text-xl font-semibold text-premium-text-primary">{metric.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4 pt-4 text-sm text-premium-text-secondary sm:flex-row sm:items-center sm:gap-10">
            {["50K free requests", "No credit card", "OpenAI-compatible"].map((badge) => (
              <div key={badge} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-premium-success" />
                {badge}
              </div>
            ))}
          </div>
        </div>

        <div className="glass relative rounded-premium-2xl border border-premium-border-subtle bg-premium-bg-elevated/80 p-6 shadow-premium-xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-premium-text-muted">Drop-in Proxy</p>
              <h3 className="text-xl font-semibold text-premium-text-primary">Zero code changes</h3>
            </div>
            <Badge className="rounded-full bg-premium-bg-secondary px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-premium-text-muted">
              Live
            </Badge>
          </div>

          <div className="mt-6 overflow-hidden rounded-premium-xl border border-premium-border-subtle bg-premium-bg-primary/80 p-4">
            <pre className="text-sm text-premium-text-secondary">
{`const client = new WatchLLM({
  apiKey: process.env.WATCHLLM_KEY,
  provider: "openai",
  baseURL: "https://api.watchllm.com/v1",
});`}
            </pre>
          </div>

          <div className="mt-6 flex items-center justify-between text-xs uppercase tracking-[0.4em] text-premium-text-muted">
            <span>OpenAI compatible</span>
            <span>Global edge</span>
          </div>
        </div>
      </div>
    </section>
  );
}
