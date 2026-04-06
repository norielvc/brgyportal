const jwt = require('jsonwebtoken');
const { supabase } = require('../services/supabaseClient');

/**
 * Middleware to authenticate JWT tokens (Supabase version)
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user in Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active'
      });
    }

    // Add user to request object (transform to match expected format)
    const userRole = user.role;
    req.user = {
      _id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: userRole,
      status: user.status,
      avatar: user.avatar,
      lastLogin: user.last_login,
      loginCount: user.login_count,
      tenant_id: user.tenant_id,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };

    /**
     * MULTI-TENANT ENFORCEMENT
     * Force the tenant ID header to match the user's verified record.
     * This prevents header spoofing and ensures data isolation.
     * Superadmins are allowed to override if they provide a header.
     */
    if (userRole === 'superadmin') {
      req.headers['x-tenant-id'] = req.headers['x-tenant-id'] || user.tenant_id;
    } else {
      req.headers['x-tenant-id'] = user.tenant_id;
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Middleware to check if user has admin role
 */
/**
 * Middleware to check if user has admin role
 */
const requireAdmin = (req, res, next) => {
  const allowedRoles = ['superadmin', 'super_admin', 'admin', 'captain', 'secretary', 'staff'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Elevated privileges required'
    });
  }
  next();
};

/**
 * Middleware to check if user has superadmin role exclusively
 */
const requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Reserved for System-Wide Administrators only'
    });
  }
  next();
};

/**
 * Middleware to check if user can access resource (admin or own resource)
 */
const requireAdminOrOwner = (req, res, next) => {
  const userId = req.params.id || req.params.userId;
  const allowedRoles = ['superadmin', 'super_admin', 'admin', 'captain', 'secretary', 'staff'];

  if (allowedRoles.includes(req.user.role) || req.user._id === userId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied - insufficient permissions'
  });
};

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * Middleware that tries to authenticate a token but won't fail if it's missing.
 * Useful for public routes that can ALSO be accessed by logged-in users.
 */
const optionalAuthenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return next();
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data: user } = await supabase.from('users').select('*').eq('id', decoded.userId).single();
    if (user && user.status === 'active') {
      req.user = { id: user.id, tenant_id: user.tenant_id, role: user.role };
    }
    next();
  } catch (err) {
    // If token is invalid, just proceed as public (it won't have req.user)
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuthenticateToken,
  requireAdmin,
  requireSuperAdmin,
  requireAdminOrOwner,
  generateToken
};
