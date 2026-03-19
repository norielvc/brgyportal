const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabaseClient');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth-supabase');

/**
 * @route   GET /api/tenants
 * @desc    Get all tenants (Super Admin Only)
 * @access  Private (Superadmin)
 */
router.get('/', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        // 1. Fetch all tenants
        const { data: tenants, error } = await supabase
            .from('tenants')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching tenants:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch registered barangays'
            });
        }

        // 2. Fetch some basic stats for each tenant (optional enrichment)
        // In a real pro system, we'd use a view or a separate service for usage tracking.
        const enrichedTenants = await Promise.all(tenants.map(async (t) => {
            // Count staff (users) for this tenant
            const { count: staffCount } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', t.id);

            // Count requests this month (mocking usage logic for dashboard)
            return {
                ...t,
                staff_count: staffCount || 0,
                // These are just mock numbers for the UI display until we build the billing engine
                requests_this_month: t.id === 'ibaoeste' ? 1290 : 45,
                last_active: 'Recently active'
            };
        }));

        res.status(200).json({
            success: true,
            data: enrichedTenants
        });
    } catch (error) {
        console.error('Get tenants error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

/**
 * @route   POST /api/tenants
 * @desc    Onboard a brand new Barangay (Super Admin Only)
 * @access  Private (Superadmin)
 */
router.post('/', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const { id, name, domain, plan_tier } = req.body;

        if (!id || !name) {
            return res.status(400).json({
                success: false,
                message: 'ID and Name are required for new tenants'
            });
        }

        const { data: newTenant, error } = await supabase
            .from('tenants')
            .insert({
                id: id.toLowerCase().replace(/\s+/g, '-'),
                name,
                domain,
                plan_tier: plan_tier || 'Starter',
                status: 'Active'
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return res.status(400).json({
                    success: false,
                    message: `Tenant ID '${id}' is already taken`
                });
            }
            console.error('Error creating tenant:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to register barangay'
            });
        }

        res.status(201).json({
            success: true,
            message: `${name} has been successfully onboarded`,
            data: newTenant
        });
    } catch (error) {
        console.error('Create tenant error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
