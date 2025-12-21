"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
                        Terms of Service
                    </h1>
                    <p className="text-premium-text-muted text-sm mb-12">
                        Last updated: {lastUpdated}
                    </p>

                    <div className="prose prose-invert max-w-none space-y-8 text-premium-text-secondary leading-relaxed text-sm sm:text-base">
                        <section>
                            <h2 className="text-white text-xl font-semibold mb-4">1. Acceptable Use</h2>
                            <p>
                                By using WatchLLM, you agree to use our services only for lawful purposes. You are prohibited from using our proxy to bypass security controls, perform DoS attacks, or engage in any activity that violates the terms of service of the AI providers you connect through us (e.g., OpenAI, Anthropic).
                            </p>
                        </section>

                        <section>
                            <h2 className="text-white text-xl font-semibold mb-4">2. Service Availability</h2>
                            <p>
                                While we strive for 99.9% uptime, WatchLLM is provided &quot;as is&quot; and &quot;as available.&quot; We are not responsible for downtimes caused by upstream AI providers or global infrastructure failures.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-white text-xl font-semibold mb-4">3. Fees and Payments</h2>
                            <p>
                                If you subscribe to a paid plan, you agree to pay the fees associated with that plan. All fees are non-refundable unless otherwise required by law. We reserve the right to change our pricing with 30 days notice.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-white text-xl font-semibold mb-4">4. Limitation of Liability</h2>
                            <p>
                                In no event shall WatchLLM be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, or use.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-white text-xl font-semibold mb-4">5. Termination</h2>
                            <p>
                                We reserve the right to suspend or terminate your account at any time, with or without cause, including for violations of these Terms.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
