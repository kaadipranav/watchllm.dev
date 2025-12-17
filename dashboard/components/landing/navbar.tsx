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
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-white/[0.06] bg-[hsl(222_47%_4%_/_0.85)] backdrop-blur-xl"
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
            className="h-7 w-7 brightness-110 drop-shadow-[0_0_18px_rgba(0,245,212,0.16)]"
          />
          <span className="text-lg font-semibold tracking-tight">WatchLLM</span>
        </Link>

        {/* Dovetail-style pill navigation */}
        <nav className="hidden md:flex items-center">
          <div className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.02] p-1">
            {[
              { href: "#features", label: "Features" },
              { href: "#pricing", label: "Pricing" },
              { href: "#faq", label: "FAQ" },
              { href: "/docs", label: "Docs" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative rounded-full px-4 py-1.5 text-sm font-medium text-premium-text-muted transition-all duration-200 hover:text-premium-text-primary hover:bg-white/[0.06]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            className="h-9 px-4 text-sm font-medium text-premium-text-muted transition-colors duration-150 hover:text-premium-text-primary hover:bg-transparent"
          >
            <Link href="/login">
              Log in
            </Link>
          </Button>
          <Button
            asChild
            className="h-9 rounded-full bg-white px-5 text-sm font-semibold text-[hsl(222_47%_4%)] transition-all duration-200 hover:bg-white/90 active:scale-[0.98]"
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
