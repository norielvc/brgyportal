import { supabase } from '../../lib/supabase';
import { authenticateToken } from '../../src/lib/api-auth';

export default async function handler(req, res) {
  const user = await authenticateToken(req, res);
  if (!user) return; // Response handled by middleware

  const tenantId = req.headers['x-tenant-id'] || user.tenant_id;

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('scan_events')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching scan events:', error);
        return res.status(500).json({ success: false, error: 'Failed' });
      }

      res.status(200).json({ success: true, data: data || [] });
    } catch (err) {
      console.error('Fetch error:', err);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, date, description, status } = req.body;
      
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
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
