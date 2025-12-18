"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const metadata: Metadata = {
  title: "Welcome to WatchLLM | Quick Onboarding",
  description: "Tell us who you are so we can personalize your WatchLLM dashboard and billing experience.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function OnboardingPage() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        router.replace("/login");
        return;
      }

      const meta = data.user.user_metadata || {};
      // If name already present, skip onboarding
      if (meta.full_name) {
        const redirect = searchParams.get("next") || "/dashboard";
        router.replace(redirect);
        return;
      }

      setFullName(meta.full_name || "");
      setCompany(meta.company || "");
      setRole(meta.role || "");
      setLoading(false);
    };

    void loadUser();
  }, [router, searchParams, supabase.auth]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          company: company.trim() || undefined,
          role: role.trim() || undefined,
        },
      });

      if (error) throw error;

      toast({
        title: "Saved",
        description: "Thanks! Your profile is set up.",
      });

      const redirect = searchParams.get("next") || "/dashboard";
      router.replace(redirect);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to save your details",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(220_13%_8%)] text-white">
        <p className="text-sm text-white/60">Loading your account…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(220_13%_8%)] px-4 py-12 text-white">
      <Card className="w-full max-w-xl bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-xl">Welcome to WatchLLM</CardTitle>
          <CardDescription className="text-white/60">
            A few quick details to personalize your dashboard and invoices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company (optional)</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company or project name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role (optional)</Label>
              <Input
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Founder, Engineer, Product, etc."
              />
            </div>

            <div className="flex items-center justify-between text-xs text-white/50">
              <span>Used for personalization and billing context.</span>
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Saving..." : "Save and continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
