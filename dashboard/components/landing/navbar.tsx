import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-premium-border-subtle bg-premium-bg-primary/80 backdrop-blur-3xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-premium-text-primary">
          <Image
            src="/watchllm_logo.png"
            alt="WatchLLM Logo"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="text-xl font-bold">WatchLLM</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="#features" className="text-premium-text-secondary transition hover:text-premium-text-primary">
            Features
          </Link>
          <Link href="#pricing" className="text-premium-text-secondary transition hover:text-premium-text-primary">
            Pricing
          </Link>
          <Link href="#faq" className="text-premium-text-secondary transition hover:text-premium-text-primary">
            FAQ
          </Link>
          <Link href="/docs" className="text-premium-text-secondary transition hover:text-premium-text-primary">
            Docs
          </Link>
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button
              variant="ghost"
              className="text-premium-text-secondary hover:text-premium-text-primary"
            >
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button
              className="rounded-premium-md bg-gradient-to-r from-premium-accent to-premium-accent/70 text-white shadow-glow-accent"
            >
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
