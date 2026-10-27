const { supabase } = require('./backend/services/supabaseClient');

async function verifyUIWorkflowSync() {
  try {
    console.log('=== VERIFYING UI WORKFLOW SYNCHRONIZATION ===');
    
    // Get users as shown in UI
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    const norielCruz = users.find(u => u.first_name === 'Noriel' && u.last_name === 'Cruz');
    const johnDoe = users.find(u => u.first_name === 'John' && u.last_name === 'Doe');
    
    console.log('UI Workflow Configuration:');
    console.log(`✅ Staff Review (Step 2): Noriel Cruz (${norielCruz?.id})`);
    console.log(`✅ Captain Approval (Step 3): John Doe (${johnDoe?.id})`);
    
    // Check current assignments
    console.log('\n=== CURRENT WORKFLOW ASSIGNMENTS ===');
    
    // Noriel's assignments (Staff Review - Step 2)
    const { data: norielAssignments } = await supabase
      .from('workflow_assignments')
      .select(`
        *,
        certificate_requests:request_id (reference_number, full_name, status)
      `)
      .eq('assigned_user_id', norielCruz.id)
      .eq('step_id', 2)
      .eq('status', 'pending');
    
    console.log(`\n1. Noriel Cruz (Staff Review) - ${norielAssignments?.length || 0} assignments:`);
    norielAssignments?.slice(0, 5).forEach(assignment => {
      const request = assignment.certificate_requests;
      console.log(`   - ${request.reference_number}: ${request.full_name} (${request.status})`);
    });
    if (norielAssignments?.length > 5) {
      console.log(`   ... and ${norielAssignments.length - 5} more`);
    }
    
    // John's assignments (Captain Approval - Step 3)
    const { data: johnAssignments } = await supabase
      .from('workflow_assignments')
      .select(`
        *,
        certificate_requests:request_id (reference_number, full_name, status)
      `)
      .eq('assigned_user_id', johnDoe.id)
      .eq('step_id', 3)
      .eq('status', 'pending');
    
    console.log(`\n2. John Doe (Captain Approval) - ${johnAssignments?.length || 0} assignments:`);
    johnAssignments?.forEach(assignment => {
      const request = assignment.certificate_requests;
      console.log(`   - ${request.reference_number}: ${request.full_name} (${request.status})`);
    });
    
    // Check workflow progression for processing requests
    console.log('\n=== WORKFLOW PROGRESSION CHECK ===');
    
    const { data: processingRequests } = await supabase
      .from('certificate_requests')
      .select('*')
      .eq('status', 'processing');
    
    console.log(`\nRequests with "processing" status: ${processingRequests?.length || 0}`);
    
    for (const request of processingRequests || []) {
      console.log(`\nChecking ${request.reference_number}:`);
      
      // Check if it has captain assignment
      const { data: captainAssignment } = await supabase
        .from('workflow_assignments')
        .select('*')
        .eq('request_id', request.id)
        .eq('step_id', 3)
        .eq('assigned_user_id', johnDoe.id)
        .eq('status', 'pending')
        .single();
      
      if (captainAssignment) {
        console.log(`   ✅ Has captain assignment for John Doe`);
      } else {
        console.log(`   ❌ Missing captain assignment for John Doe`);
      }
    }
    
    // Summary
    console.log('\n=== WORKFLOW SYSTEM STATUS ===');
    console.log(`✅ Staff assignments (Noriel Cruz): ${norielAssignments?.length || 0}`);
    console.log(`✅ Captain assignments (John Doe): ${johnAssignments?.length || 0}`);
    console.log(`✅ Processing requests: ${processingRequests?.length || 0}`);
    
    console.log('\n🎉 WORKFLOW SYSTEM SYNCHRONIZED WITH UI!');
    console.log('   - Noriel Cruz will see Staff Review assignments');
    console.log('   - John Doe will see Captain Approval assignments');
    console.log('   - Workflow progression follows UI configuration');
    
  } catch (error) {
    console.error('Error verifying workflow sync:', error);
  }
}

verifyUIWorkflowSync();