const { supabase } = require('./frontend/lib/supabase');

async function debugCHRequest() {
  try {
    console.log('=== DEBUGGING CH-2026-25387 ===\n');
    
    // 1. Check certificate request
    console.log('1. Checking certificate request...');
    const { data: request, error: reqError } = await supabase
      .from('certificate_requests')
      .select('*')
      .eq('reference_number', 'CH-2026-25387')
      .single();
    
    if (reqError) {
      console.error('Error fetching request:', reqError);
      return;
    }
    
    if (!request) {
      console.log('Request not found!');
      return;
    }
    
    console.log('Request found:');
    console.log(`   ID: ${request.id}`);
    console.log(`   Status: ${request.status}`);
    console.log(`   Type: ${request.certificate_type}`);
    console.log(`   Tenant: ${request.tenant_id}`);
    
    // 2. Check workflow assignments
    console.log('\n2. Checking workflow assignments...');
    const { data: assignments, error: assignError } = await supabase
      .from('workflow_assignments')
      .select('*')
      .eq('request_id', request.id)
      .order('created_at', { ascending: true });
    
    if (assignError) {
      console.error('Error fetching assignments:', assignError);
    } else {
      console.log(`Found ${assignments.length} assignments:`);
      assignments.forEach((a, i) => {
        console.log(`\n   Assignment ${i + 1}:`);
        console.log(`      ID: ${a.id}`);
        console.log(`      Step: ${a.step_name}`);
        console.log(`      Status: ${a.status}`);
        console.log(`      Assigned to: ${a.assigned_user_id}`);
        console.log(`      Created: ${a.created_at}`);
        console.log(`      Updated: ${a.updated_at}`);
      });
    }
    
    // 3. Check workflow history
    console.log('\n3. Checking workflow history...');
    const { data: history, error: histError } = await supabase
      .from('workflow_history')
      .select('*')
      .eq('request_id', request.id)
      .order('created_at', { ascending: true });
    
    if (histError) {
      console.error('Error fetching history:', histError);
    } else {
      console.log(`Found ${history.length} history entries:`);
      history.forEach((h, i) => {
        console.log(`\n   History ${i + 1}:`);
        console.log(`      Step: ${h.step_name}`);
        console.log(`      Action: ${h.action}`);
        console.log(`      New Status: ${h.new_status}`);
        console.log(`      Performed by: ${h.performed_by}`);
        console.log(`      Comments: ${h.comments || 'None'}`);
        console.log(`      Created: ${h.created_at}`);
      });
    }
    
    // 4. Check workflow configuration
    console.log('\n4. Checking workflow configuration...');
    const { data: config, error: configError } = await supabase
      .from('workflow_configurations')
      .select('*')
      .eq('certificate_type', 'barangay_cohabitation')
      .eq('tenant_id', request.tenant_id)
      .single();
    
    if (configError) {
      console.error('Error fetching config:', configError);
    } else if (config) {
      console.log('Workflow config found:');
      const steps = config.workflow_config?.steps || [];
      console.log(`   Total steps: ${steps.length}`);
      steps.forEach((step, i) => {
        console.log(`\n   Step ${i + 1}:`);
        console.log(`      Name: ${step.name}`);
        console.log(`      Status: ${step.status}`);
        console.log(`      Assigned users: ${step.assignedUsers?.join(', ') || 'None'}`);
      });
    } else {
      console.log('No workflow config found!');
    }
    
    // 5. Check users assigned to captain step
    console.log('\n5. Checking captain users...');
    const { data: captains, error: captainError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('tenant_id', request.tenant_id)
      .or('role.eq.captain,role.eq.admin');
    
    if (captainError) {
      console.error('Error fetching captains:', captainError);
    } else {
      console.log(`Found ${captains.length} captain/admin users:`);
      captains.forEach(u => {
        console.log(`   ${u.email} (${u.role}) - ID: ${u.id}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugCHRequest();
