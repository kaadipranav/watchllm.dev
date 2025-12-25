"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Key, Check, AlertCircle, Trash2 } from "lucide-react";
import { saveProviderKey, deleteProviderKey, getActiveProviderKeys } from "@/app/actions/provider-keys";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Project {
    id: string;
    name: string;
}

interface ProviderKeyState {
    provider: "openai" | "anthropic" | "groq" | "openrouter";
    key: string;
    loading: boolean;
    isSet: boolean;
    lastUsedAt: string | null;
}

const PROVIDERS = [
    { id: "openai", name: "OpenAI", placeholder: "sk-..." },
    { id: "anthropic", name: "Anthropic", placeholder: "sk-ant-..." },
    { id: "groq", name: "Groq", placeholder: "gsk_..." },
    { id: "openrouter", name: "OpenRouter", placeholder: "sk-or-v1-..." },
] as const;

export function ProviderSettings() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<string>("");
    const [keysState, setKeysState] = useState<Record<string, ProviderKeyState>>({
        openai: { provider: "openai", key: "", loading: false, isSet: false, lastUsedAt: null },
        anthropic: { provider: "anthropic", key: "", loading: false, isSet: false, lastUsedAt: null },
        groq: { provider: "groq", key: "", loading: false, isSet: false, lastUsedAt: null },
        openrouter: { provider: "openrouter", key: "", loading: false, isSet: false, lastUsedAt: null },
    });
    const [fetching, setFetching] = useState(true);
    const supabase = createClient();
    const { toast } = useToast();

    useEffect(() => {
        async function loadProjects() {
            const { data, error } = await supabase.from("projects").select("id, name").order("name");
            if (data && data.length > 0) {
                setProjects(data);
                setSelectedProject(data[0].id);
            }
            setFetching(false);
        }
        loadProjects();
    }, []);

    useEffect(() => {
        if (!selectedProject) return;

        async function loadKeys() {
            const activeKeys = await getActiveProviderKeys(selectedProject);

            const newState = { ...keysState };
            // Reset all to not set first
            Object.keys(newState).forEach(p => {
                newState[p] = { ...newState[p], isSet: false, key: "", lastUsedAt: null };
            });

            activeKeys.forEach(k => {
                if (newState[k.provider]) {
                    newState[k.provider] = {
                        ...newState[k.provider],
                        isSet: true,
                        lastUsedAt: k.last_used_at,
                    };
                }
            });
            setKeysState(newState);
        }
        loadKeys();
    }, [selectedProject]);

    const handleSave = async (provider: "openai" | "anthropic" | "groq" | "openrouter") => {
        const key = keysState[provider].key;
        if (!key) return;

        setKeysState(prev => ({ ...prev, [provider]: { ...prev[provider], loading: true } }));

        try {
            await saveProviderKey(selectedProject, provider, key);
            toast({
                title: "Key Saved",
                description: `Your ${provider} API key has been securely encrypted and saved.`,
            });
            setKeysState(prev => ({
                ...prev,
                [provider]: { ...prev[provider], loading: false, isSet: true, key: "" }
            }));
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to save key.",
                variant: "destructive",
            });
            setKeysState(prev => ({ ...prev, [provider]: { ...prev[provider], loading: false } }));
        }
    };

    const handleDelete = async (provider: string) => {
        if (!confirm(`Are you sure you want to remove your ${provider} key? WatchLLM will fall back to the global OpenRouter pool for this provider.`)) return;

        setKeysState(prev => ({ ...prev, [provider]: { ...prev[provider], loading: true } }));

        try {
            await deleteProviderKey(selectedProject, provider);
            toast({
                title: "Key Removed",
                description: `Your ${provider} API key has been deleted.`,
            });
            setKeysState(prev => ({
                ...prev,
                [provider]: { ...prev[provider], loading: false, isSet: false, key: "" }
            }));
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete key.",
                variant: "destructive",
            });
            setKeysState(prev => ({ ...prev, [provider]: { ...prev[provider], loading: false } }));
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-premium-accent" />
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="rounded-premium-xl border border-premium-border-subtle bg-premium-bg-secondary p-8 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-premium-text-muted mb-4" />
                <h3 className="text-lg font-semibold text-premium-text-primary">No Projects Found</h3>
                <p className="text-premium-text-secondary mt-2">
                    You need to create a project before you can manage AI provider keys.
                </p>
                <Button asChild className="mt-4 bg-premium-accent">
                    <a href="/dashboard/projects">Create Project</a>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="project-select" className="text-xs uppercase tracking-widest text-premium-text-muted">Target Project</Label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                        <SelectTrigger className="w-full md:w-[300px] border-premium-border-subtle bg-premium-bg-secondary text-premium-text-primary">
                            <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                        <SelectContent className="bg-premium-bg-primary border-premium-border-subtle text-premium-text-primary">
                            {projects.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-premium-text-muted">
                        API keys are isolating per project for maximum security and billing control.
                    </p>
                </div>
            </div>

            <div className="grid gap-6">
                {PROVIDERS.map((p) => {
                    const state = keysState[p.id];
                    return (
                        <div
                            key={p.id}
                            className="rounded-premium-xl border border-premium-border-subtle bg-premium-bg-elevated p-6 shadow-premium-sm transition-all hover:border-premium-accent/30"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-premium-bg-secondary border border-premium-border-subtle">
                                        <Key className="h-5 w-5 text-premium-accent" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-premium-text-primary">{p.name}</h3>
                                        <div className="flex items-center gap-2">
                                            {state.isSet ? (
                                                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-premium-success">
                                                    <Check className="h-3 w-3" /> Connected
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-premium-text-muted">
                                                    Not Configured
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {state.isSet && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(p.id)}
                                        disabled={state.loading}
                                        className="text-premium-text-muted hover:text-premium-danger hover:bg-premium-danger/10"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <Input
                                        type="password"
                                        placeholder={state.isSet ? "••••••••••••••••" : p.placeholder}
                                        value={state.key}
                                        onChange={(e) => setKeysState(prev => ({
                                            ...prev,
                                            [p.id]: { ...prev[p.id], key: e.target.value }
                                        }))}
                                        className="flex-1 border-premium-border-subtle bg-premium-bg-secondary text-premium-text-primary focus:border-premium-accent/60"
                                    />
                                    <Button
                                        onClick={() => handleSave(p.id)}
                                        disabled={!state.key || state.loading}
                                        className="bg-premium-accent hover:bg-premium-accent/90 shadow-glow-accent min-w-[100px]"
                                    >
                                        {state.loading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            state.isSet ? "Update" : "Connect"
                                        )}
                                    </Button>
                                </div>
                                <p className="text-[11px] text-premium-text-muted">
                                    {state.isSet
                                        ? `Encrypted at rest. Last context usage: ${state.lastUsedAt ? new Date(state.lastUsedAt).toLocaleDateString() : 'Never'}`
                                        : `Provide your own ${p.name} key to bypass the global OpenRouter pool.`
                                    }
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="rounded-premium-lg border border-violet-500/20 bg-violet-500/5 p-4">
                <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-violet-400 shrink-0" />
                    <div className="text-sm text-violet-300">
                        <p className="font-semibold mb-1">How BYOK Works</p>
                        <p>
                            When a key is provided, WatchLLM will route requests for that provider directly to their official API endpoints (or OpenRouter) using your key.
                            This allows you to use your own negotiated rates, free tiers, and avoids global rate limits. Caching and logging still apply.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
