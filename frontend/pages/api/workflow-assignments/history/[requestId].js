import { authenticateToken } from "../../../../src/lib/api-auth";
import { supabase } from "../../../../lib/supabase";
import {
  WORKFLOW_ASSIGNMENTS_FULL_SELECT,
  WORKFLOW_ASSIGNMENTS_PDF_SELECT,
  WORKFLOW_HISTORY_FULL_SELECT,
  WORKFLOW_HISTORY_PDF_SELECT,
} from "../../../../src/lib/workflowHistoryQuery";

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });

  const user = await authenticateToken(req, res);
  if (!user) return;

  const tenantId = user.tenant_id || req.headers["x-tenant-id"];
  const { requestId } = req.query;

  const isPdf =
    req.query.view === "pdf" ||
    req.query.pdf === "1" ||
    String(req.query.view || "").toLowerCase() === "pdf";

  let historySelect = isPdf
    ? WORKFLOW_HISTORY_PDF_SELECT
    : WORKFLOW_HISTORY_FULL_SELECT;
  let { data, error } = await supabase
    .from("workflow_history")
    .select(historySelect)
    .eq("request_id", requestId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });

  let historyView = isPdf ? "pdf" : "full";
  if (error && isPdf) {
    console.warn(
      "[workflow-history GET history] pdf select failed, retrying full:",
      error.message,
    );
    const retry = await supabase
      .from("workflow_history")
      .select(WORKFLOW_HISTORY_FULL_SELECT)
      .eq("request_id", requestId)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: true });
    data = retry.data;
    error = retry.error;
    historyView = "full";
  }

  if (error) {
    console.error("[workflow-history GET history]", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }

  let assignmentSelect = isPdf
    ? WORKFLOW_ASSIGNMENTS_PDF_SELECT
    : WORKFLOW_ASSIGNMENTS_FULL_SELECT;
  let { data: assignments, error: assignmentError } = await supabase
    .from("workflow_assignments")
    .select(assignmentSelect)
    .eq("request_id", requestId)
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: true });

  if (assignmentError && isPdf) {
    console.warn(
      "[workflow-history GET assignments] pdf select failed, retrying full:",
      assignmentError.message,
    );
    const retry = await supabase
      .from("workflow_assignments")
      .select(WORKFLOW_ASSIGNMENTS_FULL_SELECT)
      .eq("request_id", requestId)
      .eq("tenant_id", tenantId)
      .order("updated_at", { ascending: true });
    assignments = retry.data;
    assignmentError = retry.error;
  }

  if (assignmentError) {
    console.error("[workflow-history GET assignments]", assignmentError.message);
    return res
      .status(500)
      .json({ success: false, message: assignmentError.message });
  }

  return res.json({
    success: true,
    history: data || [],
    assignments: assignments || [],
    view: historyView,
  });
}
