const { supabase } = require('./backend/services/supabaseClient');

async function syncWorkflowAssignments() {
  try {
    console.log('=== SYNCING WORKFLOW ASSIGNMENTS WITH UI CONFIGURATION ===');
    
    // Get all users to find the correct IDs
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('first_name');
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    console.log('Available users:');
    users.forEach(user => {
      console.log(`- ${user.first_name} ${user.last_name} (${user.email}) - ID: ${user.id} - Role: ${user.role}`);
    });
    
    // Find users by name (as shown in the UI)
    const norielCruz = users.find(u => u.first_name === 'Noriel' && u.last_name === 'Cruz');
    const johnDoe = users.find(u => u.first_name === 'John' && u.last_name === 'Doe');
    
    console.log('\nUser mapping from UI:');
    console.log(`Noriel Cruz: ${norielCruz ? norielCruz.id : 'NOT FOUND'}`);
    console.log(`John Doe: ${johnDoe ? johnDoe.id : 'NOT FOUND'}`);
    
    if (!norielCruz) {
      console.log('❌ Noriel Cruz not found in database');
      return;
    }
    
    if (!johnDoe) {
      console.log('❌ John Doe not found in database');
      return;
    }
    
    // Update workflow assignments to match UI configuration
    console.log('\n=== UPDATING WORKFLOW ASSIGNMENTS ===');
    
    // 1. Update all Step 2 (Staff Review) assignments to Noriel Cruz only
    console.log('1. Updating Step 2 (Staff Review) assignments to Noriel Cruz...');
    
    // First, delete existing step 2 assignments
    const { error: deleteStep2Error } = await supabase
      .from('workflow_assignments')
      .delete()
      .eq('step_id', 2);
    
    if (deleteStep2Error) {
      console.error('Error deleting step 2 assignments:', deleteStep2Error);
    } else {
      console.log('   ✅ Deleted existing step 2 assignments');
    }
    
    // Get all pending certificate requests
    const { data: pendingRequests, error: requestsError } = await supabase
      .from('certificate_requests')
      .select('*')
      .eq('status', 'pending');
    
    if (requestsError) {
      console.error('Error fetching pending requests:', requestsError);
      return;
    }
    
    // Create new step 2 assignments for Noriel Cruz only
    for (const request of pendingRequests) {
      const { error: assignError } = await supabase
        .from('workflow_assignments')
        .insert([{
          request_id: request.id,
          request_type: request.certificate_type,
          step_id: 2,
          step_name: 'Staff Review',
          assigned_user_id: norielCruz.id,
          status: 'pending'
        }]);
      
      if (assignError) {
        console.error(`   ❌ Failed to create assignment for ${request.reference_number}:`, assignError);
      } else {
        console.log(`   ✅ Created assignment for ${request.reference_number}`);
      }
    }
    
    // 2. Update all Step 3 (Captain Approval) assignments to John Doe only
    console.log('\n2. Updating Step 3 (Captain Approval) assignments to John Doe...');
    
    // Update existing step 3 assignments
    const { error: updateStep3Error } = await supabase
      .from('workflow_assignments')
      .update({ assigned_user_id: johnDoe.id })
      .eq('step_id', 3);
    
    if (updateStep3Error) {
      console.error('Error updating step 3 assignments:', updateStep3Error);
    } else {
      console.log('   ✅ Updated step 3 assignments to John Doe');
    }
    
    // 3. Update the workflow configuration in the database
    console.log('\n3. Updating workflow configuration...');
    
    const updatedWorkflowConfig = {
      steps: [
        {
          id: 1,
          name: 'Submitted',
          description: 'Application received',
          status: 'pending',
          icon: 'FileText',
          autoApprove: false,
          assignedUsers: [],
          requiresApproval: false,
          sendEmail: false
        },
        {
          id: 2,
          name: 'Staff Review',
          description: 'Being reviewed by assigned staff',
          status: 'staff_review',
          icon: 'Clock',
          autoApprove: false,
          assignedUsers: [norielCruz.id],
          requiresApproval: true,
          sendEmail: true
        },
        {
          id: 3,
          name: 'Barangay Captain Approval',
          description: 'Awaiting Barangay Captain approval',
          status: 'captain_approval',
          icon: 'UserCheck',
          autoApprove: false,
          assignedUsers: [johnDoe.id],
          requiresApproval: true,
          sendEmail: true
        },
        {
          id: 4,
          name: 'Ready for Pickup',
          description: 'Certificate is ready',
          status: 'ready',
          icon: 'CheckCircle',
          autoApprove: false,
          assignedUsers: [],
          requiresApproval: false,
          sendEmail: false
        },
        {
          id: 5,
          name: 'Released',
          description: 'Certificate released to applicant',
          status: 'released',
          icon: 'CheckCircle',
          autoApprove: false,
          assignedUsers: [],
          requiresApproval: false,
          sendEmail: false
        }
      ]
    };
    
    // Update all certificate types with the same workflow
    const certificateTypes = ['barangay_clearance', 'certificate_of_indigency', 'barangay_residency'];
    
    for (const certType of certificateTypes) {
      const { error: configError } = await supabase
        .from('workflow_configurations')
        .upsert([{
          certificate_type: certType,
          workflow_config: updatedWorkflowConfig,
          is_active: true
        }]);
      
      if (configError) {
        console.error(`Error updating ${certType} workflow:`, configError);
      } else {
        console.log(`   ✅ Updated ${certType} workflow configuration`);
      }
    }
    
    // 4. Summary
    console.log('\n=== SUMMARY ===');
    
    // Count assignments for each user
    const { data: norielAssignments } = await supabase
      .from('workflow_assignments')
      .select('*')
      .eq('assigned_user_id', norielCruz.id)
      .eq('status', 'pending');
    
    const { data: johnAssignments } = await supabase
      .from('workflow_assignments')
      .select('*')
      .eq('assigned_user_id', johnDoe.id)
      .eq('status', 'pending');
    
    console.log(`✅ Noriel Cruz (Staff Review): ${norielAssignments?.length || 0} assignments`);
    console.log(`✅ John Doe (Captain Approval): ${johnAssignments?.length || 0} assignments`);
    
    console.log('\n🎉 Workflow assignments synced with UI configuration!');
    console.log('   - Staff Review: Noriel Cruz only');
    console.log('   - Captain Approval: John Doe only');
    console.log('   - Workflow configurations updated in database');
    
  } catch (error) {
    console.error('Error syncing workflow assignments:', error);
  }
}

syncWorkflowAssignments();