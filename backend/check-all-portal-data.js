const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function checkAllPortalData() {
  const tables = ['events', 'facilities', 'programs', 'achievements', 'barangay_officials'];
  const tenants = ['demo', 'ibaoeste'];
  
  console.log('🔍 Checking all portal data for tenant isolation...\n');
  console.log('='.repeat(80));
  
  for (const table of tables) {
    console.log(`\n📊 TABLE: ${table.toUpperCase()}`);
    console.log('-'.repeat(80));
    
    for (const tenant of tenants) {
      try {
        let query = supabase
          .from(table)
          .select('*')
          .eq('tenant_id', tenant);
        
        // Add is_active filter for officials
        if (table === 'barangay_officials') {
          query = query.eq('is_active', true);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.log(`  ❌ ${tenant.toUpperCase()}: Error - ${error.message}`);
        } else {
          console.log(`  ✅ ${tenant.toUpperCase()}: ${data?.length || 0} records`);
          if (data && data.length > 0) {
            // Show first 3 items
            data.slice(0, 3).forEach((item, i) => {
              const name = item.name || item.title || item.position_type || 'N/A';
              console.log(`     ${i + 1}. ${name}`);
            });
            if (data.length > 3) {
              console.log(`     ... and ${data.length - 3} more`);
            }
          }
        }
      } catch (err) {
        console.log(`  ❌ ${tenant.toUpperCase()}: Exception - ${err.message}`);
      }
    }
    
    // Check for records without tenant_id
    try {
      const { data: noTenant, error } = await supabase
        .from(table)
        .select('id, tenant_id')
        .is('tenant_id', null);
      
      if (!error && noTenant && noTenant.length > 0) {
        console.log(`  ⚠️  WARNING: ${noTenant.length} records without tenant_id!`);
      }
    } catch (err) {
      // Ignore if column doesn't exist
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Portal data check complete!\n');
}

checkAllPortalData().catch(console.error);
