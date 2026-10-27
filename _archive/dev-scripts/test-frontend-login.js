// Simple test to verify frontend can connect to backend
const https = require('https');
const http = require('http');

async function testFrontendLogin() {
  console.log('🧪 Testing frontend login connection...');
  
  const postData = JSON.stringify({
    email: 'admin@example.com',
    password: 'admin123'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Backend Response:', response);
          resolve(response);
        } catch (error) {
          console.error('❌ Parse Error:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request Error:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

testFrontendLogin()
  .then(() => {
    console.log('\n🎉 Login test completed successfully!');
    console.log('📝 Next steps:');
    console.log('1. Open http://localhost:3000/login in your browser');
    console.log('2. Use credentials: admin@example.com / admin123');
    console.log('3. Or test with debug page: http://localhost:3000/debug');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });