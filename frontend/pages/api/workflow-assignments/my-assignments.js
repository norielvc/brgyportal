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
    .select(
      `id, step_id, step_name, assigned_user_id, status, created_at,
      certificate_requests:request_id (
        id, reference_number, certificate_type, status, full_name, purpose, address,
        contact_number, email, created_at, updated_at, resident_id, pickup_method,
        residents:resident_id (
          id, full_name, email, contact_number, residential_address
        )
      )`,
    )
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
      } else if (
        (stepName.includes('captain') ||
          stepName.includes('chairman') ||
          stepName.includes('punong')) &&
        stepName.includes('physical')
      ) {
        const statusKey = String(certStatus).toLowerCase();
        isStale = !(
          statusKey === 'captain_approval' ||
          statusKey.includes('captain') ||
          statusKey.includes('chairman')
        );
      } else if (
        stepName.includes('inspection') &&
        !stepName.includes('captain') &&
        !stepName.includes('chairman')
      ) {
        isStale = certStatus !== 'physical_inspection';
      } else if (
        stepName.includes('finance') ||
        stepName.includes('verifying')
      ) {
        isStale = String(certStatus).toLowerCase() !== 'verifying';
      } else if (
        stepName.includes('captain') ||
        stepName.includes('chairman') ||
        stepName.includes('punong')
      ) {
        const statusKey = String(certStatus).toLowerCase();
        isStale = !(
          statusKey === 'captain_approval' ||
          statusKey.includes('captain') ||
          statusKey.includes('chairman') ||
          statusKey.includes('punong')
        );
      } else if (stepName.includes('treasury') || stepName.includes('or prep')) {
        isStale = certStatus !== 'Treasury';
      } else if (stepName.includes('releasing') || stepName.includes('oic')) {
        const isBpPrep =
          cert.certificate_type === 'business_permit' &&
          !stepName.includes('releasing');
        if (isBpPrep) {
          isStale = certStatus !== 'oic_review';
        } else {
          // Releasing Team assignments are handled in Pickup Management (/pickup-management).
          // Keep the assignment pending while the certificate is ready, and only mark approved once released/closed.
          if (certStatus === 'oic_review') {
            supabase
              .from('certificate_requests')
              .update({ status: 'ready', updated_at: new Date().toISOString() })
              .eq('id', cert.id)
              .eq('tenant_id', tenantId)
              .then(() => {});
          }
          if (['released', 'rejected', 'cancelled'].includes(certStatus)) {
            supabase
              .from('workflow_assignments')
              .update({ status: 'approved', updated_at: new Date().toISOString() })
              .eq('id', assignment.id)
              .eq('tenant_id', tenantId)
              .then(() => {});
          }
          return null;
        }
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
        _listView: true,
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

  // Enrich resident residential_address from structured fields when flat field is empty
  for (const cert of certificates) {
    if (cert.residents && !cert.residents.residential_address) {
      const r = cert.residents;
      if (r.house_number || r.purok || r.barangay || r.municipality || r.province) {
        const parts = [
          r.house_number ? String(r.house_number).trim().toUpperCase() : null,
          r.purok ? String(r.purok).trim().toUpperCase() : null,
          r.barangay ? String(r.barangay).trim().toUpperCase() : null,
          r.municipality ? String(r.municipality).trim().toUpperCase() : null,
          r.province ? String(r.province).trim().toUpperCase() : null,
        ].filter(Boolean);
        cert.residents.residential_address = parts.join(", ");
      }
    }
  }

  return res.json({ success: true, data: certificates, certificates });
}
