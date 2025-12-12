"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { APIKeyList } from "@/components/dashboard/api-key-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Key, FolderOpen } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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

export default function APIKeysPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { toast } = useToast();

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
        .select("*")
        .order("created_at", { ascending: false });

      if (keysError) throw keysError;
      setKeys(keysData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredKeys = selectedProject === "all"
    ? keys
    : keys.filter((k) => k.project_id === selectedProject);

  const activeKeys = filteredKeys.filter((k) => k.is_active);
  const revokedKeys = filteredKeys.filter((k) => !k.is_active);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">
            Manage your API keys for authentication
          </p>
        </div>

        <Card className="py-12">
          <CardContent className="text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create a project first to generate API keys.
            </p>
            <Button asChild>
              <a href="/dashboard/projects">
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">
            Manage your API keys for authentication
          </p>
        </div>
      </div>

      {/* Project Filter */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Filter by project:</span>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredKeys.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeKeys.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Revoked Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{revokedKeys.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Keys by Project */}
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Active <Badge variant="secondary" className="ml-2">{activeKeys.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="revoked">
            Revoked <Badge variant="secondary" className="ml-2">{revokedKeys.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {selectedProject === "all" ? (
            // Group by project
            projects.map((project) => {
              const projectKeys = activeKeys.filter((k) => k.project_id === project.id);
              if (projectKeys.length === 0) return null;
              return (
                <div key={project.id} className="mb-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    {project.name}
                  </h3>
                  <APIKeyList
                    projectId={project.id}
                    keys={projectKeys}
                    onRefresh={fetchData}
                  />
                </div>
              );
            })
          ) : (
            <APIKeyList
              projectId={selectedProject}
              keys={activeKeys}
              onRefresh={fetchData}
            />
          )}
        </TabsContent>

        <TabsContent value="revoked" className="mt-4">
          {revokedKeys.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                No revoked keys.
              </CardContent>
            </Card>
          ) : (
            <APIKeyList
              projectId={selectedProject}
              keys={revokedKeys}
              onRefresh={fetchData}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
