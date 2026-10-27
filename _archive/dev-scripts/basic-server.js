const http = require('http');
const url = require('url');

// Simple in-memory users
const users = [
  {
    _id: '1',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: 'admin123', // In real app, this would be hashed
    role: 'admin',
    status: 'active',
    loginCount: 25,
    lastLogin: new Date(),
    createdAt: new Date()
  },
  {
    _id: '2',
    firstName: 'John',
    lastName: 'Doe',
    email: 'user@example.com',
    password: 'user123',
    role: 'user',
    status: 'active',
    loginCount: 12,
    lastLogin: new Date(),
    createdAt: new Date()
  }
];

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  // Health check endpoint
  if (path === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: 'development'
    }));
    return;
  }

  // Login endpoint
  if (path === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const { email, password } = JSON.parse(body);
        
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
          // Update login stats
          user.lastLogin = new Date();
          user.loginCount += 1;
          
          const { password: _, ...userResponse } = user;
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: 'Login successful',
            data: {
              user: userResponse,
              token: 'fake-jwt-token-' + Date.now(),
              expiresIn: '7d'
            }
          }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            message: 'Invalid email or password'
          }));
        }
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Invalid JSON'
        }));
      }
    });
    return;
  }

  // Dashboard stats endpoint
  if (path === '/api/dashboard/stats' && req.method === 'GET') {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const adminUsers = users.filter(u => u.role === 'admin').length;
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          adminUsers,
          regularUsers: totalUsers - adminUsers,
          currentMonthUsers: 2,
          growthPercentage: 15.5
        },
        recentActivity: {
          recentUsers: users.slice(0, 5),
          activeUsers: users.slice(0, 5)
        }
      }
    }));
    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: false,
    message: 'Endpoint not found'
  }));
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log('🚀 Basic server running on port', PORT);
  console.log('✅ Ready to accept connections');
  console.log('📊 Environment: development');
  console.log('🔗 API URL: http://localhost:5000/api');
  console.log('');
  console.log('Test with:');
  console.log('- Health: http://localhost:5000/api/health');
  console.log('- Login: admin@example.com / admin123');
});