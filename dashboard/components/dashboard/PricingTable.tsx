'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DollarSign, Clock, AlertTriangle, ExternalLink, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModelPricing {
  provider: string;
  model: string;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  batchInputPricePerMillion?: number;
  batchOutputPricePerMillion?: number;
  cachedInputPricePerMillion?: number;
  isEmbeddingModel: boolean;
  lastVerifiedAt: Date;
  isStale: boolean;
  sourceUrl?: string;
}

interface PricingTableProps {
  pricing: ModelPricing[];
  onRefreshPricing?: () => void;
  showStaleWarning?: boolean;
}

export function PricingTable({ pricing, onRefreshPricing, showStaleWarning = true }: PricingTableProps) {
  const formatPrice = (price: number) => {
    if (price === 0) return '-';
    if (price < 0.01) return `$${price.toFixed(4)}`;
    if (price < 1) return `$${price.toFixed(3)}`;
    return `$${price.toFixed(2)}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const stalePricing = pricing.filter(p => p.isStale);
  const hasStale = stalePricing.length > 0;

  // Group by provider
  const byProvider = pricing.reduce((acc, p) => {
    if (!acc[p.provider]) acc[p.provider] = [];
    acc[p.provider].push(p);
    return acc;
  }, {} as Record<string, ModelPricing[]>);

  const providerColors: Record<string, string> = {
    openai: 'text-green-400',
    anthropic: 'text-orange-400',
    groq: 'text-blue-400',
    openrouter: 'text-purple-400',
  };

  return (
    <Card className="border-white/[0.08]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-green-400" />
            <div>
              <CardTitle className="text-base">Model Pricing</CardTitle>
              <CardDescription className="text-xs mt-1">
                Prices per 1M tokens
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasStale && (
              <Badge variant="outline" className="border-yellow-400/30 text-yellow-400">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {stalePricing.length} stale
              </Badge>
            )}
            {onRefreshPricing && (
              <Button variant="outline" size="sm" onClick={onRefreshPricing}>
                Refresh
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stale Warning */}
        {showStaleWarning && hasStale && (
          <Alert className="border-yellow-500/20 bg-yellow-500/5">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <AlertTitle className="text-sm">Some Pricing May Be Outdated</AlertTitle>
            <AlertDescription className="text-xs">
              {stalePricing.length} model{stalePricing.length > 1 ? 's have' : ' has'} pricing 
              that hasn&apos;t been verified in over 7 days. Cost estimates may differ from 
              actual charges.
            </AlertDescription>
          </Alert>
        )}

        {/* Provider Sections */}
        {Object.entries(byProvider).map(([provider, models]) => (
          <div key={provider} className="space-y-3">
            <h3 className={`text-sm font-semibold ${providerColors[provider] || 'text-white'}`}>
              {provider.charAt(0).toUpperCase() + provider.slice(1)}
            </h3>
            
            <div className="rounded-md border border-white/[0.08] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Model</TableHead>
                    <TableHead className="text-right">Input</TableHead>
                    <TableHead className="text-right">Output</TableHead>
                    <TableHead className="text-right">Batch Input</TableHead>
                    <TableHead className="text-right">Batch Output</TableHead>
                    <TableHead className="text-right">Verified</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {models.map((model) => (
                    <TableRow key={model.model}>
                      <TableCell className="font-mono text-xs">
                        <div className="flex items-center gap-2">
                          {model.model}
                          {model.isEmbeddingModel && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              Embedding
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {formatPrice(model.inputPricePerMillion)}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {formatPrice(model.outputPricePerMillion)}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {model.batchInputPricePerMillion 
                          ? formatPrice(model.batchInputPricePerMillion)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {model.batchOutputPricePerMillion 
                          ? formatPrice(model.batchOutputPricePerMillion)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {model.isStale ? (
                            <Clock className="h-3 w-3 text-yellow-400" />
                          ) : (
                            <CheckCircle className="h-3 w-3 text-green-400" />
                          )}
                          <span className={`text-xs ${model.isStale ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                            {formatDate(model.lastVerifiedAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {model.sourceUrl && (
                          <a 
                            href={model.sourceUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-white"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="pt-4 border-t border-white/[0.08]">
          <p className="text-xs text-muted-foreground">
            Prices are updated weekly and verified against official provider pricing pages.
            Batch pricing reflects the 50% discount for OpenAI&apos;s Batch API.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface PricingComparisonProps {
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  actualPrice: number;
  estimatedPrice: number;
}

export function PricingComparison({
  model,
  provider,
  inputTokens,
  outputTokens,
  actualPrice,
  estimatedPrice,
}: PricingComparisonProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(amount);
  };

  const variance = estimatedPrice - actualPrice;
  const variancePercentage = actualPrice > 0 ? (variance / actualPrice) * 100 : 0;
  const isAccurate = Math.abs(variancePercentage) < 2;

  return (
    <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-medium">{model}</p>
          <p className="text-xs text-muted-foreground">{provider}</p>
        </div>
        <Badge 
          variant="outline" 
          className={isAccurate ? 'border-green-400/30 text-green-400' : 'border-yellow-400/30 text-yellow-400'}
        >
          {isAccurate ? 'Accurate' : `${variancePercentage > 0 ? '+' : ''}${variancePercentage.toFixed(1)}%`}
        </Badge>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-muted-foreground">Tokens</p>
          <p className="text-sm font-semibold">{(inputTokens + outputTokens).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Estimated</p>
          <p className="text-sm font-semibold">{formatCurrency(estimatedPrice)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Actual</p>
          <p className="text-sm font-semibold">{formatCurrency(actualPrice)}</p>
        </div>
      </div>
    </div>
  );
}
