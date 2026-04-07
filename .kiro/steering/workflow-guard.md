---
inclusion: always
---

# WORKFLOW ENGINE — PROTECTED STRUCTURE

## ⚠️ DO NOT MODIFY ANY OF THE FOLLOWING WITHOUT EXPLICIT USER APPROVAL

The certificate request workflow has been carefully designed, tested, and verified in production. Every part of this document reflects the current working state.

---

## Canonical Status Flow

```
staff_review → processing → secretary_approval → captain_approval → oic_review → ready → released
```

Special paths:
- `returned` → reassigns to Step 1 (staff_review)
- `send_back_to_start` → hard reset to staff_review
- `rejected` → terminal, no further assignments
- `cancelled` → terminal, no further assignments

### statusFlow Map (LOCKED — all three files must stay in sync)

```js
staff_review:       "processing"
pending:            "processing"
submitted:          "processing"
returned:           "processing"
processing:         "secretary_approval"   // ← CRITICAL: NOT oic_review
secretary_approval: "captain_approval"
captain_approval:   "oic_review"
Treasury:           "oic_review"
oic_review:         "ready"
ready:              "released"
ready_for_pickup:   "released"
```

Files that must stay in sync:
1. `frontend/pages/requests.js` → `getNextStatus()`
2. `frontend/pages/api/workflow-assignments/[id]/status.js` → `statusFlow`
3. `frontend/pages/api/certificates/[id]/status.js` → `statusFlow`

---

## Action Buttons Per Step (LOCKED)

### Step 1 — staff_review (Review Request Team)
- **Mark as Ineligible** → `reject` action → status: `rejected`
- **Verify & Forward** → `approve` action → status: `processing`
- *(Business Permit only)* **Proceed to Physical Inspection** → `physical_inspection` action

### Step 1 — physical_inspection (Business Permit only)
- **Save Draft** → saves inspection data, no status change
- **Reject Application** → `reject` action
- **Send Back** → `return` action → status: `returned`
- **Submit & Forward to Captain** → saves inspection + `approve` action

### Step 2 — secretary_approval (Barangay Secretary)
- **Send Back** → `return` action → status: `returned`, Step 1 reassigned
- **Reject** → `reject` action → status: `rejected`
- **Forward to Next** → `approve` action → status: `captain_approval`

### Step 3 — captain_approval (Barangay Captain)
- **Send Back** → `return` action → status: `returned`, Step 1 reassigned
- **Reject** → `reject` action → status: `rejected`
- **Official Approval** → `approve` action → status: `oic_review`

### Step 4 — oic_review (Releasing Team)
- **Send Back** → `send_back_to_start` action → status: `staff_review`, Step 1 reassigned
- **Reject** → `reject` action
- **Set as Ready** → `approve` action → status: `ready`

### Step 5 — ready / ready_for_pickup
- **Confirm Pickup** → opens ConfirmPickupModal → `approve` action → status: `released`

### Treasury (Business Permit only)
- **Send Back** → `return` action
- **Mark as Paid & Generate OR** → opens OR modal → `approve` action

---

## Assignment Lifecycle (LOCKED)

**On approve:**
1. ALL pending assignments for the request → marked `approved`
2. New `pending` assignment created for next step's `assignedUsers`
3. Next step found via `steps.find(s => s.status === newCertStatus)`

**On return / send_back_to_start:**
1. ALL pending assignments → marked `returned`
2. New `pending` assignment created for Step 1 (`steps.find(s => s.requiresApproval)`)

**On reject:**
1. ALL pending assignments → marked `rejected`
2. No new assignments created

**On portal submission:**
- `portal/submit.js` creates initial Step 1 assignment using tenant's workflow config
- Falls back to all admin/staff/secretary/captain users if no config found

---

## Stale Assignment Filter (LOCKED — my-assignments.js)

Filters by `step_name` (string) vs `cert.status`:
- Contains "review request" or "staff" → valid for: `staff_review, pending, submitted, returned`
- Contains "secretary" → valid for: `processing, secretary_approval`
- Contains "captain" → valid for: `captain_approval`
- Contains "releasing" or "oic" → valid for: `oic_review, ready, ready_for_pickup`

Stale assignments are auto-marked `approved` in background on every fetch.

---

## Role-Based Access (LOCKED)

| Role | Sees Requests | Can Act |
|------|--------------|---------|
| superadmin / admin | ALL in tenant | ALL |
| captain | Only assigned step | Only assigned step |
| secretary | Only assigned step | Only assigned step |
| staff | Only assigned step | Only assigned step |

Bypass list in `isUserAssignedToRequest()`: ONLY `['superadmin', 'super_admin', 'admin']`

"Certificate Request History" tab: admin sees all, non-admin sees only their assigned history.

---

## Tenant Isolation (NEVER REMOVE)

Every Supabase query on these tables MUST include `.eq('tenant_id', tenantId)`:
- `certificate_requests`
- `workflow_assignments`
- `workflow_history`
- `workflow_configurations`
- `users`
- `residents`
- `barangay_officials`
- `facilities`
- `events`
- `programs`
- `achievements`

`tenantId` always comes from `user.tenant_id` (JWT-verified) or `req.headers['x-tenant-id']` for public portal routes. Never trust user-supplied tenant values without verification.

---

## Business Permit Isolation (LOCKED)

Physical inspection UI, OR generation, and Treasury step are ONLY for `certificate_type === 'business_permit'`.

```js
const isBusinessPermit = request.certificate_type === "business_permit";
const isClearanceWithInspection = false; // ALWAYS false — physical inspection is BP only
const requiresPhysicalInspection = isBusinessPermit;
```

Do NOT add other certificate types to `isClearanceWithInspection`.

---

## History & Comments (LOCKED)

- Comments entered in the **ActionModal** textarea are passed as the 4th argument to `submitAction(signature, null, null, comment)`
- History is stored in `workflow_history` table with fields: `tenant_id, request_id, request_type, step_name, action, performed_by, comments, new_status`
- History is fetched from `/api/workflow-assignments/history/[requestId]` which returns `data.data` (not `data.history`)
- The history tab in RequestDetailsModal does NOT have a comment input box — comments are only added via the ActionModal

---

## Key Files (DO NOT RESTRUCTURE)

| File | Purpose |
|------|---------|
| `frontend/pages/requests.js` | Main requests page, all modal components, `getNextStatus()`, `submitAction()`, `isUserAssignedToRequest()` |
| `frontend/pages/api/workflow-assignments/[id]/status.js` | Primary approval handler — marks assignments, updates cert, creates next assignments |
| `frontend/pages/api/certificates/[id]/status.js` | Fallback approval handler — same logic as above |
| `frontend/pages/api/workflow-assignments/my-assignments.js` | Returns pending assignments with stale filter |
| `frontend/pages/api/portal/submit.js` | Portal submission — creates cert + Step 1 assignment |
| `frontend/pages/api/portal/track.js` | Public status tracker — tenant-scoped, privacy-safe |
