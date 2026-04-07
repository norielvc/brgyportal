/**
 * PUBLIC Certificate Status Tracker
 * GET /api/portal/track?ref=BC-2026-00001
 * Returns limited public info — no sensitive data exposed
 */
export default async function handler(req, res) {
  if (req.method !== 'GET')
    return res.status(405).json({ success: false, message: 'Method not allowed' });

  const { ref } = req.query;
  const tenantId = req.headers['x-tenant-id'];

  if (!ref) return res.status(400).json({ success: false, message: 'Reference number required' });
  if (!tenantId) return res.status(400).json({ success: false, message: 'Tenant context required' });

  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from('certificate_requests')
      .select('reference_number, certificate_type, status, full_name, created_at, updated_at')
      .eq('reference_number', ref.toUpperCase().trim())
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Reference number not found' });
    }

    // Return only public-safe fields — no address, contact, purpose, etc.
    return res.json({
      success: true,
      data: {
        reference_number: data.reference_number,
        certificate_type: data.certificate_type,
        status: data.status,
        full_name: data.full_name ? data.full_name.split(' ')[0] + ' ' + (data.full_name.split(' ').slice(-1)[0]?.[0] || '') + '.' : '—',
        created_at: data.created_at,
        updated_at: data.updated_at,
      }
    });
  } catch (err) {
    console.error('Track error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
