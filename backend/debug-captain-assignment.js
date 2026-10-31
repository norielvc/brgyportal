const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugCaptainAssignment() {
  try {
    console.log('🔍 Debugging Chairman Approval Assignment Issue...\n');
    
    // Check the specific request that's showing incorrectly
    const requestRef = '2026-0305003';
    
    console.log(`📋 Checking request: ${requestRef}`);
    
    // 1. Get the request details
    const { data: request, error: reqError } = await supabase
      .from('certificate_requests')
      .select('*')
      .eq('reference_number', requestRef)
      .single();
    
    if (reqError) {
      console.error('❌ Error fetching request:', reqError);
      return;
    }
    
    console.log(`   Status: ${request.status}`);
    console.log(`   Type: ${request.certificate_type}`);
    console.log(`   ID: ${request.id}`);
    
    // 2. Check workflow assignments for this request
    const { data: assignments, error: assignError } = await supabase
      .from('workflow_assignments')
      .select('*')
      .eq('request_id', request.id)
      .order('created_at', { ascending: false });
    
    if (assignError) {
      console.error('❌ Error fetching assignments:', assignError);
    } else {
      console.log(`\n📝 Workflow Assignments (${assignments.length}):`);
      assignments.forEach((assignment, i) => {
        console.log(`   ${i + 1}. Step: ${assignment.step_name}`);
        console.log(`      User: ${assignment.assigned_user_id}`);
        console.log(`      Status: ${assignment.status}`);
        console.log(`      Created: ${assignment.created_at}`);
        console.log('');
      });
    }
    
    // 3. Check current user assignments
    console.log('👥 Checking user assignments...');
    
    // Get all users to see who should have access
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(10);
    
    if (userError) {
      console.error('❌ Error fetching users:', userError);
    } else {
      console.log('   Available users:');
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.role}) - ID: ${user.id}`);
      });
    }
    
    // 4. Check workflow configuration for business permits
    const { data: workflowConfig, error: configError } = await supabase
      .from('workflow_configurations')
      .select('*')
      .eq('certificate_type', 'business_permit')
      .single();
    
    if (configError) {
      console.error('❌ Error fetching workflow config:', configError);
    } else {
      console.log('\n⚙️ Workflow Configuration:');
      if (workflowConfig.workflow_config && workflowConfig.workflow_config.steps) {
        workflowConfig.workflow_config.steps.forEach((step, i) => {
          console.log(`   ${i + 1}. ${step.name} (${step.status})`);
          console.log(`      Assigned Users: ${step.assignedUsers ? step.assignedUsers.join(', ') : 'None'}`);
        });
      }
    }
    
    // 5. Check my-assignments API behavior
    console.log('\n🔍 Checking assignment logic...');
    
    // Find active assignments for captain approval status
    const { data: activeAssignments, error: activeError } = await supabase
      .from('workflow_assignments')
      .select('*')
      .eq('request_id', request.id)
      .eq('status', 'pending');
    
    if (activeError) {
      console.error('❌ Error fetching active assignments:', activeError);
    } else {
      console.log(`   Active assignments: ${activeAssignments.length}`);
      activeAssignments.forEach(assignment => {
        console.log(`   - ${assignment.step_name} assigned to ${assignment.assigned_user_id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugCaptainAssignment();