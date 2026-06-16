const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function testPortalAPI() {
  const types = ['events', 'facilities', 'programs', 'achievements', 'officials'];
  const tenantId = 'ibaoeste';
  
  console.log(`🔍 Testing Portal API queries for tenant: ${tenantId}\n`);
  console.log('='.repeat(80));
  
  const tableMap = {
    officials: "barangay_officials",
    events: "events",
    facilities: "facilities",
    achievements: "achievements",
    programs: "programs",
  };
  
  for (const type of types) {
    console.log(`\n📊 Testing: /api/portal/${type}`);
    console.log('-'.repeat(80));
    
    try {
      const targetTable = tableMap[type] || type;
      let query = supabase
        .from(targetTable)
        .select("*")
        .eq("tenant_id", tenantId);

      // Apply sorting
      if (type === "officials") {
        query = query.eq("is_active", true);
      } else if (type === "events" || type === "facilities" || type === "programs" || type === "achievements") {
        // Order by order_index for content that has it
        query = query.order("order_index", { ascending: true });
      } else {
        query = query.order("id", { ascending: true });
      }

      const { data: cloudData, error } = await query;

      if (error) {
        console.log(`  ❌ Query Error: ${error.message}`);
        console.log(`  Details:`, JSON.stringify(error, null, 2));
      } else if (!cloudData || cloudData.length === 0) {
        console.log(`  ⚠️  No data returned`);
      } else {
        console.log(`  ✅ Success: ${cloudData.length} records`);
        
        // Show first 3 items
        cloudData.slice(0, 3).forEach((item, i) => {
          const name = item.name || item.title || item.position_type || 'N/A';
          const order = item.order_index !== undefined ? ` (order: ${item.order_index})` : '';
          console.log(`     ${i + 1}. ${name}${order}`);
        });
        
        if (cloudData.length > 3) {
          console.log(`     ... and ${cloudData.length - 3} more`);
        }
      }
    } catch (err) {
      console.log(`  ❌ Exception: ${err.message}`);
      console.log(`  Stack:`, err.stack);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ API test complete!\n');
}

testPortalAPI().catch(console.error);
