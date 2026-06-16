const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function checkSchema() {
  console.log('🔍 Checking events table schema...\n');
  
  // Get one event to see all columns
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('📋 Columns in events table:');
    Object.keys(data[0]).forEach(col => {
      console.log(`  - ${col}: ${typeof data[0][col]} = ${data[0][col]}`);
    });
  } else {
    console.log('⚠️ No events found in table');
  }
}

checkSchema().catch(console.error);
