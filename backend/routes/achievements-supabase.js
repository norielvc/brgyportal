const express = require('express');
const { supabase } = require('../services/supabaseClient');
const { authenticateToken } = require('../middleware/auth-supabase');

const router = express.Router();

/**
 * @route   GET /api/achievements
 * @desc    Get all achievements (public)
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';
        const { data: achievements, error } = await supabase
            .from('achievements')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('year', { ascending: false })
            .order('order_index', { ascending: true });

        if (error) {
            if (error.code === 'PGRST116' || error.code === '42P01' || error.message.includes('not find the table')) {
                console.warn('Achievements table not found in Supabase. Returning empty array.');
                return res.status(200).json({
                    success: true,
                    data: []
                });
            }
            console.error('Error fetching achievements:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch achievements'
            });
        }

        res.status(200).json({
            success: true,
            data: achievements || []
        });
    } catch (error) {
        console.error('Get achievements error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route   POST /api/achievements
 * @desc    Create a new achievement
 * @access  Private (Admin only)
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { title, category, description, year, image, color_class, text_color } = req.body;

        const tenantId = req.user.tenant_id;
        // Get max order_index
        const { data: maxOrder } = await supabase
            .from('achievements')
            .select('order_index')
            .eq('tenant_id', tenantId)
            .order('order_index', { ascending: false })
            .limit(1)
            .single();

        const newOrderIndex = (maxOrder?.order_index || 0) + 1;

        const { data: achievement, error } = await supabase
            .from('achievements')
            .insert({
                title,
                category,
                description,
                year,
                image: image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800',
                color_class: color_class || 'bg-blue-500',
                text_color: text_color || 'blue-400',
                order_index: newOrderIndex,
                tenant_id: tenantId
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating achievement:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to create achievement'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Achievement created successfully',
            data: achievement
        });
    } catch (error) {
        console.error('Create achievement error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route   PUT /api/achievements/bulk/update
 * @desc    Bulk update all achievements (for reordering)
 * @access  Private (Admin only)
 */
router.put('/bulk/update', authenticateToken, async (req, res) => {
    try {
        const { achievements } = req.body;
        const tenantId = req.user.tenant_id;

        // Delete all existing achievements for this tenant and re-insert (full sync)
        await supabase.from('achievements').delete().eq('tenant_id', tenantId);

        if (achievements && achievements.length > 0) {
            const achievementsToInsert = achievements.map((ach, index) => ({
                title: ach.title,
                category: ach.category,
                description: ach.description,
                year: ach.year,
                image: ach.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800',
                color_class: ach.color_class || 'bg-blue-500',
                text_color: ach.text_color || 'blue-400',
                order_index: index,
                tenant_id: tenantId
            }));

            const { error } = await supabase.from('achievements').insert(achievementsToInsert);

            if (error) {
                console.error('Error bulk updating achievements:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update achievements'
                });
            }
        }

        res.status(200).json({
            success: true,
            message: 'Achievements updated successfully'
        });
    } catch (error) {
        console.error('Bulk update achievements error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route   PUT /api/achievements/:id
 * @desc    Update an achievement
 * @access  Private (Admin only)
 */
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, category, description, year, image, color_class, text_color, order_index } = req.body;

        const updateData = {};
        if (title) updateData.title = title;
        if (category) updateData.category = category;
        if (description) updateData.description = description;
        if (year) updateData.year = year;
        if (image) updateData.image = image;
        if (color_class) updateData.color_class = color_class;
        if (text_color) updateData.text_color = text_color;
        if (order_index !== undefined) updateData.order_index = order_index;
        updateData.updated_at = new Date().toISOString();

        const tenantId = req.user.tenant_id;
        const { data: achievement, error } = await supabase
            .from('achievements')
            .update(updateData)
            .eq('id', id)
            .eq('tenant_id', tenantId)
            .select()
            .single();

        if (error) {
            console.error('Error updating achievement:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update achievement'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Achievement updated successfully',
            data: achievement
        });
    } catch (error) {
        console.error('Update achievement error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route   DELETE /api/achievements/:id
 * @desc    Delete an achievement
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenant_id;

        const { error } = await supabase
            .from('achievements')
            .delete()
            .eq('id', id)
            .eq('tenant_id', tenantId);

        if (error) {
            console.error('Error deleting achievement:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete achievement'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Achievement deleted successfully'
        });
    } catch (error) {
        console.error('Delete achievement error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
