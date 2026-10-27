const fetch = require('node-fetch');

async function testWorkflowAPI() {
  try {
    console.log('=== TESTING WORKFLOW API ===');
    
    const API_URL = 'http://localhost:5005';
    const norielId = '9550a8b2-9e32-4f52-a260-52766afb49b1'; // Noriel Cruz
    
    // Test 1: Get Noriel's workflow assignments
    console.log('1. Testing user workflow assignments...');
    
    const response1 = await fetch(`${API_URL}/api/workflow-assignments/user/${norielId}`);
    const data1 = await response1.json();
    
    if (data1.success) {
      console.log(`✅ Found ${data1.count} assignments for Noriel Cruz`);
      console.log('   Sample assignments:');
      data1.assignments.slice(0, 3).forEach(assignment => {
        const request = assignment.certificate_requests;
        console.log(`   - ${request.reference_number}: ${request.full_name} (${request.certificate_type})`);
      });
    } else {
      console.log('❌ Failed to get assignments:', data1.message);
    }
    
    // Test 2: Test "My Assignments" API (requires auth token)
    console.log('\n2. Testing My Assignments API...');
    console.log('   (This would require authentication token in real usage)');
    
    // Test 3: Check if user is assigned to a specific request
    if (data1.success && data1.assignments.length > 0) {
      const testAssignment = data1.assignments[0];
      const requestId = testAssignment.request_id;
      
      console.log('\n3. Testing specific request assignment check...');
      
      const response3 = await fetch(`${API_URL}/api/workflow-assignments/user/${norielId}/request/${requestId}`);
      const data3 = await response3.json();
      
      if (data3.success) {
        console.log(`✅ User assignment check: ${data3.isAssigned ? 'ASSIGNED' : 'NOT ASSIGNED'}`);
        if (data3.assignment) {
          console.log(`   Step: ${data3.assignment.step_name} (ID: ${data3.assignment.step_id})`);
          console.log(`   Status: ${data3.assignment.status}`);
        }
      } else {
        console.log('❌ Failed to check assignment:', data3.message);
      }
    }
    
    console.log('\n=== WORKFLOW API TEST COMPLETE ===');
    console.log('🎉 The staff account should now see assigned certificate requests!');
    console.log('   Navigate to the Certificate Requests page and click "My Assignments"');
    
  } catch (error) {
    console.error('Error testing workflow API:', error);
  }
}

testWorkflowAPI();