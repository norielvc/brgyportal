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
    let query = supabase
      .from('qr_scans')
      .select(`
        *,
        users:scanned_by(id, email, first_name, last_name)
      `)
      .eq('tenant_id', tenantId)
      .order('scan_timestamp', { ascending: false });

    if (event_id) {
       query = query.eq('event_id', event_id);
    }

    const { data: allScans, error } = await query;
    if (error) throw error;

    // Group by QR data and find duplicates in JS Logic
    const qrGroups = {};
    allScans.forEach(scan => {
      if (!qrGroups[scan.qr_data]) {
        qrGroups[scan.qr_data] = [];
      }
      qrGroups[scan.qr_data].push(scan);
    });

    const duplicates = [];
    Object.keys(qrGroups).forEach(qrData => {
      if (qrGroups[qrData].length > 1) {
        const sortedScans = qrGroups[qrData].sort((a, b) => 
          new Date(a.scan_timestamp) - new Date(b.scan_timestamp)
        );

        const firstScan = sortedScans[0];
        const duplicateAttempts = sortedScans.slice(1);

        duplicateAttempts.forEach(attempt => {
          duplicates.push({
            qr_data: qrData,
            original_scan: {
              id: firstScan.id,
              scan_timestamp: firstScan.scan_timestamp,
              scanned_by: firstScan.users ? `${firstScan.users.first_name} ${firstScan.users.last_name}` : 'Unknown'
            },
            duplicate_attempt: {
              id: attempt.id,
              scan_timestamp: attempt.scan_timestamp,
              scanned_by: attempt.users ? `${attempt.users.first_name} ${attempt.users.last_name}` : 'Unknown',
              scanner_type: attempt.scanner_type
            },
            time_difference: new Date(attempt.scan_timestamp) - new Date(firstScan.scan_timestamp)
          });
        });
      }
    });

    res.status(200).json({ success: true, data: duplicates });
  } catch (err) {
    console.error('Duplicates fetch error:', err);
    res.status(500).json({ success: false, error: 'Failed' });
  }
}
