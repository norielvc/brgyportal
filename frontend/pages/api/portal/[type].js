import path from "path";
import fs from "fs/promises";

/**
 * DYNAMIC PORTAL CONTENT API (Next.js)
 * ----------------------------------
 * Handles /api/portal/events, /api/portal/facilities, /api/portal/officials, etc.
 * Implements "Resilience Fallback" for paused Supabase plans.
 */
export default async function handler(req, res) {
  const { type } = req.query;
  const tenantId = req.headers["x-tenant-id"] || "ibaoeste";

  const validTypes = [
    "events",
    "facilities",
    "officials",
    "achievements",
    "programs",
    "config",
  ];
  if (!validTypes.includes(type)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid content type" });
  }

  /**
   * STAGE 1: Attempt Cloud Fetch (Live Supabase)
   */
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error(
      `❌ [Portal/${type}] SUPABASE_URL or SUPABASE_ANON_KEY is missing from environment variables! Falling back to local data.`,
    );
  }

  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY)
      throw new Error("Missing Supabase env vars");
    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          fetch: (url, options) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            return fetch(url, { ...options, signal: controller.signal })
              .then((res) => {
                clearTimeout(timeoutId);
                return res;
              })
              .catch((err) => {
                clearTimeout(timeoutId);
                throw err;
              });
          },
        },
      },
    );

    console.log(`📡 Cloud Attempt [Portal/${type}] for tenant: ${tenantId}`);

    // Mapping internal types to real Supabase table names
    const tableMap = {
      officials: "barangay_officials",
      events: "events",
      facilities: "facilities",
      achievements: "achievements",
      programs: "programs",
    };

    if (type === "config") {
      const { data: officials } = await supabase
        .from("barangay_officials")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_active", true);
      const { data: settingsRow } = await supabase
        .from("barangay_settings")
        .select("value")
        .eq("key", "certificate_settings")
        .eq("tenant_id", tenantId)
        .single();

      const settings = settingsRow?.value || {};
      const config = mapOfficialsToConfig(officials || []);

      return res.status(200).json({
        success: true,
        data: { ...config, ...settings },
        source: "cloud_supabase",
      });
    }

    const targetTable = tableMap[type] || type;
    let query = supabase
      .from(targetTable)
      .select("*")
      .eq("tenant_id", tenantId);

    // Apply sorting for officials
    if (type === "officials") {
      query = query.eq("is_active", true);
    } else {
      query = query.order("id", { ascending: true });
    }

    const { data: cloudData, error } = await query;

    if (!error && cloudData && cloudData.length > 0) {
      let finalData = cloudData;

      // Special handling for officials sorting
      if (type === "officials") {
        const positionOrder = {
          captain: 1,
          kagawad: 2,
          sk_chairman: 3,
          sk_secretary: 3.1,
          sk_treasurer: 3.2,
          sk_kagawad: 3.3,
          secretary: 4,
          treasurer: 4,
          staff: 4,
        };
        finalData = cloudData.sort((a, b) => {
          const orderA = positionOrder[a.position_type] || 999;
          const orderB = positionOrder[b.position_type] || 999;
          if (orderA !== orderB) return orderA - orderB;
          return (a.order_index || 0) - (b.order_index || 0);
        });
      }

      console.log(
        `✅ LIVE Cloud data served for [Portal/${type}] (${finalData.length} items)`,
      );
      return res
        .status(200)
        .json({ success: true, data: finalData, source: "cloud_supabase" });
    } else if (error) {
      console.error(`Supabase fetch error [${type}]:`, error.message);
    }
  } catch (cloudError) {
    console.warn(
      `⚠️ Cloud Bypass [Portal/${type}]: Keys missing or unreachable.`,
    );
  }

  /**
   * STAGE 2: Local Resilience Fallback (JSON-based)
   */
  try {
    const dataPath = path.join(
      process.cwd(),
      "src/data/mock/portal_config.json",
    );
    const jsonData = await fs.readFile(dataPath, "utf8");
    const config = JSON.parse(jsonData);

    const list = config[type] || [];
    const filteredList = list.filter(
      (item) => !item.tenant_id || item.tenant_id === tenantId,
    );

    console.log(
      `📦 Fallback data served for [Portal/${type}] (Found ${filteredList.length} items)`,
    );
    return res.status(200).json({
      success: true,
      data: type === "config" ? config.config || {} : filteredList,
      source: "local_resilience_store",
    });
  } catch (fsError) {
    console.error(`❌ CRITICAL FAILURE [Portal/${type}]:`, fsError);
    return res
      .status(500)
      .json({ success: false, message: "Portal content unavailable offline." });
  }
}

function mapOfficialsToConfig(officials) {
  const config = { councilors: [], skKagawads: [], visibility: {} };
  officials.forEach((o) => {
    if (o.position_type === "captain") config.chairman = o.name;
    else if (o.position_type === "kagawad") config.councilors.push(o.name);
    // ... simplified mapping
  });
  return config;
}
