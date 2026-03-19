const express = require('express');
const { supabase } = require('../services/supabaseClient');
const { authenticateToken } = require('../middleware/auth-supabase');

const router = express.Router();

/**
 * @route   GET /api/programs
 * @desc    Get all programs (public)
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';
        const { data: programs, error } = await supabase
            .from('programs')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('order_index', { ascending: true });

        if (error) {
            if (error.code === 'PGRST116' || error.code === '42P01' || error.message.includes('not find the table')) {
                console.warn('Programs table not found in Supabase. Returning empty array.');
                return res.status(200).json({
                    success: true,
                    data: []
                });
            }
            console.error('Error fetching programs:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch programs'
            });
        }

        res.status(200).json({
            success: true,
            data: programs || []
        });
    } catch (error) {
        console.error('Get programs error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route   POST /api/programs
 * @desc    Create a new program
 * @access  Private (Admin only)
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { title, category, description, image } = req.body;

        const tenantId = req.user.tenant_id;
        // Get max order_index
        const { data: maxOrder } = await supabase
            .from('programs')
            .select('order_index')
            .eq('tenant_id', tenantId)
            .order('order_index', { ascending: false })
            .limit(1)
            .single();

        const newOrderIndex = (maxOrder?.order_index || 0) + 1;

        const { data: program, error } = await supabase
            .from('programs')
            .insert({
                title,
                category,
                description,
                image: image || 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=800',
                order_index: newOrderIndex,
                tenant_id: tenantId
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating program:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to create program'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Program created successfully',
            data: program
        });
    } catch (error) {
        console.error('Create program error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route   PUT /api/programs/bulk/update
 * @desc    Bulk update all programs (for reordering/saving)
 * @access  Private (Admin only)
 */
router.put('/bulk/update', authenticateToken, async (req, res) => {
    try {
        const { programs } = req.body;
        const tenantId = req.user.tenant_id;

        // Delete all existing programs for this tenant and re-insert (full sync)
        await supabase.from('programs').delete().eq('tenant_id', tenantId);

        if (programs && programs.length > 0) {
            const programsToInsert = programs.map((prog, index) => ({
                title: prog.title,
                category: prog.category,
                description: prog.description,
                image: prog.image || 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=800',
                order_index: index,
                tenant_id: tenantId
            }));

            const { error } = await supabase.from('programs').insert(programsToInsert);

            if (error) {
                console.error('Error bulk updating programs:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update programs'
                });
            }
        }

        res.status(200).json({
            success: true,
            message: 'Programs updated successfully'
        });
    } catch (error) {
        console.error('Bulk update programs error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route   PUT /api/programs/:id
 * @desc    Update a program
 * @access  Private (Admin only)
 */
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, category, description, image, order_index } = req.body;

        const updateData = {};
        if (title) updateData.title = title;
        if (category) updateData.category = category;
        if (description) updateData.description = description;
        if (image) updateData.image = image;
        if (order_index !== undefined) updateData.order_index = order_index;
        updateData.updated_at = new Date().toISOString();

        const tenantId = req.user.tenant_id;
        const { data: program, error } = await supabase
            .from('programs')
            .update(updateData)
            .eq('id', id)
            .eq('tenant_id', tenantId)
            .select()
            .single();

        if (error) {
            console.error('Error updating program:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update program'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Program updated successfully',
            data: program
        });
    } catch (error) {
        console.error('Update program error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route   DELETE /api/programs/:id
 * @desc    Delete a program
 * @access  Private (Admin only)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.user.tenant_id;

        const { error } = await supabase
            .from('programs')
            .delete()
            .eq('id', id)
            .eq('tenant_id', tenantId);

        if (error) {
            console.error('Error deleting program:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete program'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Program deleted successfully'
        });
    } catch (error) {
        console.error('Delete program error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
