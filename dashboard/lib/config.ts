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
    supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@watchllm.com",
    salesEmail: process.env.NEXT_PUBLIC_SALES_EMAIL || "sales@watchllm.com",

    // Social Links
    socials: {
        twitter: "https://twitter.com/watchllm",
        github: "https://github.com/watchllm",
        discord: "https://discord.gg/watchllm",
    },
};
