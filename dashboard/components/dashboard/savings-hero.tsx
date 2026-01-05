"use client";

import { memo, useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, Zap, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface SavingsHeroProps {
    totalSavings: number;
    cacheHitRate: number;
    totalRequests: number;
    apiCost: number;
    period?: string;
}

function SavingsHeroComponent({
    totalSavings,
    cacheHitRate,
    totalRequests,
    apiCost,
    period = "last 7 days",
}: SavingsHeroProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [displayedSavings, setDisplayedSavings] = useState(0);

    // Animate the savings number on load
    useEffect(() => {
        setIsVisible(true);

        // Animate the counter
        const duration = 1500;
        const steps = 60;
        const increment = totalSavings / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= totalSavings) {
                setDisplayedSavings(totalSavings);
                clearInterval(timer);
            } else {
                setDisplayedSavings(current);
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [totalSavings]);

    // Calculate potential savings if hit rate improved
    const potentialSavingsAt80 = cacheHitRate < 80
        ? (apiCost * (80 - cacheHitRate) / 100) * 0.7
        : 0;

    const savingsGrade = cacheHitRate >= 70 ? "A" : cacheHitRate >= 50 ? "B" : cacheHitRate >= 30 ? "C" : "D";
    const gradeColor = {
        A: "text-green-400",
        B: "text-yellow-400",
        C: "text-orange-400",
        D: "text-red-400",
    }[savingsGrade];

    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-green-500/10 via-transparent to-emerald-500/5 p-6 transition-all duration-700",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
        >
            {/* Background decoration */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-green-500/5 blur-3xl" />
                <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-emerald-500/5 blur-3xl" />
            </div>

            <div className="relative grid gap-6 md:grid-cols-3">
                {/* Main Savings Display */}
                <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-green-500/20 border border-green-500/30">
                            <DollarSign className="h-5 w-5 text-green-400" />
                        </div>
                        <div>
                            <p className="text-xs text-white/50 uppercase tracking-wide">Money Saved</p>
                            <p className="text-xs text-white/30">{period}</p>
                        </div>
                    </div>

                    <div className="flex items-baseline gap-3">
                        <span className="text-5xl md:text-6xl font-bold text-green-400 tabular-nums tracking-tight">
                            ${displayedSavings.toFixed(2)}
                        </span>
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                            <TrendingUp className="h-3 w-3" />
                            <span>Saved via caching</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-white/40" />
                            <span className="text-white/60">{totalRequests.toLocaleString()} requests</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-white/40" />
                            <span className="text-white/60">{cacheHitRate.toFixed(1)}% cache hit rate</span>
                        </div>
                        {apiCost > 0 && (
                            <div className="flex items-center gap-2">
                                <TrendingDown className="h-4 w-4 text-red-400/60" />
                                <span className="text-white/60">${apiCost.toFixed(2)} actual spend</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Grade & Potential */}
                <div className="flex flex-col justify-between gap-4">
                    {/* Cache Grade */}
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-center">
                        <p className="text-xs text-white/50 mb-1">Efficiency Grade</p>
                        <p className={cn("text-4xl font-bold", gradeColor)}>{savingsGrade}</p>
                        <p className="text-xs text-white/40 mt-1">
                            {cacheHitRate >= 70 ? "Excellent!" : cacheHitRate >= 50 ? "Good" : "Needs optimization"}
                        </p>
                    </div>

                    {/* Potential Savings */}
                    {potentialSavingsAt80 > 1 && (
                        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                            <p className="text-xs text-yellow-400/70 mb-1">Potential Extra Savings</p>
                            <p className="text-lg font-bold text-yellow-400">
                                +${potentialSavingsAt80.toFixed(2)}/week
                            </p>
                            <p className="text-xs text-white/40 mt-1">
                                If cache hit rate reaches 80%
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export const SavingsHero = memo(SavingsHeroComponent);
