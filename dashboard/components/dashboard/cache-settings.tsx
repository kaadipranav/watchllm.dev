"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { updateCacheThreshold } from "@/app/actions/cache-settings";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
  Zap,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CacheSettingsProps {
  projectId: string;
  currentThreshold: number;
  cacheStats?: {
    hitRate: number;
    totalCacheHits: number;
    totalRequests: number;
    flaggedResponses: number;
  };
  onThresholdChange?: (newThreshold: number) => void;
}

export function CacheSettings({
  projectId,
  currentThreshold,
  cacheStats,
  onThresholdChange,
}: CacheSettingsProps) {
  const [threshold, setThreshold] = useState(currentThreshold * 100);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setThreshold(currentThreshold * 100);
  }, [currentThreshold]);

  useEffect(() => {
    setHasChanges(Math.abs(threshold - currentThreshold * 100) > 0.1);
  }, [threshold, currentThreshold]);

  const getThresholdExplanation = (value: number): { text: string; type: "warning" | "info" | "success" } => {
    if (value < 88) {
      return {
        text: "Very permissive matching. Higher savings but increased risk of incorrect cached responses.",
        type: "warning",
      };
    }
    if (value < 92) {
      return {
        text: "Balanced matching. Good tradeoff between savings and accuracy for most use cases.",
        type: "info",
      };
    }
    if (value < 96) {
      return {
        text: "Strict matching. Lower savings but higher confidence in cached response accuracy.",
        type: "success",
      };
    }
    return {
      text: "Very strict matching. Only near-identical queries will hit cache. Maximum accuracy.",
      type: "success",
    };
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const newThreshold = threshold / 100;
      const result = await updateCacheThreshold(projectId, newThreshold);
      
      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Cache Settings Updated",
        description: `Similarity threshold set to ${threshold.toFixed(0)}%`,
      });

      onThresholdChange?.(newThreshold);
      setHasChanges(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update cache settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setThreshold(currentThreshold * 100);
    setHasChanges(false);
  };

  const explanation = getThresholdExplanation(threshold);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Cache Settings
            </CardTitle>
            <CardDescription>
              Configure semantic cache matching behavior
            </CardDescription>
          </div>
          {cacheStats && (
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {cacheStats.hitRate.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">
                Cache Hit Rate
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Threshold Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">
              Similarity Threshold
            </Label>
            <Badge
              variant={
                threshold < 88
                  ? "destructive"
                  : threshold < 92
                  ? "secondary"
                  : "default"
              }
              className="text-sm font-mono"
            >
              {threshold.toFixed(0)}%
            </Badge>
          </div>

          <div className="px-1">
            <Slider
              value={[threshold]}
              onValueChange={([value]) => setThreshold(value)}
              min={85}
              max={99}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>85% (Permissive)</span>
              <span>92% (Balanced)</span>
              <span>99% (Strict)</span>
            </div>
          </div>

          {/* Explanation */}
          <div
            className={cn(
              "flex items-start gap-2 p-3 rounded-lg text-sm",
              explanation.type === "warning" && "bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
              explanation.type === "info" && "bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
              explanation.type === "success" && "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200"
            )}
          >
            {explanation.type === "warning" && <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
            {explanation.type === "info" && <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />}
            {explanation.type === "success" && <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />}
            <span>{explanation.text}</span>
          </div>

          {/* Low Threshold Warning */}
          {threshold < 90 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200 text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Warning:</strong> Thresholds below 90% may return incorrect 
                cached responses. Consider using this only for non-critical applications 
                or test environments.
              </div>
            </div>
          )}
        </div>

        {/* Cache Stats */}
        {cacheStats && (
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-xl font-semibold">
                {cacheStats.totalCacheHits.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Cache Hits</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-xl font-semibold">
                {cacheStats.totalRequests.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Total Requests</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-xl font-semibold">
                {cacheStats.flaggedResponses}
              </div>
              <div className="text-xs text-muted-foreground">Flagged</div>
            </div>
          </div>
        )}

        {/* How It Works */}
        <TooltipProvider>
          <div className="pt-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  How does semantic caching work?
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-sm p-4">
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Semantic caching</strong> uses AI embeddings to find similar 
                    previous requests. When a new request is semantically similar enough 
                    to a cached one (above your threshold), the cached response is returned.
                  </p>
                  <p>
                    <strong>Higher thresholds</strong> (95%+) require near-identical requests, 
                    reducing cache hits but ensuring accuracy.
                  </p>
                  <p>
                    <strong>Lower thresholds</strong> (85-90%) match more liberally, increasing 
                    savings but risking incorrect responses.
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          {hasChanges && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={saving}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Cache Accuracy Feedback Component
interface CacheFeedbackProps {
  projectId: string;
  requestId: string;
  cachedResponse: string;
  onFeedback?: (accurate: boolean) => void;
}

export function CacheFeedback({
  projectId,
  requestId,
  cachedResponse,
  onFeedback,
}: CacheFeedbackProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<boolean | null>(null);
  const { toast } = useToast();

  const handleFeedback = async (accurate: boolean) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/cache-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          requestId,
          accurate,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      setSubmitted(accurate);
      onFeedback?.(accurate);

      toast({
        title: accurate ? "Thanks for confirming!" : "Feedback received",
        description: accurate
          ? "This helps improve cache accuracy."
          : "We'll use this to tune your threshold recommendations.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted !== null) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {submitted ? (
          <>
            <ThumbsUp className="h-4 w-4 text-green-500" />
            <span>Marked as accurate</span>
          </>
        ) : (
          <>
            <ThumbsDown className="h-4 w-4 text-red-500" />
            <span>Flagged for review</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">Was this cached response correct?</span>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFeedback(true)}
          disabled={submitting}
          className="h-8 px-2"
        >
          <ThumbsUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleFeedback(false)}
          disabled={submitting}
          className="h-8 px-2"
        >
          <ThumbsDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
