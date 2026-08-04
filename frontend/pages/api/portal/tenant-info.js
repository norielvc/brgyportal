/**
 * PUBLIC TENANT INFO API
 * ----------------------
 * Returns public branding / identity info for a given tenant.
 * No authentication required — this is public-facing portal data.
 *
 * GET /api/portal/tenant-info  (Header: x-tenant-id)
 */

export default async function handler(req, res) {
  const tenantId = (req.headers["x-tenant-id"] || "ibaoeste").toLowerCase();

  res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=600");

  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new Error("Missing Supabase env vars");
    }

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

    const { data: tenant, error } = await supabase
      .from("tenants")
      .select("id, name, domain, plan_tier, status")
      .eq("id", tenantId)
      .single();

    if (error || !tenant) {
      return res.status(200).json({
        success: true,
        data: null,
        source: "not_found",
      });
    }

    return res.status(200).json({
      success: true,
      data: tenant,
      source: "cloud_supabase",
    });
  } catch (err) {
    console.error(`[tenant-info] Error: ${err.message}`);
    return res.status(200).json({
      success: true,
      data: null,
      source: "error",
      message: err.message,
    });
  }
}
