"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-200",
        scrolled
          ? "border-b border-white/[0.06] bg-premium-bg-primary/80 backdrop-blur-xl"
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 text-premium-text-primary">
          <Image
            src="/watchllm_logo.png"
            alt="WatchLLM Logo"
            width={28}
            height={28}
            className="h-7 w-7"
          />
          <span className="text-lg font-semibold tracking-tight">WatchLLM</span>
        </Link>

        {/* Navigation - anchored feel, fast transitions */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { href: "#features", label: "Features" },
            { href: "#pricing", label: "Pricing" },
            { href: "#faq", label: "FAQ" },
            { href: "/docs", label: "Docs" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative px-3 py-2 text-sm font-medium text-premium-text-muted transition-colors duration-100 hover:text-premium-text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Auth Buttons - stable, confident */}
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            className="h-9 px-3 text-sm font-medium text-premium-text-muted transition-colors duration-100 hover:text-premium-text-primary hover:bg-transparent"
          >
            <Link href="/login">
              Log in
            </Link>
          </Button>
          <Button
            asChild
            className="h-9 rounded-lg bg-premium-accent px-4 text-sm font-semibold text-white transition-all duration-150 hover:bg-premium-accent/90 active:scale-[0.98]"
          >
            <Link href="/signup">
              Get Started
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
