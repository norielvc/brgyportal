const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://efwwtftwxhgrvukvjedk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmd3d0ZnR3eGhncnZ1a3ZqZWRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzA3NzQ0MywiZXhwIjoyMDgyNjUzNDQzfQ.xkldtB6fABnOCn-vr87d4sKYzjvPqgHGjUuYiraV_50'
);

async function check() {
  console.log('=== Simulating portal/submit.js flow for demo tenant ===\n');

  const tenantId = 'demo';
  const type = 'barangay_clearance';
  const refNumber = `BC-2026-TEST${Date.now().toString().slice(-4)}`;

  // 1. Insert certificate
  const { data: cert, error: certErr } = await supabase.from('certificate_requests').insert([{
    tenant_id: tenantId,
    reference_number: refNumber,
    certificate_type: type,
    full_name: 'MARIA TEST VILLANUEVA',
    age: 0,
    sex: '',
    civil_status: '',
    address: '',
    contact_number: '09231234567',
    email: '',
    purpose: 'EMPLOYMENT',
    place_of_birth: '',
    status: 'staff_review',
    date_issued: new Date().toISOString(),
    created_at: new Date().toISOString()
  }]).select().single();

  if (certErr) { console.log('CERT INSERT FAILED:', certErr.message); return; }
  console.log('✅ Certificate created:', cert.id, '|', refNumber);

  // 2. Get workflow config
  const { data: wfConfig } = await supabase.from('workflow_configurations')
    .select('workflow_config').eq('certificate_type', type).eq('tenant_id', tenantId).single();

  const firstStep = wfConfig?.workflow_config?.steps?.find(s => s.requiresApproval);
  console.log('✅ First step:', firstStep?.name, '| users:', firstStep?.assignedUsers);

  // 3. Create assignments
  let assignCount = 0;
  for (const userId of (firstStep?.assignedUsers || [])) {
    const { error: aErr } = await supabase.from('workflow_assignments').insert([{
      request_id: cert.id, tenant_id: tenantId, request_type: type,
      step_id: firstStep.id.toString(), step_name: firstStep.name,
      assigned_user_id: userId, status: 'pending'
    }]);
    if (aErr) console.log('Assignment FAILED:', aErr.message);
    else { assignCount++; console.log('✅ Assignment created for user:', userId); }
  }

  // 4. Verify
  const { data: verify } = await supabase.from('workflow_assignments')
    .select('*').eq('request_id', cert.id).eq('tenant_id', tenantId);
  console.log(`\n✅ Total assignments in DB: ${verify?.length}`);

  // Cleanup
  await supabase.from('workflow_assignments').delete().eq('request_id', cert.id);
  await supabase.from('certificate_requests').delete().eq('id', cert.id);
  console.log('Cleaned up test data.');
}

check().catch(console.error);
