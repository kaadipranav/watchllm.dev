"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { APP_CONFIG } from "@/lib/config";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
    { href: "/docs", label: "Docs" },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled || mobileMenuOpen
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
            className="h-7 w-7"
          />
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold tracking-tight">WatchLLM</span>
            {APP_CONFIG.isBeta && (
              <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-violet-400 ring-1 ring-inset ring-violet-500/20">
                Beta
              </span>
            )}
          </div>
        </Link>

        {/* Dovetail-style pill navigation */}
        <nav className="hidden md:flex items-center">
          <div className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.02] p-1">
            {navLinks.map((link) => (
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

        {/* Auth Buttons + Mobile Toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3">
            <Button
              asChild
              variant="ghost"
              className="h-9 px-4 text-sm font-medium text-premium-text-muted transition-colors duration-150 hover:text-premium-text-primary hover:bg-transparent"
            >
              <Link href="/login">Log in</Link>
            </Button>
            <Button
              asChild
              className="h-9 rounded-full bg-white px-5 text-sm font-semibold text-[hsl(222_47%_4%)] transition-all duration-200 hover:bg-white/90 active:scale-[0.98]"
            >
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>

          <button
            className="flex md:hidden items-center justify-center h-9 w-9 text-premium-text-primary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/[0.06] bg-[hsl(222_47%_4%)] px-4 py-6 space-y-4"
          >
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-lg font-medium text-premium-text-secondary hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-3 pt-4 border-t border-white/[0.06]">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center h-12 rounded-xl border border-white/[0.1] text-premium-text-primary font-medium"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center h-12 rounded-xl bg-white text-[hsl(222_47%_4%)] font-bold"
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
