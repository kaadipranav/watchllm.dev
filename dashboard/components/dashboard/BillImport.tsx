'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
  RefreshCw
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface ReconciliationResult {
  id: string;
  provider: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  providerBilledAmount: number;
  watchllmEstimatedAmount: number;
  varianceAmount: number;
  variancePercentage: number;
  status: 'accurate' | 'minor_variance' | 'significant_variance' | 'critical_variance';
}

interface BillImportProps {
  onImport: (file: File, provider: 'openai' | 'anthropic' | 'groq') => Promise<ReconciliationResult>;
  recentReconciliations?: ReconciliationResult[];
}

export function BillImport({ onImport, recentReconciliations = [] }: BillImportProps) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ReconciliationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'anthropic' | 'groq'>('openai');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const result = await onImport(file, selectedProvider);
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import bill');
    } finally {
      setImporting(false);
    }
  }, [onImport, selectedProvider]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
    },
    maxFiles: 1,
    disabled: importing,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: ReconciliationResult['status']) => {
    switch (status) {
      case 'accurate': return 'text-green-400 border-green-400/30';
      case 'minor_variance': return 'text-yellow-400 border-yellow-400/30';
      case 'significant_variance': return 'text-orange-400 border-orange-400/30';
      case 'critical_variance': return 'text-red-400 border-red-400/30';
    }
  };

  const getStatusLabel = (status: ReconciliationResult['status']) => {
    switch (status) {
      case 'accurate': return 'Accurate (<2%)';
      case 'minor_variance': return 'Minor (2-5%)';
      case 'significant_variance': return 'Significant (5-10%)';
      case 'critical_variance': return 'Critical (>10%)';
    }
  };

  return (
    <Card className="border-white/[0.08]">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Upload className="h-5 w-5 text-blue-400" />
          <div>
            <CardTitle className="text-base">Import Provider Bill</CardTitle>
            <CardDescription className="text-xs mt-1">
              Compare actual costs with WatchLLM estimates
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Provider Selection */}
        <div className="space-y-2">
          <Label className="text-xs">Provider</Label>
          <div className="flex gap-2">
            {(['openai', 'anthropic', 'groq'] as const).map((provider) => (
              <Button
                key={provider}
                variant={selectedProvider === provider ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedProvider(provider)}
                disabled={importing}
              >
                {provider.charAt(0).toUpperCase() + provider.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${isDragActive 
              ? 'border-blue-400 bg-blue-400/10' 
              : 'border-white/[0.15] hover:border-white/[0.25]'
            }
            ${importing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            {importing ? (
              <>
                <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin" />
                <p className="text-sm">Processing bill...</p>
              </>
            ) : (
              <>
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm">
                    {isDragActive 
                      ? 'Drop the file here' 
                      : 'Drag & drop your bill export, or click to browse'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports CSV (OpenAI) or JSON (Anthropic) formats
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <Alert className="border-red-500/20 bg-red-500/5">
            <XCircle className="h-4 w-4 text-red-400" />
            <AlertTitle className="text-sm">Import Failed</AlertTitle>
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {/* Result */}
        {result && (
          <Alert className={`${
            result.status === 'accurate' ? 'border-green-500/20 bg-green-500/5' :
            result.status === 'minor_variance' ? 'border-yellow-500/20 bg-yellow-500/5' :
            result.status === 'significant_variance' ? 'border-orange-500/20 bg-orange-500/5' :
            'border-red-500/20 bg-red-500/5'
          }`}>
            {result.status === 'accurate' ? (
              <CheckCircle className="h-4 w-4 text-green-400" />
            ) : (
              <AlertTriangle className={`h-4 w-4 ${
                result.status === 'minor_variance' ? 'text-yellow-400' :
                result.status === 'significant_variance' ? 'text-orange-400' :
                'text-red-400'
              }`} />
            )}
            <AlertTitle className="text-sm">Reconciliation Complete</AlertTitle>
            <AlertDescription className="text-xs space-y-2">
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-muted-foreground">Our Estimate</p>
                  <p className="font-semibold">{formatCurrency(result.watchllmEstimatedAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Actual Bill</p>
                  <p className="font-semibold">{formatCurrency(result.providerBilledAmount)}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-white/[0.08]">
                <p className="text-muted-foreground">Variance</p>
                <p className={`font-semibold ${
                  result.status === 'accurate' ? 'text-green-400' :
                  result.status === 'minor_variance' ? 'text-yellow-400' :
                  result.status === 'significant_variance' ? 'text-orange-400' :
                  'text-red-400'
                }`}>
                  {result.variancePercentage > 0 ? '+' : ''}{result.variancePercentage.toFixed(2)}%
                  ({result.varianceAmount > 0 ? '+' : ''}{formatCurrency(result.varianceAmount)})
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Recent Reconciliations */}
        {recentReconciliations.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Recent Reconciliations</h4>
            <div className="space-y-2">
              {recentReconciliations.slice(0, 5).map((rec) => (
                <div 
                  key={rec.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={getStatusColor(rec.status)}>
                      {rec.provider}
                    </Badge>
                    <div>
                      <p className="text-xs">
                        {rec.billingPeriodStart.toLocaleDateString()} - {rec.billingPeriodEnd.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${getStatusColor(rec.status).split(' ')[0]}`}>
                      {rec.variancePercentage > 0 ? '+' : ''}{rec.variancePercentage.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getStatusLabel(rec.status)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="pt-4 border-t border-white/[0.08] space-y-3">
          <h4 className="text-sm font-medium">How to export your bill</h4>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p><strong className="text-white">OpenAI:</strong> Usage Dashboard → Export → Download CSV</p>
            <p><strong className="text-white">Anthropic:</strong> Console → Usage → Export JSON</p>
            <p><strong className="text-white">Groq:</strong> Dashboard → Billing → Export Usage</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ReconciliationSummaryCardProps {
  summary: {
    totalReconciliations: number;
    averageVariance: number;
    maxVariance: number;
    accurateCount: number;
    minorVarianceCount: number;
    significantVarianceCount: number;
    criticalVarianceCount: number;
  };
}

export function ReconciliationSummaryCard({ summary }: ReconciliationSummaryCardProps) {
  const accuracyRate = summary.totalReconciliations > 0
    ? (summary.accurateCount / summary.totalReconciliations) * 100
    : 0;

  return (
    <Card className="border-white/[0.08]">
      <CardHeader>
        <CardTitle className="text-base">Cost Accuracy Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <p className="text-xs text-muted-foreground">Accuracy Rate</p>
            <p className={`text-2xl font-bold ${accuracyRate >= 90 ? 'text-green-400' : accuracyRate >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
              {accuracyRate.toFixed(0)}%
            </p>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <p className="text-xs text-muted-foreground">Avg Variance</p>
            <p className="text-2xl font-bold">
              {summary.averageVariance.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 rounded bg-green-500/10">
            <p className="text-lg font-bold text-green-400">{summary.accurateCount}</p>
            <p className="text-[10px] text-green-400/70">&lt;2%</p>
          </div>
          <div className="text-center p-2 rounded bg-yellow-500/10">
            <p className="text-lg font-bold text-yellow-400">{summary.minorVarianceCount}</p>
            <p className="text-[10px] text-yellow-400/70">2-5%</p>
          </div>
          <div className="text-center p-2 rounded bg-orange-500/10">
            <p className="text-lg font-bold text-orange-400">{summary.significantVarianceCount}</p>
            <p className="text-[10px] text-orange-400/70">5-10%</p>
          </div>
          <div className="text-center p-2 rounded bg-red-500/10">
            <p className="text-lg font-bold text-red-400">{summary.criticalVarianceCount}</p>
            <p className="text-[10px] text-red-400/70">&gt;10%</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Based on {summary.totalReconciliations} reconciliation{summary.totalReconciliations !== 1 ? 's' : ''}
        </p>
      </CardContent>
    </Card>
  );
}
