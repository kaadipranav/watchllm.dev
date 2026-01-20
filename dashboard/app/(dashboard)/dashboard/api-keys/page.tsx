"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { APIKeyList } from "@/components/dashboard/api-key-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FolderOpen, Plus, RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface Project {
  id: string;
  name: string;
  slug: string;
}

interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  created_at: string;
  is_active: boolean;
  project_id: string;
}

import { ProviderSettings } from "@/components/dashboard/provider-settings";

function APIKeysContent() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "active";

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [projects, setProjects] = useState<Project[]>([]);
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchData = async () => {
    try {
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("id, name, slug")
        .order("name");

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      // Fetch all API keys
      const { data: keysData, error: keysError } = await supabase
        .from("api_keys")
        .select("id, name, key, last_used_at, created_at, is_active, project_id")
        .order("created_at", { ascending: false });

      if (keysError) throw keysError;
      const normalized = (keysData || []).map((k: any) => ({
        id: k.id,
        name: k.name,
        key_prefix: (k.key ?? "").slice(0, 12),
        last_used_at: k.last_used_at,
        created_at: k.created_at,
        is_active: k.is_active,
        project_id: k.project_id,
      }));
      setKeys(normalized);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync tab with URL if it changes
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && (tab === "active" || tab === "revoked" || tab === "providers")) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const filteredKeys = selectedProject === "all"
    ? keys
    : keys.filter((k) => k.project_id === selectedProject);

  const activeKeys = filteredKeys.filter((k) => k.is_active);
  const revokedKeys = filteredKeys.filter((k) => !k.is_active);

  if (loading) {
    return (
      <div className="space-y-6 p-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="space-y-8 p-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-premium-text-muted">
            Access Control
          </p>
          <h1 className="text-4xl font-bold text-premium-text-primary">API Keys</h1>
          <p className="text-lg text-premium-text-secondary">
            Manage your keys once you add a project
          </p>
        </header>
        <div className="card-premium space-y-4 text-center">
          <FolderOpen className="mx-auto h-12 w-12 text-premium-text-muted" />
          <h3 className="text-xl font-semibold text-premium-text-primary">
            No Projects Yet
          </h3>
          <p className="text-sm text-premium-text-secondary">
            Create a project before generating API keys.
          </p>
          <Button asChild className="mx-auto bg-premium-accent text-white shadow-glow-accent">
            <a href="/dashboard/projects" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Project
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 p-8">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.4em] text-premium-text-muted">
          Access Controls
        </p>
        <h1 className="text-4xl font-bold text-premium-text-primary">API Keys</h1>
        <p className="text-lg text-premium-text-secondary">
          Manage WatchLLM keys and connect your own AI provider keys (BYOK).
        </p>
        <div className="mt-3 rounded-lg border border-premium-accent/20 bg-premium-accent/5 p-4">
          <p className="text-sm text-premium-text-secondary">
            <strong className="text-premium-accent">💡 Setup Tip:</strong> To integrate WatchLLM, you&apos;ll need both an <strong>API Key</strong> and the <strong>Project ID</strong>. 
            The Project ID is displayed prominently below each key for easy copying.
          </p>
        </div>
      </header>

      <section className="space-y-5">
        <div className="flex flex-col gap-4 rounded-premium-lg border border-premium-border-subtle bg-premium-bg-elevated p-4 shadow-premium-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-sm text-premium-text-secondary">
            <span className="text-xs uppercase tracking-[0.4em] text-premium-text-muted">
              Filter
            </span>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-[220px] rounded-premium-md border border-premium-border-subtle bg-premium-bg-primary text-premium-text-primary focus:border-premium-accent/60 focus:ring-0">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent className="rounded-premium-lg border border-premium-border-subtle bg-premium-bg-primary text-premium-text-primary shadow-premium-lg">
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={fetchData}
            className="flex items-center gap-2 rounded-premium-md bg-premium-accent px-4 py-2 text-sm font-semibold text-white shadow-glow-accent transition duration-base hover:bg-premium-accent/90"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="card-premium space-y-1 bg-premium-bg-primary border border-premium-border-subtle p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-premium-text-muted">Total Keys</p>
            <p className="text-3xl font-bold text-premium-text-primary">{filteredKeys.length}</p>
          </div>
          <div className="card-premium space-y-1 bg-premium-bg-primary border border-premium-border-subtle p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-premium-text-muted">Active Keys</p>
            <p className="text-3xl font-bold text-premium-success">{activeKeys.length}</p>
          </div>
          <div className="card-premium space-y-1 bg-premium-bg-primary border border-premium-border-subtle p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-premium-text-muted">Revoked Keys</p>
            <p className="text-3xl font-bold text-premium-danger">{revokedKeys.length}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 gap-2 rounded-premium-lg border border-premium-border-subtle bg-premium-bg-elevated p-1 text-sm">
            <TabsTrigger
              value="active"
              className="rounded-[10px] bg-transparent px-4 py-2 font-semibold text-premium-text-secondary transition duration-base data-[state=active]:bg-premium-bg-primary data-[state=active]:text-premium-text-primary data-[state=active]:shadow-glow-accent"
            >
              Active Keys <Badge className="ml-2 rounded-full bg-premium-bg-primary px-2 py-0.5 text-xs text-premium-text-secondary">{activeKeys.length}</Badge>
            </TabsTrigger>
            <TabsTrigger
              value="revoked"
              className="rounded-[10px] bg-transparent px-4 py-2 font-semibold text-premium-text-secondary transition duration-base data-[state=active]:bg-premium-bg-primary data-[state=active]:text-premium-text-primary data-[state=active]:shadow-glow-accent"
            >
              Revoked <Badge className="ml-2 rounded-full bg-premium-bg-primary px-2 py-0.5 text-xs text-premium-text-secondary">{revokedKeys.length}</Badge>
            </TabsTrigger>
            <TabsTrigger
              value="providers"
              className="rounded-[10px] bg-transparent px-4 py-2 font-semibold text-premium-text-secondary transition duration-base data-[state=active]:bg-premium-bg-primary data-[state=active]:text-premium-text-primary data-[state=active]:shadow-glow-accent"
            >
              Provider Keys (BYOK)
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="active"
            className="space-y-6 rounded-premium-lg border border-premium-border-subtle bg-premium-bg-elevated p-6 shadow-premium-sm"
          >
            {selectedProject === "all" ? (
              projects.map((project) => {
                const projectKeys = activeKeys.filter((k) => k.project_id === project.id);
                if (projectKeys.length === 0) return null;
                return (
                  <div key={project.id} className="space-y-3 card-premium border border-premium-border-subtle bg-premium-bg-primary p-5">
                    <div className="flex items-center gap-2 text-sm font-medium text-premium-text-secondary">
                      <FolderOpen className="h-4 w-4 text-premium-text-muted" />
                      <span>{project.name}</span>
                    </div>
                    <APIKeyList projectId={project.id} keys={projectKeys} onRefresh={fetchData} />
                  </div>
                );
              })
            ) : (
              <APIKeyList projectId={selectedProject} keys={activeKeys} onRefresh={fetchData} />
            )}
          </TabsContent>

          <TabsContent
            value="revoked"
            className="space-y-6 rounded-premium-lg border border-premium-border-subtle bg-premium-bg-elevated p-6 shadow-premium-sm"
          >
            {revokedKeys.length === 0 ? (
              <div className="card-premium border border-premium-border-subtle bg-premium-bg-primary p-6 text-center text-sm text-premium-text-secondary">
                No revoked keys yet.
              </div>
            ) : (
              <APIKeyList projectId={selectedProject} keys={revokedKeys} onRefresh={fetchData} />
            )}
          </TabsContent>

          <TabsContent
            value="providers"
            className="space-y-6 rounded-premium-lg border border-premium-border-subtle bg-premium-bg-elevated p-6 shadow-premium-sm"
          >
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-premium-text-primary">Connect Your Providers</h3>
                <p className="text-sm text-premium-text-secondary">
                  Provide your own API keys for OpenAI, Anthropic, or Groq to use your own quotas and rates.
                </p>
              </div>
              <ProviderSettings />
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}

export default function APIKeysPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6 p-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    }>
      <APIKeysContent />
    </Suspense>
  );
}
