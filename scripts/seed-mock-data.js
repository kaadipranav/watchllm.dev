#!/usr/bin/env node

/**
 * Mock Data Seeding Script
 * 
 * Creates realistic test data for screenshots and demos.
 * Only seeds data to your own account for testing purposes.
 * 
 * Usage:
 *   node scripts/seed-mock-data.js
 * 
 * This will:
 * 1. Create 2 sample projects
 * 2. Create API keys for each project
 * 3. Generate 500+ realistic usage logs with cache hits/misses
 * 4. Mix of OpenAI, Anthropic, and Groq models
 * 5. Realistic token counts and costs
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  console.error('   Make sure you have a .env.local file with these values');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Model pricing (from worker/src/lib/pricing.ts)
const PRICING = {
  openai: {
    'gpt-4o': { input: 0.000005, output: 0.000015 },
    'gpt-4-turbo': { input: 0.00001, output: 0.00003 },
    'gpt-3.5-turbo': { input: 0.0000005, output: 0.0000015 },
  },
  anthropic: {
    'claude-3-opus': { input: 0.000015, output: 0.000075 },
    'claude-3-sonnet': { input: 0.000003, output: 0.000015 },
    'claude-3-haiku': { input: 0.00000025, output: 0.00000125 },
  },
  groq: {
    'mixtral-8x7b-32768': { input: 0.00000024, output: 0.00000024 },
    'llama2-70b-4096': { input: 0.0000007, output: 0.0000009 },
  },
};

function generateAPIKey(prefix = 'proj') {
  const random = crypto.randomBytes(16).toString('hex');
  return `lgw_${prefix}_${random}`;
}

function getRandomModel() {
  const providers = Object.keys(PRICING);
  const provider = providers[Math.floor(Math.random() * providers.length)];
  const models = Object.keys(PRICING[provider]);
  const model = models[Math.floor(Math.random() * models.length)];
  return { provider, model };
}

function calculateCost(provider, model, tokens_input, tokens_output) {
  const pricing = PRICING[provider][model];
  if (!pricing) return 0;
  return (tokens_input * pricing.input) + (tokens_output * pricing.output);
}

async function seedMockData() {
  try {
    console.log('🚀 Starting mock data seed...\n');

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ You must be logged in to seed mock data');
      console.error('   Run: pnpm dev');
      console.error('   Then sign in at http://localhost:3000/signup');
      process.exit(1);
    }

    console.log(`📝 Using account: ${user.email}\n`);

    // Create projects
    console.log('📦 Creating sample projects...');
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .insert([
        {
          user_id: user.id,
          name: 'AI Chatbot API',
          plan: 'pro',
        },
        {
          user_id: user.id,
          name: 'Content Generation Service',
          plan: 'starter',
        },
      ])
      .select();

    if (projectError) {
      console.error('❌ Error creating projects:', projectError.message);
      process.exit(1);
    }

    console.log(`   ✅ Created ${projects.length} projects\n`);

    // Create API keys
    console.log('🔑 Creating API keys...');
    const apiKeysData = projects.map(project => ({
      project_id: project.id,
      key: generateAPIKey('proj'),
      name: `${project.name} Key`,
      is_active: true,
    }));

    const { data: apiKeys, error: keysError } = await supabase
      .from('api_keys')
      .insert(apiKeysData)
      .select();

    if (keysError) {
      console.error('❌ Error creating API keys:', keysError.message);
      process.exit(1);
    }

    console.log(`   ✅ Created ${apiKeys.length} API keys\n`);

    // Generate realistic usage logs
    console.log('📊 Generating usage logs...');
    const usageLogs = [];
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Generate 250 logs per API key
    for (const apiKey of apiKeys) {
      for (let i = 0; i < 250; i++) {
        // Random timestamp in last 7 days
        const randomTime = new Date(
          sevenDaysAgo.getTime() + Math.random() * (now.getTime() - sevenDaysAgo.getTime())
        );

        // 40% cache hit rate
        const isCached = Math.random() < 0.4;

        // Realistic token counts
        const tokens_input = Math.floor(Math.random() * 1500) + 100;
        const tokens_output = Math.floor(Math.random() * 800) + 50;

        const { provider, model } = getRandomModel();
        const cost = calculateCost(provider, model, tokens_input, tokens_output);

        usageLogs.push({
          project_id: apiKey.project_id,
          api_key_id: apiKey.id,
          model,
          provider,
          tokens_input,
          tokens_output,
          tokens_total: tokens_input + tokens_output,
          cost_usd: cost,
          cached: isCached,
          latency_ms: Math.floor(Math.random() * 3000) + 100,
          created_at: randomTime.toISOString(),
        });
      }
    }

    // Insert in batches of 100
    for (let i = 0; i < usageLogs.length; i += 100) {
      const batch = usageLogs.slice(i, i + 100);
      const { error } = await supabase
        .from('usage_logs')
        .insert(batch);

      if (error) {
        console.error('❌ Error inserting usage logs:', error.message);
        process.exit(1);
      }

      console.log(`   ✅ Inserted ${Math.min(i + 100, usageLogs.length)}/${usageLogs.length} logs`);
    }

    console.log('\n✨ Mock data seeded successfully!\n');

    // Print summary
    console.log('📋 Summary:');
    console.log(`   Projects: ${projects.length}`);
    console.log(`   API Keys: ${apiKeys.length}`);
    console.log(`   Usage Logs: ${usageLogs.length}`);
    console.log('\n💡 What to do next:');
    console.log('   1. Go to http://localhost:3000/dashboard');
    console.log('   2. All your projects and data will be visible');
    console.log('   3. View analytics, cache hit rates, and cost savings');
    console.log('   4. Take screenshots for your Product Hunt launch! 🚀');
    console.log('\n');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

seedMockData();
