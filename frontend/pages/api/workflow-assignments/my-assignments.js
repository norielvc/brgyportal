import { authenticateToken } from "../../../src/lib/api-auth";
import { supabase } from "../../../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "GET")
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

  const { data, error } = await supabase
    .from("workflow_assignments")
    .select("*, certificate_requests:request_id (*, residents:resident_id (*))")
    .eq("assigned_user_id", user._id)
    .eq("status", "pending")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error)
    return res.status(500).json({ success: false, message: error.message });

  // Flatten: attach workflow_assignment info onto the certificate record
  // Also filter out stale assignments where the cert has moved past this step
  const stepToStatuses = {
    'staff_review': ['staff_review', 'pending', 'submitted', 'returned'],
    'secretary_approval': ['processing', 'secretary_approval'],
    'captain_approval': ['captain_approval'],
    'oic_review': ['oic_review'],
    'Treasury': ['Treasury'],
    'physical_inspection': ['physical_inspection'],
  };

  const certificates = (data || [])
    .map((assignment) => {
      const cert = assignment.certificate_requests;
      if (!cert) return null;

      // Filter out stale: if cert status doesn't match this step's expected statuses, skip
      const expectedStatuses = stepToStatuses[assignment.step_id] || stepToStatuses[assignment.step_name?.toLowerCase().includes('staff') ? 'staff_review' : assignment.step_name?.toLowerCase().includes('secretary') ? 'secretary_approval' : assignment.step_name?.toLowerCase().includes('captain') ? 'captain_approval' : ''] || null;
      if (expectedStatuses && !expectedStatuses.includes(cert.status)) {
        // Auto-clean stale assignment in background
        supabase.from('workflow_assignments').update({ status: 'approved', updated_at: new Date().toISOString() }).eq('id', assignment.id).eq('tenant_id', tenantId).then(() => {});
        return null;
      }

      return {
        ...cert,
        workflow_assignment: {
          id: assignment.id,
          step_id: assignment.step_id,
          step_name: assignment.step_name,
          assigned_user_id: assignment.assigned_user_id,
          status: assignment.status,
        },
      };
    })
    .filter(Boolean);

  return res.json({ success: true, data: certificates, certificates });
}
