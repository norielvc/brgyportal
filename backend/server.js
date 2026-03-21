const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth-supabase');
const userRoutes = require('./routes/users-supabase');
const dashboardRoutes = require('./routes/dashboard-supabase');
const certificateRoutes = require('./routes/certificates-supabase');
const workflowRoutes = require('./routes/workflows-supabase');
const workflowAssignmentRoutes = require('./routes/workflow-assignments-supabase');
const eventRoutes = require('./routes/events-supabase');
const facilityRoutes = require('./routes/facilities-supabase');
const officialRoutes = require('./routes/officials-supabase');
const educationalAssistanceRoutes = require('./routes/educational-assistance-supabase');
const employeeScansRoutes = require('./routes/employee-scans-supabase');
const employeesQRRoutes = require('./routes/employees-qr-supabase');
const qrScansRoutes = require('./routes/qr-scans-supabase');
const pickupRoutes = require('./routes/pickup-supabase');
const signatureRoutes = require('./routes/signatures');
const physicalInspectionRoutes = require('./routes/physical-inspection-supabase');
const officialReceiptRoutes = require('./routes/official-receipts-supabase');
const residentRoutes = require('./routes/residents-supabase');
const achievementRoutes = require('./routes/achievements-supabase');
const programRoutes = require('./routes/programs-supabase');
const tenantRoutes = require('./routes/tenants-supabase');
const homepageRoutes = require('./routes/homepage-supabase');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { authenticateToken, optionalAuthenticateToken } = require('./middleware/auth-supabase');

// Deployment Sync: 2026-03-19 19:39 - fix inline supabase createClient crash in routes

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for Railway/Vercel (required for rate limiting behind proxies)
app.set('trust proxy', 1);

// Security middleware with development-friendly CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:", "data:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:", "http:", "ws:", "wss:"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
      connectSrc: ["'self'", "ws:", "wss:", "https:", "http:", "localhost:*", "127.0.0.1:*"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "data:", "blob:"],
      frameSrc: ["'self'"],
      childSrc: ["'self'", "blob:"],
      workerSrc: ["'self'", "blob:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for development
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin requests
}));

// Rate limiting - disabled temporarily for Railway compatibility
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
//   message: 'Too many requests from this IP, please try again later.',
//   standardHeaders: true,
//   legacyHeaders: false,
//   validate: { xForwardedForHeader: false }
// });
// app.use('/api/', limiter);

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3002',
  'http://localhost:3003',
  'http://127.0.0.1:3003',
  'http://localhost:3004',
  'http://127.0.0.1:3004',
  'http://localhost:3005',
  'http://127.0.0.1:3005'
];

// Add production URLs from environment variable
if (process.env.FRONTEND_URL) {
  const extraOrigins = process.env.FRONTEND_URL.split(',').map(o => o.trim());
  allowedOrigins.push(...extraOrigins);
}
// Force inclusion of the production frontend URL
allowedOrigins.push('https://brgyportal-frontend-production.up.railway.app');
allowedOrigins.push('http://brgyportal-frontend-production.up.railway.app');

if (process.env.ALLOWED_ORIGINS) {
  const extraOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
  allowedOrigins.push(...extraOrigins);
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id']
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Supabase connection check
const { supabase } = require('./services/supabaseClient');
console.log('✅ Connected to Supabase');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/official-receipts/files', express.static(path.join(__dirname, 'generated-receipts')));
app.use('/api/certificates/files', express.static(path.join(__dirname, 'generated-certificates')));
app.use('/api/official-receipts', authenticateToken, officialReceiptRoutes); 
app.use('/api/residents', authenticateToken, residentRoutes); 
app.use('/api/achievements', optionalAuthenticateToken, achievementRoutes); 
app.use('/api/programs', optionalAuthenticateToken, programRoutes); 
app.use('/api/tenants', authenticateToken, tenantRoutes); 
app.use('/api/homepage', optionalAuthenticateToken, homepageRoutes);
app.use('/api/officials', optionalAuthenticateToken, officialRoutes); 
app.use('/api/certificates', authenticateToken, certificateRoutes); 
app.use('/api/workflows', authenticateToken, workflowRoutes); 
app.use('/api/workflow-assignments', authenticateToken, workflowAssignmentRoutes); 
app.use('/api/events', optionalAuthenticateToken, eventRoutes); 
app.use('/api/facilities', optionalAuthenticateToken, facilityRoutes); 
app.use('/api/pickup', pickupRoutes); 
app.use('/api/educational-assistance', educationalAssistanceRoutes); 
app.use('/api/employee-scans', authenticateToken, employeeScansRoutes); 
app.use('/api/employees', authenticateToken, employeesQRRoutes); 
app.use('/api/qr-scans', authenticateToken, qrScansRoutes); 
app.use('/api/user/signatures', authenticateToken, signatureRoutes); 
app.use('/api/physical-inspection', authenticateToken, physicalInspectionRoutes); 


// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://0.0.0.0:${PORT}/api`);
});
