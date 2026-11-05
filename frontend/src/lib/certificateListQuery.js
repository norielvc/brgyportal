import { supabase } from "../../lib/supabase";

/** List view: no `details` JSON blob; slim resident join. */
export const CERTIFICATE_LIST_SELECT = `
  id,
  tenant_id,
  reference_number,
  certificate_type,
  status,
  full_name,
  applicant_name,
  email,
  purpose,
  address,
  phone,
  created_at,
  updated_at,
  resident_id,
  released_at,
  workflow_assignments (
    id,
    step_id,
    step_name,
    assigned_user_id,
    status,
    created_at
  ),
  residents:resident_id (
    id,
    full_name,
    email,
    contact_number,
    residential_address,
    house_number,
    purok,
    barangay,
    municipality,
    province
  )
`;

export const CERTIFICATE_FULL_SELECT = `
  *,
  residents:resident_id (*),
  workflow_assignments (
    id,
    step_id,
    step_name,
    assigned_user_id,
    status,
    created_at
  )
`;

export function attachPendingWorkflowAssignment(cert) {
  const assignments = cert.workflow_assignments || [];
  const pendingAssignment = assignments
    .filter((a) => a.status === "pending")
    .sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime(),
    )[0];
  return {
    ...cert,
    workflow_assignment: pendingAssignment || null,
  };
}

function buildReleasingStepByType(wfConfigs) {
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
  return releasingStepByType;
}

export async function enrichCertificateList(certificates, tenantId, options = {}) {
  const { includeCohabitationPartners = false } = options;
  const list = (certificates || []).map(attachPendingWorkflowAssignment);

  const { data: wfConfigs } = await supabase
    .from("workflow_configurations")
    .select("certificate_type, workflow_config")
    .eq("tenant_id", tenantId);

  const releasingStepByType = buildReleasingStepByType(wfConfigs);

  for (const cert of list) {
    if (
      cert.status === "oic_review" &&
      cert.certificate_type !== "business_permit"
    ) {
      cert.status = "ready";
      supabase
        .from("certificate_requests")
        .update({ status: "ready", updated_at: new Date().toISOString() })
        .eq("id", cert.id)
        .eq("tenant_id", tenantId)
        .then(() => {});
    }
  }

  const pickupCerts = list.filter((c) =>
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
      if (
        sName.includes("releasing") ||
        sName.includes("release") ||
        sName.includes("oic")
      ) {
        if (!assignmentsByReq[a.request_id]) {
          assignmentsByReq[a.request_id] = [];
        }
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

      if (["ready", "ready_for_pickup"].includes(cert.status)) {
        const hasPending = reqAssigns.some((a) => a.status === "pending");
        if (!hasPending && reqAssigns.length > 0) {
          supabase
            .from("workflow_assignments")
            .update({
              status: "pending",
              updated_at: new Date().toISOString(),
            })
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
          supabase.from("workflow_assignments").insert(rowsToInsert).then(() => {});
        }
      }

      cert.releasing_user_ids = [...new Set([...assignUsers, ...stepUsers])];
      cert.releasing_step_name =
        relStep?.name || reqAssigns[0]?.step_name || "Releasing Team";
    }
  }

  for (const cert of list) {
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

  if (includeCohabitationPartners) {
    const cohabitationRequests = list.filter(
      (c) =>
        c.certificate_type === "barangay_cohabitation" && c.details?.partnerId,
    );

    if (cohabitationRequests.length > 0) {
      const partnerIds = [
        ...new Set(cohabitationRequests.map((c) => c.details.partnerId)),
      ];
      const { data: partnerResidents } = await supabase
        .from("residents")
        .select(
          "id, place_of_birth, date_of_birth, age, sex, gender, residential_address",
        )
        .eq("tenant_id", tenantId)
        .in("id", partnerIds);

      if (partnerResidents?.length) {
        const partnerMap = Object.fromEntries(
          partnerResidents.map((r) => [r.id, r]),
        );
        for (const cert of list) {
          if (
            cert.certificate_type === "barangay_cohabitation" &&
            cert.details?.partnerId
          ) {
            const partner = partnerMap[cert.details.partnerId];
            if (partner) {
              cert.partner_place_of_birth = partner.place_of_birth || "";
              cert.partner_residential_address = partner.residential_address || "";
              if (!cert.partner_age) cert.partner_age = partner.age || "";
              if (!cert.partner_sex) {
                cert.partner_sex = partner.sex || partner.gender || "";
              }
              if (!cert.partner_date_of_birth) {
                cert.partner_date_of_birth = partner.date_of_birth || "";
              }
            }
          }
        }
      }
    }
  }

  if (options.markListView) {
    for (const cert of list) {
      cert._listView = true;
    }
  }

  return list;
}

export async function fetchCertificatesForTenant(
  tenantId,
  { type, status, view = "list" } = {},
) {
  const isFull = view === "full" || view === "1" || view === "true";
  let query = supabase
    .from("certificate_requests")
    .select(isFull ? CERTIFICATE_FULL_SELECT : CERTIFICATE_LIST_SELECT)
    .eq("tenant_id", tenantId);

  if (type && type !== "all") query = query.eq("certificate_type", type);
  if (status && status !== "all") query = query.eq("status", status);

  const { data, error } = await query.order("updated_at", { ascending: false });
  if (error) throw error;

  return enrichCertificateList(data || [], tenantId, {
    includeCohabitationPartners: isFull,
    markListView: !isFull,
  });
}
