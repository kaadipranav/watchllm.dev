/**
 * Apply Agent Debug Service Role Policies Migration
 * 
 * Runs the migration SQL directly against Supabase
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://pcpioqczebgdhktpgxxi.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjcGlvcWN6ZWJnZGhrdHBneHhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUyNTc1NCwiZXhwIjoyMDgxMTAxNzU0fQ.2NbPyklUcUuBVWie6eY1IEhHVWrhU1eemIq35SFJisc';

const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '009_agent_debug_service_role_policies.sql');
const sql = fs.readFileSync(migrationPath, 'utf-8');

async function runMigration() {
  console.log('🔄 Applying migration: 009_agent_debug_service_role_policies.sql\n');
  
  const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`);
  
  // Split SQL into statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));
  
  console.log(`Found ${statements.length} SQL statements\n`);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement) continue;
    
    console.log(`Executing statement ${i + 1}/${statements.length}...`);
    console.log(`   ${statement.substring(0, 60)}...`);
    
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: statement + ';' }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`   ❌ Failed: ${response.status} ${errorText}`);
      } else {
        console.log(`   ✅ Success`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log();
  }
  
  console.log('Migration complete!');
}

runMigration().catch(console.error);
