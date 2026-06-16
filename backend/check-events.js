const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load from .env in current directory
dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function checkEvents() {
  console.log('🔍 Checking events for both tenants...\n');
  
  // Check demo tenant
  const { data: demoEvents, error: demoError } = await supabase
    .from('events')
    .select('*')
    .eq('tenant_id', 'demo');
  
  console.log('📊 DEMO tenant events:');
  if (demoError) {
    console.error('❌ Error:', demoError.message);
  } else {
    console.log(`✅ Found ${demoEvents?.length || 0} events`);
    demoEvents?.forEach(e => console.log(`  - ${e.title}`));
  }
  
  console.log('\n📊 IBAOESTE tenant events:');
  // Check ibaoeste tenant
  const { data: ibaoesteEvents, error: ibaoesteError } = await supabase
    .from('events')
    .select('*')
    .eq('tenant_id', 'ibaoeste');
  
  if (ibaoesteError) {
    console.error('❌ Error:', ibaoesteError.message);
  } else {
    console.log(`✅ Found ${ibaoesteEvents?.length || 0} events`);
    ibaoesteEvents?.forEach(e => console.log(`  - ${e.title}`));
  }
}

checkEvents().catch(console.error);
