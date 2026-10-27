const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;

// Simple in-memory database
let users = [
  {
    _id: '1',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3QJgusgqSK', // admin123
    role: 'admin',
    status: 'active',
    loginCount: 25,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '2',
    firstName: 'John',
    lastName: 'Doe',
    email: 'user@example.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3QJgusgqSK', // user123
    role: 'user',
    status: 'active',
    loginCount: 12,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: 'development'
  });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    const token = jwt.sign(
      { userId: user._id },
      'your-secret-key',
      { expiresIn: '7d' }
    );
    
    // Update login stats
    user.lastLogin = new Date();
    user.loginCount += 1;
    
    const { password: _, ...userResponse } = user;
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token,
        expiresIn: '7d'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const adminUsers = users.filter(u => u.role === 'admin').length;
  
  res.json({
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
  });
});

app.listen(PORT, () => {
  console.log('🚀 Simple server running on port', PORT);
  console.log('✅ Ready to accept connections');
  console.log('📊 Environment: development');
  console.log('🔗 API URL: http://localhost:5000/api');
});