/**
 * Check Agent Debug Data in Supabase
 * 
 * Verifies that agent runs and steps are properly stored
 */

const https = require('https');

const SUPABASE_URL = 'https://pcpioqczebgdhktpgxxi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjcGlvcWN6ZWJnZGhrdHBneHhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUyNTc1NCwiZXhwIjoyMDgxMTAxNzU0fQ.2NbPyklUcUuBVWie6eY1IEhHVWrhU1eemIq35SFJisc';

async function checkData() {
  console.log('🔍 Checking Agent Debug Data in Supabase\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. Check agent_debug_logs (no user filter - just get all records)
  const logsUrl = `${SUPABASE_URL}/rest/v1/agent_debug_logs?select=run_id,agent_name,total_steps,status,user_id&order=created_at.desc&limit=5`;
  
  const logsResponse = await new Promise((resolve, reject) => {
    https.get(logsUrl, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
    }).on('error', reject);
  });

  console.log('📊 Agent Debug Logs Table:');
  console.log(`   Status: ${logsResponse.status}`);
  console.log(`   Records: ${logsResponse.data.length}\n`);
  
  if (logsResponse.data.length > 0) {
    logsResponse.data.forEach((log, i) => {
      console.log(`   ${i + 1}. ${log.agent_name}`);
      console.log(`      Run ID: ${log.run_id}`);
      console.log(`      Status: ${log.status}`);
      console.log(`      Total Steps: ${log.total_steps}`);
      console.log();
    });
  }

  // 2. Check agent_debug_steps for the first run
  if (logsResponse.data.length > 0) {
    const firstRunId = logsResponse.data[0].run_id;
    
    const stepsUrl = `${SUPABASE_URL}/rest/v1/agent_debug_steps?select=step_index,type,summary&run_id=eq.${firstRunId}&order=step_index.asc`;
    
    console.log(`   Fetching steps for run: ${firstRunId}`);
    
    const stepsResponse = await new Promise((resolve, reject) => {
      https.get(stepsUrl, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
      }).on('error', reject);
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 Agent Debug Steps Table (for first run):');
    console.log(`   Status: ${stepsResponse.status}`);
    console.log(`   Records: ${stepsResponse.data.length}\n`);
    
    if (stepsResponse.data.length > 0) {
      stepsResponse.data.forEach((step) => {
        console.log(`   Step ${step.step_index}: ${step.type}`);
        if (step.summary) {
          console.log(`      ${step.summary.substring(0, 60)}${step.summary.length > 60 ? '...' : ''}`);
        }
      });
    } else {
      console.log('   ❌ NO STEPS FOUND - This is the problem!');
      console.log('   The agent_debug_logs table has a record saying there are steps,');
      console.log('   but the agent_debug_steps table is empty.');
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

checkData().catch(console.error);
