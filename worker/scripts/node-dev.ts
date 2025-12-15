import { serve } from '@hono/node-server';
import { existsSync, readFileSync } from 'node:fs';
import app from '../src/index';
import type { Env } from '../src/types';

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function loadDotEnvLikeFile(filePath: string): void {
  if (!existsSync(filePath)) return;

  const contents = readFileSync(filePath, 'utf8');
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eq = line.indexOf('=');
    if (eq <= 0) continue;

    const key = line.slice(0, eq).trim();
    const value = stripQuotes(line.slice(eq + 1));

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

// Wrangler uses .dev.vars; load it for Node dev too.
loadDotEnvLikeFile('.dev.vars');

const env: Env = {
  SUPABASE_URL: process.env.SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ?? '',
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  APP_URL: process.env.APP_URL,
  EMAIL_TRIGGER_SECRET: process.env.EMAIL_TRIGGER_SECRET,
  SENTRY_DSN: process.env.SENTRY_DSN,
};

const port = Number(process.env.PORT ?? 8787);

serve(
  {
    port,
    fetch: (request: Request) => app.fetch(request, env),
  },
  (info: { port: number }) => {
    console.log(`WatchLLM node dev server listening on http://localhost:${info.port}`);
    console.log('Note: this is a local Node fallback (not wrangler/workerd).');
  }
);
