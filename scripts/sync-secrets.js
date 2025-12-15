const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ENV_PATH = path.join(__dirname, '..', 'dashboard', '.env.local');
const WORKER_DIR = path.join(__dirname, '..', 'worker');

const REQUIRED_KEYS = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'GROQ_API_KEY'
];

function run() {
    if (!fs.existsSync(ENV_PATH)) {
        console.error(`Error: Could not find .env.local at ${ENV_PATH}`);
        process.exit(1);
    }

    const envContent = fs.readFileSync(ENV_PATH, 'utf-8');
    console.log(`Read ${envContent.length} bytes from .env.local`);
    const envVars = {};

    envContent.split(/\r?\n/).forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return;

        // Handle 'export ' prefix often found in .env files
        line = line.replace(/^export\s+/, '');

        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            envVars[key] = value;
        }
    });

    console.log(`Found keys: ${Object.keys(envVars).join(', ')}`);

    for (const key of REQUIRED_KEYS) {
        let value = envVars[key];

        // Try NEXT_PUBLIC_ prefix fallback
        if (!value) {
            value = envVars[`NEXT_PUBLIC_${key}`];
        }

        if (value) {
            console.log(`Setting secret: ${key}...`);
            try {
                // Use execSync with input to pipe the secret to wrangler
                // We run this inside the worker directory so wrangler picks up the correct config
                execSync(`pnpm exec wrangler secret put ${key}`, {
                    cwd: WORKER_DIR,
                    input: value,
                    stdio: ['pipe', 'inherit', 'inherit'], // Pipe stdin, inherit stdout/stderr
                    encoding: 'utf-8'
                });
                console.log(`✅ Set ${key}`);
            } catch (e) {
                console.error(`❌ Failed to set ${key}:`, e.message);
            }
        } else {
            console.log(`⚠️  Skipping ${key} (not found in .env.local)`);
        }
    }
}

run();
