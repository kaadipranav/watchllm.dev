
export interface ABTestVariant {
    name: string;
    model: string;
    weight: number; // 0-100
}

export interface ABTestingConfig {
    variants: ABTestVariant[];
}

/**
 * Calculate statistical significance of A/B test results
 * Uses Chi-squared test for success rates
 */
export function calculateSignificance(
    variantA: { requests: number; successes: number },
    variantB: { requests: number; successes: number }
): {
    significant: boolean;
    pValue: number;
    confidenceLevel: number;
} {
    const n1 = variantA.requests;
    const n2 = variantB.requests;
    const p1 = variantA.successes / n1;
    const p2 = variantB.successes / n2;

    // Pooled proportion
    const p = (variantA.successes + variantB.successes) / (n1 + n2);

    // Standard error
    const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));

    // Z-score
    const z = Math.abs(p1 - p2) / se;

    // Approximate p-value (two-tailed)
    const pValue = 2 * (1 - normalCDF(z));

    // Significant if p-value < 0.05 (95% confidence)
    const significant = pValue < 0.05;
    const confidenceLevel = (1 - pValue) * 100;

    return {
        significant,
        pValue,
        confidenceLevel: Math.min(99.9, confidenceLevel),
    };
}

/**
 * Normal cumulative distribution function (approximation)
 */
function normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp((-x * x) / 2);
    const probability =
        d *
        t *
        (0.3193815 +
            t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - probability : probability;
}

export interface ABTestSummary {
    variantName: string;
    model: string;
    requests: number;
    avgCost: number;
    avgLatency: number;
    cacheHitRate: number;
    winner?: boolean;
    improvement?: string;
}

export function summarizeABTestResults(
    results: Array<{
        variant_name: string;
        model: string;
        total_requests: number;
        avg_cost_per_request: number;
        avg_latency_ms: number;
        cache_hit_rate: number;
    }>
): ABTestSummary[] {
    if (results.length === 0) return [];

    // Find best performer by cost
    const lowestCost = Math.min(...results.map(r => r.avg_cost_per_request));
    const fastestLatency = Math.min(...results.map(r => r.avg_latency_ms));

    return results.map(r => {
        const isCheapest = r.avg_cost_per_request === lowestCost;
        const isFastest = r.avg_latency_ms === fastestLatency;

        let improvement: string | undefined;
        if (isCheapest && isFastest) {
            improvement = 'Best overall (cheapest & fastest)';
        } else if (isCheapest) {
            improvement = 'Most cost-effective';
        } else if (isFastest) {
            improvement = 'Fastest response time';
        }

        return {
            variantName: r.variant_name,
            model: r.model,
            requests: r.total_requests,
            avgCost: r.avg_cost_per_request,
            avgLatency: r.avg_latency_ms,
            cacheHitRate: r.cache_hit_rate,
            winner: isCheapest || isFastest,
            improvement,
        };
    });
}
