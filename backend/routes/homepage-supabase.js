const express = require('express');
const { supabase } = require('../services/supabaseClient');
const { optionalAuthenticateToken } = require('../middleware/auth-supabase');

const router = express.Router();

/**
 * @route   GET /api/homepage
 * @desc    Aggregated homepage data - single request for all public content
 * @access  Public
 */
router.get('/', optionalAuthenticateToken, async (req, res) => {
  try {
    const tenantId = req.user?.tenant_id || req.headers['x-tenant-id'];
    if (!tenantId) return res.status(403).json({ success: false, message: 'Tenant context required' });

    // Fire all 6 queries in parallel
    const [
      eventsResult,
      facilitiesResult,
      officialsResult,
      achievementsResult,
      programsResult,
      settingsResult
    ] = await Promise.all([
      supabase.from('events')
        .select('id, title, description, date, image, order_index')
        .eq('tenant_id', tenantId)
        .order('order_index', { ascending: true }),

      supabase.from('facilities')
        .select('id, name, description, icon, color, images, features, order_index')
        .eq('tenant_id', tenantId)
        .order('order_index', { ascending: true }),

      supabase.from('barangay_officials')
        .select('id, name, position, position_type, image_url, description, committee, order_index')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('order_index', { ascending: true }),

      supabase.from('achievements')
        .select('id, title, category, description, year, image, color_class, text_color, order_index')
        .eq('tenant_id', tenantId)
        .order('year', { ascending: false })
        .order('order_index', { ascending: true }),

      supabase.from('programs')
        .select('id, name, description, icon, color, features, order_index')
        .eq('tenant_id', tenantId)
        .order('order_index', { ascending: true }),

      supabase.from('barangay_settings')
        .select('value')
        .eq('key', 'certificate_settings')
        .eq('tenant_id', tenantId)
        .single()
    ]);

    // Cache for 60 seconds on CDN/browser
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');

    res.status(200).json({
      success: true,
      data: {
        events:       eventsResult.data       || [],
        facilities:   facilitiesResult.data   || [],
        officials:    officialsResult.data     || [],
        achievements: achievementsResult.data  || [],
        programs:     programsResult.data      || [],
        settings:     settingsResult.data?.value || {}
      }
    });
  } catch (error) {
    console.error('Homepage aggregator error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
