const { default: fetch } = require('node-fetch');

async function testSyncEndpoint() {
  try {
    console.log('=== TESTING SYNC ENDPOINT ===');
    
    // First, get an admin token (you'll need to replace this with actual admin credentials)
    const loginResponse = await fetch('http://localhost:5005/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@example.com', // Replace with actual admin email
        password: 'admin123' // Replace with actual admin password
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      console.error('Failed to login:', loginData.message);
      return;
    }
    
    console.log('✅ Successfully logged in as admin');
    const token = loginData.token;
    
    // Test the sync endpoint
    console.log('Testing sync endpoint...');
    const syncResponse = await fetch('http://localhost:5005/api/workflows/sync-assignments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const syncData = await syncResponse.json();
    
    if (syncData.success) {
      console.log('✅ Sync endpoint test successful!');
      console.log('Results:');
      console.log(`- Total assignments: ${syncData.data.totalAssignments}`);
      console.log(`- Updated steps: ${syncData.data.updatedSteps}`);
      console.log(`- Errors: ${syncData.data.errors.length}`);
      
      if (syncData.data.errors.length > 0) {
        console.log('Errors:');
        syncData.data.errors.forEach(error => console.log(`  - ${error}`));
      }
    } else {
      console.error('❌ Sync endpoint test failed:', syncData.message);
    }
    
  } catch (error) {
    console.error('Error testing sync endpoint:', error.message);
  }
}

testSyncEndpoint();