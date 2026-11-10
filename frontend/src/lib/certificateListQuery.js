import { supabase } from "../../lib/supabase";
import { mergeResidentDemographicsOntoCertificate } from "./certificateRequestDemographics";

/** List view: no `details` JSON blob; slim joins (detail fields load on open). */
export const CERTIFICATE_LIST_SELECT = `
  id,
  tenant_id,
  reference_number,
  certificate_type,
  status,
  full_name,
  email,
  purpose,
  address,
  contact_number,
  created_at,
  updated_at,
  resident_id,
  date_released,
  pickup_method,
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
    residential_address
  )
`;

/** Pickup queue — no workflow embed; only statuses staff release from. */
export const CERTIFICATE_PICKUP_SELECT = `
  id,
  tenant_id,
  reference_number,
  certificate_type,
  status,
  full_name,
  email,
  contact_number,
  created_at,
  updated_at,
  resident_id,
  date_released,
  pickup_method,
  residents:resident_id (
    id,
    full_name,
    email,
    contact_number
  )
`;

export const PICKUP_QUEUE_STATUSES = [
  "ready",
  "ready_for_pickup",
  "oic_review",
  "released",
];

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

/** PDF / preview: full cert row (incl. details) but slim resident join (known DB columns only). */
export const RESIDENT_PDF_SELECT = `
  id,
  tenant_id,
  full_name,
  first_name,
  middle_name,
  last_name,
  suffix,
  email,
  contact_number,
  gender,
  age,
  civil_status,
  date_of_birth,
  place_of_birth,
  residential_address,
  house_number,
  purok,
  barangay,
  municipality,
  province,
  pending_case,
  case_record_history,
  is_deceased,
  date_of_death,
  covid_related,
  cause_of_death
`;

export const CERTIFICATE_PDF_SELECT = `
  *,
  residents:resident_id (${RESIDENT_PDF_SELECT.replace(/\s+/g, " ").trim()}),
  workflow_assignments (
    id,
    step_id,
    step_name,
    assigned_user_id,
    status,
    created_at,
    updated_at,
    completed_at
  )
`;

const WORKFLOW_CONFIG_CACHE_TTL_MS = 90_000;
let workflowConfigCache = { tenantId: null, at: 0, rows: null };

async function loadWorkflowConfigurations(tenantId) {
  const now = Date.now();
  if (
    workflowConfigCache.tenantId === tenantId &&
    workflowConfigCache.rows &&
    now - workflowConfigCache.at < WORKFLOW_CONFIG_CACHE_TTL_MS
  ) {
    return workflowConfigCache.rows;
  }
  const { data: wfConfigs } = await supabase
    .from("workflow_configurations")
    .select("certificate_type, workflow_config")
    .eq("tenant_id", tenantId);
  workflowConfigCache = {
    tenantId,
    at: now,
    rows: wfConfigs || [],
  };
  return workflowConfigCache.rows;
}

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
    applicant_name: cert.applicant_name || cert.full_name || null,
    phone: cert.phone || cert.contact_number || null,
    released_at: cert.released_at || cert.date_released || null,
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
  const { includeCohabitationPartners = false, skipSideEffects = false } =
    options;
  const list = (certificates || []).map(attachPendingWorkflowAssignment);

  const wfConfigs = await loadWorkflowConfigurations(tenantId);
  const releasingStepByType = buildReleasingStepByType(wfConfigs);

  if (!skipSideEffects) {
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
  }

  const pickupCerts = list.filter((c) =>
    ["ready", "ready_for_pickup", "released"].includes(c.status),
  );

  if (!skipSideEffects && pickupCerts.length > 0) {
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
  } else if (skipSideEffects && pickupCerts.length > 0) {
    for (const cert of pickupCerts) {
      const relStep = releasingStepByType[cert.certificate_type];
      cert.releasing_user_ids = (relStep?.assignedUsers || []).map((u) =>
        String(u),
      );
      cert.releasing_step_name = relStep?.name || "Releasing Team";
    }
  }

  for (const cert of list) {
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

  if (includeCohabitationPartners) {
    const cohabitationPartnerId = (cert) => {
      let details = cert.details;
      if (typeof details === "string") {
        try {
          details = JSON.parse(details);
        } catch {
          details = null;
        }
      }
      return details?.partnerId || null;
    };

    const cohabitationRequests = list.filter(
      (c) =>
        c.certificate_type === "barangay_cohabitation" &&
        cohabitationPartnerId(c),
    );

    if (cohabitationRequests.length > 0) {
      const partnerIds = [
        ...new Set(cohabitationRequests.map((c) => cohabitationPartnerId(c))),
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
          const partnerId = cohabitationPartnerId(cert);
          if (cert.certificate_type === "barangay_cohabitation" && partnerId) {
            const partner = partnerMap[partnerId];
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

export async function fetchCertificateById(tenantId, id, { view = "full" } = {}) {
  const isPdf = view === "pdf";
  let effectiveView = view;
  let select = isPdf ? CERTIFICATE_PDF_SELECT : CERTIFICATE_FULL_SELECT;

  let { data, error } = await supabase
    .from("certificate_requests")
    .select(select)
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (error && isPdf) {
    const retry = await supabase
      .from("certificate_requests")
      .select(CERTIFICATE_FULL_SELECT)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();
    data = retry.data;
    error = retry.error;
    effectiveView = "full";
  }

  if (error) {
    const err = new Error(error.message || "Failed to load certificate");
    err.code =
      error.code === "PGRST116" || String(error.message || "").includes("0 rows")
        ? "NOT_FOUND"
        : "QUERY_ERROR";
    throw err;
  }
  if (!data) {
    const err = new Error("Certificate not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  const [enriched] = await enrichCertificateList([data], tenantId, {
    includeCohabitationPartners: effectiveView === "pdf" || effectiveView === "full",
    skipSideEffects: true,
  });

  return mergeResidentDemographicsOntoCertificate(
    attachPendingWorkflowAssignment(enriched),
  );
}

export async function fetchCertificatesForTenant(
  tenantId,
  { type, status, view = "list", pickupQueue = false } = {},
) {
  const isFull = view === "full" || view === "1" || view === "true";
  const isPickup = Boolean(pickupQueue) && !isFull;

  let select = CERTIFICATE_LIST_SELECT;
  if (isFull) select = CERTIFICATE_FULL_SELECT;
  else if (isPickup) select = CERTIFICATE_PICKUP_SELECT;

  let query = supabase
    .from("certificate_requests")
    .select(select)
    .eq("tenant_id", tenantId);

  if (isPickup) {
    query = query.in("status", PICKUP_QUEUE_STATUSES);
  }

  if (type && type !== "all") query = query.eq("certificate_type", type);
  if (status && status !== "all") query = query.eq("status", status);

  const { data, error } = await query.order("updated_at", { ascending: false });
  if (error) throw error;

  return enrichCertificateList(data || [], tenantId, {
    includeCohabitationPartners: isFull,
    markListView: !isFull,
    // Side effects (status fixes, releasing assignments) only on pickup queue — not /requests history.
    skipSideEffects: isFull || !isPickup,
  });
}
