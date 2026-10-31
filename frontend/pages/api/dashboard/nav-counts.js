import { authenticateToken } from "../../../src/lib/api-auth";
import { supabase } from "../../../lib/supabase";

const OPEN_REQUEST_STATUSES = [
  "pending",
  "submitted",
  "processing",
  "under_review",
  "staff_review",
  "returned",
  "secretary_approval",
  "captain_approval",
  "oic_review",
  "physical_inspection",
  "Treasury",
  "ready",
  "ready_for_pickup",
];

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });

  const user = await authenticateToken(req, res);
  if (!user) return;

  const tenantId = user.tenant_id || req.headers["x-tenant-id"];
  if (!tenantId) {
    return res.status(200).json({
      success: true,
      data: { pendingRequests: 0 },
    });
  }

  const { count, error } = await supabase
    .from("certificate_requests")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .in("status", OPEN_REQUEST_STATUSES);

  if (error)
    return res
      .status(400)
      .json({ success: false, message: "Failed to fetch request counts" });

  return res.status(200).json({
    success: true,
    data: { pendingRequests: count ?? 0 },
  });
}
