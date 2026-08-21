const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabaseClient');

// Create new blotter report (E-Sumbong)
router.post('/', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || req.user?.tenant_id;
        if (!tenantId) {
            return res.status(403).json({ success: false, message: 'Tenant context required' });
        }

        const {
            complainant_resident_id,
            complainant_name,
            respondent_name,
            details,
            incident_date,
            incident_time,
            contact_number,
            email
        } = req.body;

        if (!complainant_name || !respondent_name || !details || !incident_date || !contact_number) {
            return res.status(400).json({
                success: false,
                message: 'Required fields: complainant_name, respondent_name, details, incident_date, contact_number'
            });
        }

        const insertData = {
            tenant_id: tenantId,
            complainant_resident_id: complainant_resident_id || null,
            complainant_name: complainant_name.trim(),
            respondent_name: respondent_name.trim(),
            details: details.trim(),
            incident_date,
            incident_time: incident_time || null,
            contact_number: contact_number.trim(),
            email: email ? email.trim() : null,
            status: 'pending'
        };

        const { data, error } = await supabase
            .from('blotter_reports')
            .insert([insertData])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: 'Blotter report submitted successfully',
            report: data
        });
    } catch (error) {
        console.error('Error creating blotter report:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// List all blotter reports for tenant
router.get('/', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || req.user?.tenant_id;
        if (!tenantId) {
            return res.status(403).json({ success: false, message: 'Tenant context required' });
        }

        const { status, page = 1, limit = 20 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        let query = supabase
            .from('blotter_reports')
            .select('*', { count: 'exact' })
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limitNum - 1);

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        res.json({
            success: true,
            reports: data,
            totalItems: count,
            totalPages: Math.ceil(count / limitNum),
            currentPage: pageNum
        });
    } catch (error) {
        console.error('Error fetching blotter reports:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get single blotter report
router.get('/:id', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || req.user?.tenant_id;
        if (!tenantId) {
            return res.status(403).json({ success: false, message: 'Tenant context required' });
        }

        const { id } = req.params;

        const { data, error } = await supabase
            .from('blotter_reports')
            .select('*')
            .eq('id', id)
            .eq('tenant_id', tenantId)
            .single();

        if (error) throw error;

        res.json({ success: true, report: data });
    } catch (error) {
        console.error('Error fetching blotter report:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update blotter report status
router.put('/:id', async (req, res) => {
    try {
        const tenantId = req.headers['x-tenant-id'] || req.user?.tenant_id;
        if (!tenantId) {
            return res.status(403).json({ success: false, message: 'Tenant context required' });
        }

        const { id } = req.params;
        const { status } = req.body;

        const { data, error } = await supabase
            .from('blotter_reports')
            .update({ status })
            .eq('id', id)
            .eq('tenant_id', tenantId)
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, message: 'Blotter report updated', report: data });
    } catch (error) {
        console.error('Error updating blotter report:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
