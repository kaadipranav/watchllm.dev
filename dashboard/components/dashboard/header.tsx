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
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[hsl(220_13%_8%)]/90 backdrop-blur-md px-6">
      {/* Search */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
        <Input 
          placeholder="Search..." 
          className="h-8 pl-9 text-sm bg-white/[0.04] border-white/[0.06] text-white/80 placeholder:text-white/30 focus:border-white/[0.12] focus:bg-white/[0.06] transition-all duration-100"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button 
          variant="ghost" 
          size="icon"
          className="relative h-8 w-8"
        >
          <Bell className="h-4 w-4 text-white/50" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-blue-400" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="relative h-8 w-8 rounded-full p-0"
            >
              <Avatar className="h-7 w-7 border border-white/[0.08]">
                <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email || ""} />
                <AvatarFallback className="bg-white/[0.08] text-white/70 text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className="w-52 bg-[hsl(220_13%_12%)] border-white/[0.08] shadow-xl" 
            align="end" 
            sideOffset={8}
          >
            <DropdownMenuLabel className="font-normal py-2">
              <div className="flex flex-col space-y-0.5">
                <p className="text-sm font-medium text-white/90">
                  {user?.user_metadata?.full_name || "User"}
                </p>
                <p className="text-xs text-white/40 truncate">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/[0.06]" />
            <DropdownMenuItem 
              onClick={() => router.push("/dashboard/settings")}
              className="text-white/70 hover:text-white hover:bg-white/[0.04] transition-colors duration-100"
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => router.push("/dashboard/billing")}
              className="text-white/70 hover:text-white hover:bg-white/[0.04] transition-colors duration-100"
            >
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/[0.06]" />
            <DropdownMenuItem 
              onClick={handleSignOut}
              className="text-red-400/80 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors duration-100"
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
