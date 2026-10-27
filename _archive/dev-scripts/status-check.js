const http = require('http');

async function checkStatus() {
  console.log('🔍 CompanyHub System Status Check');
  console.log('='.repeat(50));
  
  // Check MongoDB (via backend health)
  try {
    const response = await fetch('http://localhost:5000/api/health');
    const data = await response.json();
    console.log('✅ Backend API:', data.status, `(${Math.floor(data.uptime)}s uptime)`);
  } catch (error) {
    console.log('❌ Backend API: Not responding');
  }
  
  // Check Frontend
  try {
    const response = await fetch('http://localhost:3002');
    console.log('✅ Frontend:', response.status === 200 ? 'Running' : `Status ${response.status}`);
  } catch (error) {
    console.log('❌ Frontend: Not accessible');
  }
  
  // Test Login API
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
    });
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Login API: Working');
      console.log(`   User: ${data.data.user.firstName} ${data.data.user.lastName} (${data.data.user.role})`);
    } else {
      console.log('❌ Login API:', data.message);
    }
  } catch (error) {
    console.log('❌ Login API: Error -', error.message);
  }
  
  console.log('='.repeat(50));
  console.log('🌐 Access URLs:');
  console.log('   Frontend: http://localhost:3002');
  console.log('   Backend:  http://localhost:5000/api');
  console.log('   Test:     test-login-flow.html');
  console.log('');
  console.log('🔐 Login Credentials:');
  console.log('   Admin: admin@example.com / admin123');
  console.log('   User:  user@example.com / user123');
}

checkStatus().catch(console.error);