import { authenticateToken } from "../../src/lib/api-auth";
import { supabase } from "../../lib/supabase";

/**
 * GET /api/settings
 * Fetch barangay settings for the current tenant
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const user = await authenticateToken(req, res);
  if (!user) return;

  const tenantId = user.tenant_id || req.headers["x-tenant-id"];
  if (!tenantId) {
    return res.status(403).json({ success: false, message: "Tenant context required" });
  }

  try {
    // Fetch barangay settings for this tenant
    const { data, error } = await supabase
      .from("barangay_settings")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("key", "certificate_settings")
      .single();

    // Fetch tenant identity as fallback source (not hardcoded)
    const { data: tenant } = await supabase
      .from("tenants")
      .select("name, municipality, region")
      .eq("id", tenantId)
      .maybeSingle();

    const settingsValue = data?.value || {};
    const headerInfo = settingsValue.certificate_settings?.headerInfo || settingsValue.headerInfo || {};

    const effectiveHeaderInfo = {
      ...headerInfo,
      barangayName: headerInfo.barangayName || tenant?.name || '',
      municipality: headerInfo.municipality || tenant?.municipality || '',
      province: headerInfo.province || (tenant?.region ? `Province of ${tenant.region}` : 'Province of Bulacan'),
    };

    const merged = {
      ...settingsValue,
      certificate_settings: {
        ...(settingsValue.certificate_settings || {}),
        headerInfo: effectiveHeaderInfo,
      },
      headerInfo: effectiveHeaderInfo,
    };

    return res.status(200).json({
      success: true,
      settings: merged,
    });
  } catch (error) {
    console.error("Error in settings API:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
