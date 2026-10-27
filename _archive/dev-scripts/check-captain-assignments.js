const { supabase } = require('./backend/services/supabaseClient');

async function checkCaptainAssignments() {
  try {
    console.log('=== CHECKING CAPTAIN WORKFLOW ASSIGNMENTS ===');
    
    // Captain/Admin user IDs
    const captainIds = [
      'aaa242af-6ef2-4c72-8729-f8e8d68ec1fa', // David Brown
      '2a6054aa-d73d-4f52-876f-efa95f77add9'  // Admin User
    ];
    
    console.log('Captain/Admin user IDs:', captainIds);
    
    // Check BC-2026-00014 specifically
    console.log('\n1. Checking BC-2026-00014 certificate request...');
    
    const { data: request, error: requestError } = await supabase
      .from('certificate_requests')
      .select('*')
      .eq('reference_number', 'BC-2026-00014')
      .single();
    
    if (requestError) {
      console.error('Error fetching BC-2026-00014:', requestError);
      return;
    }
    
    console.log('✅ Found BC-2026-00014:');
    console.log(`   Status: ${request.status}`);
    console.log(`   Full Name: ${request.full_name}`);
    console.log(`   Created: ${request.created_at}`);
    console.log(`   Request ID: ${request.id}`);
    
    // Check workflow assignments for this request
    console.log('\n2. Checking workflow assignments for BC-2026-00014...');
    
    const { data: assignments, error: assignError } = await supabase
      .from('workflow_assignments')
      .select('*')
      .eq('request_id', request.id);
    
    if (assignError) {
      console.error('Error fetching assignments:', assignError);
      return;
    }
    
    console.log(`✅ Found ${assignments.length} workflow assignments:`);
    assignments.forEach(assignment => {
      console.log(`   - Step ${assignment.step_id}: ${assignment.step_name}`);
      console.log(`     Assigned to: ${assignment.assigned_user_id}`);
      console.log(`     Status: ${assignment.status}`);
      console.log(`     Created: ${assignment.created_at}`);
      console.log('   ---');
    });
    
    // Check if there are captain assignments for this request
    const captainAssignments = assignments.filter(a => 
      captainIds.includes(a.assigned_user_id) && a.status === 'pending'
    );
    
    console.log(`\n3. Captain assignments for BC-2026-00014: ${captainAssignments.length}`);
    
    if (captainAssignments.length === 0) {
      console.log('❌ NO CAPTAIN ASSIGNMENTS FOUND!');
      console.log('   This is why the captain cannot see this request.');
      
      // Check if we need to create captain assignments
      if (request.status === 'processing') {
        console.log('\n4. Creating captain assignments for processing request...');
        
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
            console.error(`❌ Failed to create captain assignment for ${captainId}:`, createError);
          } else {
            console.log(`✅ Created captain assignment for ${captainId}`);
          }
        }
      }
    } else {
      console.log('✅ Captain assignments exist:');
      captainAssignments.forEach(assignment => {
        console.log(`   - Captain ${assignment.assigned_user_id}: ${assignment.step_name}`);
      });
    }
    
    // Check all captain assignments across all requests
    console.log('\n5. Checking ALL captain assignments...');
    
    for (const captainId of captainIds) {
      const { data: allAssignments, error: allError } = await supabase
        .from('workflow_assignments')
        .select(`
          *,
          certificate_requests:request_id (
            reference_number,
            full_name,
            status
          )
        `)
        .eq('assigned_user_id', captainId)
        .eq('status', 'pending');
      
      if (allError) {
        console.error(`Error fetching assignments for ${captainId}:`, allError);
        continue;
      }
      
      console.log(`\nCaptain ${captainId} has ${allAssignments.length} pending assignments:`);
      allAssignments.forEach(assignment => {
        const request = assignment.certificate_requests;
        console.log(`   - ${request.reference_number}: ${request.full_name} (${request.status})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCaptainAssignments();