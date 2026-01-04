import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  
  // Environment tracking
  environment: process.env.NODE_ENV || "development",
  
  // Release tracking (from package.json version)
  release: process.env.npm_package_version,
  
  // Ignore common errors
  ignoreErrors: [
    // Random plugins/extensions
    "top.GLOBALS",
    // See: http://blog.errorception.com/2012/03/tale-of-unfindable-js-error.html
    "originalCreateNotification",
    "canvas.contentDocument",
    "MyApp_RemoveAllHighlights",
    // Network errors
    "NetworkError",
    "Non-Error promise rejection captured",
  ],
  
  // Additional configuration
  beforeSend(event, hint) {
    // Filter out development errors if needed
    if (process.env.NODE_ENV === "development") {
      console.log("Sentry Event:", event);
    }
    return event;
  },
});
