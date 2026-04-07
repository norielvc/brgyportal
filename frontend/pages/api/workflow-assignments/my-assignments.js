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
  // Filter out stale assignments where the cert has already moved past this step
  const certificates = (data || [])
    .map((assignment) => {
      const cert = assignment.certificate_requests;
      if (!cert) return null;

      const stepName = (assignment.step_name || '').toLowerCase();
      const certStatus = cert.status || '';

      // Determine if this assignment is stale based on step name vs cert status
      let isStale = false;
      if (stepName.includes('review request') || stepName.includes('staff')) {
        // Step 1 is only valid when cert is at staff_review, pending, submitted, or returned
        isStale = !['staff_review', 'pending', 'submitted', 'returned'].includes(certStatus);
      } else if (stepName.includes('secretary')) {
        isStale = !['processing', 'secretary_approval'].includes(certStatus);
      } else if (stepName.includes('captain')) {
        isStale = certStatus !== 'captain_approval';
      } else if (stepName.includes('releasing') || stepName.includes('oic')) {
        isStale = !['oic_review', 'ready', 'ready_for_pickup'].includes(certStatus);
      }

      if (isStale) {
        // Auto-clean in background
        supabase.from('workflow_assignments')
          .update({ status: 'approved', updated_at: new Date().toISOString() })
          .eq('id', assignment.id)
          .eq('tenant_id', tenantId)
          .then(() => {});
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
