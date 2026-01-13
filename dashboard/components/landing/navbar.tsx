"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { APP_CONFIG } from "@/lib/config";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#power-features", label: "Agent Debugger", highlight: true },
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
    { href: "#enterprise", label: "Self-Hosted" },
    { href: "/docs", label: "Docs" },
  ];

  return (
    <motion.header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-base",
        scrolled
          ? "border-b border-border-subtle bg-bg-primary/80 backdrop-blur-xl shadow-small"
          : "bg-transparent"
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" as const }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 lg:h-18 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90 duration-base"
          >
            <Image
              src="/watchllm_logo.png"
              alt="WatchLLM Logo"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold tracking-tight text-text-primary">
                WatchLLM
              </span>
              {APP_CONFIG.isBeta && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-white/10 text-white border-white/20">
                  Beta
                </Badge>
              )}
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-sm",
                  "hover:bg-white/5 transition-colors duration-base",
                  link.highlight
                    ? "text-purple-400 hover:text-purple-300"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                {link.label}
                {link.highlight && (
                  <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 rounded">
                    New
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-3">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-text-secondary hover:text-text-primary"
              >
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="!bg-white !text-black hover:!bg-white/90 border border-white/20">
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-text-secondary hover:text-text-primary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="text-xs font-bold uppercase tracking-wider">
                {mobileMenuOpen ? "Close" : "Menu"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-border-subtle bg-bg-primary"
          >
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-4 py-3 text-base font-medium text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-border-subtle grid gap-3">
                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild variant="ghost" className="w-full !bg-white !text-black hover:!bg-white/90 border border-white/20">
                  <Link href="/signup">Get Started</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
