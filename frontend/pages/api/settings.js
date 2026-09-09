import { authenticateToken } from "../../src/lib/api-auth";
import { supabase } from "../../lib/supabase";

/**
 * GET /api/settings
 * Fetch barangay settings for the current tenant with graceful defaults
 */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  let tenantId = req.headers["x-tenant-id"] || "ibaoeste";

  try {
    const user = await authenticateToken(req, res);
    if (user && user.tenant_id) {
      tenantId = user.tenant_id;
    }
  } catch (err) {
    // Continue with header or default tenantId
  }

  try {
    // Fetch barangay settings for this tenant
    const { data } = await supabase
      .from("barangay_settings")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("key", "certificate_settings")
      .maybeSingle();

    // Fetch tenant identity as fallback source
    const { data: tenant } = await supabase
      .from("tenants")
      .select("name, municipality, region")
      .eq("id", tenantId)
      .maybeSingle();

    const settingsValue = data?.value || {};
    const headerInfo = settingsValue.certificate_settings?.headerInfo || settingsValue.headerInfo || {};

    const effectiveHeaderInfo = {
      ...headerInfo,
      barangayName: headerInfo.barangayName || tenant?.name || "BARANGAY IBA O' ESTE",
      municipality: headerInfo.municipality || tenant?.municipality || 'Calumpit',
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
    return res.status(200).json({
      success: true,
      settings: {
        headerInfo: {
          barangayName: "BARANGAY IBA O' ESTE",
          municipality: "Calumpit",
          province: "Province of Bulacan",
        },
      },
    });
  }
}
