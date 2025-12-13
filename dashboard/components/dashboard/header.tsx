"use client";

import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export function Header() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "U";

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-premium-border-subtle bg-premium-bg-elevated/80 backdrop-blur-md px-8">
      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-premium-text-muted" />
        <Input 
          placeholder="Search projects, keys..." 
          className="pl-10 bg-premium-bg-primary border-premium-border-subtle text-premium-text-primary placeholder:text-premium-text-muted focus:border-premium-accent/50 focus:ring-premium-accent/20 transition-all duration-base"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Button 
          variant="ghost" 
          size="icon"
          className="relative h-10 w-10 hover:bg-premium-bg-elevated-hover transition-colors duration-base"
        >
          <Bell className="h-5 w-5 text-premium-text-secondary" />
          {/* Notification badge */}
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-premium-accent shadow-glow-accent" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="relative h-10 w-10 rounded-full p-0 hover:bg-premium-bg-elevated-hover transition-colors duration-base"
            >
              <Avatar className="h-9 w-9 border-2 border-premium-border-subtle hover:border-premium-accent/50 transition-colors duration-base">
                <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email || ""} />
                <AvatarFallback className="bg-premium-accent text-white text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className="w-56 bg-premium-bg-elevated border-premium-border-subtle shadow-premium-lg" 
            align="end" 
            forceMount
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold text-premium-text-primary">
                  {user?.user_metadata?.full_name || "User"}
                </p>
                <p className="text-xs text-premium-text-muted">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-premium-border-subtle" />
            <DropdownMenuItem 
              onClick={() => router.push("/dashboard/settings")}
              className="cursor-pointer text-premium-text-secondary hover:text-premium-text-primary hover:bg-premium-bg-elevated-hover focus:bg-premium-bg-elevated-hover"
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => router.push("/dashboard/billing")}
              className="cursor-pointer text-premium-text-secondary hover:text-premium-text-primary hover:bg-premium-bg-elevated-hover focus:bg-premium-bg-elevated-hover"
            >
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-premium-border-subtle" />
            <DropdownMenuItem 
              onClick={handleSignOut}
              className="cursor-pointer text-premium-danger hover:bg-premium-danger/10 focus:bg-premium-danger/10"
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
