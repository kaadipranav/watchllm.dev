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
import { Copy, Eye, EyeOff, Trash2, Plus } from "lucide-react";
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
  const [showKey, setShowKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    
    setLoading(true);
    try {
      const fullKey = generateAPIKey("proj");
      const keyPrefix = fullKey.slice(0, 12);
      const keyHash = await hashKey(fullKey);

      const { error } = await supabase.from("api_keys").insert({
        project_id: projectId,
        name: newKeyName,
        key_prefix: keyPrefix,
        key_hash: keyHash,
      });

      if (error) throw error;

      setCreatedKey(fullKey);
      setNewKeyName("");
      onRefresh();
      
      toast({
        title: "API Key Created",
        description: "Make sure to copy your key now. You won't be able to see it again!",
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    });
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setCreatedKey(null);
    setNewKeyName("");
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>API Keys</CardTitle>
          <Button onClick={() => setShowDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Key
          </Button>
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
                      <code className="text-sm">
                        {showKey === apiKey.id 
                          ? apiKey.key_prefix + "••••••••••••••••••••••••"
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
                          onClick={() => setShowKey(showKey === apiKey.id ? null : apiKey.id)}
                        >
                          {showKey === apiKey.id ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(apiKey.key_prefix)}
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
                ? "Make sure to copy your API key now. You won't be able to see it again!"
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
                <Button onClick={handleCreate} disabled={loading || !newKeyName.trim()}>
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

// Simple hash function for demo (use proper hashing in production)
async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
