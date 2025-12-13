import { 
  Zap, 
  Database, 
  Shield, 
  BarChart3, 
  Code, 
  Globe,
  Clock,
  DollarSign 
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Semantic Caching",
    description:
      "Intelligent caching that understands similar queries, not just exact matches. Save up to 70% on repeated API calls.",
  },
  {
    icon: Code,
    title: "Zero Code Changes",
    description:
      "Just change your base URL. Works with any OpenAI-compatible SDK - Python, Node.js, Go, and more.",
  },
  {
    icon: Clock,
    title: "Faster Responses",
    description:
      "Cached responses return in <50ms instead of 500ms+. Better user experience with lower latency.",
  },
  {
    icon: DollarSign,
    title: "Cost Analytics",
    description:
      "Real-time dashboard showing exactly how much you're saving. Track costs by project, model, and more.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Your data never stored on disk. End-to-end encryption. SOC 2 compliant infrastructure.",
  },
  {
    icon: Globe,
    title: "Global Edge Network",
    description:
      "Deployed on Cloudflare's global network. Low latency from anywhere in the world.",
  },
  {
    icon: BarChart3,
    title: "Usage Analytics",
    description:
      "Detailed insights into your API usage patterns. Optimize your prompts and reduce costs further.",
  },
  {
    icon: Database,
    title: "Multi-Provider Support",
    description:
      "Route requests to OpenAI, Anthropic, Groq, and more through a single unified API.",
  },
];

export function Features() {
  return (
    <section
      id="features"
      className="relative overflow-hidden bg-gradient-to-b from-premium-bg-elevated/40 to-transparent py-24"
    >
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -z-10 right-0 top-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(59,130,246,0.3),_transparent)] blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center mb-16 space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-premium-text-muted">Capabilities</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to cut AI costs
          </h2>
          <p className="text-lg text-premium-text-secondary">
            WatchLLM combines semantic caching, analytics, and enterprise controls so you can scale safely and save aggressively.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="card-premium p-6 transition duration-base hover:-translate-y-1"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-premium-bg-secondary">
                <feature.icon className="h-6 w-6 text-premium-accent" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-premium-text-primary">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-premium-text-secondary">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
