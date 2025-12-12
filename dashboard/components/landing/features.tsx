import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <section id="features" className="py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Everything You Need to Cut AI Costs
          </h2>
          <p className="text-lg text-muted-foreground">
            WatchLLM provides powerful tools to optimize your AI spending 
            without sacrificing quality or performance.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
