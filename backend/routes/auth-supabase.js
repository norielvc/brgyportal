const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../services/supabaseClient');
const { validateLogin } = require('../middleware/validation');
const { authenticateToken, generateToken } = require('../middleware/auth-supabase');

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
router.post('/login', validateLogin, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email} on tenant: ${tenantId}`);

    // Get user from Supabase with tenant filter
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('tenant_id', tenantId) // MULTI-TENANT FILTER
      .single();

    console.log('Supabase query result:', { users: users ? 'found' : 'not found', error: fetchError });

    if (fetchError || !users) {
      console.log('User not found or error:', fetchError);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    console.log('User status:', users.status);
    if (users.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active. Please contact administrator.'
      });
    }

    // Check password
    console.log('Checking password...');
    const isPasswordValid = await bcrypt.compare(password, users.password_hash);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await supabase
      .from('users')
      .update({
        last_login: new Date().toISOString(),
        login_count: users.login_count + 1
      })
      .eq('id', users.id)
      .eq('tenant_id', tenantId); // MULTI-TENANT FILTER

    // Generate token
    const token = generateToken(users.id);

    // Prepare user response (without password)
    const userResponse = {
      id: users.id,       // Include both id and _id for compatibility
      _id: users.id,
      firstName: users.first_name,
      lastName: users.last_name,
      email: users.email,
      role: users.role,
      status: users.status,
      avatar: users.avatar,
      lastLogin: users.last_login,
      loginCount: users.login_count,
      createdAt: users.created_at,
      updatedAt: users.updated_at
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token,
        expiresIn: process.env.JWT_EXPIRE || '7d'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user._id)
      .eq('tenant_id', tenantId) // MULTI-TENANT FILTER
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userResponse = {
      _id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      lastLogin: user.last_login,
      loginCount: user.login_count,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };

    res.status(200).json({
      success: true,
      data: {
        user: userResponse
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';
    const { firstName, lastName, email } = req.body;
    const userId = req.user._id;

    // Check if email is already taken within this tenant
    if (email) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', userId)
        .eq('tenant_id', tenantId) // MULTI-TENANT FILTER
        .single();

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use'
        });
      }
    }

    // Update user
    const updateData = {};
    if (firstName) updateData.first_name = firstName;
    if (lastName) updateData.last_name = lastName;
    if (email) updateData.email = email;
    updateData.updated_at = new Date().toISOString();

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .eq('tenant_id', tenantId) // MULTI-TENANT FILTER
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update profile'
      });
    }

    const userResponse = {
      _id: updatedUser.id,
      firstName: updatedUser.first_name,
      lastName: updatedUser.last_name,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
      avatar: updatedUser.avatar,
      lastLogin: updatedUser.last_login,
      loginCount: updatedUser.login_count,
      createdAt: updatedUser.created_at,
      updatedAt: updatedUser.updated_at
    };

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: userResponse
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;