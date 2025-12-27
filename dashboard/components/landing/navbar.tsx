"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      setScrolled(window.scrollY > 50);
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
                <Badge variant="primary" className="text-[10px] px-1.5 py-0">
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
                  "text-text-secondary hover:text-text-primary",
                  "hover:bg-white/5 transition-colors duration-base"
                )}
              >
                {link.label}
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
              <Button asChild size="sm">
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="flex md:hidden items-center justify-center h-8 w-8 rounded-sm hover:bg-white/5 transition-colors text-text-primary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
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
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-border-subtle bg-bg-primary/95 backdrop-blur-xl"
          >
            <div className="px-4 py-6 space-y-4">
              {/* Navigation Links */}
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-base font-medium text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-sm transition-all"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Auth Buttons */}
              <div className="flex flex-col gap-2 pt-4 border-t border-border-subtle">
                <Button
                  asChild
                  variant="secondary"
                  className="w-full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button
                  asChild
                  className="w-full"
                  onClick={() => setMobileMenuOpen(false)}
                >
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
