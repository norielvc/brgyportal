import { supabase } from '../../../lib/supabase';
import { authenticateToken } from '../../../src/lib/api-auth';

export default async function handler(req, res) {
  const user = await authenticateToken(req, res);
  if (!user) return; // Auth handled response

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const tenantId = req.headers['x-tenant-id'] || user.tenant_id;
  const { event_id } = req.query;

  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // Today's Scans Count
    let todayQuery = supabase
      .from('qr_scans')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('scan_timestamp', startOfDay.toISOString())
      .lt('scan_timestamp', endOfDay.toISOString());
    if (event_id) todayQuery = todayQuery.eq('event_id', event_id);
    const { count: todayCount, error: todayError } = await todayQuery;

    // Total Scans Count
    let totalQuery = supabase
      .from('qr_scans')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);
    if (event_id) totalQuery = totalQuery.eq('event_id', event_id);
    const { count: totalCount, error: totalError } = await totalQuery;

    if (todayError || totalError) throw (todayError || totalError);

    res.status(200).json({
      success: true,
      stats: {
        today: todayCount || 0,
        total: totalCount || 0
      }
    });
  } catch (err) {
    console.error('Stats fetch error:', err);
    res.status(500).json({ success: false, error: 'Failed' });
  }
}
