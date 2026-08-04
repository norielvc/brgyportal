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
  const tenantId = (req.headers["x-tenant-id"] || "ibaoeste").toLowerCase();

  // Cache responses for 60 seconds on client, serve stale for 5 minutes
  res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");

  const validTypes = [
    "events",
    "facilities",
    "officials",
    "achievements",
    "programs",
    "config",
    "tourism",
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
            const timeoutId = setTimeout(() => controller.abort(), 5000);
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
      tourism: "tourism_destinations",
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

    // Apply sorting
    if (type === "officials") {
      query = query.eq("is_active", true);
    } else if (type === "events" || type === "facilities" || type === "programs" || type === "achievements" || type === "tourism") {
      // Order by order_index for content that has it
      query = query.order("order_index", { ascending: true });
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

    // No data found (empty result, no error) — return empty array
    return res.status(200).json({
      success: true,
      data: [],
      source: "cloud_supabase_empty",
    });
  } catch (cloudError) {
    console.error(
      `❌ Cloud data unavailable [Portal/${type}]: ${cloudError.message}`,
    );
    // Don't serve fake fallback data - return empty result
    return res.status(200).json({
      success: true,
      data: type === "config" ? {} : [],
      source: "no_data_available",
      message: "Database unavailable - no fallback data provided"
    });
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
