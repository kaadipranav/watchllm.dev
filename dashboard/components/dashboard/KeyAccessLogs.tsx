'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface AccessLog {
  id: string;
  accessedAt: string;
  accessType: 'decrypt' | 'validate' | 'rotate' | 'delete';
  success: boolean;
  failureReason?: string;
  ipAddress?: string;
  requestId?: string;
}

interface KeyAccessLogsProps {
  keyName: string;
  provider: string;
  logs: AccessLog[];
  showAnomalyWarning?: boolean;
}

export function KeyAccessLogs({ keyName, provider, logs, showAnomalyWarning }: KeyAccessLogsProps) {
  const recentLogs = logs.slice(0, 50); // Show last 50 accesses
  const failedAttempts = logs.filter(log => !log.success).length;

  const getAccessTypeLabel = (type: string) => {
    switch (type) {
      case 'decrypt': return 'Key Used';
      case 'validate': return 'Validated';
      case 'rotate': return 'Rotated';
      case 'delete': return 'Deleted';
      default: return type;
    }
  };

  const getAccessTypeColor = (type: string) => {
    switch (type) {
      case 'decrypt': return 'text-blue-400';
      case 'validate': return 'text-green-400';
      case 'rotate': return 'text-yellow-400';
      case 'delete': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <Card className="border-white/[0.08]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-blue-400" />
            <div>
              <CardTitle className="text-base">Access Audit Log</CardTitle>
              <CardDescription className="text-xs mt-1">
                {keyName} ({provider})
              </CardDescription>
            </div>
          </div>
          {failedAttempts > 0 && (
            <Badge variant="outline" className="border-red-400/30 text-red-400">
              {failedAttempts} Failed Attempts
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAnomalyWarning && (
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-400">Unusual Access Pattern Detected</p>
                <p className="text-xs text-yellow-400/80 mt-1">
                  This key has experienced an unusual number of access attempts. Review the logs below and consider rotating the key.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-md border border-white/[0.08]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Request ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No access logs available
                  </TableCell>
                </TableRow>
              ) : (
                recentLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">
                      {new Date(log.accessedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium ${getAccessTypeColor(log.accessType)}`}>
                        {getAccessTypeLabel(log.accessType)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {log.success ? (
                        <div className="flex items-center gap-1 text-green-400">
                          <CheckCircle className="h-3 w-3" />
                          <span className="text-xs">Success</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-400">
                          <XCircle className="h-3 w-3" />
                          <span className="text-xs">Failed</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.ipAddress || 'N/A'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {log.requestId ? log.requestId.slice(0, 8) : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {recentLogs.length >= 50 && (
          <p className="text-xs text-muted-foreground text-center">
            Showing most recent 50 access events
          </p>
        )}
      </CardContent>
    </Card>
  );
}
