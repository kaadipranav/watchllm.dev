"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Eye, EyeOff, Trash2, Plus, Fingerprint } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { maskAPIKey, formatRelativeTime, generateAPIKey } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  created_at: string;
  is_active: boolean;
}

interface APIKeyListProps {
  projectId: string;
  keys: APIKey[];
  onRefresh: () => void;
}

export function APIKeyList({ projectId, keys, onRefresh }: APIKeyListProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Record<string,string>>({});
  const [showKeyId, setShowKeyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    
    setLoading(true);
    try {
      const fullKey = generateAPIKey("proj");
      const { error } = await supabase.from("api_keys").insert({
        project_id: projectId,
        name: newKeyName,
        key: fullKey,
      });

      if (error) throw error;

      setCreatedKey(fullKey);
      setNewKeyName("");
      onRefresh();
      
      toast({
        title: "API Key Created",
        description: "Your API key has been created — you can reveal and copy it any time from this page.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from("api_keys")
        .update({ is_active: false })
        .eq("id", keyId);

      if (error) throw error;

      onRefresh();
      toast({
        title: "API Key Deleted",
        description: "The API key has been revoked",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string, label: string = "API key") => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  const revealKey = async (keyId: string) => {
    try {
      const res = await fetch('/api/reveal-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId }),
      });
      if (!res.ok) throw new Error('Failed to reveal key');
      const json = await res.json();
      setRevealedKeys((prev) => ({ ...prev, [keyId]: json.key }));
      return json.key;
    } catch (err) {
      toast({ title: 'Error', description: 'Unable to reveal API key', variant: 'destructive' });
      return null;
    }
  };

  const revealAndCopy = async (keyId: string) => {
    let key = revealedKeys[keyId];
    if (!key) {
      key = await revealKey(keyId);
    }
    if (key) {
      copyToClipboard(key);
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setCreatedKey(null);
    setNewKeyName("");
  };

  return (
    <>
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-row items-center justify-between">
            <CardTitle>API Keys</CardTitle>
            <Button onClick={() => setShowDialog(true)} size="sm" data-sa-event="api-key-new">
              <Plus className="h-4 w-4 mr-2" />
              New Key
            </Button>
          </div>
          {/* Project ID Display - Prominent */}
          <div className="flex items-center gap-3 rounded-lg border border-premium-border-subtle bg-premium-bg-elevated p-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-premium-accent/10">
              <Fingerprint className="h-5 w-5 text-premium-accent" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-premium-text-muted">
                Project ID
              </p>
              <code className="block text-sm font-mono text-premium-text-primary">
                {projectId}
              </code>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(projectId, "Project ID")}
              className="flex items-center gap-2 border-premium-border-subtle hover:bg-premium-accent/10 hover:text-premium-accent"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No API keys yet. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((apiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell className="font-medium">{apiKey.name}</TableCell>
                    <TableCell>
                      <code className="text-sm break-all">
                        {revealedKeys[apiKey.id]
                          ? revealedKeys[apiKey.id]
                          : maskAPIKey(apiKey.key_prefix + "••••••••••••••••••••••••")
                        }
                      </code>
                    </TableCell>
                    <TableCell>
                      {apiKey.last_used_at 
                        ? formatRelativeTime(apiKey.last_used_at)
                        : "Never"
                      }
                    </TableCell>
                    <TableCell>{formatRelativeTime(apiKey.created_at)}</TableCell>
                    <TableCell>
                      <Badge variant={apiKey.is_active ? "success" : "secondary"}>
                        {apiKey.is_active ? "Active" : "Revoked"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            if (revealedKeys[apiKey.id]) {
                              // hide
                              setRevealedKeys((prev) => {
                                const copy = { ...prev };
                                delete copy[apiKey.id];
                                return copy;
                              });
                            } else {
                              await revealKey(apiKey.id);
                            }
                          }}
                        >
                          {revealedKeys[apiKey.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => revealAndCopy(apiKey.id)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {apiKey.is_active && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(apiKey.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Key Dialog */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {createdKey ? "API Key Created" : "Create New API Key"}
            </DialogTitle>
            <DialogDescription>
              {createdKey
                ? "Your API key has been created — you can reveal and copy it any time from this page."
                : "Give your API key a name to help you identify it later."
              }
            </DialogDescription>
          </DialogHeader>

          {createdKey ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <code className="text-sm break-all">{createdKey}</code>
              </div>
              <Button
                className="w-full"
                onClick={() => copyToClipboard(createdKey)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy to Clipboard
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Key Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Production API Key"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={loading || !newKeyName.trim()} data-sa-event="api-key-create">
                  {loading ? "Creating..." : "Create Key"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
