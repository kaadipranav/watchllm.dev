/**
 * Cost Forecasting Module for WatchLLM
 * Predictive analytics based on historical usage patterns
 */

import type { Env } from '../types';
import { createSupabaseClient } from './supabase';

export interface CostForecast {
    date: string;
    predictedCost: number;
    confidenceLow: number;
    confidenceHigh: number;
    trend: 'increasing' | 'decreasing' | 'stable';
}

export interface CostTrend {
    direction: 'increasing' | 'decreasing' | 'stable';
    percentage: number;
    avgDailyCost: number;
    daysOfData: number;
}

/**
 * Generate cost forecast for a project
 * Uses database function for calculation
 */
export async function generateCostForecast(
    env: Env,
    projectId: string,
    forecastDays: number = 30
): Promise<CostForecast[]> {
    const supabase = createSupabaseClient(env);

    try {
        const { data, error } = await supabase.rpc('calculate_cost_forecast', {
            p_project_id: projectId,
            p_forecast_days: forecastDays,
        });

        if (error) {
            console.error('Cost forecast error:', error);
            return [];
        }

        if (!data || !Array.isArray(data)) {
            return [];
        }

        return data.map((row: any) => ({
            date: row.forecast_date,
            predictedCost: parseFloat(row.predicted_cost),
            confidenceLow: parseFloat(row.confidence_low),
            confidenceHigh: parseFloat(row.confidence_high),
            trend: row.trend as 'increasing' | 'decreasing' | 'stable',
        }));
    } catch (error) {
        console.error('Failed to generate cost forecast:', error);
        return [];
    }
}

/**
 * Calculate simple cost trend from recent data
 * Client-side calculation for quick insights
 */
export function calculateCostTrend(
    dailyCosts: Array<{ date: string; cost: number }>
): CostTrend {
    if (dailyCosts.length === 0) {
        return {
            direction: 'stable',
            percentage: 0,
            avgDailyCost: 0,
            daysOfData: 0,
        };
    }

    // Calculate average
    const avgCost = dailyCosts.reduce((sum, d) => sum + d.cost, 0) / dailyCosts.length;

    // Simple linear regression for trend
    const n = dailyCosts.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    dailyCosts.forEach((d, i) => {
        const x = i + 1; // Day number
        const y = d.cost;
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
    });

    // Slope of regression line
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    // Determine trend
    let direction: 'increasing' | 'decreasing' | 'stable';
    const threshold = avgCost * 0.01; // 1% of average

    if (slope > threshold) {
        direction = 'increasing';
    } else if (slope < -threshold) {
        direction = 'decreasing';
    } else {
        direction = 'stable';
    }

    // Calculate percentage change
    const firstWeekAvg =
        dailyCosts.slice(0, Math.min(7, n)).reduce((sum, d) => sum + d.cost, 0) /
        Math.min(7, n);
    const lastWeekAvg =
        dailyCosts.slice(-Math.min(7, n)).reduce((sum, d) => sum + d.cost, 0) /
        Math.min(7, n);

    const percentageChange =
        firstWeekAvg > 0 ? ((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 100 : 0;

    return {
        direction,
        percentage: Math.abs(percentageChange),
        avgDailyCost: avgCost,
        daysOfData: n,
    };
}

/**
 * Estimate end-of-month cost based on current trajectory
 */
export function estimateMonthEndCost(
    monthToDateCost: number,
    daysElapsed: number,
    daysInMonth: number = 30
): {
    estimated: number;
    confidence: 'high' | 'medium' | 'low';
    daysRemaining: number;
} {
    if (daysElapsed === 0) {
        return {
            estimated: 0,
            confidence: 'low',
            daysRemaining: daysInMonth,
        };
    }

    const dailyAverage = monthToDateCost / daysElapsed;
    const estimated = dailyAverage * daysInMonth;
    const daysRemaining = daysInMonth - daysElapsed;

    // Confidence based on how much of the month has passed
    let confidence: 'high' | 'medium' | 'low';
    if (daysElapsed >= daysInMonth * 0.75) {
        confidence = 'high'; // 75%+ of month passed
    } else if (daysElapsed >= daysInMonth * 0.5) {
        confidence = 'medium'; // 50-75% of month passed
    } else {
        confidence = 'low'; // Less than 50% of month passed
    }

    return {
        estimated,
        confidence,
        daysRemaining,
    };
}

/**
 * Detect cost anomalies (sudden spikes)
 */
export function detectCostAnomalies(
    dailyCosts: Array<{ date: string; cost: number }>,
    threshold: number = 2.5 // Standard deviations
): Array<{ date: string; cost: number; deviation: number }> {
    if (dailyCosts.length < 7) {
        return []; // Need at least a week of data
    }

    // Calculate mean and standard deviation
    const costs = dailyCosts.map(d => d.cost);
    const mean = costs.reduce((sum, c) => sum + c, 0) / costs.length;
    const variance =
        costs.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / costs.length;
    const stdDev = Math.sqrt(variance);

    // Find anomalies
    const anomalies: Array<{ date: string; cost: number; deviation: number }> = [];

    dailyCosts.forEach(d => {
        const deviation = Math.abs(d.cost - mean) / stdDev;
        if (deviation > threshold) {
            anomalies.push({
                date: d.date,
                cost: d.cost,
                deviation,
            });
        }
    });

    return anomalies;
}

/**
 * Generate cost optimization recommendations
 */
export interface CostRecommendation {
    type: 'caching' | 'model' | 'usage';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    potentialSavings: number; // USD per month
}

export function generateCostRecommendations(stats: {
    avgDailyCost: number;
    cacheHitRate: number;
    topModels: Array<{ model: string; cost: number; requests: number }>;
}): CostRecommendation[] {
    const recommendations: CostRecommendation[] = [];

    // Caching recommendation
    if (stats.cacheHitRate < 30) {
        const potentialSavings = stats.avgDailyCost * 30 * 0.3; // 30% savings potential
        recommendations.push({
            type: 'caching',
            priority: 'high',
            title: 'Improve cache hit rate',
            description: `Your cache hit rate is ${stats.cacheHitRate.toFixed(1)}%. Increasing it to 50% could save ~$${potentialSavings.toFixed(2)}/month.`,
            potentialSavings,
        });
    }

    // Model recommendation
    const expensiveModels = stats.topModels.filter(m =>
        m.model.includes('gpt-4') && !m.model.includes('mini')
    );
    if (expensiveModels.length > 0) {
        const totalExpensiveCost = expensiveModels.reduce((sum, m) => sum + m.cost, 0);
        const potentialSavings = totalExpensiveCost * 0.5; // 50% savings by switching some to mini
        recommendations.push({
            type: 'model',
            priority: 'medium',
            title: 'Consider GPT-4o-mini for simple tasks',
            description: `You're spending $${totalExpensiveCost.toFixed(2)} on GPT-4. Switching 50% of requests to GPT-4o-mini could save ~$${potentialSavings.toFixed(2)}/month.`,
            potentialSavings,
        });
    }

    // Usage pattern recommendation
    if (stats.avgDailyCost > 10) {
        recommendations.push({
            type: 'usage',
            priority: 'low',
            title: 'Review usage patterns',
            description: 'Your daily spend is high. Consider implementing request batching or reducing unnecessary API calls.',
            potentialSavings: stats.avgDailyCost * 30 * 0.1, // 10% potential savings
        });
    }

    return recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
}

/**
 * Format forecast for display
 */
export function formatForecastSummary(forecasts: CostForecast[]): {
    nextWeek: number;
    nextMonth: number;
    trend: string;
    confidence: string;
} {
    if (forecasts.length === 0) {
        return {
            nextWeek: 0,
            nextMonth: 0,
            trend: 'Unknown',
            confidence: 'No data',
        };
    }

    const nextWeek = forecasts.slice(0, 7).reduce((sum, f) => sum + f.predictedCost, 0);
    const nextMonth = forecasts.reduce((sum, f) => sum + f.predictedCost, 0);

    const avgConfidenceRange =
        forecasts.reduce((sum, f) => sum + (f.confidenceHigh - f.confidenceLow), 0) /
        forecasts.length;

    let confidence: string;
    if (avgConfidenceRange < nextMonth * 0.2) {
        confidence = 'High';
    } else if (avgConfidenceRange < nextMonth * 0.5) {
        confidence = 'Medium';
    } else {
        confidence = 'Low';
    }

    const trend = forecasts[0]?.trend || 'stable';
    const trendText =
        trend === 'increasing'
            ? 'Increasing'
            : trend === 'decreasing'
                ? 'Decreasing'
                : 'Stable';

    return {
        nextWeek,
        nextMonth,
        trend: trendText,
        confidence,
    };
}
