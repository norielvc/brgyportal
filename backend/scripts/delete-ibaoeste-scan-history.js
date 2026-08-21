require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const TENANT_ID = 'ibaoeste';
const DRY_RUN = !process.argv.includes('--confirm');

async function main() {
  console.log(`🔎 Tenant: ${TENANT_ID}`);
  console.log(`🧪 Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE DELETE'}`);

  const tables = ['qr_scans', 'scan_events'];
  const counts = {};

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID);

    if (error) {
      if (error.message.includes('does not exist') || error.code === 'PGRST116' || error.code === '42P01') {
        console.log(`⚠️ Table ${table} does not exist, skipping`);
        counts[table] = 0;
      } else {
        console.error(`❌ Error counting ${table}:`, error.message);
        process.exit(1);
      }
    } else {
      counts[table] = count ?? 0;
      console.log(`📊 ${table}: ${count ?? 0}`);
    }
  }

  if (DRY_RUN) {
    console.log('\n👉 This is a dry run. No data was deleted.');
    console.log('👉 To actually delete, run: node scripts/delete-ibaoeste-scan-history.js --confirm');
    return;
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) {
    console.log('\n✅ Nothing to delete.');
    return;
  }

  console.log('\n🗑️ Deleting scan history...');
  for (const table of tables) {
    if (counts[table] === 0) continue;
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('tenant_id', TENANT_ID);

    if (error) {
      console.error(`   ❌ Error deleting from ${table}:`, error.message);
    } else {
      console.log(`   ✅ Deleted ${counts[table]} rows from ${table}`);
    }
  }

  console.log('\n🎉 Scan history cleared for tenant:', TENANT_ID);
}

main().catch(e => {
  console.error('Unexpected error:', e);
  process.exit(1);
});
