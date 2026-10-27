import { authenticateToken } from "../../../src/lib/api-auth";
import { supabase } from "../../../lib/supabase";

/**
 * DELETE /api/upload/delete
 * Removes a file from Supabase Storage by its public URL.
 * Only allows deleting files within the authenticated user's tenant folder.
 *
 * Body: { url: "https://...supabase.co/.../portal-images/ibaoeste/facilities/123.webp" }
 */
export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const userRes = await authenticateToken(req, res);
  if (!userRes) return;

  const tenantId = userRes.tenant_id;
  if (!tenantId) {
    return res.status(403).json({ success: false, message: "No tenant context" });
  }

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, message: "Missing url" });
  }

  // Only delete files that belong to this tenant's folder
  const path = extractStoragePath(url);
  if (!path) {
    return res.status(400).json({ success: false, message: "Not a valid storage URL" });
  }
  if (!path.startsWith(`${tenantId}/`)) {
    return res.status(403).json({ success: false, message: "Cannot delete files from another tenant" });
  }

  try {
    const { error } = await supabase.storage
      .from("portal-images")
      .remove([path]);

    if (error) throw error;

    return res.status(200).json({ success: true, message: "File deleted" });
  } catch (err) {
    console.error("Storage delete error:", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
}

function extractStoragePath(url) {
  try {
    const marker = "/portal-images/";
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.slice(idx + marker.length);
  } catch {
    return null;
  }
}
