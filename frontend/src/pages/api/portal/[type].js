import path from 'path';
import fs from 'fs/promises';

/**
 * DYNAMIC PORTAL CONTENT API (Next.js)
 * ----------------------------------
 * Handles /api/portal/events, /api/portal/facilities, /api/portal/officials, etc.
 * Implements "Resilience Fallback" for paused Supabase plans.
 */
export default async function handler(req, res) {
  const { type } = req.query;
  const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';
  
  const validTypes = ['events', 'facilities', 'officials', 'achievements', 'programs'];
  if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid content type' });
  }

  /**
   * STAGE 1: Attempt Cloud Fetch (Live Supabase)
   * This is our "Resilience Pledge" - if Supabase is active, we use it!
   */
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    const { data: cloudData, error } = await supabase
      .from(type)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('id', { ascending: true });

    if (!error && cloudData && cloudData.length > 0) {
      console.log(`✅ BRGY API [Portal/${type}]: Served LIVE data for tenant [${tenantId}]`);
      return res.status(200).json({ success: true, data: cloudData, source: 'cloud_supabase' });
    }
  } catch (cloudError) {
    console.warn(`⚠️ Cloud Bypass [Portal/${type}]: Paused/Inactive - Using Resilience Fallback.`);
  }

  /**
   * STAGE 2: Local Resilience Fallback (JSON-based)
   */
  try {
      const dataPath = path.join(process.cwd(), 'src/data/mock/portal_config.json');
      const jsonData = await fs.readFile(dataPath, 'utf8');
      const config = JSON.parse(jsonData);
      
      const list = config[type] || [];
      const filteredList = list.filter(item => item.tenant_id === tenantId);

      return res.status(200).json({
          success: true,
          data: filteredList,
          source: 'local_resilience_store'
      });
  } catch (fsError) {
      console.error(`❌ CRITICAL FAILURE [Portal/${type}]:`, fsError);
      return res.status(500).json({ success: false, message: 'Portal content unavailable offline.' });
  }
}
