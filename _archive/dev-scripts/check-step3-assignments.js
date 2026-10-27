const { supabase } = require('./backend/services/supabaseClient');

async function checkStep3Assignments() {
  try {
    console.log('=== CHECKING STEP 3 (CAPTAIN APPROVAL) ASSIGNMENTS ===');
    
    // Check Step 3 assignments
    const { data: step3Assignments, error: step3Error } = await supabase
      .from('workflow_assignments')
      .select(`
        *,
        certificate_requests:request_id (reference_number, certificate_type, status),
        users:assigned_user_id (first_name, last_name, email)
      `)
      .eq('step_id', 3)
      .order('created_at', { ascending: false });
    
    if (step3Error) {
      console.error('Error fetching Step 3 assignments:', step3Error);
      return;
    }
    
    console.log(`\nStep 3 (Captain Approval) assignments:`);
    if (step3Assignments && step3Assignments.length > 0) {
      step3Assignments.forEach(assignment => {
        const request = assignment.certificate_requests;
        const user = assignment.users;
        console.log(`- ${request?.reference_number || 'N/A'} (${request?.certificate_type || 'N/A'}, Status: ${request?.status || 'N/A'}) -> ${user?.first_name || 'Unknown'} ${user?.last_name || 'User'} (Assignment Status: ${assignment.status})`);
      });
    } else {
      console.log('❌ No Step 3 assignments found');
    }
    
    // Check processing requests that should have Step 3 assignments
    const { data: processingRequests, error: processingError } = await supabase
      .from('certificate_requests')
      .select('id, reference_number, certificate_type, status, created_at')
      .eq('status', 'processing')
      .order('created_at', { ascending: false });
    
    if (processingError) {
      console.error('Error fetching processing requests:', processingError);
      return;
    }
    
    console.log(`\nProcessing requests (should have Step 3 assignments):`);
    if (processingRequests && processingRequests.length > 0) {
      for (const request of processingRequests) {
        console.log(`- ${request.reference_number} (${request.certificate_type}) - Status: ${request.status}`);
        
        // Check if this request has a Step 3 assignment
        const { data: hasStep3, error: checkError } = await supabase
          .from('workflow_assignments')
          .select('*')
          .eq('request_id', request.id)
          .eq('step_id', 3);
        
        if (checkError) {
          console.error(`  Error checking Step 3 assignment for ${request.reference_number}:`, checkError);
        } else if (!hasStep3 || hasStep3.length === 0) {
          console.log(`  ❌ Missing Step 3 assignment for ${request.reference_number}`);
        } else {
          console.log(`  ✅ Has Step 3 assignment`);
        }
      }
    } else {
      console.log('No processing requests found');
    }
    
    // Find John Doe (Captain)
    const { data: johnDoe, error: johnError } = await supabase
      .from('users')
      .select('*')
      .eq('first_name', 'John')
      .eq('last_name', 'Doe')
      .single();
    
    if (johnError) {
      console.error('Error finding John Doe:', johnError);
    } else {
      console.log(`\nJohn Doe (Captain) details:`);
      console.log(`- ID: ${johnDoe.id}`);
      console.log(`- Email: ${johnDoe.email}`);
      console.log(`- Role: ${johnDoe.role}`);
      
      // Check assignments for John Doe
      const { data: johnAssignments, error: johnAssignError } = await supabase
        .from('workflow_assignments')
        .select(`
          *,
          certificate_requests:request_id (reference_number, certificate_type, status)
        `)
        .eq('assigned_user_id', johnDoe.id)
        .order('created_at', { ascending: false });
      
      if (johnAssignError) {
        console.error('Error fetching John Doe assignments:', johnAssignError);
      } else {
        console.log(`\nJohn Doe's current assignments:`);
        if (johnAssignments && johnAssignments.length > 0) {
          johnAssignments.forEach(assignment => {
            const request = assignment.certificate_requests;
            console.log(`- ${request?.reference_number || 'N/A'} -> Step ${assignment.step_id}: ${assignment.step_name} (${assignment.status})`);
          });
        } else {
          console.log('❌ No assignments found for John Doe');
        }
      }
    }
    
  } catch (error) {
    console.error('Error during check:', error);
  }
}

checkStep3Assignments();