"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { APP_CONFIG } from "@/lib/config";
import {
    Bug,
    Server,
    ArrowRight,
    Shield,
    Zap,
    Eye,
    DollarSign,
    AlertTriangle,
    Clock,
    Lock,
    Cloud,
    Database,
    CheckCircle,
} from "lucide-react";

/**
 * Power Features Section
 * 
 * Prominently showcases the two differentiating features:
 * 1. Agent Debugger - Timeline observability for AI agents
 * 2. Self-Hosted Enterprise - Complete data isolation deployment
 * 
 * Designed to stand out from regular features with:
 * - Large, immersive cards with gradient borders
 * - Interactive hover states with glassmorphism
 * - Visual mockups/previews of features
 * - Clear CTAs for each feature
 */
export function PowerFeatures() {
    return (
        <section id="power-features" className="relative py-24 overflow-hidden">
            {/* Background accent */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-primary/5 blur-[120px] rounded-full" />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Section header */}
                <motion.div
                    className="text-center max-w-3xl mx-auto mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-white/10 mb-6">
                        <Zap className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium text-white/80">Power Features</span>
                    </div>

                    <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-text-primary mb-6">
                        Built for serious teams
                    </h2>

                    <p className="text-lg text-text-secondary leading-relaxed">
                        Beyond caching: debug your AI agents step-by-step, or deploy entirely on your own infrastructure.
                    </p>
                </motion.div>

                {/* Power Feature Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Agent Debugger Card */}
                    <motion.div
                        className="group relative"
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                    >
                        {/* Gradient border effect */}
                        <div className="absolute -inset-[1px] bg-gradient-to-br from-purple-500/50 via-transparent to-cyan-500/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
                        <div className="absolute -inset-[1px] bg-gradient-to-br from-purple-500/30 via-transparent to-cyan-500/30 rounded-2xl" />

                        <div className="relative bg-bg-surface/80 backdrop-blur-xl rounded-2xl p-8 h-full border border-white/5 overflow-hidden">
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />

                            {/* Icon */}
                            <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20 mb-6">
                                <Bug className="w-7 h-7 text-purple-400" />
                            </div>

                            {/* Content */}
                            <div className="relative">
                                <h3 className="text-2xl font-bold text-text-primary mb-3">
                                    Agent Debugger
                                </h3>
                                <p className="text-text-secondary leading-relaxed mb-6">
                                    See exactly what your AI agents are doing, step by step. Track every decision,
                                    tool call, and API cost. Find loops, wasted spend, and optimization opportunities instantly.
                                </p>

                                {/* Feature preview - Timeline mockup */}
                                <div className="bg-bg-elevated/50 rounded-xl border border-border-subtle p-4 mb-6 space-y-2">
                                    <TimelineStep
                                        icon={<Eye className="w-3.5 h-3.5" />}
                                        label="User Input"
                                        detail="'Find me a pizza nearby'"
                                        color="blue"
                                    />
                                    <TimelineStep
                                        icon={<Zap className="w-3.5 h-3.5" />}
                                        label="Tool Call"
                                        detail="search_restaurants({query: 'pizza'})"
                                        color="orange"
                                        cost="$0.003"
                                    />
                                    <TimelineStep
                                        icon={<AlertTriangle className="w-3.5 h-3.5" />}
                                        label="Loop Detected"
                                        detail="Same tool called 3x — $0.012 wasted"
                                        color="red"
                                        badge="⚠️"
                                    />
                                    <TimelineStep
                                        icon={<CheckCircle className="w-3.5 h-3.5" />}
                                        label="Cached Response"
                                        detail="$0.008 saved"
                                        color="green"
                                        badge="✓"
                                    />
                                </div>

                                {/* Highlights */}
                                <div className="grid grid-cols-2 gap-3 mb-8">
                                    <Highlight icon={<Clock className="w-4 h-4" />} text="Step-by-step timeline" />
                                    <Highlight icon={<DollarSign className="w-4 h-4" />} text="Cost per decision" />
                                    <Highlight icon={<AlertTriangle className="w-4 h-4" />} text="Anomaly detection" />
                                    <Highlight icon={<Eye className="w-4 h-4" />} text="LLM explanations" />
                                </div>

                                {/* CTA */}
                                <Button
                                    asChild
                                    className="w-full sm:w-auto bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:border-purple-500/50 transition-all"
                                >
                                    <Link href="/signup">
                                        Try Agent Debugger
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Self-Hosted Enterprise Card */}
                    <motion.div
                        className="group relative"
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        {/* Gradient border effect */}
                        <div className="absolute -inset-[1px] bg-gradient-to-br from-green-500/50 via-transparent to-emerald-500/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
                        <div className="absolute -inset-[1px] bg-gradient-to-br from-green-500/30 via-transparent to-emerald-500/30 rounded-2xl" />

                        <div className="relative bg-bg-surface/80 backdrop-blur-xl rounded-2xl p-8 h-full border border-white/5 overflow-hidden">
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />

                            {/* Icon */}
                            <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/10 border border-green-500/20 mb-6">
                                <Server className="w-7 h-7 text-green-400" />
                            </div>

                            {/* Content */}
                            <div className="relative">
                                <div className="flex items-center gap-3 mb-3">
                                    <h3 className="text-2xl font-bold text-text-primary">
                                        Self-Hosted
                                    </h3>
                                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20 rounded">
                                        Enterprise
                                    </span>
                                </div>
                                <p className="text-text-secondary leading-relaxed mb-6">
                                    Deploy WatchLLM entirely inside your VPC. Zero data leaves your infrastructure.
                                    Docker-ready, offline license, works with your existing LLM keys.
                                </p>

                                {/* Infrastructure preview */}
                                <div className="bg-bg-elevated/50 rounded-xl border border-border-subtle p-4 mb-6">
                                    <div className="flex items-center justify-center gap-8 py-2">
                                        {/* Your VPC */}
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-2">
                                                <Cloud className="w-6 h-6 text-green-400" />
                                            </div>
                                            <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Your VPC</span>
                                        </div>

                                        {/* Arrow with lock */}
                                        <div className="flex flex-col items-center gap-1">
                                            <Lock className="w-4 h-4 text-green-400" />
                                            <div className="flex items-center gap-1">
                                                <div className="w-8 h-px bg-gradient-to-r from-green-500/50 to-transparent" />
                                                <div className="w-2 h-2 border-t border-r border-green-500/50 rotate-45" />
                                            </div>
                                            <span className="text-[9px] text-green-400/80">All data local</span>
                                        </div>

                                        {/* WatchLLM */}
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-2">
                                                <Database className="w-6 h-6 text-text-secondary" />
                                            </div>
                                            <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">WatchLLM</span>
                                        </div>

                                        {/* Arrow to LLM */}
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="flex items-center gap-1">
                                                <div className="w-8 h-px bg-gradient-to-r from-white/20 to-transparent" />
                                                <div className="w-2 h-2 border-t border-r border-white/20 rotate-45" />
                                            </div>
                                            <span className="text-[9px] text-text-muted">API only</span>
                                        </div>

                                        {/* LLM Providers */}
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-2">
                                                <Zap className="w-6 h-6 text-text-muted" />
                                            </div>
                                            <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">LLM APIs</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Highlights */}
                                <div className="grid grid-cols-2 gap-3 mb-8">
                                    <Highlight icon={<Shield className="w-4 h-4" />} text="100% data isolation" />
                                    <Highlight icon={<Lock className="w-4 h-4" />} text="Offline license" />
                                    <Highlight icon={<Server className="w-4 h-4" />} text="Docker-ready" />
                                    <Highlight icon={<Cloud className="w-4 h-4" />} text="Any cloud / on-prem" />
                                </div>

                                {/* Legal note */}
                                <p className="text-[11px] text-text-muted mb-4 leading-relaxed">
                                    <Shield className="w-3 h-3 inline mr-1 text-green-500/70" />
                                    WatchLLM does not claim compliance certifications — self-hosting enables you to meet your own regulatory requirements (HIPAA, SOC2, etc).
                                </p>

                                {/* CTA */}
                                <Button
                                    asChild
                                    className="w-full sm:w-auto bg-green-500/10 hover:bg-green-500/20 text-green-300 border border-green-500/30 hover:border-green-500/50 transition-all"
                                >
                                    <a href={`mailto:${APP_CONFIG.salesEmail}?subject=WatchLLM Self-Hosted Inquiry`}>
                                        Contact for Enterprise
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

// ============================================================================
// Sub-components
// ============================================================================

interface TimelineStepProps {
    icon: React.ReactNode;
    label: string;
    detail: string;
    color: "blue" | "orange" | "red" | "green" | "purple";
    cost?: string;
    badge?: string;
}

function TimelineStep({ icon, label, detail, color, cost, badge }: TimelineStepProps) {
    const colorClasses = {
        blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        red: "bg-red-500/10 text-red-400 border-red-500/20",
        green: "bg-green-500/10 text-green-400 border-green-500/20",
        purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    };

    return (
        <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-md flex items-center justify-center border ${colorClasses[color]}`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{label}</span>
                    {badge && <span className="text-[10px]">{badge}</span>}
                </div>
                <p className="text-xs text-text-secondary truncate font-mono">{detail}</p>
            </div>
            {cost && (
                <span className="text-[10px] font-mono text-text-muted">{cost}</span>
            )}
        </div>
    );
}

interface HighlightProps {
    icon: React.ReactNode;
    text: string;
}

function Highlight({ icon, text }: HighlightProps) {
    return (
        <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span className="text-text-muted">{icon}</span>
            <span>{text}</span>
        </div>
    );
}
