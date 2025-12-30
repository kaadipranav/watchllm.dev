"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Key, Check, AlertCircle, Trash2, Plus, ShieldCheck, ShieldAlert, Shield } from "lucide-react";
import { saveProviderKey, deleteProviderKey, getActiveProviderKeys } from "@/app/actions/provider-keys";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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

interface Project {
    id: string;
    name: string;
}

interface ProviderKey {
    id: string;
    name: string;
    priority: number;
    last_used_at: string | null;
    created_at: string;
}

interface ProviderState {
    provider: "openai" | "anthropic" | "groq" | "openrouter";
    keys: ProviderKey[];
    loading: boolean;
}

const PROVIDERS = [
    {
        id: "openai",
        name: "OpenAI",
        placeholder: "sk-...",
        logo: "https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg"
    },
    {
        id: "anthropic",
        name: "Anthropic",
        placeholder: "sk-ant-...",
        logo: "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/anthropic.svg"
    },
    {
        id: "groq",
        name: "Groq",
        placeholder: "gsk_...",
        logo: "https://groq.com/wp-content/uploads/2024/03/favicon.png"
    },
    {
        id: "openrouter",
        name: "OpenRouter",
        placeholder: "sk-or-v1-...",
        logo: "https://openrouter.ai/static/favicon/favicon-32x32.png"
    },
] as const;

export function ProviderSettings() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<string>("");

    // State to hold keys for each provider
    const [providerStates, setProviderStates] = useState<Record<string, ProviderState>>({
        openai: { provider: "openai", keys: [], loading: false },
        anthropic: { provider: "anthropic", keys: [], loading: false },
        groq: { provider: "groq", keys: [], loading: false },
        openrouter: { provider: "openrouter", keys: [], loading: false },
    });

    // Form state for adding new key
    const [newKeyValues, setNewKeyValues] = useState<Record<string, { key: string; name: string }>>({
        openai: { key: "", name: "" },
        anthropic: { key: "", name: "" },
        groq: { key: "", name: "" },
        openrouter: { key: "", name: "" },
    });

    const [fetching, setFetching] = useState(true);
    const supabase = createClient();
    const { toast } = useToast();

    // Load Projects
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
    }, [supabase]);

    // Load Keys when project changes
    useEffect(() => {
        if (!selectedProject) return;

        async function loadKeys() {
            const activeKeys = await getActiveProviderKeys(selectedProject);

            // Group keys by provider
            const groupedKeys: Record<string, ProviderKey[]> = {
                openai: [],
                anthropic: [],
                groq: [],
                openrouter: []
            };

            // Cast type since server action might return slightly different shape if not strictly typed
            (activeKeys as any[]).forEach(k => {
                if (groupedKeys[k.provider]) {
                    groupedKeys[k.provider].push({
                        id: k.id,
                        name: k.name || `${k.provider} Key`,
                        priority: k.priority || 1,
                        last_used_at: k.last_used_at,
                        created_at: k.created_at
                    });
                }
            });

            // Update state
            setProviderStates(prev => {
                const newState = { ...prev };
                Object.keys(newState).forEach(p => {
                    newState[p] = { ...newState[p], keys: groupedKeys[p] || [] };
                });
                return newState;
            });
        }
        loadKeys();
    }, [selectedProject]);

    const handleSaveKey = async (provider: "openai" | "anthropic" | "groq" | "openrouter") => {
        const { key, name } = newKeyValues[provider];
        if (!key) return;

        setProviderStates(prev => ({ ...prev, [provider]: { ...prev[provider], loading: true } }));

        try {
            await saveProviderKey(selectedProject, provider, key, name || undefined);

            toast({
                title: "Key Added",
                description: `Your ${provider} API key has been securely saved as priority key.`,
            });

            // Clear inputs
            setNewKeyValues(prev => ({ ...prev, [provider]: { key: "", name: "" } }));

            // Reload keys to get the new ID and updated list
            const activeKeys = await getActiveProviderKeys(selectedProject);
            const providerKeys = (activeKeys as any[])
                .filter(k => k.provider === provider)
                .map(k => ({
                    id: k.id,
                    name: k.name || `${k.provider} Key`,
                    priority: k.priority || 1,
                    last_used_at: k.last_used_at,
                    created_at: k.created_at
                }));

            setProviderStates(prev => ({
                ...prev,
                [provider]: { ...prev[provider], keys: providerKeys, loading: false }
            }));

        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to save key.",
                variant: "destructive",
            });
            setProviderStates(prev => ({ ...prev, [provider]: { ...prev[provider], loading: false } }));
        }
    };

    const handleDeleteKey = async (provider: string, keyId: string) => {
        if (!confirm("Are you sure you want to remove this key?")) return;

        setProviderStates(prev => ({ ...prev, [provider]: { ...prev[provider], loading: true } }));

        try {
            await deleteProviderKey(selectedProject, keyId);
            toast({
                title: "Key Removed",
                description: "The API key has been permanently deleted.",
            });

            // Optimistic update
            setProviderStates(prev => ({
                ...prev,
                [provider]: {
                    ...prev[provider],
                    keys: prev[provider].keys.filter(k => k.id !== keyId),
                    loading: false
                }
            }));

        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete key.",
                variant: "destructive",
            });
            setProviderStates(prev => ({ ...prev, [provider]: { ...prev[provider], loading: false } }));
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
            <div className="rounded-premium-xl border border-premium-border-subtle bg-premium-bg-elevated p-8 text-center text-white">
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
            {/* Context Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold text-premium-text-primary">Provider Configuration</h2>
                    <p className="text-sm text-premium-text-muted">
                        Connect your own API keys to bypass global limits and access direct provider pricing.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Label htmlFor="project-select" className="text-xs uppercase tracking-widest text-premium-text-muted sr-only">Target Project</Label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                        <SelectTrigger className="w-[200px] border-white/10 bg-white/5 text-premium-text-primary">
                            <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                        <SelectContent className="bg-premium-bg-elevated border-white/10 text-premium-text-primary">
                            {projects.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid gap-6">
                {PROVIDERS.map((p) => {
                    const state = providerStates[p.id];
                    const keyCount = state.keys.length;
                    const canAddMore = keyCount < 3;
                    const inputs = newKeyValues[p.id];

                    return (
                        <div
                            key={p.id}
                            className={`rounded-premium-xl border p-6 transition-all ${keyCount > 0
                                    ? 'border-premium-accent/20 bg-premium-accent/5'
                                    : 'border-premium-border-subtle bg-premium-bg-elevated'
                                }`}
                        >
                            {/* Card Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl border p-2 ${keyCount > 0 ? 'bg-premium-bg-primary border-premium-accent/30' : 'bg-premium-bg-primary border-white/5'
                                        }`}>
                                        <img
                                            src={p.logo}
                                            alt={p.name}
                                            className={`h-full w-full object-contain ${p.id === 'openai' || p.id === 'anthropic' ? 'invert opacity-90' : ''}`}
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-premium-text-primary flex items-center gap-2">
                                            {p.name}
                                            {keyCount > 0 && (
                                                <Badge variant="outline" className="border-premium-success/30 text-premium-success bg-premium-success/5 text-[10px] uppercase">
                                                    Active
                                                </Badge>
                                            )}
                                        </h3>
                                        <p className="text-xs text-premium-text-muted mt-1 flex items-center gap-1.5">
                                            <Key className="h-3 w-3" />
                                            {keyCount === 0 ? "No keys configured" : `${keyCount} / 3 keys loaded`}
                                        </p>
                                    </div>
                                </div>
                                {keyCount > 0 && (
                                    <div className="text-right">
                                        <span className="text-xs font-mono text-premium-text-muted/60">
                                            Next Priority: #{keyCount < 3 ? keyCount + 1 : '-'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Existing Keys List */}
                            {keyCount > 0 && (
                                <div className="space-y-3 mb-6">
                                    {state.keys
                                        .sort((a, b) => a.priority - b.priority)
                                        .map((key) => (
                                            <div key={key.id} className="group relative flex items-center justify-between p-3 rounded-lg bg-premium-bg-primary border border-premium-border-subtle hover:border-premium-accent/30 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${key.priority === 1 ? 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/30' :
                                                            key.priority === 2 ? 'bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/30' :
                                                                'bg-amber-900/10 text-amber-700 ring-1 ring-amber-900/30'
                                                        }`}>
                                                        #{key.priority}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-premium-text-primary">{key.name}</span>
                                                        <span className="text-[10px] text-premium-text-muted">
                                                            Added {new Date(key.created_at).toLocaleDateString()} • Used: {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteKey(p.id, key.id)}
                                                    className="h-8 w-8 text-premium-text-muted hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                </div>
                            )}

                            {/* Add New Key Form */}
                            {canAddMore ? (
                                <div className={`space-y-3 ${keyCount > 0 ? 'pt-4 border-t border-white/5' : ''}`}>
                                    {keyCount > 0 && <p className="text-xs font-semibold text-premium-text-muted uppercase tracking-wider mb-2">Add Backup Key</p>}

                                    <div className="grid md:grid-cols-[1fr,2fr,auto] gap-3 items-start">
                                        <Input
                                            placeholder="Name (e.g. Production)"
                                            value={inputs.name}
                                            onChange={(e) => setNewKeyValues(prev => ({
                                                ...prev,
                                                [p.id]: { ...prev[p.id], name: e.target.value }
                                            }))}
                                            className="bg-white/5 border-white/10 text-sm h-10 placeholder:text-white/20"
                                        />
                                        <div className="relative">
                                            <Input
                                                type="password"
                                                placeholder={p.placeholder}
                                                value={inputs.key}
                                                onChange={(e) => setNewKeyValues(prev => ({
                                                    ...prev,
                                                    [p.id]: { ...prev[p.id], key: e.target.value }
                                                }))}
                                                className="bg-white/5 border-white/10 text-sm h-10 font-mono placeholder:text-white/20 pr-10"
                                            />
                                            <ShieldCheck className="absolute right-3 top-3 h-4 w-4 text-premium-success/40 pointer-events-none" />
                                        </div>
                                        <Button
                                            onClick={() => handleSaveKey(p.id)}
                                            disabled={!inputs.key || state.loading}
                                            className="bg-premium-accent hover:bg-premium-accent/90 shadow-glow-accent h-10 px-4 whitespace-nowrap"
                                        >
                                            {state.loading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <span className="flex items-center gap-2"><Plus className="h-3 w-3" /> Add Key</span>
                                            )}
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-premium-text-muted/60 pl-1">
                                        Keys are securely encrypted with AES-256-GCM. We never store them in plain text.
                                    </p>
                                </div>
                            ) : (
                                <div className="mt-4 flex items-center gap-2 rounded-lg bg-yellow-500/10 p-3 text-xs text-yellow-500 border border-yellow-500/20">
                                    <ShieldAlert className="h-4 w-4 shrink-0" />
                                    <span>Maximum limit of 3 keys reached for this provider. Delete a key to add a new one.</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Info Footer */}
            <div className="rounded-premium-lg border border-violet-500/20 bg-violet-500/5 p-4">
                <div className="flex gap-3">
                    <Shield className="h-5 w-5 text-violet-400 shrink-0" />
                    <div className="text-sm text-violet-300">
                        <p className="font-semibold mb-1">Secure Multi-Key Management</p>
                        <p className="opacity-90 leading-relaxed">
                            WatchLLM automatically rotates through your keys based on priority (1-3).
                            If your primary key hits a rate limit or error, we instantly failover to the next available priority key
                            to ensure 100% uptime for your AI features.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
