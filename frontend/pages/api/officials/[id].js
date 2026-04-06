import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';
    const { id } = req.query;

    const { data: official, error } = await supabase
      .from('barangay_officials')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .single();

    if (error) {
      return res.status(404).json({ success: false, message: 'Official not found', error: error.message });
    }
    
    return res.status(200).json({ success: true, data: official });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
}
