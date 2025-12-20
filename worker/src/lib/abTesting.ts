/**
 * A/B Testing Engine for WatchLLM
 * Enables split testing of different AI models for performance comparison
 */

import type { ABTestingConfig, ABTestVariant } from '../types';

/**
 * Select a model variant based on A/B testing configuration
 * Uses weighted random selection
 */
export function selectABTestVariant(
    config: ABTestingConfig,
    requestModel: string
): string {
    // If no variants configured, return original model
    if (!config.variants || config.variants.length === 0) {
        return requestModel;
    }

    // Calculate total weight
    const totalWeight = config.variants.reduce((sum, v) => sum + v.weight, 0);

    // If weights don't add up to 100, normalize them
    const normalizedVariants = config.variants.map(v => ({
        ...v,
        normalizedWeight: (v.weight / totalWeight) * 100,
    }));

    // Generate random number between 0-100
    const random = Math.random() * 100;

    // Select variant based on weighted probability
    let cumulativeWeight = 0;
    for (const variant of normalizedVariants) {
        cumulativeWeight += variant.normalizedWeight;
        if (random <= cumulativeWeight) {
            console.log(`A/B Test: Selected variant "${variant.name}" (${variant.model}) - weight: ${variant.weight}%`);
            return variant.model;
        }
    }

    // Fallback to last variant (shouldn't happen with proper weights)
    const fallback = config.variants[config.variants.length - 1];
    console.log(`A/B Test: Fallback to variant "${fallback.name}" (${fallback.model})`);
    return fallback.model;
}

/**
 * Validate A/B testing configuration
 */
export function validateABTestConfig(config: ABTestingConfig): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!config.variants || !Array.isArray(config.variants)) {
        errors.push('Variants must be an array');
        return { valid: false, errors };
    }

    if (config.variants.length < 2) {
        errors.push('At least 2 variants required for A/B testing');
    }

    if (config.variants.length > 5) {
        errors.push('Maximum 5 variants allowed');
    }

    // Validate each variant
    const variantNames = new Set<string>();
    let totalWeight = 0;

    for (const variant of config.variants) {
        if (!variant.name || typeof variant.name !== 'string') {
            errors.push('Each variant must have a name');
        }

        if (!variant.model || typeof variant.model !== 'string') {
            errors.push('Each variant must have a model');
        }

        if (typeof variant.weight !== 'number' || variant.weight <= 0 || variant.weight > 100) {
            errors.push(`Variant "${variant.name}" weight must be between 1-100`);
        }

        // Check for duplicate names
        if (variantNames.has(variant.name)) {
            errors.push(`Duplicate variant name: "${variant.name}"`);
        }
        variantNames.add(variant.name);

        totalWeight += variant.weight;
    }

    // Weights should add up to approximately 100 (allow small rounding errors)
    if (Math.abs(totalWeight - 100) > 0.1) {
        errors.push(`Variant weights must sum to 100 (current: ${totalWeight})`);
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Create a default A/B test configuration for common scenarios
 */
export function createDefaultABTest(scenario: 'gpt4-vs-claude' | 'speed-vs-quality'): ABTestingConfig {
    switch (scenario) {
        case 'gpt4-vs-claude':
            return {
                variants: [
                    { name: 'GPT-4', model: 'gpt-4', weight: 50 },
                    { name: 'Claude-3.5', model: 'claude-3-5-sonnet-20241022', weight: 50 },
                ],
            };

        case 'speed-vs-quality':
            return {
                variants: [
                    { name: 'Fast', model: 'gpt-4o-mini', weight: 50 },
                    { name: 'Quality', model: 'gpt-4o', weight: 50 },
                ],
            };

        default:
            return {
                variants: [
                    { name: 'Control', model: 'gpt-4o', weight: 50 },
                    { name: 'Variant', model: 'gpt-4o-mini', weight: 50 },
                ],
            };
    }
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

/**
 * Format A/B test results for display
 */
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
