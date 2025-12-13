type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  userId?: string;
  action?: string;
  result?: string;
  [key: string]: unknown;
}

export function logEvent(level: LogLevel, message: string, context: LogContext = {}) {
  // Keep logs JSON-formatted for APM ingestion (Datadog, etc.)
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    })
  );
}

export function captureError(error: unknown, context: LogContext = {}) {
  logEvent("error", (error as Error)?.message || "Unknown error", context);
}