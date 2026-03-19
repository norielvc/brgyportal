const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabaseClient');

// Helper to map DB officials to Frontend object
const mapOfficialsToConfig = (officials) => {
  const config = {
    councilors: Array(7).fill(''),
    // Defaults
    chairman: '', secretary: '', treasurer: '', skChairman: '',
    skSecretary: '', skTreasurer: '', skKagawads: Array(8).fill(''),
    administrator: '', assistantSecretary: '', assistantAdministrator: '',
    recordKeeper: '', clerk: '',
    officialImages: {
      chairman: '', secretary: '', treasurer: '', skChairman: '',
      skSecretary: '', skTreasurer: '',
      skKagawads: Array(8).fill(''),
      councilors: Array(7).fill(''),
      administrator: '', assistantSecretary: '', assistantAdministrator: '',
      recordKeeper: '', clerk: ''
    },
    heroSection: {
      title: 'BARANGAY OFFICIALS',
      subtitle: 'Meet our dedicated team serving Iba O\' Este',
      image: '/images/barangay-officials.jpg'
    },
    descriptions: {
      chairman: '', secretary: '', treasurer: '', skChairman: '',
      skSecretary: '', skTreasurer: '',
      skKagawads: Array(8).fill(''),
      councilors: Array(7).fill(''),
      administrator: '', assistantSecretary: '', assistantAdministrator: '',
      recordKeeper: '', clerk: ''
    },
    committees: {
      skKagawads: Array(8).fill(''),
      councilors: Array(7).fill('')
    },
    visibility: {
      section: true,
      chairman: true, secretary: true, treasurer: true, skChairman: true,
      skSecretary: true, skTreasurer: true,
      skKagawads: Array(8).fill(true),
      councilors: Array(7).fill(true),
      administrator: true, assistantSecretary: true, assistantAdministrator: true,
      recordKeeper: true, clerk: true
    }
  };

  const setImg = (key, val) => { config.officialImages[key] = val; };
  const setDesc = (key, val) => { config.descriptions[key] = val; };

  const setCouncilImg = (idx, val) => { if (idx >= 0 && idx < 7) config.officialImages.councilors[idx] = val; };
  const setCouncilDesc = (idx, val) => { if (idx >= 0 && idx < 7) config.descriptions.councilors[idx] = val; };
  const setCouncilComm = (idx, val) => { if (idx >= 0 && idx < 7) config.committees.councilors[idx] = val; };

  const setSkKagawadImg = (idx, val) => { if (idx >= 0 && idx < 8) config.officialImages.skKagawads[idx] = val; };
  const setSkKagawadDesc = (idx, val) => { if (idx >= 0 && idx < 8) config.descriptions.skKagawads[idx] = val; };
  const setSkKagawadComm = (idx, val) => { if (idx >= 0 && idx < 8) config.committees.skKagawads[idx] = val; };

  officials.forEach(o => {
    const url = o.image_url || '';
    const desc = o.description || '';
    const comm = o.committee || '';

    if (o.position_type === 'captain') { config.chairman = o.name; setImg('chairman', url); setDesc('chairman', desc); }
    else if (o.position_type === 'secretary') { config.secretary = o.name; setImg('secretary', url); setDesc('secretary', desc); }
    else if (o.position_type === 'treasurer') { config.treasurer = o.name; setImg('treasurer', url); setDesc('treasurer', desc); }
    else if (o.position_type === 'sk_chairman') { config.skChairman = o.name; setImg('skChairman', url); setDesc('skChairman', desc); }
    else if (o.position_type === 'sk_secretary') { config.skSecretary = o.name; setImg('skSecretary', url); setDesc('skSecretary', desc); }
    else if (o.position_type === 'sk_treasurer') { config.skTreasurer = o.name; setImg('skTreasurer', url); setDesc('skTreasurer', desc); }
    else if (o.position_type === 'sk_kagawad') {
      const match = o.position?.match(/SK Kagawad\s+(\d+)/i);
      if (match) {
        const idx = parseInt(match[1], 10) - 1;
        if (idx >= 0 && idx < 8) {
          config.skKagawads[idx] = o.name;
          setSkKagawadImg(idx, url);
          setSkKagawadDesc(idx, desc);
          setSkKagawadComm(idx, comm);
        }
      }
    }
    else if (o.position_type === 'kagawad') {
      const match = o.position?.match(/Kagawad\s+(\d+)/i);
      let idx = -1;
      if (match) {
        idx = parseInt(match[1], 10) - 1;
      } else {
        idx = (o.order_index || 5) - 5;
      }

      if (idx >= 0 && idx < 7) {
        config.councilors[idx] = o.name;
        setCouncilImg(idx, url);
        setCouncilDesc(idx, desc);
        setCouncilComm(idx, comm);
      }
    }
    else if (o.position === 'Administrator') { config.administrator = o.name; setImg('administrator', url); setDesc('administrator', desc); }
    else if (o.position === 'Assistant Secretary') { config.assistantSecretary = o.name; setImg('assistantSecretary', url); setDesc('assistantSecretary', desc); }
    else if (o.position === 'Assistant Administrator') { config.assistantAdministrator = o.name; setImg('assistantAdministrator', url); setDesc('assistantAdministrator', desc); }
    else if (o.position === 'Barangay Keeper' || o.position === 'Record Keeper') { config.recordKeeper = o.name; setImg('recordKeeper', url); setDesc('recordKeeper', desc); }
    else if (o.position === 'Clerk') { config.clerk = o.name; setImg('clerk', url); setDesc('clerk', desc); }
  });
  return config;
};

// GET Configuration (Officials + Settings)
router.get('/config', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';
    // 1. Fetch Officials
    const { data: officials, error: officialsError } = await supabase
      .from('barangay_officials')
      .select('*')
      .eq('tenant_id', tenantId) // MULTI-TENANT FILTER
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (officialsError) throw officialsError;

    // 2. Fetch Settings
    const { data: settingsRow, error: settingsError } = await supabase
      .from('barangay_settings')
      .select('value')
      .eq('key', 'certificate_settings')
      .eq('tenant_id', tenantId) // MULTI-TENANT FILTER
      .single();

    // Ignore settings error (might not exist yet), use defaults if so
    const settings = settingsRow?.value || {};

    // 3. Merge
    const officialsConfig = mapOfficialsToConfig(officials || []);

    const fullConfig = {
      ...officialsConfig,
      ...settings
    };

    res.json({ success: true, data: fullConfig });

  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT Configuration (Update Officials + Settings)
router.put('/config', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';
    const config = req.body;

    // 1. Update Officials
    // We need to map back from Config -> DB update calls

    const updates = [];

    // Helper to push update promise
    const updateOfficial = (type, name, positionPattern = null, orderIndex = null, imageUrl = null, description = null, committee = null) => {
      const payload = { name, updated_at: new Date() };
      if (imageUrl !== null && imageUrl !== undefined) payload.image_url = imageUrl;
      if (description !== null && description !== undefined) payload.description = description;
      if (committee !== null && committee !== undefined) payload.committee = committee;

      let query = supabase.from('barangay_officials').update(payload).eq('position_type', type).eq('tenant_id', tenantId);

      if (positionPattern) {
        query = query.eq('position', positionPattern);
      }
      if (orderIndex !== null) {
        query = query.eq('order_index', orderIndex);
      }
      return query;
    };

    const imgs = config.officialImages || {};
    const descs = config.descriptions || {};
    const comms = config.committees || {};

    updates.push(updateOfficial('captain', config.chairman, null, null, imgs.chairman, descs.chairman));
    updates.push(updateOfficial('secretary', config.secretary, null, null, imgs.secretary, descs.secretary));
    updates.push(updateOfficial('treasurer', config.treasurer, null, null, imgs.treasurer, descs.treasurer));
    updates.push(updateOfficial('sk_chairman', config.skChairman, null, null, imgs.skChairman, descs.skChairman));
    updates.push(updateOfficial('sk_secretary', config.skSecretary || '', null, null, imgs.skSecretary, descs.skSecretary));
    updates.push(updateOfficial('sk_treasurer', config.skTreasurer || '', null, null, imgs.skTreasurer, descs.skTreasurer));

    // SK Kagawads
    if (Array.isArray(config.skKagawads)) {
      config.skKagawads.forEach((name, i) => {
        const imageUrl = (imgs.skKagawads && imgs.skKagawads[i]) ? imgs.skKagawads[i] : null;
        const description = (descs.skKagawads && descs.skKagawads[i]) ? descs.skKagawads[i] : null;
        const committee = (comms.skKagawads && comms.skKagawads[i]) ? comms.skKagawads[i] : null;

        updates.push(
          supabase.from('barangay_officials')
            .update({ name: name || '', image_url: imageUrl, description, committee, updated_at: new Date() })
            .eq('position_type', 'sk_kagawad')
            .eq('tenant_id', tenantId)
            .eq('position', `SK Kagawad ${i + 1}`)
        );
      });
    }

    // Councilors
    if (Array.isArray(config.councilors)) {
      config.councilors.forEach((name, i) => {
        const imageUrl = (imgs.councilors && imgs.councilors[i]) ? imgs.councilors[i] : null;
        const description = (descs.councilors && descs.councilors[i]) ? descs.councilors[i] : null;
        const committee = (comms.councilors && comms.councilors[i]) ? comms.councilors[i] : null;

        updates.push(
          supabase.from('barangay_officials')
            .update({ name, image_url: imageUrl, description, committee, updated_at: new Date() })
            .eq('position_type', 'kagawad')
            .eq('tenant_id', tenantId)
            .eq('position', `Kagawad ${i + 1}`)
        );
      });
    }

    // Staff
    updates.push(supabase.from('barangay_officials').update({ name: config.administrator, image_url: imgs.administrator, description: descs.administrator }).eq('position', 'Administrator').eq('tenant_id', tenantId));
    updates.push(supabase.from('barangay_officials').update({ name: config.assistantSecretary, image_url: imgs.assistantSecretary, description: descs.assistantSecretary }).eq('position', 'Assistant Secretary').eq('tenant_id', tenantId));
    updates.push(supabase.from('barangay_officials').update({ name: config.assistantAdministrator, image_url: imgs.assistantAdministrator, description: descs.assistantAdministrator }).eq('position', 'Assistant Administrator').eq('tenant_id', tenantId));
    updates.push(supabase.from('barangay_officials').update({ name: config.recordKeeper, image_url: imgs.recordKeeper, description: descs.recordKeeper }).eq('position', 'Barangay Keeper').eq('tenant_id', tenantId));
    updates.push(supabase.from('barangay_officials').update({ name: config.clerk, image_url: imgs.clerk, description: descs.clerk }).eq('position', 'Clerk').eq('tenant_id', tenantId));


    await Promise.all(updates);

    // 2. Update Settings
    const settingsValue = {
      contactInfo: config.contactInfo,
      headerInfo: config.headerInfo,
      logos: config.logos,
      headerStyle: config.headerStyle,
      sidebarStyle: config.sidebarStyle,
      bodyStyle: config.bodyStyle,
      footerStyle: config.footerStyle,
      countryStyle: config.countryStyle,
      provinceStyle: config.provinceStyle,
      municipalityStyle: config.municipalityStyle,
      barangayNameStyle: config.barangayNameStyle,
      officeNameStyle: config.officeNameStyle,
      heroSection: config.heroSection,
      visibility: config.visibility
    };

    const { error: settingsError } = await supabase
      .from('barangay_settings')
      .upsert({
        key: 'certificate_settings',
        tenant_id: tenantId,
        value: settingsValue,
        updated_at: new Date()
      }, { onConflict: 'key,tenant_id' });

    if (settingsError) throw settingsError;

    res.json({ success: true, message: 'Configuration saved successfully' });

  } catch (error) {
    console.error('Error saving config:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all barangay officials (Original Endpoint)
router.get('/', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';
    console.log('Fetching barangay officials...');

    const { data: officials, error } = await supabase
      .from('barangay_officials')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch officials',
        error: error.message
      });
    }

    console.log(`Found ${officials?.length || 0} officials`);

    // Custom ordering: Brgy Captain → Kagawad → SK Chairman → Staff (Secretary & Treasurer)
    const positionOrder = {
      'captain': 1,
      'kagawad': 2,
      'sk_chairman': 3,
      'sk_secretary': 3.1,
      'sk_treasurer': 3.2,
      'sk_kagawad': 3.3,
      'secretary': 4,
      'treasurer': 4,
      'staff': 4
    };

    const sortedOfficials = officials?.sort((a, b) => {
      const orderA = positionOrder[a.position_type] || 999;
      const orderB = positionOrder[b.position_type] || 999;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      // Within same position type, sort by order_index for kagawads, or by name for others
      if (a.position_type === 'kagawad' && b.position_type === 'kagawad') {
        return (a.order_index || 0) - (b.order_index || 0);
      }

      // For staff positions, sort by order_index
      return (a.order_index || 0) - (b.order_index || 0);
    }) || [];

    res.json({
      success: true,
      data: sortedOfficials,
      count: sortedOfficials?.length || 0
    });

  } catch (error) {
    console.error('Error fetching officials:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get officials by position type
router.get('/by-type/:type', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';
    const { type } = req.params;
    console.log(`Fetching officials by type: ${type}`);

    const { data: officials, error } = await supabase
      .from('barangay_officials')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('position_type', type)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch officials by type',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: officials || [],
      count: officials?.length || 0
    });

  } catch (error) {
    console.error('Error fetching officials by type:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get single official by ID
router.get('/:id', async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';
    const { id } = req.params;
    console.log(`Fetching official with ID: ${id}`);

    const { data: official, error } = await supabase
      .from('barangay_officials')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(404).json({
        success: false,
        message: 'Official not found',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: official
    });

  } catch (error) {
    console.error('Error fetching official:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;