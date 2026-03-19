const express = require('express');
const bcrypt = require('bcryptjs');
const { supabase } = require('../services/supabaseClient');
const { requireAdmin } = require('../middleware/auth-supabase');
const { validateUserCreation, validateUserUpdate } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   GET /api/users
 * @desc    Get all users with search and filtering
 * @access  Private (Admin only)
 */
router.get('/', requireAdmin, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';
    const { search = '', role, status } = req.query;

    let query = supabase.from('users').select('*').eq('tenant_id', tenantId); // MULTI-TENANT FILTER

    // Apply filters
    if (role) {
      query = query.eq('role', role);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: users, error } = await query;

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch users'
      });
    }

    // Client-side search (Supabase free tier limitation)
    let filteredUsers = users || [];
    if (search) {
      filteredUsers = filteredUsers.filter(user =>
        user.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Transform data to match frontend expectations
    const transformedUsers = filteredUsers.map(user => ({
      id: user.id,      // Include both id and _id for compatibility
      _id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      status: user.status,
      position: user.position,
      avatar: user.avatar,
      lastLogin: user.last_login,
      loginCount: user.login_count,
      employeeCode: user.employee_code,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }));

    res.status(200).json({
      success: true,
      data: transformedUsers
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get single user by ID
 * @access  Private (Admin only)
 */
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const transformedUser = {
      _id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      status: user.status,
      position: user.position,
      avatar: user.avatar,
      lastLogin: user.last_login,
      loginCount: user.login_count,
      employeeCode: user.employee_code,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };

    res.status(200).json({
      success: true,
      data: transformedUser
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (Admin only)
 */
router.post('/', requireAdmin, validateUserCreation, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';
    const { firstName, lastName, email, password, role = 'user', status = 'active', position = '', employeeCode = '' } = req.body;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .eq('tenant_id', tenantId) // MULTI-TENANT FILTER
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{
        tenant_id: tenantId, // MULTI-TENANT ASSIGNMENT
        email,
        first_name: firstName,
        last_name: lastName,
        password_hash: hashedPassword,
        role,
        status,
        position,
        employee_code: employeeCode
      }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create user',
        error: error.message
      });
    }

    const transformedUser = {
      _id: newUser.id,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      position: newUser.position,
      avatar: newUser.avatar,
      lastLogin: newUser.last_login,
      loginCount: newUser.login_count,
      employeeCode: newUser.employee_code,
      createdAt: newUser.created_at,
      updatedAt: newUser.updated_at
    };

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: transformedUser
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   PUT /api/users/:id/reset-password
 * @desc    Reset user password (Admin only)
 * @access  Private (Admin only)
 */
router.put('/:id/reset-password', requireAdmin, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';
    const userId = req.params.id;
    const { newPassword } = req.body;

    // Validate password
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user exists
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .eq('tenant_id', tenantId);

    if (updateError) {
      return res.status(400).json({
        success: false,
        message: 'Failed to reset password'
      });
    }

    res.status(200).json({
      success: true,
      message: `Password reset successfully for ${user.first_name} ${user.last_name}`
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin only)
 */
router.put('/:id', requireAdmin, validateUserUpdate, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';
    const { firstName, lastName, email, password, role, status, position, employeeCode } = req.body;
    const userId = req.params.id;

    // Check if user exists
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is already taken
    if (email && email !== user.email) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .eq('tenant_id', tenantId)
        .single();

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use'
        });
      }
    }

    // Build update data
    const updateData = {};
    if (firstName) updateData.first_name = firstName;
    if (lastName) updateData.last_name = lastName;
    if (email) updateData.email = email;
    if (password) updateData.password_hash = await bcrypt.hash(password, 12);
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    if (position !== undefined) updateData.position = position;
    if (employeeCode !== undefined) updateData.employee_code = employeeCode;
    updateData.updated_at = new Date().toISOString();

    // Update user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update user'
      });
    }

    const transformedUser = {
      _id: updatedUser.id,
      firstName: updatedUser.first_name,
      lastName: updatedUser.last_name,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
      position: updatedUser.position,
      avatar: updatedUser.avatar,
      lastLogin: updatedUser.last_login,
      loginCount: updatedUser.login_count,
      employeeCode: updatedUser.employee_code,
      createdAt: updatedUser.created_at,
      updatedAt: updatedUser.updated_at
    };

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: transformedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (Admin only)
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (userId === req.user._id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Check if user exists
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)
      .eq('tenant_id', tenantId);

    if (deleteError) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete user'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
