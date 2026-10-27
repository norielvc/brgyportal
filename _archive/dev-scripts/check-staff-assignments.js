const { supabase } = require('./backend/services/supabaseClient');

async function checkStaffAssignments() {
  try {
    console.log('=== CHECKING STAFF (NORIEL CRUZ) ASSIGNMENTS ===');
    
    // Find Noriel Cruz
    const { data: noriel, error: norielError } = await supabase
      .from('users')
      .select('*')
      .eq('first_name', 'Noriel')
      .eq('last_name', 'Cruz')
      .single();
    
    if (norielError) {
      console.error('Error finding Noriel Cruz:', norielError);
      return;
    }
    
    console.log(`\nNoriel Cruz (Staff) details:`);
    console.log(`- ID: ${noriel.id}`);
    console.log(`- Email: ${noriel.email}`);
    console.log(`- Role: ${noriel.role}`);
    
    // Check assignments for Noriel Cruz using the same query as the API
    const { data: assignments, error: assignError } = await supabase
      .from('workflow_assignments')
      .select(`
        *,
        certificate_requests:request_id (
          id,
          reference_number,
          full_name,
          certificate_type,
          status,
          created_at,
          contact_number,
          purpose,
          age,
          sex,
          civil_status,
          address,
          date_of_birth,
          place_of_birth
        )
      `)
      .eq('assigned_user_id', noriel.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (assignError) {
      console.error('Error fetching Noriel assignments:', assignError);
      return;
    }
    
    console.log(`\nNoriel Cruz's pending assignments (what should appear in "My Assignments"):`);
    if (assignments && assignments.length > 0) {
      assignments.forEach(assignment => {
        const request = assignment.certificate_requests;
        console.log(`- ${request?.reference_number || 'N/A'} (${request?.certificate_type || 'N/A'})`);
        console.log(`  Applicant: ${request?.full_name || 'N/A'}`);
        console.log(`  Status: ${request?.status || 'N/A'}`);
        console.log(`  Step: ${assignment.step_id} - ${assignment.step_name}`);
        console.log(`  Assignment Status: ${assignment.status}`);
        console.log(`  Created: ${new Date(request?.created_at || assignment.created_at).toLocaleDateString()}`);
        console.log('');
      });
      
      console.log(`✅ Total assignments for Noriel: ${assignments.length}`);
    } else {
      console.log('❌ No pending assignments found for Noriel Cruz');
    }
    
    // Check what requests should be assigned to staff (pending status)
    const { data: pendingRequests, error: pendingError } = await supabase
      .from('certificate_requests')
      .select('id, reference_number, certificate_type, status, full_name, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (pendingError) {
      console.error('Error fetching pending requests:', pendingError);
      return;
    }
    
    console.log(`\nPending requests (should be assigned to staff for Step 2 review):`);
    if (pendingRequests && pendingRequests.length > 0) {
      for (const request of pendingRequests) {
        console.log(`- ${request.reference_number} (${request.certificate_type}) - ${request.full_name}`);
        
        // Check if this request has a Step 2 assignment for Noriel
        const { data: hasAssignment, error: checkError } = await supabase
          .from('workflow_assignments')
          .select('*')
          .eq('request_id', request.id)
          .eq('step_id', 2)
          .eq('assigned_user_id', noriel.id);
        
        if (checkError) {
          console.error(`  Error checking assignment for ${request.reference_number}:`, checkError);
        } else if (!hasAssignment || hasAssignment.length === 0) {
          console.log(`  ❌ Missing Step 2 assignment for ${request.reference_number}`);
        } else {
          console.log(`  ✅ Has Step 2 assignment (Status: ${hasAssignment[0].status})`);
        }
      }
    } else {
      console.log('No pending requests found');
    }
    
  } catch (error) {
    console.error('Error during check:', error);
  }
}

checkStaffAssignments();