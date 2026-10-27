const { supabase } = require('./backend/services/supabaseClient');

async function testApprovalWorkflow() {
  console.log('🔍 Testing approval workflow directly...\n');

  try {
    // Find a certificate request that can be approved
    const { data: request, error: fetchError } = await supabase
      .from('certificate_requests')
      .select('*')
      .eq('status', 'pending')
      .limit(1)
      .single();

    if (fetchError) {
      console.log('❌ Error fetching request:', fetchError);
      return;
    }

    console.log(`Found request: ${request.reference_number}`);

    // Test the certificate generation service directly
    console.log('\n1. Testing certificate generation service...');
    
    try {
      const certificateGenerationService = require('./backend/services/certificateGenerationService');
      const result = await certificateGenerationService.generateCertificate(request.id);
      console.log('✅ Certificate generation result:', result);
    } catch (certError) {
      console.log('❌ Certificate generation error:', certError.message);
    }

    // Check what status the request has now
    const { data: updatedRequest, error: checkError } = await supabase
      .from('certificate_requests')
      .select('status')
      .eq('id', request.id)
      .single();

    if (checkError) {
      console.log('❌ Error checking updated status:', checkError);
    } else {
      console.log(`Current status after generation: ${updatedRequest.status}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testApprovalWorkflow();