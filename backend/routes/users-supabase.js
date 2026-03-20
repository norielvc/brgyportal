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
    let targetTenantId = req.user?.tenant_id;
    const { search = '', role, status, tenant_id } = req.query;

    let query = supabase.from('users').select('*');

    // Multi-tenant logic: Superadmins can see anyone, regular admins only their tenant
    if (req.user.role === 'superadmin') {
      if (tenant_id) {
        query = query.eq('tenant_id', tenant_id);
      }
      // If no tenant_id is provided, superadmin sees EVERYTHING globally
    } else {
      query = query.eq('tenant_id', targetTenantId);
    }

    if (role) query = query.eq('role', role);
    if (status) query = query.eq('status', status);

    const { data: users, error } = await query;

    if (error) {
      return res.status(400).json({ success: false, message: 'Failed to fetch users' });
    }

    let filteredUsers = users || [];
    if (search) {
      filteredUsers = filteredUsers.filter(user =>
        user.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase())
      );
    }

    const transformedUsers = filteredUsers.map(user => ({
      id: user.id,
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
      tenantId: user.tenant_id,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }));

    res.status(200).json({ success: true, data: transformedUsers });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get single user by ID
 * @access  Private (Admin only)
 */
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    let query = supabase.from('users').select('*').eq('id', id);

    // Filter by tenant ONLY if not superadmin
    if (req.user.role !== 'superadmin') {
      const tenantId = req.user?.tenant_id;
      if (!tenantId) return res.status(403).json({ success: false, message: 'Tenant context required' });
      query = query.eq('tenant_id', tenantId);
    }

    const { data: user, error } = await query.single();

    if (error || !user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: {
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
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (Admin only)
 * FIX: tenant_id from the request body (UI System dropdown) takes priority
 * so that new users are assigned to the correct tenant, not the creator's tenant.
 */
router.post('/', requireAdmin, validateUserCreation, async (req, res) => {
  try {
    // Default: assign to creator's tenant
    let targetTenantId = req.user?.tenant_id;
    // Allow any admin to override with tenant_id from the form body (e.g., System dropdown)
    if (req.body.tenant_id) {
      targetTenantId = req.body.tenant_id;
    }

    const { firstName, lastName, email, password, role = 'user', status = 'active', position = '', employeeCode = '' } = req.body;

    // Check for existing user globally
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{
        tenant_id: targetTenantId,
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
      return res.status(400).json({ success: false, message: 'Failed to create user', error: error.message });
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        _id: newUser.id,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        tenant_id: newUser.tenant_id,
        createdAt: newUser.created_at
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * @route   PUT /api/users/:id/reset-password
 * @desc    Reset user password (Admin only)
 * @access  Private (Admin only)
 */
router.put('/:id/reset-password', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    let query = supabase.from('users').select('id, email, first_name, last_name, tenant_id').eq('id', userId);

    // Filter by tenant ONLY if not superadmin
    if (req.user.role !== 'superadmin') {
      const tenantId = req.user?.tenant_id;
      if (!tenantId) return res.status(403).json({ success: false, message: 'Tenant context required' });
      query = query.eq('tenant_id', tenantId);
    }

    const { data: user, error: fetchError } = await query.single();

    if (fetchError || !user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    let updateQuery = supabase
      .from('users')
      .update({ password_hash: hashedPassword, updated_at: new Date().toISOString() })
      .eq('id', userId);

    // Filter by tenant ONLY if not superadmin
    if (req.user.role !== 'superadmin') {
      updateQuery = updateQuery.eq('tenant_id', req.user.tenant_id);
    }

    const { error: updateError } = await updateQuery;

    if (updateError) {
      return res.status(400).json({ success: false, message: 'Failed to reset password' });
    }

    res.status(200).json({ success: true, message: `Password reset successfully for ${user.first_name} ${user.last_name}` });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin only)
 */
router.put('/:id', requireAdmin, validateUserUpdate, async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, status, position, employeeCode } = req.body;
    const userId = req.params.id;

    let query = supabase.from('users').select('*').eq('id', userId);

    // Filter by tenant ONLY if not superadmin
    if (req.user.role !== 'superadmin') {
      const targetTenantId = req.user?.tenant_id;
      if (!targetTenantId) return res.status(403).json({ success: false, message: 'Tenant context required' });
      query = query.eq('tenant_id', targetTenantId);
    }

    const { data: user, error: fetchError } = await query.single();

    if (fetchError || !user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (email && email !== user.email) {
      const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).single();
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email is already in use' });
      }
    }

    const updateData = {};
    if (firstName) updateData.first_name = firstName;
    if (lastName) updateData.last_name = lastName;
    if (email) updateData.email = email;
    const hashedPassword = password ? await bcrypt.hash(password, 12) : undefined;
    if (hashedPassword) updateData.password_hash = hashedPassword;
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    if (position !== undefined) updateData.position = position;
    if (employeeCode !== undefined) updateData.employee_code = employeeCode;
    updateData.updated_at = new Date().toISOString();

    let updateQuery = supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    // Filter by tenant ONLY if not superadmin
    if (req.user.role !== 'superadmin') {
      updateQuery = updateQuery.eq('tenant_id', req.user.tenant_id);
    }

    const { data: updatedUser, error: updateError } = await updateQuery
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({ success: false, message: 'Failed to update user' });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
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
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (Admin only)
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const targetTenantId = req.user?.tenant_id;
    const userId = req.params.id;

    if (userId === req.user._id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    let query = supabase.from('users').select('id').eq('id', userId);

    // Filter by tenant ONLY if not superadmin
    if (req.user.role !== 'superadmin') {
      const targetTenantId = req.user?.tenant_id;
      if (!targetTenantId) return res.status(403).json({ success: false, message: 'Tenant context required' });
      query = query.eq('tenant_id', targetTenantId);
    }

    const { data: user, error: fetchError } = await query.single();

    if (fetchError || !user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let deleteQuery = supabase.from('users').delete().eq('id', userId);

    // Filter by tenant ONLY if not superadmin
    if (req.user.role !== 'superadmin') {
      deleteQuery = deleteQuery.eq('tenant_id', req.user.tenant_id);
    }

    const { error: deleteError } = await deleteQuery;

    if (deleteError) {
      return res.status(400).json({ success: false, message: 'Failed to delete user' });
    }

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
