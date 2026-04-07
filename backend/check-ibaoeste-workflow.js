const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://efwwtftwxhgrvukvjedk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmd3d0ZnR3eGhncnZ1a3ZqZWRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzA3NzQ0MywiZXhwIjoyMDgyNjUzNDQzfQ.xkldtB6fABnOCn-vr87d4sKYzjvPqgHGjUuYiraV_50'
);

async function check() {
  const tenants = ['ibaoeste', 'demo'];

  for (const tenantId of tenants) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`TENANT: ${tenantId}`);
    console.log('='.repeat(60));

    // Workflow configs
    const { data: wfConfigs } = await supabase
      .from('workflow_configurations')
      .select('certificate_type, is_active, workflow_config')
      .eq('tenant_id', tenantId)
      .order('certificate_type');

    if (!wfConfigs?.length) {
      console.log('❌ NO workflow_configurations found');
    } else {
      console.log(`\n✅ ${wfConfigs.length} workflow configs found:`);
      wfConfigs.forEach(c => {
        const steps = c.workflow_config?.steps || [];
        const firstStep = steps.find(s => s.requiresApproval);
        console.log(`  [${c.certificate_type}] steps=${steps.length} | first assignable step: "${firstStep?.name}" | users: ${JSON.stringify(firstStep?.assignedUsers || [])}`);
      });
    }

    // Users
    const { data: users } = await supabase
      .from('users')
      .select('id, first_name, last_name, role, status')
      .eq('tenant_id', tenantId);
    console.log(`\n✅ Users (${users?.length || 0}):`);
    (users || []).forEach(u => console.log(`  ${u.id} | ${u.first_name} ${u.last_name} | ${u.role} | ${u.status}`));

    // Recent certificates
    const { data: certs } = await supabase
      .from('certificate_requests')
      .select('id, reference_number, certificate_type, status, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(3);
    console.log(`\n✅ Recent certificates (${certs?.length || 0}):`);
    (certs || []).forEach(c => console.log(`  ${c.reference_number} | ${c.certificate_type} | ${c.status} | ${c.created_at?.slice(0,10)}`));

    // Pending assignments
    const { data: assignments } = await supabase
      .from('workflow_assignments')
      .select('request_id, step_name, assigned_user_id, status')
      .eq('tenant_id', tenantId)
      .eq('status', 'pending')
      .limit(5);
    console.log(`\n✅ Pending assignments (${assignments?.length || 0}):`);
    (assignments || []).forEach(a => console.log(`  req:${a.request_id?.slice(0,8)}... | step:"${a.step_name}" | user:${a.assigned_user_id?.slice(0,8)}...`));
  }
}

check().catch(console.error);
