'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, AlertTriangle, Clock, RefreshCw, Eye, Lock } from 'lucide-react';
import { useState } from 'react';

interface ProviderKeySecurityProps {
  keyId: string;
  provider: 'openai' | 'anthropic' | 'groq' | 'openrouter';
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
  onRotate?: () => void;
  onViewAccessLogs?: () => void;
}

export function ProviderKeySecurityCard({
  keyId,
  provider,
  name,
  createdAt,
  lastUsedAt,
  onRotate,
  onViewAccessLogs,
}: ProviderKeySecurityProps) {
  const [rotating, setRotating] = useState(false);

  const daysOld = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const daysSinceUse = lastUsedAt
    ? Math.floor((Date.now() - new Date(lastUsedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const rotationRequired = daysOld >= 90;
  const rotationWarning = daysOld >= 60 && daysOld < 90;
  const neverUsed = !lastUsedAt;
  const stale = daysSinceUse !== null && daysSinceUse >= 30;

  const handleRotate = async () => {
    if (!onRotate) return;
    setRotating(true);
    try {
      await onRotate();
    } finally {
      setRotating(false);
    }
  };

  return (
    <Card className="border-white/[0.08]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-blue-400" />
            <div>
              <CardTitle className="text-base">{name}</CardTitle>
              <CardDescription className="text-xs mt-1">
                {provider.charAt(0).toUpperCase() + provider.slice(1)} API Key
              </CardDescription>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={
              rotationRequired 
                ? 'border-red-400/30 text-red-400' 
                : rotationWarning
                ? 'border-yellow-400/30 text-yellow-400'
                : 'border-green-400/30 text-green-400'
            }
          >
            <Lock className="h-3 w-3 mr-1" />
            {rotationRequired ? 'Rotation Required' : rotationWarning ? 'Rotation Soon' : 'Secure'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Security Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Key Age</span>
            </div>
            <div className={`text-sm font-semibold ${daysOld >= 90 ? 'text-red-400' : 'text-white'}`}>
              {daysOld} days
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Last Used</span>
            </div>
            <div className={`text-sm font-semibold ${neverUsed || stale ? 'text-yellow-400' : 'text-white'}`}>
              {neverUsed ? 'Never' : daysSinceUse === 0 ? 'Today' : `${daysSinceUse} days ago`}
            </div>
          </div>
        </div>

        {/* Security Alerts */}
        {rotationRequired && (
          <Alert className="border-red-500/20 bg-red-500/5">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertTitle className="text-sm">Rotation Required</AlertTitle>
            <AlertDescription className="text-xs">
              This key is over 90 days old. For security best practices, rotate it immediately.
            </AlertDescription>
          </Alert>
        )}

        {rotationWarning && !rotationRequired && (
          <Alert className="border-yellow-500/20 bg-yellow-500/5">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <AlertTitle className="text-sm">Rotation Recommended</AlertTitle>
            <AlertDescription className="text-xs">
              This key is {daysOld} days old. Consider rotating it soon (recommended every 90 days).
            </AlertDescription>
          </Alert>
        )}

        {neverUsed && (
          <Alert className="border-blue-500/20 bg-blue-500/5">
            <AlertTriangle className="h-4 w-4 text-blue-400" />
            <AlertTitle className="text-sm">Unused Key</AlertTitle>
            <AlertDescription className="text-xs">
              This key has never been used. Consider deleting it if not needed.
            </AlertDescription>
          </Alert>
        )}

        {stale && !neverUsed && (
          <Alert className="border-yellow-500/20 bg-yellow-500/5">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <AlertTitle className="text-sm">Inactive Key</AlertTitle>
            <AlertDescription className="text-xs">
              This key hasn&apos;t been used in {daysSinceUse} days. Consider rotating or removing it.
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRotate}
            disabled={rotating || !onRotate}
            className="flex-1"
          >
            <RefreshCw className={`h-3 w-3 mr-2 ${rotating ? 'animate-spin' : ''}`} />
            {rotating ? 'Rotating...' : 'Rotate Key'}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewAccessLogs}
            disabled={!onViewAccessLogs}
            className="flex-1"
          >
            <Eye className="h-3 w-3 mr-2" />
            Access Logs
          </Button>
        </div>

        {/* Security Info */}
        <div className="pt-4 border-t border-white/[0.08]">
          <p className="text-xs text-muted-foreground">
            <strong>Security:</strong> Your key is encrypted with AES-256-GCM and never stored in plaintext. 
            All access is logged for security auditing.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
