const { supabase } = require('./backend/services/supabaseClient');

async function createWorkflowAssignments() {
  try {
    console.log('=== CREATING WORKFLOW ASSIGNMENTS FOR EXISTING REQUESTS ===');
    
    // Get all pending certificate requests that don't have workflow assignments
    const { data: pendingRequests, error: requestsError } = await supabase
      .from('certificate_requests')
      .select('*')
      .eq('status', 'pending');
    
    if (requestsError) {
      console.error('Error fetching pending requests:', requestsError);
      return;
    }
    
    console.log(`Found ${pendingRequests.length} pending certificate requests`);
    
    // Staff user IDs who should be assigned to step 2 (Under Review)
    const staffUserIds = [
      '9550a8b2-9e32-4f52-a260-52766afb49b1', // Noriel Cruz
      'f398db9a-1224-42f9-a72f-69dd14fa5064', // Jane Smith
      '379898b5-06e9-43a7-b51d-213aec975825'  // Sarah Wilson
    ];
    
    for (const request of pendingRequests) {
      console.log(`\nProcessing request: ${request.reference_number}`);
      
      // Check if workflow assignment already exists
      const { data: existingAssignment } = await supabase
        .from('workflow_assignments')
        .select('*')
        .eq('request_id', request.id)
        .single();
      
      if (existingAssignment) {
        console.log('  ✅ Workflow assignment already exists');
        continue;
      }
      
      // Create workflow assignments for each staff member
      for (const staffUserId of staffUserIds) {
        const { data: assignment, error: assignmentError } = await supabase
          .from('workflow_assignments')
          .insert([{
            request_id: request.id,
            request_type: request.certificate_type,
            step_id: 2, // Step 2: Under Review (where staff should see it)
            step_name: 'Under Review',
            assigned_user_id: staffUserId,
            status: 'pending'
          }])
          .select()
          .single();
        
        if (assignmentError) {
          console.error(`  ❌ Failed to create assignment for ${staffUserId}:`, assignmentError);
        } else {
          console.log(`  ✅ Created assignment for staff user ${staffUserId}`);
        }
        
        // Create workflow history entry
        const { error: historyError } = await supabase
          .from('workflow_history')
          .insert([{
            request_id: request.id,
            request_type: request.certificate_type,
            step_id: 2,
            step_name: 'Under Review',
            action: 'assigned',
            performed_by: '00000000-0000-0000-0000-000000000000', // System
            new_status: 'pending',
            comments: 'Automatically assigned to staff for review'
          }]);
        
        if (historyError) {
          console.error(`  ❌ Failed to create history entry:`, historyError);
        }
      }
    }
    
    // Now test if Noriel Cruz can see his assignments
    console.log('\n=== TESTING STAFF ASSIGNMENTS ===');
    const norielId = '9550a8b2-9e32-4f52-a260-52766afb49b1';
    
    const { data: norielAssignments, error: queryError } = await supabase
      .from('workflow_assignments')
      .select(`
        *,
        certificate_requests:request_id (
          reference_number,
          full_name,
          certificate_type,
          status,
          created_at
        )
      `)
      .eq('assigned_user_id', norielId)
      .eq('status', 'pending');
    
    if (queryError) {
      console.error('❌ Failed to query Noriel\'s assignments:', queryError);
    } else {
      console.log(`✅ Noriel Cruz has ${norielAssignments.length} pending assignments:`);
      norielAssignments.forEach(assignment => {
        const request = assignment.certificate_requests;
        console.log(`  - ${request.reference_number}: ${request.full_name} (${request.certificate_type})`);
      });
    }
    
    // Test the workflow logic that the frontend uses
    console.log('\n=== TESTING FRONTEND WORKFLOW LOGIC ===');
    
    // Simulate the frontend logic for checking if user is assigned to a request
    const testRequest = pendingRequests[0];
    if (testRequest) {
      console.log(`Testing with request: ${testRequest.reference_number}`);
      
      // Check if Noriel is assigned to this request at the current step
      const { data: userAssignment } = await supabase
        .from('workflow_assignments')
        .select('*')
        .eq('request_id', testRequest.id)
        .eq('assigned_user_id', norielId)
        .eq('status', 'pending')
        .single();
      
      if (userAssignment) {
        console.log('✅ Noriel is assigned to this request');
        console.log(`   Step: ${userAssignment.step_name} (ID: ${userAssignment.step_id})`);
        console.log('🎉 The request should appear in Noriel\'s "My Assignments" section!');
      } else {
        console.log('❌ Noriel is NOT assigned to this request');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createWorkflowAssignments();