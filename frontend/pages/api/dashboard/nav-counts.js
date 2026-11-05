import { authenticateToken } from "../../../src/lib/api-auth";
import { supabase } from "../../../lib/supabase";
import {
  buildReleasingStepByType,
  computeStaffNavCounts,
} from "../../../src/lib/certificateNavCounts";
import { getWorkflowMapForTenant } from "../../../src/lib/workflowMap";

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

const ESUMBONG_OPEN = ["pending", "under_review"];
const ASSISTANCE_OPEN = ["pending", "in_progress"];

async function countKapchatUnread(tenantId) {
  const { count, error } = await supabase
    .from("kapchat_messages")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("is_admin", false)
    .eq("status", "unread");
  if (error) {
    console.warn("[nav-counts] kapchat unread:", error.message);
    return 0;
  }
  return count ?? 0;
}

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
      data: {
        pendingRequests: 0,
        certificateRequests: 0,
        pickupManagement: 0,
        helpDesk: { esumbong: 0, assistance: 0, kapchat: 0, total: 0 },
      },
    });
  }

  const userId = String(user._id || user.id || "");

  try {
    const [
      pendingRes,
      esumbongRes,
      assistanceRes,
      kapchatUnread,
      wfMap,
      wfConfigsRes,
      myAssignRes,
      openCertsRes,
      pickupCertsRes,
    ] = await Promise.all([
      supabase
        .from("certificate_requests")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .in("status", OPEN_REQUEST_STATUSES),
      supabase
        .from("blotter_reports")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .in("status", ESUMBONG_OPEN),
      supabase
        .from("assistance_inquiries")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .in("status", ASSISTANCE_OPEN),
      countKapchatUnread(tenantId),
      getWorkflowMapForTenant(tenantId),
      supabase
        .from("workflow_configurations")
        .select("certificate_type, workflow_config")
        .eq("tenant_id", tenantId),
      userId
        ? supabase
            .from("workflow_assignments")
            .select(
              "id, step_name, assigned_user_id, status, certificate_requests:request_id (id, status, certificate_type)",
            )
            .eq("tenant_id", tenantId)
            .eq("assigned_user_id", userId)
            .eq("status", "pending")
        : Promise.resolve({ data: [] }),
      supabase
        .from("certificate_requests")
        .select(
          "id, status, certificate_type, workflow_assignments (id, step_name, assigned_user_id, status, created_at)",
        )
        .eq("tenant_id", tenantId)
        .in("status", OPEN_REQUEST_STATUSES),
      supabase
        .from("certificate_requests")
        .select("id, status, certificate_type")
        .eq("tenant_id", tenantId)
        .in("status", ["ready", "ready_for_pickup", "oic_review"]),
    ]);

    if (pendingRes.error) {
      return res.status(400).json({
        success: false,
        message: "Failed to fetch request counts",
      });
    }

    const releasingStepByType = buildReleasingStepByType(
      wfConfigsRes.data || [],
    );
    const pickupCerts = pickupCertsRes.data || [];
    let releasingAssignmentsByRequestId = {};

    if (pickupCerts.length > 0) {
      const pickupIds = pickupCerts.map((c) => c.id);
      const { data: relAssignments } = await supabase
        .from("workflow_assignments")
        .select("request_id, assigned_user_id, step_name")
        .eq("tenant_id", tenantId)
        .in("request_id", pickupIds);

      for (const a of relAssignments || []) {
        const sName = String(a.step_name || "").toLowerCase();
        if (
          sName.includes("releasing") ||
          sName.includes("release") ||
          sName.includes("oic")
        ) {
          if (!releasingAssignmentsByRequestId[a.request_id]) {
            releasingAssignmentsByRequestId[a.request_id] = [];
          }
          releasingAssignmentsByRequestId[a.request_id].push(a);
        }
      }
    }

    const staffCounts = computeStaffNavCounts({
      activeUser: user,
      wfMap,
      myAssignmentRows: myAssignRes.data || [],
      openCertificates: openCertsRes.data || [],
      pickupCertificates: pickupCerts,
      releasingStepByType,
      releasingAssignmentsByRequestId,
    });

    const esumbong = esumbongRes.error ? 0 : esumbongRes.count ?? 0;
    const assistance = assistanceRes.error ? 0 : assistanceRes.count ?? 0;
    const kapchat = kapchatUnread;
    const helpDeskTotal = esumbong + assistance + kapchat;

    res.setHeader("Cache-Control", "private, max-age=15");

    return res.status(200).json({
      success: true,
      data: {
        pendingRequests: pendingRes.count ?? 0,
        certificateRequests: staffCounts.certificateRequests,
        pickupManagement: staffCounts.pickupManagement,
        helpDesk: {
          esumbong,
          assistance,
          kapchat,
          total: helpDeskTotal,
        },
      },
    });
  } catch (err) {
    console.error("[nav-counts]", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch nav counts",
    });
  }
}
