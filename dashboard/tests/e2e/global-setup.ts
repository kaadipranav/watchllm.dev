import { chromium, type FullConfig, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

type EnvMap = Record<string, string>;

function loadDotEnv(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (!key) continue;
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

async function ensureE2EUser(email: string, password: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      'Missing Supabase env vars for E2E. Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const emailLower = email.toLowerCase();

  const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) {
    throw new Error(`Failed to list users: ${listError.message}`);
  }

  const existing = listData.users.find((u) => (u.email || '').toLowerCase() === emailLower);

  if (!existing) {
    const { error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError) {
      throw new Error(`Failed to create E2E user: ${createError.message}`);
    }
    return;
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
  });

  if (updateError) {
    throw new Error(`Failed to update E2E user: ${updateError.message}`);
  }
}

export default async function globalSetup(config: FullConfig) {
  // Local dev convenience: load dashboard/.env.local if present.
  // In CI, you should supply env vars directly.
  const repoRoot = path.resolve(__dirname, '../../..');
  const dashboardRoot = path.resolve(__dirname, '../..');
  loadDotEnv(path.join(dashboardRoot, '.env.local'));

  const baseURL = process.env.E2E_BASE_URL || config.projects[0]?.use?.baseURL?.toString() || 'http://localhost:3000';
  const email = process.env.E2E_EMAIL || 'e2e@watchllm.local';
  const password = process.env.E2E_PASSWORD || 'TestPassword123!';

  await ensureE2EUser(email, password);

  const authDir = path.join(dashboardRoot, '.playwright', '.auth');
  ensureDir(authDir);
  const storageStatePath = path.join(authDir, 'user.json');

  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL });

  await page.goto('/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();

  await page.waitForURL('**/dashboard', { timeout: 30_000 });
  await expect(page.getByRole('main')).toBeVisible();

  await page.context().storageState({ path: storageStatePath });
  await browser.close();

  // Write a tiny marker so tests can assert setup ran.
  fs.writeFileSync(path.join(authDir, 'README_DO_NOT_COMMIT.txt'), 'Playwright auth state lives here. Do not commit.\n', 'utf8');
}
