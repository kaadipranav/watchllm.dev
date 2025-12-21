"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
    return (
        <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[hsl(222_47%_4%)] px-6 py-24 sm:py-32 lg:px-8">
            {/* Background radial gradient */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-500/20 via-transparent to-transparent pointer-events-none" />

            {/* Grid Pattern */}
            <div className="absolute inset-0 hero-grid opacity-30 pointer-events-none" />

            <div className="relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <p className="text-sm font-bold uppercase tracking-[0.4em] text-violet-500">404 Error</p>
                    <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
                        Lost in the <span className="text-gradient-accent">latent space</span>
                    </h1>
                    <p className="mt-6 text-lg leading-7 text-premium-text-secondary max-w-lg mx-auto">
                        The page you are looking for doesn&apos;t exist or has been moved to a different dimension.
                    </p>
                </motion.div>

                <motion.div
                    className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <Button
                        asChild
                        className="h-12 rounded-full bg-white px-8 text-sm font-semibold text-[hsl(222_47%_4%)] transition-all duration-200 hover:bg-white/90"
                    >
                        <Link href="/" className="flex items-center gap-2">
                            <Home className="h-4 w-4" />
                            Return Home
                        </Link>
                    </Button>

                    <Button
                        asChild
                        variant="outline"
                        className="h-12 rounded-full border-white/[0.12] bg-transparent px-8 text-sm font-semibold text-premium-text-primary transition-all duration-200 hover:border-white/[0.2] hover:bg-white/[0.05]"
                    >
                        <button onClick={() => window.history.back()} className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Go Back
                        </button>
                    </Button>
                </motion.div>
            </div>

            {/* Decorative Blur */}
            <div className="pointer-events-none absolute -bottom-24 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-violet-600/20 blur-[120px]" />
        </main>
    );
}
