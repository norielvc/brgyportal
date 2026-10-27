const { supabase } = require('./backend/services/supabaseClient');

async function testWorkflowAssignment() {
  try {
    console.log('=== TESTING WORKFLOW ASSIGNMENT ===');
    
    // First, let's submit a test certificate request
    console.log('1. Submitting test certificate request...');
    
    const testRequest = {
      fullName: 'TEST WORKFLOW USER',
      age: 35,
      sex: 'Male',
      civilStatus: 'Married',
      address: 'Test Address for Workflow',
      contactNumber: '09123456789',
      dateOfBirth: '1989-01-01',
      placeOfBirth: 'Test Place',
      purpose: 'Testing workflow assignment'
    };
    
    // Submit via API call to ensure proper reference number generation
    const response = await fetch('http://localhost:5005/api/certificates/clearance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testRequest)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Certificate request submitted successfully');
      console.log(`   Reference: ${result.referenceNumber}`);
      console.log(`   Request ID: ${result.data.id}`);
      
      // Now check if it appears in the database with correct status
      console.log('\n2. Checking request in database...');
      
      const { data: dbRequest, error: dbError } = await supabase
        .from('certificate_requests')
        .select('*')
        .eq('id', result.data.id)
        .single();
      
      if (dbError) {
        console.error('Error fetching request from database:', dbError);
        return;
      }
      
      console.log('✅ Request found in database:');
      console.log(`   Status: ${dbRequest.status}`);
      console.log(`   Type: ${dbRequest.certificate_type}`);
      console.log(`   Full Name: ${dbRequest.full_name}`);
      
      // Now test the workflow assignment logic
      console.log('\n3. Testing workflow assignment logic...');
      
      // Load workflows
      const fs = require('fs');
      const path = require('path');
      const workflowsPath = path.join(__dirname, 'backend/data/workflows.json');
      const workflows = JSON.parse(fs.readFileSync(workflowsPath, 'utf8'));
      
      console.log('Workflows loaded for certificate types:', Object.keys(workflows));
      
      // Get workflow for barangay_clearance
      const workflowSteps = workflows[dbRequest.certificate_type];
      console.log(`Workflow steps for ${dbRequest.certificate_type}:`, workflowSteps.length);
      
      // For pending status, should be assigned to step 1 (Under Review)
      const statusToStepIndex = {
        'pending': 1,
        'submitted': 1,
        'processing': 2,
        'approved': 3,
        'ready': 3,
        'released': 4
      };
      
      const stepIndex = statusToStepIndex[dbRequest.status] || 0;
      const currentStep = workflowSteps[stepIndex];
      
      console.log(`\nFor status '${dbRequest.status}', step index is: ${stepIndex}`);
      console.log(`Current step: ${currentStep.name}`);
      console.log(`Requires approval: ${currentStep.requiresApproval}`);
      console.log(`Assigned users: ${JSON.stringify(currentStep.assignedUsers)}`);
      
      // Check if Noriel Cruz (staff account) is assigned
      const norielId = '9550a8b2-9e32-4f52-a260-52766afb49b1';
      const isNorielAssigned = currentStep.assignedUsers.includes(norielId);
      
      console.log(`\nIs Noriel Cruz (${norielId}) assigned to this step? ${isNorielAssigned ? '✅ YES' : '❌ NO'}`);
      
      if (isNorielAssigned && currentStep.requiresApproval) {
        console.log('🎉 SUCCESS! The request should appear in Noriel\'s "My Assignments" section');
      } else {
        console.log('❌ ISSUE: The request will NOT appear in Noriel\'s assignments');
      }
      
    } else {
      console.error('❌ Failed to submit certificate request:', result.message);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testWorkflowAssignment();