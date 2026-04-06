const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabaseClient');
const { authenticateToken } = require('../middleware/auth-supabase');

// GET /api/scan-events - Get all events
router.get('/', authenticateToken, async (req, res) => {
    try {
        const tenantId = req.user?.tenant_id || req.headers['x-tenant-id'];
        const { data, error } = await supabase
            .from('scan_events')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching scan events:', error);
            return res.status(500).json({ success: false, error: 'Failed' });
        }

        res.json({ success: true, data: data || [] });
    } catch (err) {
        console.error('Fetch error:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// POST /api/scan-events - Create new event
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, date, description, status } = req.body;
        const tenantId = req.user?.tenant_id || req.headers['x-tenant-id'];
        
        const { data, error } = await supabase
            .from('scan_events')
            .insert([{
                name, date, description, status: status || 'ACTIVE', tenant_id: tenantId
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating event:', error);
            return res.status(500).json({ success: false, error: 'Failed' });
        }

        res.status(201).json({ success: true, data });
    } catch (err) {
        console.error('Create error:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
