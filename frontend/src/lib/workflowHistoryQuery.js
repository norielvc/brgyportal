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
