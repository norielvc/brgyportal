const { supabase } = require('./backend/services/supabaseClient');

async function testConstraintAndApproval() {
  console.log('🔍 Testing certificate status constraint and approval process...\n');

  try {
    // Test 1: Check current constraint
    console.log('1. Checking current constraint on certificate_requests table...');
    const { data: constraints, error: constraintError } = await supabase.rpc('sql', {
      query: `
        SELECT 
          conname as constraint_name,
          pg_get_constraintdef(oid) as constraint_definition
        FROM pg_constraint 
        WHERE conrelid = 'certificate_requests'::regclass 
        AND contype = 'c'
        ORDER BY conname;
      `
    });

    if (constraintError) {
      console.log('❌ Error checking constraints:', constraintError);
    } else {
      console.log('✅ Current constraints:');
      constraints.forEach(c => {
        console.log(`   - ${c.constraint_name}: ${c.constraint_definition}`);
      });
    }

    // Test 2: Try to insert a test record with 'ready' status
    console.log('\n2. Testing direct status update to "ready"...');
    
    // First, find an existing certificate request
    const { data: existingRequest, error: fetchError } = await supabase
      .from('certificate_requests')
      .select('id, reference_number, status')
      .limit(1)
      .single();

    if (fetchError) {
      console.log('❌ Error fetching existing request:', fetchError);
      return;
    }

    console.log(`   Found request: ${existingRequest.reference_number} (current status: ${existingRequest.status})`);

    // Try to update to 'ready' status
    const { data: updateResult, error: updateError } = await supabase
      .from('certificate_requests')
      .update({ status: 'ready' })
      .eq('id', existingRequest.id)
      .select();

    if (updateError) {
      console.log('❌ Error updating to "ready" status:', updateError);
    } else {
      console.log('✅ Successfully updated to "ready" status');
      
      // Revert back to original status
      await supabase
        .from('certificate_requests')
        .update({ status: existingRequest.status })
        .eq('id', existingRequest.id);
      console.log(`   Reverted back to original status: ${existingRequest.status}`);
    }

    // Test 3: Try with 'ready_for_pickup' to confirm it fails
    console.log('\n3. Testing "ready_for_pickup" status (should fail)...');
    const { data: badUpdateResult, error: badUpdateError } = await supabase
      .from('certificate_requests')
      .update({ status: 'ready_for_pickup' })
      .eq('id', existingRequest.id)
      .select();

    if (badUpdateError) {
      console.log('✅ Correctly rejected "ready_for_pickup" status:', badUpdateError.message);
    } else {
      console.log('❌ Unexpectedly accepted "ready_for_pickup" status');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testConstraintAndApproval();