'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Zap, Search } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function TracesPage() {
  const [traces, setTraces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // TODO: Fetch from /v1/analytics/traces or /v1/analytics/event/:eventId endpoints
    setLoading(false);
  }, []);

  return (
    <div className="space-y-10 p-8">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.4em] text-premium-text-muted">
          Observability
        </p>
        <h1 className="text-4xl font-bold text-premium-text-primary">Traces</h1>
        <p className="text-lg text-premium-text-secondary">
          Detailed view of individual requests with tool calls and execution flow.
        </p>
      </header>

      <section className="space-y-5">

      <Alert className="border-white/[0.08] bg-white/[0.02]">
        <AlertTitle className="text-xs uppercase tracking-wide">Needs an active provider key</AlertTitle>
        <AlertDescription className="text-xs text-white/70">
          Traces stream only after you save at least one provider API key per project. ClickHouse retention policies keep your observability data under control even at higher volumes.
        </AlertDescription>
      </Alert>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Trace
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by run ID, user ID, or request..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Traces List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Recent Traces
          </CardTitle>
          <CardDescription>
            Execution traces from your AI applications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading traces...</div>
          ) : traces.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No traces found. Check back after running some requests.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Traces will be rendered here */}
            </div>
          )}
        </CardContent>
      </Card>
      </section>
    </div>
  );
}
