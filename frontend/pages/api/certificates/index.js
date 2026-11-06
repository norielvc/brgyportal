import { authenticateToken } from "../../../src/lib/api-auth";
import { fetchCertificatesForTenant } from "../../../src/lib/certificateListQuery";

export default async function handler(req, res) {
  const user = await authenticateToken(req, res);
  if (!user) return;

  const tenantId = user.tenant_id || req.headers["x-tenant-id"];
  if (!tenantId)
    return res
      .status(403)
      .json({ success: false, message: "Tenant context required" });

  if (req.method === "GET") {
    const { type, status, view, full, pickup } = req.query;
    const viewMode =
      full === "1" || full === "true" ? "full" : view || "list";
    const pickupQueue =
      pickup === "1" || pickup === "true" || viewMode === "pickup";

    try {
      const certificates = await fetchCertificatesForTenant(tenantId, {
        type,
        status,
        view: viewMode === "pickup" ? "list" : viewMode,
        pickupQueue,
      });
      return res.json({ success: true, certificates, view: viewMode });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: error.message || "Query failed" });
    }
  }

  return res
    .status(405)
    .json({ success: false, message: "Method not allowed" });
}
