export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export function log(level: LogLevel, message: string, context: Record<string, unknown> = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };

  // Always log JSON for easier ingestion (Datadog, etc.)
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(entry));
}

export function maskApiKey(key?: string | null) {
  if (!key) return undefined;
  if (key.length <= 6) return `${key}***`;
  return `${key.slice(0, 6)}***`;
}