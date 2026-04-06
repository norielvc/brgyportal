import { supabase } from '../../../lib/supabase';
import { authenticateToken } from '../../../src/lib/api-auth';

// Helper to parse complex QR scan data
const parseQRData = (data) => {
  if (!data || typeof data !== 'string') return null;
  if (data.startsWith('http')) return null;

  // Pattern: ID (HXXXXX-FXXXXX)
  const idMatch = data.match(/^H\d{5}-F\d{5}/);
  const household_id = idMatch ? idMatch[0] : null;

  let remaining = data.replace(household_id || '', '').trim();

  // Pattern: Remarks (Starts with GOODS RECD)
  const remarksStart = remaining.indexOf('GOODS RECD');
  let remarks = null;
  if (remarksStart !== -1) {
    remarks = remaining.substring(remarksStart).trim();
    remaining = remaining.substring(0, remarksStart).trim();
  }

  // Pattern: Address
  const addressMarkers = ['SITIO', 'BLOCK', 'LOT', 'PUROK', 'PHASE', 'ST.', 'AVE.'];
  let addressStart = -1;
  const upperRemaining = remaining.toUpperCase();

  for (const marker of addressMarkers) {
    const termPos = upperRemaining.indexOf(marker);
    if (termPos !== -1 && (addressStart === -1 || termPos < addressStart)) {
      addressStart = termPos;
    }
  }

  let name = null;
  let address = null;

  if (addressStart !== -1) {
    name = remaining.substring(0, addressStart).trim();
    address = remaining.substring(addressStart).trim();
  } else {
    name = remaining || null;
  }

  return {
    household_id,
    name: name ? name.replace(/\s+/g, ' ') : null,
    address: address ? address.replace(/\s+/g, ' ') : null,
    remarks
  };
};

export default async function handler(req, res) {
  const user = await authenticateToken(req, res);
  if (!user) return; // Auth handled response

  const tenantId = req.headers['x-tenant-id'] || user.tenant_id;

  if (req.method === 'GET') {
    try {
      const { page = 1, limit = 20, date, qr_data, event_id } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('qr_scans')
        .select(`
          *,
          users:scanned_by(id, email, first_name, last_name)
        `, { count: 'exact' })
        .eq('tenant_id', tenantId)
        .order('scan_timestamp', { ascending: false });

      if (event_id) {
         query = query.eq('event_id', event_id);
      }

      if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        query = query.gte('scan_timestamp', startDate.toISOString()).lt('scan_timestamp', endDate.toISOString());
      }

      if (qr_data) {
        query = query.or(`qr_data.ilike.%${qr_data}%,parsed_household_id.ilike.%${qr_data}%,parsed_name.ilike.%${qr_data}%,parsed_address.ilike.%${qr_data}%,parsed_remarks.ilike.%${qr_data}%`);
      }

      query = query.range(offset, offset + parseInt(limit) - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      res.status(200).json({
        success: true,
        data: data || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil((count || 0) / parseInt(limit))
        }
      });
    } catch (err) {
      console.error('Fetch scans error:', err);
      res.status(500).json({ success: false, error: 'Failed' });
    }
  } else if (req.method === 'POST') {
    try {
      const { qr_data, scan_timestamp, scanner_type, device_info, event_id } = req.body;
      const parsedData = parseQRData(qr_data);

      if (!qr_data || !scan_timestamp) {
        return res.status(400).json({ success: false, error: 'Data and timestamp required' });
      }

      // Duplicate check (scoped to event)
      let duplicateQuery = supabase.from('qr_scans').select('*').eq('qr_data', qr_data).eq('tenant_id', tenantId);
      if (event_id) duplicateQuery = duplicateQuery.eq('event_id', event_id);

      const { data: existingScan } = await duplicateQuery.single();

      if (existingScan) {
        return res.status(409).json({
          success: false,
          isDuplicate: true,
          message: `Already scanned on ${new Date(existingScan.scan_timestamp).toLocaleString()}`
        });
      }

      const { data, error } = await supabase
        .from('qr_scans')
        .insert([{
          qr_data,
          scan_timestamp: new Date(scan_timestamp).toISOString(),
          scanner_type: scanner_type || 'mobile',
          device_info: device_info || {},
          scanned_by: user._id,
          event_id: event_id || null,
          tenant_id: tenantId,
          parsed_household_id: parsedData?.household_id,
          parsed_name: parsedData?.name,
          parsed_address: parsedData?.address,
          parsed_remarks: parsedData?.remarks,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      res.status(201).json({ success: true, data });
    } catch (err) {
      console.error('Post scan error:', err);
      res.status(500).json({ success: false, error: 'Failed' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { event_id } = req.query;
      let deleteQuery = supabase.from('qr_scans').delete().eq('tenant_id', tenantId).neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all matching
      
      if (event_id) deleteQuery = deleteQuery.eq('event_id', event_id);
      
      const { error } = await deleteQuery;
      if (error) throw error;
      
      res.status(200).json({ success: true, message: 'Scan history cleared' });
    } catch (err) {
      console.error('Delete error:', err);
      res.status(500).json({ success: false, error: 'Failed' });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
