const { supabase } = require('./backend/services/supabaseClient');

async function testWorkflowTables() {
  try {
    console.log('=== TESTING WORKFLOW TABLES ===');
    
    // Test 1: Check if workflow tables exist
    console.log('1. Checking if workflow tables exist...');
    
    const { data: assignments, error: assignError } = await supabase
      .from('workflow_assignments')
      .select('*')
      .limit(1);
    
    if (assignError) {
      console.log('❌ workflow_assignments table not found:', assignError.message);
    } else {
      console.log('✅ workflow_assignments table exists');
    }
    
    const { data: history, error: historyError } = await supabase
      .from('workflow_history')
      .select('*')
      .limit(1);
    
    if (historyError) {
      console.log('❌ workflow_history table not found:', historyError.message);
    } else {
      console.log('✅ workflow_history table exists');
    }
    
    // Test 2: Test workflow assignment creation (if tables exist)
    if (!assignError && !historyError) {
      console.log('\n2. Testing workflow assignment creation...');
      
      // Get a test certificate request
      const { data: testRequest, error: requestError } = await supabase
        .from('certificate_requests')
        .select('*')
        .eq('certificate_type', 'barangay_clearance')
        .limit(1)
        .single();
      
      if (requestError || !testRequest) {
        console.log('No test certificate request found, creating one...');
        
        // Create a test request first
        const { data: newRequest, error: createError } = await supabase
          .from('certificate_requests')
          .insert([{
            reference_number: 'TEST-WORKFLOW-001',
            certificate_type: 'barangay_clearance',
            full_name: 'TEST WORKFLOW USER',
            age: 30,
            sex: 'Male',
            civil_status: 'Single',
            address: 'Test Address',
            contact_number: '09123456789',
            date_of_birth: '1994-01-01',
            place_of_birth: 'Test Place',
            purpose: 'Testing workflow tables',
            status: 'pending'
          }])
          .select()
          .single();
        
        if (createError) {
          console.error('❌ Failed to create test request:', createError);
          return;
        }
        
        console.log('✅ Test request created:', newRequest.reference_number);
        
        // Test workflow assignment creation
        const { data: assignment, error: assignmentError } = await supabase
          .from('workflow_assignments')
          .insert([{
            request_id: newRequest.id,
            certificate_type: 'barangay_clearance',
            current_step: 1,
            current_step_name: 'Submitted',
            assigned_to: [],
            status: 'pending'
          }])
          .select()
          .single();
        
        if (assignmentError) {
          console.error('❌ Failed to create workflow assignment:', assignmentError);
        } else {
          console.log('✅ Workflow assignment created successfully');
          
          // Test workflow history logging
          const { data: historyEntry, error: historyEntryError } = await supabase
            .from('workflow_history')
            .insert([{
              request_id: newRequest.id,
              certificate_type: 'barangay_clearance',
              action: 'created',
              from_step: null,
              to_step: 1,
              performed_by: '9550a8b2-9e32-4f52-a260-52766afb49b1', // Noriel Cruz
              comments: 'Workflow assignment created for testing'
            }])
            .select()
            .single();
          
          if (historyEntryError) {
            console.error('❌ Failed to create workflow history:', historyEntryError);
          } else {
            console.log('✅ Workflow history entry created successfully');
          }
        }
      }
    }
    
    // Test 3: Query workflow assignments for staff users
    if (!assignError) {
      console.log('\n3. Testing workflow queries for staff users...');
      
      const staffUserId = '9550a8b2-9e32-4f52-a260-52766afb49b1'; // Noriel Cruz
      
      // Query assignments where user is in the assigned_to array
      const { data: userAssignments, error: queryError } = await supabase
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
        .contains('assigned_to', [staffUserId]);
      
      if (queryError) {
        console.error('❌ Failed to query user assignments:', queryError);
      } else {
        console.log(`✅ Found ${userAssignments.length} assignments for staff user`);
        userAssignments.forEach(assignment => {
          console.log(`   - ${assignment.certificate_requests?.reference_number} (Step ${assignment.current_step}: ${assignment.current_step_name})`);
        });
      }
    }
    
    console.log('\n=== WORKFLOW TABLES TEST COMPLETE ===');
    
  } catch (error) {
    console.error('Error testing workflow tables:', error);
  }
}

testWorkflowTables();