const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixPendingAssignments() {
  try {
    console.log('🔧 Fixing pending assignments for completed workflow steps...\n');
    
    // Get all requests that are not in initial status
    const { data: requests, error: reqError } = await supabase
      .from('certificate_requests')
      .select('id, reference_number, status, certificate_type')
      .not('status', 'in', '(pending,staff_review,submitted)');
    
    if (reqError) {
      console.error('❌ Error fetching requests:', reqError);
      return;
    }
    
    console.log(`📋 Found ${requests.length} requests in progress/completed status`);
    
    let fixedCount = 0;
    
    for (const request of requests) {
      console.log(`\n🔍 Checking ${request.reference_number} (${request.status})`);
      
      // Get all pending assignments for this request
      const { data: pendingAssignments, error: assignError } = await supabase
        .from('workflow_assignments')
        .select('*')
        .eq('request_id', request.id)
        .eq('status', 'pending');
      
      if (assignError) {
        console.error(`❌ Error fetching assignments for ${request.reference_number}:`, assignError);
        continue;
      }
      
      if (pendingAssignments.length <= 1) {
        console.log(`   ✅ Only ${pendingAssignments.length} pending assignment(s) - OK`);
        continue;
      }
      
      console.log(`   ⚠️  Found ${pendingAssignments.length} pending assignments - need to fix`);
      
      // Determine which assignment should remain pending based on current status
      let keepPendingStepName = '';
      
      switch (request.status) {
        case 'staff_review':
          keepPendingStepName = 'Review Request';
          break;
        case 'physical_inspection':
          keepPendingStepName = 'Inspection Team';
          break;
        case 'captain_approval':
          keepPendingStepName = 'Barangay Chairman Approval';
          break;
        case 'Treasury':
          keepPendingStepName = 'OR Preparation';
          break;
        case 'oic_review':
          keepPendingStepName = 'Releasing Team';
          break;
        default:
          // For completed statuses, mark all as completed
          keepPendingStepName = '';
      }
      
      // Mark inappropriate assignments as completed
      for (const assignment of pendingAssignments) {
        if (assignment.step_name !== keepPendingStepName) {
          console.log(`   🔧 Marking "${assignment.step_name}" as completed`);
          
          const { error: updateError } = await supabase
            .from('workflow_assignments')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', assignment.id);
          
          if (updateError) {
            console.error(`   ❌ Error updating assignment ${assignment.id}:`, updateError);
          } else {
            fixedCount++;
          }
        } else {
          console.log(`   ✅ Keeping "${assignment.step_name}" as pending`);
        }
      }
    }
    
    console.log(`\n✅ Fixed ${fixedCount} pending assignments`);
    console.log('🎯 Users should now only see requests they are currently assigned to');
    
  } catch (error) {
    console.error('❌ Fix error:', error);
  }
}

fixPendingAssignments();