export const WORKFLOW_HISTORY_PDF_SELECT = `
  id,
  request_id,
  tenant_id,
  action,
  new_status,
  previous_status,
  signature_data,
  created_at,
  step_name,
  official_role,
  performed_by,
  comments,
  users:performed_by (
    first_name,
    middle_name,
    last_name,
    email,
    role,
    employee_code
  )
`;

export const WORKFLOW_ASSIGNMENTS_PDF_SELECT = `
  id,
  step_id,
  step_name,
  status,
  assigned_user_id,
  completed_at,
  updated_at,
  users:assigned_user_id (
    first_name,
    middle_name,
    last_name,
    role,
    employee_code
  )
`;

export const WORKFLOW_HISTORY_FULL_SELECT = `
  *,
  users:performed_by (
    first_name,
    middle_name,
    last_name,
    email,
    role,
    employee_code
  )
`;

import { supabase } from "../../lib/supabase";

/** Workflow history + assignments for certificate PDF preview (single round-trip). */
export async function fetchWorkflowHistoryPdfBundle(tenantId, requestId) {
  let { data: history, error: historyError } = await supabase
    .from("workflow_history")
    .select(WORKFLOW_HISTORY_PDF_SELECT)
    .eq("request_id", requestId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });

  if (historyError) {
    const retry = await supabase
      .from("workflow_history")
      .select(WORKFLOW_HISTORY_FULL_SELECT)
      .eq("request_id", requestId)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: true });
    history = retry.data;
    historyError = retry.error;
  }
  if (historyError) throw historyError;

  let { data: assignments, error: assignmentError } = await supabase
    .from("workflow_assignments")
    .select(WORKFLOW_ASSIGNMENTS_PDF_SELECT)
    .eq("request_id", requestId)
    .eq("tenant_id", tenantId)
    .order("updated_at", { ascending: true });

  if (assignmentError) {
    const retry = await supabase
      .from("workflow_assignments")
      .select(WORKFLOW_ASSIGNMENTS_FULL_SELECT)
      .eq("request_id", requestId)
      .eq("tenant_id", tenantId)
      .order("updated_at", { ascending: true });
    assignments = retry.data;
    assignmentError = retry.error;
  }
  if (assignmentError) throw assignmentError;

  return {
    history: history || [],
    assignments: assignments || [],
  };
}

export const WORKFLOW_ASSIGNMENTS_FULL_SELECT = `
  id,
  step_id,
  step_name,
  status,
  assigned_user_id,
  completed_at,
  updated_at,
  users:assigned_user_id (
    first_name,
    middle_name,
    last_name,
    role,
    employee_code
  )
`;
