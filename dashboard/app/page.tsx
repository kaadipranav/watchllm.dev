import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Pricing } from "@/components/landing/pricing";
import { FAQ } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";
import { LiveFlow } from "@/components/landing/live-flow";

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col selection:bg-indigo-500/30">
      {/* Premium Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#030711]">
        <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-br from-violet-500/10 via-transparent to-transparent blur-[100px] opacity-40 mix-blend-screen" />
        <div className="absolute top-0 right-0 w-full h-[600px] bg-gradient-to-bl from-teal-500/10 via-transparent to-transparent blur-[100px] opacity-40 mix-blend-screen" />
        <div className="absolute bottom-0 left-1/3 h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-[120px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.1),transparent)]" />
      </div>

      <Navbar />
      <main className="flex-1">
        <Hero />
        <LiveFlow />
        <Features />
        <Pricing />
        <FAQ />

        {/* Bottom CTA Gradient */}
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-[300px] bg-gradient-to-t from-violet-900/10 to-transparent blur-3xl" />
      </main>
      <Footer />
    </div>
  );
}
