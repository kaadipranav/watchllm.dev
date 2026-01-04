/**
 * Central application configuration and feature flags.
 * Values are read from environment variables to allow for easy per-environment tuning.
 */
export const APP_CONFIG = {
    // App Stage (beta, testing, production)
    stage: process.env.NEXT_PUBLIC_APP_STAGE || "beta",
    isBeta: process.env.NEXT_PUBLIC_APP_STAGE === "beta",
    isTesting: process.env.NEXT_PUBLIC_APP_STAGE === "testing",

    // Feature Flags
    showPricingComingSoon: process.env.NEXT_PUBLIC_SHOW_PRICING_COMING_SOON === "true",

    // External URLs
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://watchllm.dev",
    workerUrl: process.env.NEXT_PUBLIC_WORKER_URL || "https://api.watchllm.com",

    // Contact & Support
    supportEmail: "kiwi092020@gmail.com",
    salesEmail: "kiwi092020@gmail.com",
    developerName: "Pranav",

    // Social Links
    socials: {
        twitter: "https://twitter.com/watchllm",
        github: "https://github.com/watchllm",
        discord: "https://discord.gg/watchllm",
    },

    // Smart Defaults - "We've thought about this for you"
    defaults: {
        // Observability
        observability: {
            enabled: true, // Enable by default when provider key exists
            retention_days: 30,
            partition_by: "month",
        },
        // Caching
        cache: {
            similarity_threshold: 0.92, // 92% - aggressive enough to help
            ttl_seconds: 604800, // 7 days
            min_similarity_for_near_miss: 0.87, // Track near-misses for insights
        },
        // Alerts
        alerts: {
            cost_spike_percentage: 50,
            error_rate_threshold: 5,
            latency_warning_ms: 2000,
            latency_critical_ms: 5000,
        },
    },
};
