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

      {/* Navigation - anchored active states */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navigation.map((item) => {
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
              
              {/* Active indicator bar */}
              {isActive && (
                <div className="ml-auto w-0.5 h-4 rounded-full bg-premium-accent" />
              )}
            </Link>
          );
        })}
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
