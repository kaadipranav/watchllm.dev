import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Replay sample rate for session recordings
  replaysSessionSampleRate: 0.1,
  
  // Replay on error sample rate
  replaysOnErrorSampleRate: 1.0,
  
  // Environment tracking
  environment: process.env.NODE_ENV || "development",
  
  // Release tracking
  release: process.env.npm_package_version,
  
  // Integrations
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // Ignore common errors
  ignoreErrors: [
    // Browser extensions
    "top.GLOBALS",
    "originalCreateNotification",
    "canvas.contentDocument",
    "MyApp_RemoveAllHighlights",
    // Network errors
    "NetworkError",
    "Network request failed",
    "Failed to fetch",
    // React hydration errors (usually not critical)
    "Hydration failed",
    "Text content does not match",
  ],
  
  beforeSend(event, hint) {
    // Filter PII if needed
    if (event.request) {
      delete event.request.cookies;
    }
    return event;
  },
});
