"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, EyeOff, Server } from "lucide-react";

export default function SecurityPage() {
    const lastUpdated = "December 21, 2024";

    return (
        <div className="min-h-screen bg-[hsl(222_47%_4%)] text-premium-text-primary px-6 py-24 sm:py-32">
            <div className="mx-auto max-w-3xl">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-premium-text-muted hover:text-white transition-colors mb-12"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to home
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <ShieldCheck className="h-8 w-8 text-violet-500" />
                        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                            Security
                        </h1>
                    </div>
                    <p className="text-premium-text-muted text-sm mb-12">
                        Our commitment to protecting your AI infrastructure.
                    </p>

                    <div className="grid gap-8 mb-16">
                        <div className="flex gap-4 p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                            <Lock className="h-6 w-6 text-violet-400 shrink-0" />
                            <div>
                                <h3 className="text-white font-semibold mb-2">Encryption at Rest & Transit</h3>
                                <p className="text-sm text-premium-text-secondary">All data transmitted between your application and WatchLLM is encrypted using TLS 1.3. Sensitive information, including provider API keys, is encrypted at rest using AES-256 via Supabase Vault patterns.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                            <EyeOff className="h-6 w-6 text-violet-400 shrink-0" />
                            <div>
                                <h3 className="text-white font-semibold mb-2">Data Privacy by Design</h3>
                                <p className="text-sm text-premium-text-secondary">WatchLLM is designed as a pass-through proxy. By default, prompt and response bodies are NOT stored permanently unless you explicitly enable caching. Even then, we prioritize storing semantic hashes (embeddings) rather than raw text.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                            <Server className="h-6 w-6 text-violet-400 shrink-0" />
                            <div>
                                <h3 className="text-white font-semibold mb-2">Infrastructure Security</h3>
                                <p className="text-sm text-premium-text-secondary">Our edge workers run on Cloudflare&apos;s global network, benefiting from their industry-leading DDoS protection and isolated V8 isolates. We perform regular security audits and dependency updates.</p>
                            </div>
                        </div>
                    </div>

                    <div className="prose prose-invert max-w-none text-premium-text-secondary leading-relaxed text-sm">
                        <h2 className="text-white text-xl font-semibold mb-4">Vulnerability Disclosure</h2>
                        <p>
                            If you believe you have found a security vulnerability in WatchLLM, please report it to us at <a href="mailto:security@watchllm.com" className="text-violet-400 hover:underline">security@watchllm.com</a>. We will respond as quickly as possible.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
