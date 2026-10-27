const { supabase } = require('./backend/services/supabaseClient');

async function checkWorkflowTableStructure() {
  try {
    console.log('=== CHECKING WORKFLOW TABLE STRUCTURE ===');
    
    // Check workflow_assignments table structure
    console.log('1. Checking workflow_assignments table structure...');
    const { data: assignments, error: assignError } = await supabase
      .from('workflow_assignments')
      .select('*')
      .limit(1);
    
    if (assignError) {
      console.error('Error accessing workflow_assignments:', assignError);
    } else {
      console.log('✅ workflow_assignments table accessible');
      if (assignments.length > 0) {
        console.log('   Columns:', Object.keys(assignments[0]));
      } else {
        console.log('   Table is empty, inserting test record to see structure...');
        
        // Get a certificate request to test with
        const { data: testRequest } = await supabase
          .from('certificate_requests')
          .select('id, certificate_type')
          .limit(1)
          .single();
        
        if (testRequest) {
          const { data: testAssignment, error: insertError } = await supabase
            .from('workflow_assignments')
            .insert([{
              request_id: testRequest.id,
              request_type: testRequest.certificate_type,
              step_id: 1,
              step_name: 'Submitted',
              assigned_user_id: '9550a8b2-9e32-4f52-a260-52766afb49b1',
              status: 'pending'
            }])
            .select()
            .single();
          
          if (insertError) {
            console.error('Error inserting test assignment:', insertError);
          } else {
            console.log('✅ Test assignment created');
            console.log('   Columns:', Object.keys(testAssignment));
          }
        }
      }
    }
    
    // Check workflow_history table structure
    console.log('\n2. Checking workflow_history table structure...');
    const { data: history, error: historyError } = await supabase
      .from('workflow_history')
      .select('*')
      .limit(1);
    
    if (historyError) {
      console.error('Error accessing workflow_history:', historyError);
    } else {
      console.log('✅ workflow_history table accessible');
      if (history.length > 0) {
        console.log('   Columns:', Object.keys(history[0]));
      } else {
        console.log('   Table is empty');
      }
    }
    
    // Check workflow_configurations table structure
    console.log('\n3. Checking workflow_configurations table structure...');
    const { data: configs, error: configError } = await supabase
      .from('workflow_configurations')
      .select('*')
      .limit(1);
    
    if (configError) {
      console.error('Error accessing workflow_configurations:', configError);
    } else {
      console.log('✅ workflow_configurations table accessible');
      if (configs.length > 0) {
        console.log('   Columns:', Object.keys(configs[0]));
        console.log('   Certificate types available:', configs.map(c => c.certificate_type));
      } else {
        console.log('   Table is empty');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkWorkflowTableStructure();