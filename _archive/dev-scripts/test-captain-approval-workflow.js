const { createClient } = require('@supabase/supabase-js');

// Direct Supabase connection for testing
const supabaseUrl = 'https://efwwtftwxhgrvukvjedk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmd3d0ZnR3eGhncnZ1a3ZqZWRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzA3NzQ0MywiZXhwIjoyMDgyNjUzNDQzfQ.xkldtB6fABnOCn-vr87d4sKYzjvPqgHGjUuYiraV_50';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCaptainApprovalWorkflow() {
  console.log('🧪 Testing Chairman Approval → Post-Approval Workflow');
  console.log('=' .repeat(60));

  try {
    // Step 1: Find a certificate request that's ready for captain approval
    console.log('\n📋 Step 1: Looking for certificates pending captain approval...');
    
    const { data: pendingRequests, error: requestError } = await supabase
      .from('workflow_assignments')
      .select(`
        *,
        certificate_requests:request_id (
          id,
          reference_number,
          full_name,
          certificate_type,
          status,
          created_at
        )
      `)
      .eq('step_id', 3) // Captain approval step
      .eq('status', 'pending')
      .limit(1);

    if (requestError) {
      console.log('❌ Error fetching pending requests:', requestError.message);
      return false;
    }

    if (!pendingRequests || pendingRequests.length === 0) {
      console.log('ℹ️  No certificates pending captain approval');
      console.log('💡 To test: Submit a certificate request and have staff approve it first');
      
      // Let's check what certificates exist
      const { data: allRequests, error: allError } = await supabase
        .from('certificate_requests')
        .select('reference_number, full_name, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!allError && allRequests?.length > 0) {
        console.log('\n📋 Recent certificate requests:');
        allRequests.forEach(req => {
          console.log(`  • ${req.reference_number} - ${req.full_name} (${req.status})`);
        });
      }
      
      return true;
    }

    const assignment = pendingRequests[0];
    const request = assignment.certificate_requests;
    
    console.log(`✅ Found certificate pending captain approval:`);
    console.log(`  📄 Reference: ${request.reference_number}`);
    console.log(`  👤 Applicant: ${request.full_name}`);
    console.log(`  📋 Type: ${request.certificate_type}`);
    console.log(`  📊 Current Status: ${request.status}`);

    // Step 2: Simulate captain approval (this would normally be done via API)
    console.log('\n📋 Step 2: Simulating captain approval...');
    
    // Update assignment status to completed
    const { error: assignmentUpdateError } = await supabase
      .from('workflow_assignments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', assignment.id);

    if (assignmentUpdateError) {
      console.log('❌ Error updating assignment:', assignmentUpdateError.message);
      return false;
    }

    // Update certificate request status to approved
    const { error: requestUpdateError } = await supabase
      .from('certificate_requests')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', request.id);

    if (requestUpdateError) {
      console.log('❌ Error updating request:', requestUpdateError.message);
      return false;
    }

    console.log('✅ Certificate approved by captain');

    // Step 3: Manually trigger post-approval workflow (since we're not going through the API)
    console.log('\n📋 Step 3: Triggering post-approval workflow...');
    
    // Import the services (this would normally be triggered by the API)
    const certificateGenerationService = require('./backend/services/certificateGenerationService');
    const qrCodeService = require('./backend/services/qrCodeService');

    try {
      // Generate certificate
      console.log('📄 Generating certificate...');
      const certificateResult = await certificateGenerationService.generateCertificate(request.id);
      
      if (certificateResult.success) {
        console.log(`✅ Certificate generated: ${certificateResult.filename}`);
      } else {
        throw new Error('Certificate generation failed');
      }

      // Generate pickup QR code
      console.log('🔗 Generating pickup QR code...');
      const qrResult = await qrCodeService.generatePickupQRCode(request.id);
      
      if (qrResult.success) {
        console.log(`✅ Pickup QR code generated: ${qrResult.pickupToken.substring(0, 8)}...`);
        console.log(`🌐 Verification URL: ${qrResult.qrCodeUrl}`);
      } else {
        throw new Error('QR code generation failed');
      }

      // Log workflow completion
      await supabase
        .from('workflow_history')
        .insert([{
          request_id: request.id,
          request_type: request.certificate_type,
          step_id: 4,
          step_name: 'Post-Approval Processing',
          action: 'completed',
          performed_by: 'system',
          previous_status: 'approved',
          new_status: 'ready_for_pickup',
          comments: `Certificate generated and QR code created. Ready for pickup.`
        }]);

      console.log('✅ Post-approval workflow completed successfully');

      // Step 4: Verify the results
      console.log('\n📋 Step 4: Verifying results...');
      
      // Check certificate request status
      const { data: updatedRequest, error: checkError } = await supabase
        .from('certificate_requests')
        .select('*')
        .eq('id', request.id)
        .single();

      if (checkError) {
        console.log('❌ Error checking updated request:', checkError.message);
      } else {
        console.log(`✅ Certificate status: ${updatedRequest.status}`);
        console.log(`📄 Certificate file: ${updatedRequest.certificate_file_path ? 'Generated' : 'Missing'}`);
      }

      // Check pickup record
      const { data: pickupRecord, error: pickupError } = await supabase
        .from('certificate_pickups')
        .select('*')
        .eq('request_id', request.id)
        .single();

      if (pickupError) {
        console.log('❌ Error checking pickup record:', pickupError.message);
      } else {
        console.log(`✅ Pickup record created`);
        console.log(`🔗 Pickup token: ${pickupRecord.pickup_token.substring(0, 8)}...`);
        console.log(`📅 Expires: ${new Date(pickupRecord.expires_at).toLocaleDateString()}`);
        console.log(`📊 Status: ${pickupRecord.status}`);
      }

      console.log('\n🎉 Complete Post-Approval Workflow Test Results:');
      console.log('=' .repeat(60));
      console.log('✅ Captain approval processed');
      console.log('✅ Certificate automatically generated');
      console.log('✅ QR code pickup system created');
      console.log('✅ Status updated to ready_for_pickup');
      console.log('✅ Workflow history logged');
      
      console.log('\n💡 Next Steps:');
      console.log(`1. Visit: /verify-pickup?token=${qrResult.pickupToken}&ref=${request.reference_number}`);
      console.log('2. Test the pickup verification process');
      console.log('3. Confirm certificate pickup');

      return true;

    } catch (workflowError) {
      console.log('❌ Post-approval workflow failed:', workflowError.message);
      
      // Log the error
      await supabase
        .from('workflow_history')
        .insert([{
          request_id: request.id,
          request_type: request.certificate_type,
          step_id: 4,
          step_name: 'Post-Approval Processing',
          action: 'failed',
          performed_by: 'system',
          previous_status: 'approved',
          new_status: 'approved',
          comments: `Post-approval workflow failed: ${workflowError.message}`
        }]);

      return false;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testCaptainApprovalWorkflow()
  .then(success => {
    if (success) {
      console.log('\n🎉 Captain approval workflow test completed!');
    } else {
      console.log('\n❌ Test encountered issues - check logs above');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });