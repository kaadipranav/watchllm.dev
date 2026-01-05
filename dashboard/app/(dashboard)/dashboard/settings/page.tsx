"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@supabase/supabase-js";
import { ProviderSettings } from "@/components/dashboard/provider-settings";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setName(user.user_metadata?.full_name || "");
        setEmail(user.email || "");

        // Fetch projects for notification settings
        const { data: userProjects } = await supabase
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false });

        if (userProjects) {
          setProjects(userProjects);
        }
      }
    };
    getData();
  }, [supabase]);

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name },
      });

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });

      e.currentTarget.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );

    if (!confirmed) return;

    toast({
      title: "Account Deletion",
      description: "Please contact support to delete your account.",
    });
  };

  const handleUpdateProjectSettings = async (projectId: string, updates: any) => {
    // Optimistic update
    setProjects(projects.map(p =>
      p.id === projectId ? { ...p, ...updates } : p
    ));

    try {
      const { error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", projectId);

      if (error) throw error;

      toast({
        title: "Settings Updated",
        description: "Project notification settings saved.",
      });
    } catch (error: any) {
      // Revert on error
      const { data: originalProject } = await supabase.from("projects").select("*").eq("id", projectId).single();
      if (originalProject) {
        setProjects(projects.map(p =>
          p.id === projectId ? originalProject : p
        ));
      }

      toast({
        title: "Error",
        description: "Failed to update settings.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-10 p-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-premium-text-muted">Account</p>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-premium-text-primary">Settings</h1>
            <p className="max-w-2xl text-lg text-premium-text-secondary">
              Keep your profile, security, and notification preferences aligned with your premium workspace.
            </p>
          </div>
          <Button
            className="rounded-premium-md px-4 py-2 text-sm font-semibold text-white shadow-glow-accent bg-gradient-to-r from-premium-accent to-premium-accent/80"
          >
            View audit logs
          </Button>
        </div>
      </header>

      <div className="space-y-6 rounded-premium-xl border border-premium-border-subtle bg-premium-bg-primary p-6 shadow-premium-xl">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid grid-cols-2 gap-2 rounded-premium-md bg-premium-bg-primary p-1 text-[0.65rem] font-semibold uppercase tracking-[0.4em] text-premium-text-muted md:grid-cols-5 border border-premium-border-subtle">
            {[
              { value: "profile", label: "Profile" },
              { value: "security", label: "Security" },
              { value: "providers", label: "AI Providers" },
              { value: "notifications", label: "Notifications" },
              { value: "danger", label: "Danger" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-premium-md border border-transparent bg-transparent px-3 py-2 text-premium-text-muted transition duration-200 hover:border-premium-border-subtle data-[state=active]:bg-gradient-to-r data-[state=active]:from-premium-accent/80 data-[state=active]:to-premium-accent/30 data-[state=active]:text-white"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.4em] text-premium-text-muted">Profile Info</p>
              <h2 className="text-xl font-semibold text-premium-text-primary">Update your personal details</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="rounded-premium-md border border-premium-border-subtle bg-premium-bg-secondary text-premium-text-primary focus:border-premium-accent/70 focus:ring-0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="rounded-premium-md border border-premium-border-subtle bg-white/5 text-premium-text-muted"
                />
                <p className="text-xs text-premium-text-muted">
                  Contact support to change the email address associated with your account.
                </p>
              </div>
            </div>
            <Button
              onClick={handleUpdateProfile}
              disabled={loading}
              className="w-full rounded-premium-md bg-premium-accent px-5 py-2 text-sm font-semibold text-white shadow-glow-accent hover:bg-premium-accent/90 sm:w-auto"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </TabsContent>

          <TabsContent value="providers" className="space-y-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.4em] text-premium-text-muted">AI Providers</p>
              <h2 className="text-xl font-semibold text-premium-text-primary">Manage your own API keys</h2>
              <p className="text-premium-text-secondary">
                Use your own accounts with OpenAI, Anthropic, or Groq to bypass global limits and use your own rates.
              </p>
            </div>
            <ProviderSettings />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.4em] text-premium-text-muted">Security</p>
              <h2 className="text-xl font-semibold text-premium-text-primary">Keep your account secure</h2>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4 rounded-premium-xl border border-premium-border-subtle bg-premium-bg-elevated p-6 shadow-premium-sm">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  minLength={8}
                  required
                  className="rounded-premium-md border border-premium-border-subtle bg-white/5 text-premium-text-primary focus:border-premium-accent/70 focus:ring-0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  minLength={8}
                  required
                  className="rounded-premium-md border border-premium-border-subtle bg-premium-bg-secondary text-premium-text-primary focus:border-premium-accent/70 focus:ring-0"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="rounded-premium-md bg-premium-accent px-4 py-2 text-sm font-semibold text-white shadow-glow-accent hover:bg-premium-accent/90"
              >
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>

            <div className="rounded-premium-xl border border-premium-border-subtle bg-premium-bg-primary p-6 shadow-premium-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-premium-text-primary">Two-Factor Authentication</p>
                  <p className="text-sm text-premium-text-secondary">
                    Add an extra layer of security to your workspace
                  </p>
                </div>
                <Badge className="rounded-full bg-premium-bg-elevated px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-premium-text-muted">
                  Coming Soon
                </Badge>
              </div>
              <p className="mt-4 text-sm text-premium-text-secondary">
                Two-factor authentication is not enabled yet.
              </p>
              <Button
                variant="outline"
                disabled
                className="mt-4 rounded-premium-md border border-dashed border-premium-border-subtle text-premium-text-muted"
              >
                Enable 2FA (Coming Soon)
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.4em] text-premium-text-muted">Notifications</p>
              <h2 className="text-xl font-semibold text-premium-text-primary">Manage your usage alerts</h2>
              <p className="text-premium-text-secondary">
                Configure when you want to receive emails about your API usage and costs.
              </p>
            </div>

            {projects.length === 0 ? (
              <div className="rounded-premium-xl border border-premium-border-subtle bg-premium-bg-elevated p-8 text-center shadow-premium-sm">
                <p className="text-premium-text-secondary">You don't have any projects yet.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex flex-col gap-4 rounded-premium-xl border border-premium-border-subtle bg-premium-bg-elevated p-5 shadow-premium-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="text-base font-semibold text-premium-text-primary">{project.name}</p>
                          <Badge variant={project.cost_alerts_enabled !== false ? "default" : "secondary"} className="text-[10px]">
                            {project.cost_alerts_enabled !== false ? "Alerts Active" : "Alerts Paused"}
                          </Badge>
                        </div>
                        <p className="text-sm text-premium-text-secondary mt-1">
                          Receive an email when usage hits <span className="text-premium-accent font-medium">{project.cost_alert_threshold || 80}%</span> of your plan limit.
                        </p>
                      </div>
                      <Button
                        variant={project.cost_alerts_enabled !== false ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleUpdateProjectSettings(project.id, { cost_alerts_enabled: !(project.cost_alerts_enabled !== false) })}
                        className={project.cost_alerts_enabled !== false
                          ? "bg-premium-accent text-white hover:bg-premium-accent/90"
                          : "border-premium-border-subtle text-premium-text-muted"}
                      >
                        {project.cost_alerts_enabled !== false ? "Enabled" : "Disabled"}
                      </Button>
                    </div>

                    {project.cost_alerts_enabled !== false && (
                      <div className="pt-4 border-t border-premium-border-subtle">
                        <div className="grid gap-2">
                          <Label htmlFor={`threshold-${project.id}`}>Alert Threshold</Label>
                          <div className="flex items-center gap-4">
                            <Input
                              id={`threshold-${project.id}`}
                              type="number"
                              min="10"
                              max="100"
                              value={project.cost_alert_threshold || 80}
                              onChange={(e) => handleUpdateProjectSettings(project.id, { cost_alert_threshold: parseInt(e.target.value) })}
                              className="w-24 bg-white/5 border-premium-border-subtle"
                            />
                            <span className="text-sm text-premium-text-muted">% of monthly limit</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 pt-8 border-t border-premium-border-subtle space-y-4">
              <h3 className="text-lg font-medium text-premium-text-primary">Global Preferences</h3>
              <div className="flex flex-col justify-between gap-4 rounded-premium-xl border border-premium-border-subtle bg-premium-bg-elevated p-5 shadow-premium-sm">
                <div>
                  <p className="text-base font-semibold text-premium-text-primary">Weekly Reports</p>
                  <p className="text-sm text-premium-text-secondary">Receive curated insights on usage and spend every Monday</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="rounded-premium-md border border-premium-border-subtle text-premium-text-muted w-fit"
                >
                  Enabled (Coming soon)
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="danger" className="space-y-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.4em] text-premium-text-muted">Danger Zone</p>
              <h2 className="text-xl font-semibold text-premium-text-primary">Delete your account</h2>
            </div>
            <div className="rounded-premium-xl border border-destructive/40 bg-gradient-to-br from-destructive/30 via-transparent to-transparent p-6 shadow-premium-sm">
              <div className="space-y-3">
                <p className="text-sm text-premium-text-secondary">
                  Permanently delete your account and all associated data.
                  This includes projects, API keys, and usage history.
                </p>
                <p className="text-xs uppercase tracking-[0.4em] text-premium-text-muted">
                  This action cannot be undone
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                className="mt-4 rounded-premium-md px-4 py-2 text-sm font-semibold"
              >
                Delete Account
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
