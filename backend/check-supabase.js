const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials missing!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role, status, first_name, last_name, tenant_id')
      .limit(10);

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    console.log('--- Supabase Users ---');
    console.table(users);
    
    // Check tenants too
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('*');
      
    if (!tenantError) {
        console.log('--- Tenants ---');
        console.table(tenants);
    }

  } catch (err) {
    console.error('System error:', err);
  }
}

checkUsers();
