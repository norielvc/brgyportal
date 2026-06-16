const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function testEventsAPI() {
  console.log('🔍 Testing events API query for ibaoeste...\n');
  
  const tenantId = 'ibaoeste';
  
  try {
    // Simulate what the API does
    let query = supabase
      .from('events')
      .select('*')
      .eq('tenant_id', tenantId);
    
    // Apply ordering like the API does
    query = query.order('id', { ascending: true });
    
    const { data: cloudData, error } = await query;
    
    if (error) {
      console.error('❌ Query error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    } else if (cloudData && cloudData.length > 0) {
      console.log(`✅ Query successful! Found ${cloudData.length} events`);
      cloudData.forEach((event, index) => {
        console.log(`\n${index + 1}. ${event.title}`);
        console.log(`   ID: ${event.id}`);
        console.log(`   Tenant: ${event.tenant_id}`);
        console.log(`   Order: ${event.order_index}`);
      });
    } else {
      console.log('⚠️ Query returned no results');
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
    console.error('Stack:', err.stack);
  }
}

testEventsAPI().catch(console.error);
