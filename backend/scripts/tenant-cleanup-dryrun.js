require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

const TARGET_TENANT = 'ibaoeste';

async function main() {
  console.log(`🔎 Looking up tenant: ${TARGET_TENANT}`);

  // Find tenant record (by exact id OR name match)
  const { data: byId, error: idErr } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('id', TARGET_TENANT);

  const { data: byName, error: nameErr } = await supabase
    .from('tenants')
    .select('id, name')
    .ilike('name', `%${TARGET_TENANT}%`);

  if (idErr) {
    console.error('❌ Error fetching tenants by id:', idErr.message);
    process.exit(1);
  }
  if (nameErr) {
    console.error('❌ Error fetching tenants by name:', nameErr.message);
    process.exit(1);
  }

  const seen = new Set();
  const tenants = [];
  for (const t of [...(byId || []), ...(byName || [])]) {
    if (!seen.has(t.id)) {
      seen.add(t.id);
      tenants.push(t);
    }
  }

  if (tenants.length === 0) {
    console.log('⚠️ No tenant found matching "ibaoeste". Searched id and name.');
    process.exit(0);
  }

  console.log('\n✅ Matching tenants:');
  for (const t of tenants) {
    console.log(`   id="${t.id}" name="${t.name}"`);
  }

  const tenantId = tenants[0].id;

  // Find all tables with a tenant_id column via raw SQL
  const tableSql = `
    SELECT table_name
    FROM information_schema.columns
    WHERE column_name = 'tenant_id'
      AND table_schema = 'public'
    ORDER BY table_name
  `;
  const { data: columns, error: cErr } = await supabase.rpc('exec_sql', { sql: tableSql });

  if (cErr) {
    console.error('❌ Error reading schema:', cErr.message);
    console.error('   (The exec_sql RPC may not exist. We will need to use a fixed table list.)');
    process.exit(1);
  }

  const tables = [...new Set(columns.map(c => c.table_name))];
  console.log(`\n📊 Tables with tenant_id column (${tables.length} total):`);

  const summary = [];
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      const status = error ? `ERROR: ${error.message}` : `${count ?? 0} rows`;
      console.log(`   ${table}: ${status}`);
      if (!error) summary.push({ table, count: count ?? 0 });
    } catch (e) {
      console.log(`   ${table}: EXCEPTION: ${e.message}`);
    }
  }

  const total = summary.reduce((a, b) => a + b.count, 0);
  console.log(`\n🔢 Total rows for tenant "${tenantId}": ${total}`);
  console.log('\n👉 This was a DRY RUN. No data was deleted.');
  console.log('👉 To actually delete, run: node scripts/tenant-cleanup-execute.js --confirm');
}

main().catch(e => {
  console.error('Unexpected error:', e);
  process.exit(1);
});
