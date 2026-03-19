const express = require('express');
const { supabase } = require('../services/supabaseClient');
const { authenticateToken } = require('../middleware/auth-supabase');

const router = express.Router();

/**
 * @route   GET /api/facilities
 * @desc    Get all facilities (public)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';
    const { data: facilities, error } = await supabase
      .from('facilities')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching facilities:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch facilities'
      });
    }

    res.status(200).json({
      success: true,
      data: facilities || []
    });
  } catch (error) {
    console.error('Get facilities error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/facilities
 * @desc    Create a new facility
 * @access  Private (Admin only)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, icon, color, images, features } = req.body;

    const tenantId = req.user.tenant_id;
    // Get max order_index
    const { data: maxOrder } = await supabase
      .from('facilities')
      .select('order_index')
      .eq('tenant_id', tenantId)
      .order('order_index', { ascending: false })
      .limit(1)
      .single();

    const newOrderIndex = (maxOrder?.order_index || 0) + 1;

    const { data: facility, error } = await supabase
      .from('facilities')
      .insert({
        name,
        description,
        icon: icon || 'Building2',
        color: color || 'bg-blue-500',
        images: images || ['/background.jpg'],
        features: features || [],
        order_index: newOrderIndex,
        tenant_id: tenantId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating facility:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create facility'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Facility created successfully',
      data: facility
    });
  } catch (error) {
    console.error('Create facility error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   PUT /api/facilities/:id
 * @desc    Update a facility
 * @access  Private (Admin only)
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, color, images, features, order_index } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (icon) updateData.icon = icon;
    if (color) updateData.color = color;
    if (images) updateData.images = images;
    if (features) updateData.features = features;
    if (order_index !== undefined) updateData.order_index = order_index;
    updateData.updated_at = new Date().toISOString();

    const tenantId = req.user.tenant_id;
    const { data: facility, error } = await supabase
      .from('facilities')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating facility:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update facility'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Facility updated successfully',
      data: facility
    });
  } catch (error) {
    console.error('Update facility error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   PUT /api/facilities/bulk
 * @desc    Bulk update all facilities (for reordering)
 * @access  Private (Admin only)
 */
router.put('/bulk/update', authenticateToken, async (req, res) => {
  try {
    const { facilities } = req.body;
    const tenantId = req.user.tenant_id;
    // Delete all existing facilities for this tenant and insert new ones
    await supabase.from('facilities').delete().eq('tenant_id', tenantId);

    if (facilities && facilities.length > 0) {
      const facilitiesToInsert = facilities.map((facility, index) => ({
        name: facility.name,
        description: facility.description,
        icon: facility.icon || 'Building2',
        color: facility.color || 'bg-blue-500',
        images: facility.images || ['/background.jpg'],
        features: facility.features || [],
        order_index: index,
        tenant_id: tenantId
      }));

      const { error } = await supabase.from('facilities').insert(facilitiesToInsert);

      if (error) {
        console.error('Error bulk updating facilities:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to update facilities'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Facilities updated successfully'
    });
  } catch (error) {
    console.error('Bulk update facilities error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   DELETE /api/facilities/:id
 * @desc    Delete a facility
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;
    const { error } = await supabase
      .from('facilities')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('Error deleting facility:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete facility'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Facility deleted successfully'
    });
  } catch (error) {
    console.error('Delete facility error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;