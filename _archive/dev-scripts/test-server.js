const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  
  if (req.url === '/test') {
    res.end(JSON.stringify({ 
      message: 'Test server is working!', 
      timestamp: new Date().toISOString() 
    }));
  } else {
    res.end(JSON.stringify({ 
      message: 'Simple test server', 
      url: req.url,
      method: req.method 
    }));
  }
});

server.listen(5001, () => {
  console.log('🚀 Test server running on http://localhost:5001');
  console.log('📊 Test URL: http://localhost:5001/test');
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});