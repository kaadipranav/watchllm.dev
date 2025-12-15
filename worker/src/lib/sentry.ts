type CaptureContext = {
  extra?: Record<string, unknown>;
};

let sentryModule: { captureException?: (err: unknown, ctx?: CaptureContext) => void } | null = null;
let triedImport = false;

async function getSentryModule(): Promise<typeof sentryModule> {
  if (sentryModule) return sentryModule;
  if (triedImport) return null;

  triedImport = true;

  try {
    // Cloudflare-specific SDK. In non-Workers environments (e.g. Node dev server)
    // this import may fail; in that case we no-op.
    const mod = (await import('@sentry/cloudflare')) as unknown as typeof sentryModule;
    sentryModule = mod;
    return sentryModule;
  } catch {
    return null;
  }
}

export async function captureException(err: unknown, ctx?: CaptureContext): Promise<void> {
  const mod = await getSentryModule();
  try {
    mod?.captureException?.(err, ctx);
  } catch {
    // Never let observability break the request path
  }
}
