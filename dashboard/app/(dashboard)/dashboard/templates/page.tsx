"use client";

import { useState, useEffect } from "react";
import { createAnalyticsClient } from "@/lib/analytics-api";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Rocket, ArrowRight, Zap, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

interface AgentTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    tags: string[];
    recommendedModels: string[];
    expectedPerformance: {
        expectedCostPerTaskUsd: number;
        expectedLatencyMs: number;
        expectedSuccessRate: number;
    };
}

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<AgentTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState<string>("");
    const [deployingId, setDeployingId] = useState<string | null>(null);
    const [deployDialogOpen, setDeployDialogOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);

    const supabase = createClient();
    const router = useRouter();
    const analyticsClient = createAnalyticsClient();
    const { toast } = useToast();

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch User's Projects for deployment
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: projectsData } = await supabase
                        .from("projects")
                        .select("id, name")
                        .order("created_at", { ascending: false });
                    setProjects(projectsData || []);
                    if (projectsData && projectsData.length > 0) {
                        setSelectedProject(projectsData[0].id);
                    }
                }

                // Fetch Templates
                const { templates } = await analyticsClient.getAgentTemplates();
                setTemplates(templates || []);
            } catch (error) {
                console.error("Failed to fetch data:", error);
                toast({
                    title: "Error",
                    description: "Failed to load templates",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, []);

    const handleDeploy = async () => {
        if (!selectedTemplate || !selectedProject) return;

        setDeployingId(selectedTemplate.id);
        try {
            await analyticsClient.deployTemplate(selectedTemplate.id, selectedProject);
            toast({
                title: "Success",
                description: "Template deployed successfully!",
            });
            setDeployDialogOpen(false);
            router.push(`/dashboard/observability/agent-runs?project_id=${selectedProject}`);
        } catch (error) {
            console.error("Deploy failed:", error);
            toast({
                title: "Error",
                description: "Failed to deploy template",
                variant: "destructive",
            });
        } finally {
            setDeployingId(null);
        }
    };

    const openDeployDialog = (template: AgentTemplate) => {
        setSelectedTemplate(template);
        setDeployDialogOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white/20" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <h1 className="text-xl font-medium tracking-tight text-white/90">Agent Templates</h1>
                    <p className="text-sm text-white/50">
                        Pre-built agent patterns optimized for cost and performance.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                    <Card key={template.id} className="flex flex-col border-white/[0.08] bg-white/[0.02]">
                        <CardHeader>
                            <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                                    {template.category}
                                </Badge>
                                {template.recommendedModels[0] && (
                                    <span className="text-xs text-white/40 font-mono">
                                        {template.recommendedModels[0]}
                                    </span>
                                )}
                            </div>
                            <CardTitle className="text-base text-white/90">{template.name}</CardTitle>
                            <CardDescription className="line-clamp-2 mt-1">
                                {template.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2 rounded bg-white/[0.03] space-y-1">
                                    <div className="text-white/40">Est. Cost</div>
                                    <div className="font-medium text-white/80">
                                        ${template.expectedPerformance.expectedCostPerTaskUsd.toFixed(4)}
                                    </div>
                                </div>
                                <div className="p-2 rounded bg-white/[0.03] space-y-1">
                                    <div className="text-white/40">Est. Latency</div>
                                    <div className="font-medium text-white/80">
                                        {template.expectedPerformance.expectedLatencyMs}ms
                                    </div>
                                </div>
                                <div className="p-2 rounded bg-white/[0.03] space-y-1">
                                    <div className="text-white/40">Success Rate</div>
                                    <div className="font-medium text-green-400">
                                        {(template.expectedPerformance.expectedSuccessRate * 100).toFixed(0)}%
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {template.tags.map(tag => (
                                    <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.05] text-white/40">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="pt-2">
                            <Button
                                className="w-full bg-white/10 hover:bg-white/20 text-white"
                                onClick={() => openDeployDialog(template)}
                            >
                                <Rocket className="mr-2 h-4 w-4" />
                                Deploy Template
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <Dialog open={deployDialogOpen} onOpenChange={setDeployDialogOpen}>
                <DialogContent className="sm:max-w-md bg-[#0A0A0A] border-white/10">
                    <DialogHeader>
                        <DialogTitle>Deploy {selectedTemplate?.name}</DialogTitle>
                        <DialogDescription>
                            Choose a project to deploy this agent template to. This will configure the monitoring and evaluation rules automatically.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <label htmlFor="project" className="text-sm text-white/60">Target Project</label>
                            <Select value={selectedProject} onValueChange={setSelectedProject}>
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                    <SelectValue placeholder="Select project" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                                    {projects.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-between">
                        <Button variant="ghost" onClick={() => setDeployDialogOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleDeploy}
                            disabled={!selectedProject || deployingId === selectedTemplate?.id}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {deployingId === selectedTemplate?.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Check className="mr-2 h-4 w-4" />
                            )}
                            Confirm Deployment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
