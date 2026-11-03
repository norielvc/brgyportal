import { authenticateToken } from "../../../src/lib/api-auth";
import { supabase } from "../../../lib/supabase";
import {
  getKapchatSettings,
  normalizeKapchatSettings,
  saveKapchatSettings,
} from "../../../src/lib/kapchatAccess";

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
    const settings = await getKapchatSettings(supabase, tenantId);
    return res.status(200).json({ success: true, data: settings });
  }

  if (req.method === "PUT") {
    const role = String(user.role || "").toLowerCase();
    if (!["admin", "superadmin", "super_admin", "captain"].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Only admin or barangay captain can update KapChat settings",
      });
    }

    const settings = normalizeKapchatSettings(req.body?.settings || req.body);
    try {
      const saved = await saveKapchatSettings(supabase, tenantId, settings);
      return res.status(200).json({
        success: true,
        message: "KapChat settings saved",
        data: saved,
      });
    } catch (error) {
      console.error("[kapchat-settings] save:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to save KapChat settings",
      });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}

