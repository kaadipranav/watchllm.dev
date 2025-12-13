"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderOpen,
  Key,
  BarChart3,
  CreditCard,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", href: "/dashboard/projects", icon: FolderOpen },
  { name: "API Keys", href: "/dashboard/api-keys", icon: Key },
  { name: "Usage", href: "/dashboard/usage", icon: BarChart3 },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="flex h-full w-[280px] flex-col bg-premium-bg-elevated border-r border-premium-border-subtle">
      {/* Premium Logo Section */}
      <div className="relative px-6 pt-8 pb-6">
        {/* Gradient backdrop with glow */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-premium-accent/10 to-transparent pointer-events-none" />
        
        {/* Logo container with glass effect */}
        <div className="relative flex flex-col items-center gap-3">
          {/* Logo with accent glow */}
          <div className="relative flex items-center justify-center w-16 h-16 rounded-premium-xl bg-premium-bg-elevated-hover border border-premium-border-subtle shadow-glow-accent transition-all duration-slow hover:scale-105 hover:shadow-glow-accent hover:border-premium-accent/50">
            <Image
              src="/watchllm_logo.png"
              alt="WatchLLM"
              width={40}
              height={40}
              className="h-10 w-10"
              priority
            />
            {/* Sparkle accent */}
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-premium-accent rounded-full flex items-center justify-center shadow-glow-accent">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
          
          {/* Brand name */}
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-2xl font-bold tracking-tight text-premium-text-primary">
              WatchLLM
            </h1>
            <p className="text-xs font-medium text-premium-accent uppercase tracking-wider">
              Cache Cost Cutter
            </p>
          </div>
        </div>
      </div>

      {/* Separator with gradient */}
      <div className="h-px mx-6 mb-6 bg-gradient-to-r from-transparent via-premium-border-subtle to-transparent" />

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1.5">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-premium-md px-3 py-2.5 text-sm font-medium transition-all duration-base relative overflow-hidden",
                isActive
                  ? "bg-premium-accent text-white shadow-glow-accent"
                  : "text-premium-text-secondary hover:text-premium-text-primary hover:bg-premium-bg-elevated-hover"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-premium-accent to-premium-accent/80 animate-fade-in" />
              )}
              
              {/* Content */}
              <div className="relative flex items-center gap-3 w-full">
                <item.icon className={cn(
                  "h-5 w-5 transition-transform duration-base",
                  isActive ? "scale-110" : "group-hover:scale-110"
                )} />
                <span className="flex-1">{item.name}</span>
                
                {/* Hover indicator */}
                {!isActive && (
                  <div className="w-1 h-1 rounded-full bg-premium-accent opacity-0 group-hover:opacity-100 transition-opacity duration-base" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User section with glass effect */}
      <div className="p-4">
        <div className="glass rounded-premium-lg p-3 border border-premium-border-subtle">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-premium-md px-3 py-2 text-sm font-medium text-premium-text-secondary hover:text-premium-text-primary hover:bg-premium-bg-elevated-hover transition-all duration-base group"
          >
            <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform duration-base" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
