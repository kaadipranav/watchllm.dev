/**
 * Comprehensive Agent Debug Data Check
 * 
 * Checks both logs and their corresponding steps
 */

const https = require('https');

const SUPABASE_URL = 'https://pcpioqczebgdhktpgxxi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjcGlvcWN6ZWJnZGhrdHBneHhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUyNTc1NCwiZXhwIjoyMDgxMTAxNzU0fQ.2NbPyklUcUuBVWie6eY1IEhHVWrhU1eemIq35SFJisc';

async function comprehensiveCheck() {
  console.log('🔍 Comprehensive Agent Debug Data Check\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Get all runs
  const logsResponse = await fetch(`${SUPABASE_URL}/rest/v1/agent_debug_logs?select=run_id,agent_name,total_steps,created_at&order=created_at.desc&limit=10`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });

  const logs = await logsResponse.json();
  console.log(`Found ${logs.length} runs:\n`);

  for (const log of logs) {
    // Check steps for this run
    const stepsResponse = await fetch(`${SUPABASE_URL}/rest/v1/agent_debug_steps?select=step_index&run_id=eq.${log.run_id}`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    });

    const steps = await stepsResponse.json();
    const status = steps.length === log.total_steps ? '✅' : '❌';

    console.log(`${status} ${log.agent_name}`);
    console.log(`   Run ID: ${log.run_id.substring(0, 13)}...`);
    console.log(`   Created: ${log.created_at}`);
    console.log(`   Expected Steps: ${log.total_steps} | Actual: ${steps.length}`);
    console.log();
  }
}

comprehensiveCheck().catch(console.error);
