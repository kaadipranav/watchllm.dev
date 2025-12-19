const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ENV_PATH = path.join(__dirname, '..', 'worker', '.dev.vars');
const WORKER_DIR = path.join(__dirname, '..', 'worker');

const REQUIRED_KEYS = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'OPENROUTER_API_KEY',
    'OPENAI_API_KEY', // Check this just in case user pasted OR key here
    'MONGODB_URI',
    'MONGODB_DATABASE',
    'MONGODB_COLLECTION'
];

const ENV = process.argv[2] ? `--env ${process.argv[2]}` : '';

function run() {
    if (!fs.existsSync(ENV_PATH)) {
        console.error(`Error: Could not find .dev.vars at ${ENV_PATH}`);
        process.exit(1);
    }

    const envContent = fs.readFileSync(ENV_PATH, 'utf-8');
    console.log(`Read ${envContent.length} bytes from .dev.vars`);

    const envVars = {};

    envContent.split(/\r?\n/).forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return;

        // Handle parsing strictly key=value
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
        const value = envVars[key];

        if (value) {
            console.log(`Setting secret: ${key}...`);
            try {
                execSync(`pnpm exec wrangler secret put ${key} ${ENV}`, {
                    cwd: WORKER_DIR,
                    input: value,
                    stdio: ['pipe', 'inherit', 'inherit'],
                    encoding: 'utf-8'
                });
                console.log(`✅ Set ${key}`);
            } catch (e) {
                console.error(`❌ Failed to set ${key}:`, e.message);
            }
        } else {
            console.log(`⚠️  Skipping ${key} (not found in .dev.vars)`);
        }
    }
}

run();
