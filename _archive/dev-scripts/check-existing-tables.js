const { supabase } = require('./backend/services/supabaseClient');

async function checkExistingTables() {
  try {
    console.log('=== CHECKING EXISTING TABLES ===');
    
    // Check certificate_requests table structure
    console.log('1. Checking certificate_requests table...');
    const { data: certRequests, error: certError } = await supabase
      .from('certificate_requests')
      .select('*')
      .limit(1);
    
    if (certError) {
      console.log('❌ certificate_requests table does not exist or has issues:', certError.message);
    } else {
      console.log('✅ certificate_requests table exists');
      if (certRequests.length > 0) {
        console.log('   Sample columns:', Object.keys(certRequests[0]));
      }
    }
    
    // Check if workflow_assignments table exists
    console.log('\n2. Checking workflow_assignments table...');
    const { data: workflowData, error: workflowError } = await supabase
      .from('workflow_assignments')
      .select('*')
      .limit(1);
    
    if (workflowError) {
      console.log('❌ workflow_assignments table does not exist:', workflowError.message);
    } else {
      console.log('✅ workflow_assignments table exists');
      if (workflowData.length > 0) {
        console.log('   Sample columns:', Object.keys(workflowData[0]));
      }
    }
    
    // Check if workflow_history table exists
    console.log('\n3. Checking workflow_history table...');
    const { data: historyData, error: historyError } = await supabase
      .from('workflow_history')
      .select('*')
      .limit(1);
    
    if (historyError) {
      console.log('❌ workflow_history table does not exist:', historyError.message);
    } else {
      console.log('✅ workflow_history table exists');
      if (historyData.length > 0) {
        console.log('   Sample columns:', Object.keys(historyData[0]));
      }
    }
    
    // Check users table
    console.log('\n4. Checking users table...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (userError) {
      console.log('❌ users table does not exist:', userError.message);
    } else {
      console.log('✅ users table exists');
      if (userData.length > 0) {
        console.log('   Sample columns:', Object.keys(userData[0]));
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkExistingTables();