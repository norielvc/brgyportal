/**
 * Database Data Checker
 * This script checks if you have existing data in your database
 * and shows what's available for the dashboard
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in frontend/.env.local');
  console.log('\nRequired variables:');
  console.log('  - NEXT_PUBLIC_SUPABASE_URL');
  console.log('  - SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('🔍 Checking database for existing data...\n');

  try {
    // Check tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name')
      .limit(5);

    if (tenantsError) {
      console.log('⚠️  Tenants table:', tenantsError.message);
    } else {
      console.log(`✅ Tenants: ${tenants?.length || 0} found`);
      if (tenants && tenants.length > 0) {
        tenants.forEach(t => console.log(`   - ${t.name} (${t.id})`));
      }
    }

    // Check certificate requests
    const { data: requests, error: requestsError, count } = await supabase
      .from('certificate_requests')
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (requestsError) {
      console.log('\n⚠️  Certificate Requests:', requestsError.message);
    } else {
      console.log(`\n✅ Certificate Requests: ${count || 0} total`);
      if (requests && requests.length > 0) {
        console.log('\nSample requests:');
        requests.forEach(r => {
          console.log(`   - ${r.reference_number} | ${r.full_name} | ${r.status} | ${r.certificate_type}`);
        });
      }
    }

    // Check by tenant
    if (tenants && tenants.length > 0) {
      const firstTenant = tenants[0];
      const { data: tenantRequests, count: tenantCount } = await supabase
        .from('certificate_requests')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', firstTenant.id);

      console.log(`\n📊 Tenant "${firstTenant.name}" has ${tenantCount || 0} requests`);
    }

    // Check residents
    const { count: residentsCount } = await supabase
      .from('residents')
      .select('*', { count: 'exact', head: true });

    console.log(`\n👥 Residents: ${residentsCount || 0} registered`);

    // Check users
    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    console.log(`👤 Users: ${usersCount || 0} in system`);

    // Check workflow assignments
    const { count: assignmentsCount } = await supabase
      .from('workflow_assignments')
      .select('*', { count: 'exact', head: true });

    console.log(`📋 Workflow Assignments: ${assignmentsCount || 0} total`);

    console.log('\n' + '='.repeat(60));
    
    if (count > 0) {
      console.log('✅ You have existing data! The dashboard should populate.');
      console.log('\n💡 Next steps:');
      console.log('   1. Make sure you\'re logged in with a user that has a tenant_id');
      console.log('   2. Refresh the dashboard page');
      console.log('   3. The metrics should show your data');
    } else {
      console.log('⚠️  No certificate requests found.');
      console.log('\n💡 To populate the dashboard:');
      console.log('   1. Go to your portal and submit some certificate requests');
      console.log('   2. Or use the admin panel to create test data');
      console.log('   3. Then refresh the dashboard');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkData();
