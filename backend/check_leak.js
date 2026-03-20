const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDemoLeak() {
  const tables = ['events', 'facilities', 'programs', 'achievements'];
  for (const table of tables) {
    const { data } = await supabase.from(table).select('*').eq('tenant_id', 'demo');
    console.log(`[demo] table ${table} has ${data?.length || 0} rows`);
    if (data?.length > 0) {
        console.log(`  SAMPLE: ${data[0].title || data[0].name}`);
    }
  }
}

checkDemoLeak();
