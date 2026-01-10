"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderOpen,
  Key,
  BarChart3,
  CreditCard,
  Settings,
  LogOut,
  FileText,
  ChevronDown,
  Zap,
  Activity,
  Bug,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Core navigation (outside dropdowns)
const coreNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Documentation", href: "/docs", icon: FileText },
];

// Cost Savings section (semantic caching features)
const costSavingsNavigation = [
  { name: "Projects", href: "/dashboard/projects", icon: FolderOpen },
  { name: "API Keys", href: "/dashboard/api-keys", icon: Key },
  { name: "Usage", href: "/dashboard/usage", icon: BarChart3 },
  { name: "A/B Testing", href: "/dashboard/ab-testing", icon: Zap },
];

// Observability section (monitoring & debugging)
const observabilityNavigation = [
  { name: "Requests", href: "/dashboard/observability/logs", icon: Activity },
  { name: "Analytics", href: "/dashboard/observability/analytics", icon: BarChart3 },
  { name: "Traces", href: "/dashboard/observability/traces", icon: Zap },
  { name: "Agent Debugger", href: "/dashboard/observability/agent-runs", icon: Bug },
];

function NavSection({ title, icon: Icon, items, isOpen, onToggle }: { title: string; icon: any; items: any[]; isOpen: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const hasActive = items.some(item => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)));

  return (
    <div className="space-y-1">
      <button
        onClick={onToggle}
        className={cn(
          "group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-100",
          hasActive
            ? "text-premium-text-primary bg-white/[0.06]"
            : "text-premium-text-muted hover:text-premium-text-primary hover:bg-white/[0.03]"
        )}
      >
        <div className="flex items-center gap-3">
          <Icon className={cn(
            "h-4 w-4 shrink-0",
            hasActive ? "text-premium-accent" : "text-premium-text-muted group-hover:text-premium-text-secondary"
          )} />
          <span>{title}</span>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 transition-transform duration-200",
          isOpen ? "rotate-180" : ""
        )} />
      </button>
      {isOpen && (
        <div className="space-y-0.5 pl-2">
          {items.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-100",
                  isActive
                    ? "bg-white/[0.06] text-premium-text-primary"
                    : "text-premium-text-muted hover:text-premium-text-primary hover:bg-white/[0.03]"
                )}
              >
                <item.icon className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-premium-accent" : "text-premium-text-muted group-hover:text-premium-text-secondary"
                )} />
                <span>{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-0.5 h-4 rounded-full bg-premium-accent" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [costSavingsOpen, setCostSavingsOpen] = useState(true);
  const [observabilityOpen, setObservabilityOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="flex h-full w-[240px] flex-col border-r border-white/[0.06] bg-premium-bg-primary">
      {/* Logo Section - cleaner, tighter */}
      <div className="px-5 pt-6 pb-5">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/watchllm_logo.png"
            alt="WatchLLM"
            width={28}
            height={28}
            className="h-7 w-7"
            priority
          />
          <span className="text-base font-semibold text-premium-text-primary">
            WatchLLM
          </span>
        </Link>
      </div>

      {/* Separator */}
      <div className="mx-5 h-px bg-white/[0.06]" />

      {/* Navigation - organized by sections */}
      <nav className="flex-1 px-3 py-4 space-y-3">
        {/* Core Navigation */}
        <div className="space-y-0.5">
          {coreNavigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-100",
                  isActive
                    ? "bg-white/[0.06] text-premium-text-primary"
                    : "text-premium-text-muted hover:text-premium-text-primary hover:bg-white/[0.03]"
                )}
              >
                <item.icon className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-premium-accent" : "text-premium-text-muted group-hover:text-premium-text-secondary"
                )} />
                <span>{item.name}</span>

                {isActive && (
                  <div className="ml-auto w-0.5 h-4 rounded-full bg-premium-accent" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.06]" />

        {/* Cost Savings Section */}
        <NavSection
          title="Cost Savings"
          icon={CreditCard}
          items={costSavingsNavigation}
          isOpen={costSavingsOpen}
          onToggle={() => setCostSavingsOpen(!costSavingsOpen)}
        />

        {/* Observability Section */}
        <NavSection
          title="Observability"
          icon={Activity}
          items={observabilityNavigation}
          isOpen={observabilityOpen}
          onToggle={() => setObservabilityOpen(!observabilityOpen)}
        />
      </nav>

      {/* Sign out - quieter */}
      <div className="p-3">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-premium-text-muted transition-colors duration-100 hover:text-premium-text-primary hover:bg-white/[0.03]"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
