import { authenticateToken } from "../../../src/lib/api-auth";
import { supabase } from "../../../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });

  const user = await authenticateToken(req, res);
  if (!user) return;

  const tenantId = user.tenant_id || req.headers["x-tenant-id"];
  if (!tenantId)
    return res
      .status(403)
      .json({ success: false, message: "Tenant context required" });
  const { requestId, note, stepName } = req.body;

  if (!requestId || !note)
    return res
      .status(400)
      .json({ success: false, message: "requestId and note are required" });

  const { data, error } = await supabase
    .from("workflow_history")
    .insert([
      {
        tenant_id: tenantId,
        request_id: requestId,
        step_name: stepName || "Note",
        action: "note",
        performed_by: user._id,
        comments: note,
      },
    ])
    .select()
    .single();

  if (error)
    return res.status(500).json({ success: false, message: error.message });
  return res.json({ success: true, data });
}
