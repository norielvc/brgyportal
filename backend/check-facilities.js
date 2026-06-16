const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function checkFacilities() {
  console.log('🔍 Checking facilities for both tenants...\n');
  
  // Check demo tenant
  const { data: demoFacilities, error: demoError } = await supabase
    .from('facilities')
    .select('*')
    .eq('tenant_id', 'demo')
    .order('order_index', { ascending: true });
  
  console.log('📊 DEMO tenant facilities:');
  if (demoError) {
    console.error('❌ Error:', demoError.message);
  } else {
    console.log(`✅ Found ${demoFacilities?.length || 0} facilities`);
    demoFacilities?.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.name} (order: ${f.order_index}, tenant: ${f.tenant_id})`);
    });
  }
  
  console.log('\n📊 IBAOESTE tenant facilities:');
  // Check ibaoeste tenant
  const { data: ibaFacilities, error: ibaError } = await supabase
    .from('facilities')
    .select('*')
    .eq('tenant_id', 'ibaoeste')
    .order('order_index', { ascending: true });
  
  if (ibaError) {
    console.error('❌ Error:', ibaError.message);
  } else {
    console.log(`✅ Found ${ibaFacilities?.length || 0} facilities`);
    ibaFacilities?.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.name} (order: ${f.order_index}, tenant: ${f.tenant_id})`);
    });
  }
  
  // Check if there are any facilities without tenant_id
  console.log('\n🔍 Checking for facilities without tenant_id...');
  const { data: noTenantFacilities, error: noTenantError } = await supabase
    .from('facilities')
    .select('*')
    .is('tenant_id', null);
  
  if (noTenantError) {
    console.error('❌ Error:', noTenantError.message);
  } else if (noTenantFacilities && noTenantFacilities.length > 0) {
    console.log(`⚠️ Found ${noTenantFacilities.length} facilities without tenant_id:`);
    noTenantFacilities.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.name} (id: ${f.id})`);
    });
  } else {
    console.log('✅ All facilities have tenant_id assigned');
  }
  
  // Get one facility to see the schema
  console.log('\n📋 Facility table schema (sample):');
  const { data: sampleFacility } = await supabase
    .from('facilities')
    .select('*')
    .limit(1);
  
  if (sampleFacility && sampleFacility.length > 0) {
    console.log('Columns:', Object.keys(sampleFacility[0]).join(', '));
  }
}

checkFacilities().catch(console.error);
