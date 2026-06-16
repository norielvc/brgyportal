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

    if (error) {
      console.error("Error fetching settings:", error);
      return res.status(404).json({ 
        success: false, 
        message: "Settings not found for this tenant",
        settings: {
          certificate_settings: {
            headerInfo: {
              barangayName: '',
              municipality: '',
              province: 'Province of Bulacan'
            }
          }
        }
      });
    }

    return res.status(200).json({
      success: true,
      settings: data.value || {}
    });
  } catch (error) {
    console.error("Error in settings API:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
}
