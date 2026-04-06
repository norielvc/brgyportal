import path from 'path';
import fs from 'fs/promises';

/**
 * RESIDENT SEARCH API (Next.js)
 * ----------------------------
 * Handles /api/residents/search?name=...
 * Implements "Resilience Fallback" for paused Supabase plans.
 */
export default async function handler(req, res) {
  const { name } = req.query;
  const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';
  
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = (page - 1) * limit;

  // If no name is provided, default to empty to match against anything in the full_name field
  const searchStr = `%${name || ''}%`;

  /**
   * STAGE 1: Live Cloud Attempt
   */
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    console.log(`📡 Cloud Search Attempt for: ${name} (Tenant: ${tenantId})`);
    const { data: residents, error, count } = await supabase
      .from('residents')
      .select('*', { count: 'exact' })
      .ilike('full_name', searchStr)
      .eq('tenant_id', tenantId)
      .order('id', { ascending: false })
      .range(offset, offset + limit - 1);

    if (!error && residents) {
      console.log(`✅ Resident Search: Found ${residents.length} live records. Total: ${count}`);
      return res.status(200).json({ 
        success: true, 
        residents, 
        totalItems: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        currentPage: page,
        source: 'cloud_supabase' 
      });
    } else if (error) {
       console.error('Supabase fetch error:', error.message);
    }
  } catch (cloudError) {
    console.warn('⚠️ Search Resilience: Supabase inactive or keys missing - attempting local resolution...');
  }

  /**
   * STAGE 2: Local Resilience Fallback (JSON-based)
   */
  try {
      const dataPath = path.join(process.cwd(), 'src/data/mock/residents.json');
      const jsonData = await fs.readFile(dataPath, 'utf8');
      const data = JSON.parse(jsonData);
      
      const residents = data.residents || [];
      const allFiltered = residents.filter(r => 
        r.full_name.toLowerCase().includes((name || '').toLowerCase()) &&
        (r.tenant_id === tenantId || (tenantId === 'demo' && r.tenant_id === 'demo'))
      );
      
      const totalItems = allFiltered.length;
      const paginated = allFiltered.slice(offset, offset + limit);

      console.log(`📦 Fallback Search: Found ${paginated.length} local records (Total: ${totalItems}).`);
      return res.status(200).json({
          success: true,
          residents: paginated,
          totalItems,
          totalPages: Math.ceil(totalItems / limit),
          currentPage: page,
          source: 'local_resilience_store'
      });
  } catch (fsError) {
      console.error(`❌ CRITICAL FAILURE [Search]:`, fsError);
      return res.status(500).json({ success: false, message: 'Resident database offline.' });
  }
}
