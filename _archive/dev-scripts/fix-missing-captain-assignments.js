const { supabase } = require('./backend/services/supabaseClient');

async function fixMissingCaptainAssignments() {
  try {
    console.log('=== FIXING MISSING CAPTAIN ASSIGNMENTS ===');
    
    // Captain/Admin user IDs
    const captainIds = [
      'aaa242af-6ef2-4c72-8729-f8e8d68ec1fa', // David Brown
      '2a6054aa-d73d-4f52-876f-efa95f77add9'  // Admin User
    ];
    
    // Find all requests with "processing" status (should be at captain approval step)
    console.log('1. Finding requests with "processing" status...');
    
    const { data: processingRequests, error: requestsError } = await supabase
      .from('certificate_requests')
      .select('*')
      .eq('status', 'processing');
    
    if (requestsError) {
      console.error('Error fetching processing requests:', requestsError);
      return;
    }
    
    console.log(`✅ Found ${processingRequests.length} requests with "processing" status`);
    
    for (const request of processingRequests) {
      console.log(`\nProcessing ${request.reference_number}...`);
      
      // Check if captain assignments already exist
      const { data: existingCaptainAssignments } = await supabase
        .from('workflow_assignments')
        .select('*')
        .eq('request_id', request.id)
        .in('assigned_user_id', captainIds)
        .eq('status', 'pending');
      
      if (existingCaptainAssignments && existingCaptainAssignments.length > 0) {
        console.log(`  ✅ Captain assignments already exist (${existingCaptainAssignments.length})`);
        continue;
      }
      
      // Create captain assignments
      console.log(`  🔧 Creating captain assignments...`);
      
      for (const captainId of captainIds) {
        const { data: newAssignment, error: createError } = await supabase
          .from('workflow_assignments')
          .insert([{
            request_id: request.id,
            request_type: request.certificate_type,
            step_id: 3, // Step 3: Barangay Captain Approval
            step_name: 'Barangay Captain Approval',
            assigned_user_id: captainId,
            status: 'pending'
          }])
          .select()
          .single();
        
        if (createError) {
          console.error(`    ❌ Failed to create assignment for ${captainId}:`, createError);
        } else {
          console.log(`    ✅ Created assignment for captain ${captainId}`);
        }
      }
    }
    
    // Also check for "approved" status requests (should be at ready step)
    console.log('\n2. Finding requests with "approved" status...');
    
    const { data: approvedRequests, error: approvedError } = await supabase
      .from('certificate_requests')
      .select('*')
      .eq('status', 'approved');
    
    if (approvedError) {
      console.error('Error fetching approved requests:', approvedError);
      return;
    }
    
    console.log(`✅ Found ${approvedRequests.length} requests with "approved" status`);
    console.log('   (These should be at "Ready for Pickup" step - no assignments needed)');
    
    // Summary
    console.log('\n=== SUMMARY ===');
    
    // Count captain assignments
    for (const captainId of captainIds) {
      const { data: assignments } = await supabase
        .from('workflow_assignments')
        .select(`
          *,
          certificate_requests:request_id (reference_number, full_name)
        `)
        .eq('assigned_user_id', captainId)
        .eq('status', 'pending');
      
      console.log(`\nCaptain ${captainId} now has ${assignments?.length || 0} pending assignments:`);
      assignments?.forEach(assignment => {
        const request = assignment.certificate_requests;
        console.log(`  - ${request.reference_number}: ${request.full_name}`);
      });
    }
    
    console.log('\n🎉 Captain assignments have been fixed!');
    console.log('   Captains should now see their assigned requests in "My Assignments"');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixMissingCaptainAssignments();