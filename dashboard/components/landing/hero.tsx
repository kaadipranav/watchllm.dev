import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, CheckCircle } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
      
      <div className="container relative mx-auto px-4 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center rounded-full border bg-muted px-4 py-1.5 text-sm">
            <Zap className="mr-2 h-4 w-4 text-yellow-500" />
            <span>Save 40-70% on AI API costs</span>
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Cut Your{" "}
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              AI Costs
            </span>{" "}
            Without Changing Code
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            WatchLLM is a drop-in proxy that reduces your OpenAI, Claude, and Groq API costs 
            through intelligent semantic caching. Just change your base URL.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#pricing">
              <Button size="lg" variant="outline" className="text-lg px-8">
                View Pricing
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              50K free requests/month
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              No credit card required
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              OpenAI-compatible API
            </div>
          </div>
        </div>

        {/* Code Example */}
        <div className="mx-auto mt-16 max-w-2xl">
          <div className="rounded-lg border bg-card p-1">
            <div className="flex items-center gap-2 border-b px-4 py-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="ml-4 text-sm text-muted-foreground">Quick Integration</span>
            </div>
            <pre className="overflow-x-auto p-4 text-sm">
              <code className="text-muted-foreground">
                <span className="text-blue-500">const</span>{" "}
                <span className="text-green-500">client</span> ={" "}
                <span className="text-blue-500">new</span>{" "}
                <span className="text-yellow-500">OpenAI</span>({"{"}
                {"\n"}
                {"  "}apiKey: <span className="text-orange-500">process.env.OPENAI_API_KEY</span>,
                {"\n"}
                {"  "}baseURL: <span className="text-green-400">"https://api.watchllm.com/v1"</span>
                {"\n"}
                {"}"});
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
