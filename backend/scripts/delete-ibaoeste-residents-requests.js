require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const TENANT_ID = 'ibaoeste';
const DRY_RUN = !process.argv.includes('--confirm');

const BATCH_SIZE = 100;

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function main() {
  console.log(`🔎 Tenant: ${TENANT_ID}`);
  console.log(`🧪 Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE DELETE'}`);

  // 1. Count residents
  const { count: resCount, error: resCountErr } = await supabase
    .from('residents')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', TENANT_ID);

  if (resCountErr) {
    console.error('❌ Error counting residents:', resCountErr.message);
    process.exit(1);
  }

  // 2. Count and get certificate request IDs
  const { data: requests, error: reqErr } = await supabase
    .from('certificate_requests')
    .select('id')
    .eq('tenant_id', TENANT_ID);

  if (reqErr) {
    console.error('❌ Error fetching certificate requests:', reqErr.message);
    process.exit(1);
  }

  const requestIds = (requests || []).map(r => r.id);
  console.log(`\n📊 Residents: ${resCount ?? 0}`);
  console.log(`📊 Certificate requests: ${requestIds.length}`);

  if (DRY_RUN) {
    console.log('\n👉 This is a dry run. No data was deleted.');
    console.log('👉 To actually delete, run: node scripts/delete-ibaoeste-residents-requests.js --confirm');
    return;
  }

  if (requestIds.length === 0 && (resCount ?? 0) === 0) {
    console.log('\n✅ Nothing to delete.');
    return;
  }

  // --- LIVE DELETE ---
  console.log('\n🗑️ Deleting data...');

  // Delete workflow records tied to these requests in batches
  const tablesToDeleteByRequest = ['workflow_assignments', 'workflow_history'];
  for (const table of tablesToDeleteByRequest) {
    if (requestIds.length === 0) continue;
    let deleted = 0;
    const chunks = chunkArray(requestIds, BATCH_SIZE);
    for (const chunk of chunks) {
      const { error } = await supabase
        .from(table)
        .delete()
        .in('request_id', chunk);
      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`   ⚠️ Table ${table} does not exist, skipping`);
          break;
        }
        console.error(`   ❌ Error deleting from ${table}:`, error.message);
      } else {
        deleted += chunk.length;
      }
    }
    console.log(`   ✅ Deleted related rows from ${table}`);
  }

  // Delete certificate requests
  const { error: crErr } = await supabase
    .from('certificate_requests')
    .delete()
    .eq('tenant_id', TENANT_ID);

  if (crErr) {
    console.error('   ❌ Error deleting certificate_requests:', crErr.message);
  } else {
    console.log('   ✅ Deleted certificate_requests');
  }

  // Delete residents
  const { error: resErr } = await supabase
    .from('residents')
    .delete()
    .eq('tenant_id', TENANT_ID);

  if (resErr) {
    console.error('   ❌ Error deleting residents:', resErr.message);
  } else {
    console.log('   ✅ Deleted residents');
  }

  console.log('\n🎉 Deletion complete for tenant:', TENANT_ID);
}

main().catch(e => {
  console.error('Unexpected error:', e);
  process.exit(1);
});
