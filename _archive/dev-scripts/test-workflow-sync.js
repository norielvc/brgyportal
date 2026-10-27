const { supabase } = require('./backend/services/supabaseClient');

async function testWorkflowSync() {
  try {
    console.log('=== TESTING WORKFLOW SYNC FUNCTIONALITY ===');
    
    // Check current workflow assignments
    const { data: assignments, error: assignError } = await supabase
      .from('workflow_assignments')
      .select(`
        *,
        certificate_requests:request_id (reference_number, certificate_type, status),
        users:assigned_user_id (first_name, last_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (assignError) {
      console.error('Error fetching assignments:', assignError);
      return;
    }
    
    console.log(`\nCurrent workflow assignments (last 10):`);
    if (assignments && assignments.length > 0) {
      assignments.forEach(assignment => {
        const request = assignment.certificate_requests;
        const user = assignment.users;
        console.log(`- ${request?.reference_number || 'N/A'} (${request?.certificate_type || 'N/A'}) -> Step ${assignment.step_id}: ${assignment.step_name} -> ${user?.first_name || 'Unknown'} ${user?.last_name || 'User'} (${assignment.status})`);
      });
    } else {
      console.log('No assignments found');
    }
    
    // Check users available for assignment
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, role')
      .order('first_name');
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    console.log(`\nAvailable users for assignment:`);
    users.forEach(user => {
      console.log(`- ${user.first_name} ${user.last_name} (${user.email}) - ID: ${user.id} - Role: ${user.role}`);
    });
    
    // Check pending certificate requests
    const { data: pendingRequests, error: requestsError } = await supabase
      .from('certificate_requests')
      .select('id, reference_number, certificate_type, status, created_at')
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (requestsError) {
      console.error('Error fetching pending requests:', requestsError);
      return;
    }
    
    console.log(`\nPending/Processing certificate requests:`);
    if (pendingRequests && pendingRequests.length > 0) {
      pendingRequests.forEach(request => {
        console.log(`- ${request.reference_number} (${request.certificate_type}) - Status: ${request.status} - Created: ${new Date(request.created_at).toLocaleDateString()}`);
      });
    } else {
      console.log('No pending/processing requests found');
    }
    
    console.log('\n✅ Test completed successfully');
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testWorkflowSync();