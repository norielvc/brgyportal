import { supabase } from '../../../lib/supabase';

const mapOfficialsToConfig = (officials) => {
  const config = {
    councilors: Array(7).fill(''),
    chairman: '', secretary: '', treasurer: '', skChairman: '',
    skSecretary: '', skTreasurer: '', skKagawads: Array(8).fill(''),
    administrator: '', assistantSecretary: '', assistantAdministrator: '',
    recordKeeper: '', clerk: '',
    heroSection: {
      title: 'BARANGAY OFFICIALS',
      subtitle: 'Meet our dedicated team serving our community',
      image: '' 
    },
    officialImages: {
      chairman: '', secretary: '', treasurer: '', skChairman: '',
      skSecretary: '', skTreasurer: '',
      skKagawads: Array(8).fill(''),
      councilors: Array(7).fill(''),
      administrator: '', assistantSecretary: '', assistantAdministrator: '',
      recordKeeper: '', clerk: ''
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

  const setImg  = (key, val) => { config.officialImages[key] = val; };
  const setDesc = (key, val) => { config.descriptions[key] = val; };

  const setCouncilImg  = (idx, val) => { if (idx >= 0 && idx < 7) config.officialImages.councilors[idx] = val; };
  const setCouncilDesc = (idx, val) => { if (idx >= 0 && idx < 7) config.descriptions.councilors[idx] = val; };
  const setCouncilComm = (idx, val) => { if (idx >= 0 && idx < 7) config.committees.councilors[idx] = val; };

  const setSkKagawadImg  = (idx, val) => { if (idx >= 0 && idx < 8) config.officialImages.skKagawads[idx] = val; };
  const setSkKagawadDesc = (idx, val) => { if (idx >= 0 && idx < 8) config.descriptions.skKagawads[idx] = val; };
  const setSkKagawadComm = (idx, val) => { if (idx >= 0 && idx < 8) config.committees.skKagawads[idx] = val; };

  officials.forEach(o => {
    const url  = o.image_url  || '';
    const desc = o.description || '';
    const comm = o.committee   || '';

    if      (o.position_type === 'captain')      { config.chairman      = o.name; setImg('chairman', url);      setDesc('chairman', desc); }
    else if (o.position_type === 'secretary')    { config.secretary     = o.name; setImg('secretary', url);     setDesc('secretary', desc); }
    else if (o.position_type === 'treasurer')    { config.treasurer     = o.name; setImg('treasurer', url);     setDesc('treasurer', desc); }
    else if (o.position_type === 'sk_chairman')  { config.skChairman    = o.name; setImg('skChairman', url);    setDesc('skChairman', desc); }
    else if (o.position_type === 'sk_secretary') { config.skSecretary   = o.name; setImg('skSecretary', url);   setDesc('skSecretary', desc); }
    else if (o.position_type === 'sk_treasurer') { config.skTreasurer   = o.name; setImg('skTreasurer', url);   setDesc('skTreasurer', desc); }
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
      let idx = match ? parseInt(match[1], 10) - 1 : (o.order_index || 5) - 5;
      if (idx >= 0 && idx < 7) {
        config.councilors[idx] = o.name;
        setCouncilImg(idx, url);
        setCouncilDesc(idx, desc);
        setCouncilComm(idx, comm);
      }
    }
    else if (o.position === 'Administrator')          { config.administrator          = o.name; setImg('administrator', url);          setDesc('administrator', desc); }
    else if (o.position === 'Assistant Secretary')    { config.assistantSecretary     = o.name; setImg('assistantSecretary', url);     setDesc('assistantSecretary', desc); }
    else if (o.position === 'Assistant Administrator'){ config.assistantAdministrator = o.name; setImg('assistantAdministrator', url); setDesc('assistantAdministrator', desc); }
    else if (o.position === 'Barangay Keeper' || o.position === 'Record Keeper') { config.recordKeeper = o.name; setImg('recordKeeper', url); setDesc('recordKeeper', desc); }
    else if (o.position === 'Clerk')                  { config.clerk                  = o.name; setImg('clerk', url);                  setDesc('clerk', desc); }
  });

  return config;
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';

      const { data: officials, error: officialsError } = await supabase
        .from('barangay_officials')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (officialsError) throw officialsError;

      const { data: settingsRow } = await supabase
        .from('barangay_settings')
        .select('value')
        .eq('key', 'certificate_settings')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      const settings = settingsRow?.value || {};
      const officialsConfig = mapOfficialsToConfig(officials || []);
      
      const finalConfig = {
        ...officialsConfig,
        ...settings,
        contactInfo: { ...officialsConfig.contactInfo, ...(settings.contactInfo || {}) },
        headerInfo: { ...officialsConfig.headerInfo, ...(settings.headerInfo || {}) },
        logos: { ...officialsConfig.logos, ...(settings.logos || {}) },
        headerStyle: { ...officialsConfig.headerStyle, ...(settings.headerStyle || {}) },
        sidebarStyle: { ...officialsConfig.sidebarStyle, ...(settings.sidebarStyle || {}) },
        footerStyle: { ...officialsConfig.footerStyle, ...(settings.footerStyle || {}) },
        portalBranding: { ...officialsConfig.portalBranding, ...(settings.portalBranding || {}) },
        missionGoals: { ...officialsConfig.missionGoals, ...(settings.missionGoals || {}) },
        siteContact: { ...officialsConfig.siteContact, ...(settings.siteContact || {}) },
      };

      return res.status(200).json({ success: true, data: finalConfig });
    } catch (error) {
      console.error('Error fetching officials:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';
      const config = req.body;

      const updates = [];
      const updateOfficial = (type, name, positionPattern = null, orderIndex = null, imageUrl = null, description = null, committee = null) => {
        const payload = { name, updated_at: new Date() };
        if (imageUrl !== null && imageUrl !== undefined) payload.image_url = imageUrl;
        if (description !== null && description !== undefined) payload.description = description;
        if (committee !== null && committee !== undefined) payload.committee = committee;

        let query = supabase.from('barangay_officials').update(payload).eq('position_type', type).eq('tenant_id', tenantId);
        if (positionPattern) query = query.eq('position', positionPattern);
        if (orderIndex !== null) query = query.eq('order_index', orderIndex);
        return query;
      };

      const imgs  = config.officialImages || {};
      const descs = config.descriptions   || {};
      const comms = config.committees     || {};

      updates.push(updateOfficial('captain',      config.chairman,      null, null, imgs.chairman,      descs.chairman));
      updates.push(updateOfficial('secretary',    config.secretary,     null, null, imgs.secretary,     descs.secretary));
      updates.push(updateOfficial('treasurer',    config.treasurer,     null, null, imgs.treasurer,     descs.treasurer));
      updates.push(updateOfficial('sk_chairman',  config.skChairman,    null, null, imgs.skChairman,    descs.skChairman));
      updates.push(updateOfficial('sk_secretary', config.skSecretary || '', null, null, imgs.skSecretary, descs.skSecretary));
      updates.push(updateOfficial('sk_treasurer', config.skTreasurer || '', null, null, imgs.skTreasurer, descs.skTreasurer));

      if (Array.isArray(config.skKagawads)) {
        config.skKagawads.forEach((name, i) => {
          updates.push(
            supabase.from('barangay_officials')
              .update({ name: name || '', image_url: imgs.skKagawads?.[i] || null, description: descs.skKagawads?.[i] || null, committee: comms.skKagawads?.[i] || null, updated_at: new Date() })
              .eq('position_type', 'sk_kagawad').eq('tenant_id', tenantId).eq('position', `SK Kagawad ${i + 1}`)
          );
        });
      }

      if (Array.isArray(config.councilors)) {
        config.councilors.forEach((name, i) => {
          updates.push(
            supabase.from('barangay_officials')
              .update({ name, image_url: imgs.councilors?.[i] || null, description: descs.councilors?.[i] || null, committee: comms.councilors?.[i] || null, updated_at: new Date() })
              .eq('position_type', 'kagawad').eq('tenant_id', tenantId).eq('position', `Kagawad ${i + 1}`)
          );
        });
      }

      updates.push(supabase.from('barangay_officials').update({ name: config.administrator,          image_url: imgs.administrator,          description: descs.administrator          }).eq('position', 'Administrator').eq('tenant_id', tenantId));
      updates.push(supabase.from('barangay_officials').update({ name: config.assistantSecretary,     image_url: imgs.assistantSecretary,     description: descs.assistantSecretary     }).eq('position', 'Assistant Secretary').eq('tenant_id', tenantId));
      updates.push(supabase.from('barangay_officials').update({ name: config.assistantAdministrator, image_url: imgs.assistantAdministrator, description: descs.assistantAdministrator }).eq('position', 'Assistant Administrator').eq('tenant_id', tenantId));
      updates.push(supabase.from('barangay_officials').update({ name: config.recordKeeper,           image_url: imgs.recordKeeper,           description: descs.recordKeeper           }).eq('position', 'Barangay Keeper').eq('tenant_id', tenantId));
      updates.push(supabase.from('barangay_officials').update({ name: config.clerk,                  image_url: imgs.clerk,                  description: descs.clerk                  }).eq('position', 'Clerk').eq('tenant_id', tenantId));

      await Promise.all(updates);

      const settingsValue = {
        contactInfo: config.contactInfo, headerInfo: config.headerInfo,
        logos: config.logos, headerStyle: config.headerStyle,
        sidebarStyle: config.sidebarStyle, bodyStyle: config.bodyStyle,
        footerStyle: config.footerStyle, countryStyle: config.countryStyle,
        provinceStyle: config.provinceStyle, municipalityStyle: config.municipalityStyle,
        barangayNameStyle: config.barangayNameStyle, officeNameStyle: config.officeNameStyle,
        heroSection: config.heroSection, visibility: config.visibility,
        portalBranding: config.portalBranding,
        missionGoals: config.missionGoals,
        siteContact: config.siteContact,
      };

      const { error: settingsError } = await supabase
        .from('barangay_settings')
        .upsert({ key: 'certificate_settings', tenant_id: tenantId, value: settingsValue, updated_at: new Date() }, { onConflict: 'key,tenant_id' });

      if (settingsError) throw settingsError;

      return res.status(200).json({ success: true, message: 'Configuration saved successfully' });
    } catch (error) {
      console.error('Error saving config:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}
