"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProjectCard } from "@/components/dashboard/project-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Project {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  api_keys_count: number;
  requests_this_month: number;
  requests_limit: number;
  cache_hit_rate: number;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const supabase = createClient();
  const { toast } = useToast();

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform to include mock stats for now
      const projectsWithStats = (data || []).map((p) => ({
        ...p,
        api_keys_count: 0,
        requests_this_month: Math.floor(Math.random() * 50000),
        requests_limit: 50000,
        cache_hit_rate: Math.random() * 100,
      }));

      setProjects(projectsWithStats);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async () => {
    if (!newProjectName.trim()) return;

    setCreating(true);
    try {
      const slug = newProjectName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("projects").insert({
        name: newProjectName,
        slug,
        user_id: user?.id,
      });

      if (error) throw error;

      toast({
        title: "Project Created",
        description: `${newProjectName} has been created successfully.`,
      });

      setShowDialog(false);
      setNewProjectName("");
      fetchProjects();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;

      toast({
        title: "Project Deleted",
        description: "The project has been deleted.",
      });
      
      fetchProjects();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 p-8">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.4em] text-premium-text-muted">Projects</p>
        <div className="flex items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-premium-text-primary">Projects</h1>
            <p className="text-lg text-premium-text-secondary">
              Manage your projects and their API keys
            </p>
          </div>
          <Button
            onClick={() => setShowDialog(true)}
            className="flex items-center gap-2 rounded-premium-md bg-premium-accent px-5 py-2 text-sm font-semibold text-white shadow-glow-accent transition duration-base hover:bg-premium-accent/90"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </header>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-premium-text-muted" />
        <Input
          placeholder="Search projects..."
          className="pl-10 rounded-premium-md border border-premium-border-subtle bg-premium-bg-primary text-premium-text-primary focus:border-premium-accent/60 focus:ring-0"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-premium border border-premium-border-subtle bg-premium-bg-primary p-6 space-y-4 shadow-premium-sm">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="card-premium border border-premium-border-subtle bg-premium-bg-elevated p-8 text-center shadow-premium-sm">
          <p className="mb-4 text-lg text-premium-text-secondary">
            {search ? "No projects match your search." : "No projects yet. Create one to get started."}
          </p>
          {!search && (
            <Button
              onClick={() => setShowDialog(true)}
              className="flex items-center justify-center gap-2 rounded-premium-md bg-premium-accent px-4 py-2 text-sm font-semibold text-white shadow-glow-accent"
            >
              <Plus className="h-4 w-4" />
              Create Your First Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-premium-xl border border-premium-border-subtle bg-premium-bg-elevated shadow-premium-lg">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Projects help you organize your API keys and track usage separately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                placeholder="e.g., My Production App"
                className="rounded-premium-md border border-premium-border-subtle bg-premium-bg-primary text-premium-text-primary focus:border-premium-accent/60 focus:ring-0"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="rounded-premium-md border border-premium-border-subtle text-premium-text-secondary transition hover:border-premium-accent/60 hover:text-premium-text-primary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !newProjectName.trim()}
              className="rounded-premium-md bg-premium-accent text-white shadow-glow-accent hover:bg-premium-accent/90"
            >
              {creating ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
