import { authenticateToken } from "../../../src/lib/api-auth";
import { supabase } from "../../../lib/supabase";

export default async function handler(req, res) {
  const user = await authenticateToken(req, res);
  if (!user) return;

  const tenantId = user.tenant_id || req.headers["x-tenant-id"];
  if (!tenantId)
    return res
      .status(403)
      .json({ success: false, message: "Tenant context required" });

  if (req.method === "GET") {
    const { type, status } = req.query;
    let query = supabase
      .from("certificate_requests")
      .select("*, residents:resident_id (*)")
      .eq("tenant_id", tenantId);
    if (type && type !== "all") query = query.eq("certificate_type", type);
    if (status && status !== "all") query = query.eq("status", status);
    const { data, error } = await query.order("updated_at", {
      ascending: false,
    });
    if (error)
      return res.status(500).json({ success: false, message: error.message });

    // For cohabitation requests, enrich with partner resident's place_of_birth
    const certificates = data || [];

    // Fetch workflow configurations to resolve Releasing Team assignedUsers per certificate type
    const { data: wfConfigs } = await supabase
      .from("workflow_configurations")
      .select("certificate_type, workflow_config")
      .eq("tenant_id", tenantId);

    const releasingStepByType = {};
    for (const cfg of wfConfigs || []) {
      const steps = cfg.workflow_config?.steps || [];
      const relStep =
        steps.find((s) =>
          String(s.name || "").toLowerCase().includes("releasing"),
        ) ||
        steps.find(
          (s) =>
            String(s.status || "").toLowerCase() === "oic_review" &&
            !String(s.name || "").toLowerCase().includes("preparation"),
        ) ||
        steps.find((s) =>
          ["ready", "ready_for_pickup", "released"].includes(
            String(s.status || "").toLowerCase(),
          ),
        );
      if (relStep) {
        releasingStepByType[cfg.certificate_type] = relStep;
      }
    }

    // Migrate any non-business-permit certificates at oic_review (Releasing Team) directly to ready (Pickup Management)
    for (const cert of certificates) {
      if (cert.status === "oic_review" && cert.certificate_type !== "business_permit") {
        cert.status = "ready";
        supabase
          .from("certificate_requests")
          .update({ status: "ready", updated_at: new Date().toISOString() })
          .eq("id", cert.id)
          .eq("tenant_id", tenantId)
          .then(() => {});
      }
    }

    // Attach Releasing Team assignments to ready/released certificates
    const pickupCerts = certificates.filter((c) =>
      ["ready", "ready_for_pickup", "released"].includes(c.status),
    );
    if (pickupCerts.length > 0) {
      const pickupIds = pickupCerts.map((c) => c.id);
      const { data: relAssignments } = await supabase
        .from("workflow_assignments")
        .select("id, request_id, step_id, step_name, assigned_user_id, status")
        .eq("tenant_id", tenantId)
        .in("request_id", pickupIds);

      const assignmentsByReq = {};
      for (const a of relAssignments || []) {
        const sName = String(a.step_name || "").toLowerCase();
        if (sName.includes("releasing") || sName.includes("release") || sName.includes("oic")) {
          if (!assignmentsByReq[a.request_id]) assignmentsByReq[a.request_id] = [];
          assignmentsByReq[a.request_id].push(a);
        }
      }

      for (const cert of pickupCerts) {
        const relStep = releasingStepByType[cert.certificate_type];
        const stepUsers = (relStep?.assignedUsers || []).map((u) => String(u));
        const reqAssigns = assignmentsByReq[cert.id] || [];
        const assignUsers = reqAssigns
          .map((a) => String(a.assigned_user_id || ""))
          .filter(Boolean);

        // If cert is ready/ready_for_pickup and had its Releasing Team assignment marked approved early, restore it to pending
        if (["ready", "ready_for_pickup"].includes(cert.status)) {
          const hasPending = reqAssigns.some((a) => a.status === "pending");
          if (!hasPending && reqAssigns.length > 0) {
            supabase
              .from("workflow_assignments")
              .update({ status: "pending", updated_at: new Date().toISOString() })
              .in(
                "id",
                reqAssigns.map((a) => a.id),
              )
              .eq("tenant_id", tenantId)
              .then(() => {});
          } else if (reqAssigns.length === 0 && relStep && stepUsers.length > 0) {
            const rowsToInsert = stepUsers.map((uid) => ({
              request_id: cert.id,
              tenant_id: tenantId,
              request_type: cert.certificate_type,
              step_id: String(relStep.id),
              step_name: relStep.name || "Releasing Team",
              assigned_user_id: uid,
              status: "pending",
            }));
            supabase
              .from("workflow_assignments")
              .insert(rowsToInsert)
              .then(() => {});
          }
        }

        cert.releasing_user_ids = [...new Set([...assignUsers, ...stepUsers])];
        cert.releasing_step_name = relStep?.name || reqAssigns[0]?.step_name || "Releasing Team";
      }
    }

    // Enrich resident residential_address from structured fields when flat field is empty
    for (const cert of certificates) {
      if (cert.residents && !cert.residents.residential_address) {
        const r = cert.residents;
        if (r.house_number || r.purok || r.barangay || r.municipality || r.province) {
          const parts = [
            r.house_number ? `HOUSE NO. ${String(r.house_number).trim()}` : null,
            r.purok ? String(r.purok).trim().toUpperCase() : null,
            r.barangay ? String(r.barangay).trim().toUpperCase() : null,
            r.municipality ? String(r.municipality).trim().toUpperCase() : null,
            r.province ? String(r.province).trim().toUpperCase() : null,
          ].filter(Boolean);
          cert.residents.residential_address = parts.join(", ");
        }
      }
    }
    const cohabitationRequests = certificates.filter(
      (c) => c.certificate_type === "barangay_cohabitation" && c.details?.partnerId
    );

    if (cohabitationRequests.length > 0) {
      const partnerIds = [...new Set(cohabitationRequests.map((c) => c.details.partnerId))];
      const { data: partnerResidents } = await supabase
        .from("residents")
        .select("id, place_of_birth, date_of_birth, age, sex, gender, residential_address")
        .eq("tenant_id", tenantId)
        .in("id", partnerIds);

      if (partnerResidents?.length) {
        const partnerMap = Object.fromEntries(partnerResidents.map((r) => [r.id, r]));
        for (const cert of certificates) {
          if (cert.certificate_type === "barangay_cohabitation" && cert.details?.partnerId) {
            const partner = partnerMap[cert.details.partnerId];
            if (partner) {
              cert.partner_place_of_birth = partner.place_of_birth || "";
              cert.partner_residential_address = partner.residential_address || "";
              if (!cert.partner_age) cert.partner_age = partner.age || "";
              if (!cert.partner_sex) cert.partner_sex = partner.sex || partner.gender || "";
              if (!cert.partner_date_of_birth) cert.partner_date_of_birth = partner.date_of_birth || "";
            }
          }
        }
      }
    }

    return res.json({ success: true, certificates });
  }

  return res
    .status(405)
    .json({ success: false, message: "Method not allowed" });
}
