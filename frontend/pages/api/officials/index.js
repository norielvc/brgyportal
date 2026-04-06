import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // x-tenant-id header always wins for public routes
    const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';

    const { data: officials, error } = await supabase
      .from('barangay_officials')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch officials', error: error.message });
    }

    const positionOrder = { 'captain': 1, 'kagawad': 2, 'sk_chairman': 3, 'sk_secretary': 3.1, 'sk_treasurer': 3.2, 'sk_kagawad': 3.3, 'secretary': 4, 'treasurer': 4, 'staff': 4 };
    const sortedOfficials = officials?.sort((a, b) => {
      const orderA = positionOrder[a.position_type] || 999;
      const orderB = positionOrder[b.position_type] || 999;
      if (orderA !== orderB) return orderA - orderB;
      return (a.order_index || 0) - (b.order_index || 0);
    }) || [];

    return res.status(200).json({ success: true, data: sortedOfficials, count: sortedOfficials.length });
  } catch (error) {
    console.error('Error fetching officials:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
}
