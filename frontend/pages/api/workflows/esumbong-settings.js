import { authenticateToken } from "../../../src/lib/api-auth";
import { supabase } from "../../../lib/supabase";
import {
  getEsumbongSettings,
  normalizeEsumbongSettings,
  saveEsumbongSettings,
} from "../../../src/lib/esumbongAccess";

export default async function handler(req, res) {
  const user = await authenticateToken(req, res);
  if (!user) return;

  const tenantId = user.tenant_id || req.headers["x-tenant-id"];
  if (!tenantId) {
    return res
      .status(403)
      .json({ success: false, message: "Tenant context required" });
  }

  if (req.method === "GET") {
    const settings = await getEsumbongSettings(supabase, tenantId);
    return res.status(200).json({ success: true, data: settings });
  }

  if (req.method === "PUT") {
    const role = String(user.role || "").toLowerCase();
    if (!["admin", "superadmin", "captain"].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Only admin or barangay chairman can update E-Sumbong settings",
      });
    }

    const settings = normalizeEsumbongSettings(req.body?.settings || req.body);
    try {
      const saved = await saveEsumbongSettings(supabase, tenantId, settings);
      return res.status(200).json({
        success: true,
        message: "E-Sumbong settings saved",
        data: saved,
      });
    } catch (error) {
      console.error("[esumbong-settings] save:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to save E-Sumbong settings",
      });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
