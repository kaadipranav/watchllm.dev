import { Providers } from "@/components/landing/providers";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Testimonials } from "@/components/landing/testimonials";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Pricing } from "@/components/landing/pricing";
import { FAQ } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";
import { LiveFlow } from "@/components/landing/live-flow";

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col selection:bg-violet-500/30">
      {/* Dovetail-inspired grid background with gradient overlays */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[hsl(222_47%_4%)]">
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 grid-pattern opacity-60" />
        
        {/* Gradient orbs - Dovetail/OpenAI style */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[radial-gradient(circle,hsl(258_90%_66%_/_0.08)_0%,transparent_70%)] blur-[60px]" />
        <div className="absolute top-[20%] right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,hsl(350_89%_60%_/_0.06)_0%,transparent_70%)] blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-[700px] h-[500px] bg-[radial-gradient(circle,hsl(180_60%_50%_/_0.04)_0%,transparent_70%)] blur-[100px]" />
        
        {/* Dovetail-style geometric decorations */}
        <div className="absolute top-[15%] right-[15%] w-3 h-3 rounded-full border border-white/20" />
        <div className="absolute top-[25%] right-[10%] w-2 h-2 rounded-full bg-white/10" />
        <div className="absolute top-[20%] right-[20%] w-1.5 h-1.5 rounded-full bg-violet-500/50" />
        
        {/* Connecting lines like Dovetail's node pattern */}
        <svg className="absolute top-[10%] right-[5%] w-[300px] h-[400px] opacity-20" viewBox="0 0 300 400">
          <path d="M50 50 L150 100 L250 80 L200 200 L150 350" stroke="url(#line-gradient)" strokeWidth="1" fill="none" />
          <path d="M100 150 L200 200" stroke="hsl(350 89% 60% / 0.4)" strokeWidth="1" fill="none" />
          <circle cx="50" cy="50" r="4" fill="hsl(258 90% 66% / 0.5)" />
          <circle cx="150" cy="100" r="3" fill="white" fillOpacity="0.3" />
          <circle cx="250" cy="80" r="4" fill="hsl(350 89% 60% / 0.5)" />
          <circle cx="200" cy="200" r="3" fill="white" fillOpacity="0.2" />
          <rect x="145" y="345" width="10" height="10" fill="none" stroke="hsl(258 90% 66% / 0.4)" strokeWidth="1" />
          <defs>
            <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(258 90% 66% / 0.4)" />
              <stop offset="100%" stopColor="hsl(350 89% 60% / 0.3)" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Radial gradient at center top */}
        <div className="absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(258_90%_66%_/_0.1),transparent)]" />
        
        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-[200px] bg-gradient-to-t from-[hsl(222_47%_4%)] to-transparent" />
      </div>

      <Navbar />
      <main className="flex-1">
        <Hero />
        <Providers />
        <LiveFlow />
        <HowItWorks />
        <Features />
        <Testimonials />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
