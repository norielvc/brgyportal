const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://efwwtftwxhgrvukvjedk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmd3d0ZnR3eGhncnZ1a3ZqZWRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzA3NzQ0MywiZXhwIjoyMDgyNjUzNDQzfQ.xkldtB6fABnOCn-vr87d4sKYzjvPqgHGjUuYiraV_50'
);

async function check() {
  console.log('\n=== 1. Latest certificate_requests for demo ===');
  const { data: certs } = await supabase
    .from('certificate_requests')
    .select('id, reference_number, certificate_type, status, tenant_id, created_at')
    .eq('tenant_id', 'demo')
    .order('created_at', { ascending: false })
    .limit(5);
  console.table(certs);

  console.log('\n=== 2. workflow_configurations for demo ===');
  const { data: wfConfigs } = await supabase
    .from('workflow_configurations')
    .select('certificate_type, tenant_id, is_active, workflow_config')
    .eq('tenant_id', 'demo');
  if (!wfConfigs || wfConfigs.length === 0) {
    console.log('NO workflow_configurations found for tenant=demo');
  } else {
    wfConfigs.forEach(c => {
      const steps = c.workflow_config?.steps || [];
      console.log(`\n[${c.certificate_type}] active=${c.is_active}, steps=${steps.length}`);
      steps.forEach(s => console.log(`  - Step ${s.id}: "${s.name}" | assignedUsers: ${JSON.stringify(s.assignedUsers)}`));
    });
  }

  console.log('\n=== 3. workflow_assignments for demo (latest 10) ===');
  const { data: assignments } = await supabase
    .from('workflow_assignments')
    .select('id, request_id, request_type, step_name, assigned_user_id, status, tenant_id, created_at')
    .eq('tenant_id', 'demo')
    .order('created_at', { ascending: false })
    .limit(10);
  if (!assignments || assignments.length === 0) {
    console.log('NO workflow_assignments found for tenant=demo');
  } else {
    console.table(assignments);
  }

  console.log('\n=== 4. Users for demo tenant ===');
  const { data: users } = await supabase
    .from('users')
    .select('id, first_name, last_name, role, status, tenant_id')
    .eq('tenant_id', 'demo');
  console.table(users);
}

check().catch(console.error);
