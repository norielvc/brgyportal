/**
 * One-off / ops: realign a business permit by reference (e.g. stuck on Ready).
 *
 *   node scripts/realign-business-permit-ref.js BP-2026-35372 --confirm
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({
  path: path.join(__dirname, "..", "..", "frontend", ".env.local"),
});

const { createClient } = require("@supabase/supabase-js");

const REF = process.argv.find((a) => !a.startsWith("-") && a !== process.argv[0] && a !== process.argv[1]);
const DRY_RUN = !process.argv.includes("--confirm");

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

function normalizeKey(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function isPhysicalCaptainStepName(name) {
  const n = String(name || "").toLowerCase();
  return (
    (n.includes("captain") || n.includes("chairman")) &&
    n.includes("physical")
  );
}

function isFinalBpCaptainStepName(name) {
  const n = String(name || "").toLowerCase();
  return (
    n.includes("business permit") &&
    (n.includes("captain") || n.includes("chairman"))
  );
}

function historyHasPhysicalChairmanApprove(history) {
  return (history || []).some(
    (h) =>
      normalizeKey(h.action) === "approve" &&
      isPhysicalCaptainStepName(h.step_name),
  );
}

function historyHasFinalChairmanApprove(history) {
  return (history || []).some(
    (h) =>
      normalizeKey(h.action) === "approve" &&
      isFinalBpCaptainStepName(h.step_name),
  );
}

async function main() {
  if (!REF) {
    console.error("Usage: node realign-business-permit-ref.js <REFERENCE> --confirm");
    process.exit(1);
  }

  const { data: cert, error: certErr } = await supabase
    .from("certificate_requests")
    .select("id, tenant_id, reference_number, status, certificate_type")
    .eq("reference_number", REF)
    .maybeSingle();

  if (certErr || !cert) {
    console.error("Certificate not found:", certErr?.message || REF);
    process.exit(1);
  }

  if (cert.certificate_type !== "business_permit") {
    console.error("Not a business permit:", cert.certificate_type);
    process.exit(1);
  }

  const { data: wfRow } = await supabase
    .from("workflow_configurations")
    .select("workflow_config")
    .eq("certificate_type", "business_permit")
    .eq("tenant_id", cert.tenant_id)
    .maybeSingle();

  const steps = wfRow?.workflow_config?.steps || [];
  const financeStep =
    steps.find((s) => normalizeKey(s.status) === "verifying") ||
    steps.find((s) => String(s.name || "").toLowerCase().includes("finance"));

  const physicalCaptainStep = steps.find((s) =>
    isPhysicalCaptainStepName(s.name),
  );

  const { data: history } = await supabase
    .from("workflow_history")
    .select("action, step_name, previous_status, new_status, created_at")
    .eq("request_id", cert.id)
    .eq("tenant_id", cert.tenant_id)
    .order("created_at", { ascending: false })
    .limit(40);

  const physicalDone = historyHasPhysicalChairmanApprove(history);
  const finalDone = historyHasFinalChairmanApprove(history);

  let targetStatus = cert.status;
  let targetStep = null;

  if (["ready", "ready_for_pickup"].includes(normalizeKey(cert.status))) {
    if (physicalDone && !finalDone && financeStep) {
      targetStatus = "verifying";
      targetStep = financeStep;
    } else if (!physicalDone && physicalCaptainStep) {
      targetStatus = "captain_approval";
      targetStep = physicalCaptainStep;
    }
  }

  console.log("Reference:", cert.reference_number);
  console.log("Current status:", cert.status);
  console.log("Physical chairman approved:", physicalDone);
  console.log("Final BP chairman approved:", finalDone);
  console.log("Target status:", targetStatus);
  console.log("Target step:", targetStep?.name || "(none)");
  console.log("Mode:", DRY_RUN ? "DRY RUN" : "CONFIRM");

  if (DRY_RUN) {
    console.log("\nAdd --confirm to apply.");
    return;
  }

  if (targetStatus === cert.status && !targetStep) {
    console.log("No change needed.");
    return;
  }

  const { error: upErr } = await supabase
    .from("certificate_requests")
    .update({
      status: targetStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cert.id)
    .eq("tenant_id", cert.tenant_id);

  if (upErr) {
    console.error("Status update failed:", upErr.message);
    process.exit(1);
  }

  await supabase
    .from("workflow_assignments")
    .delete()
    .eq("request_id", cert.id)
    .eq("tenant_id", cert.tenant_id)
    .eq("status", "pending");

  if (targetStep?.assignedUsers?.length) {
    for (const userId of targetStep.assignedUsers) {
      await supabase.from("workflow_assignments").insert([
        {
          request_id: cert.id,
          tenant_id: cert.tenant_id,
          request_type: "business_permit",
          step_id: String(targetStep.id),
          step_name: targetStep.name,
          assigned_user_id: userId,
          status: "pending",
        },
      ]);
    }
  }

  await supabase.from("workflow_history").insert([
    {
      tenant_id: cert.tenant_id,
      request_id: cert.id,
      request_type: "business_permit",
      step_name: "Workflow realign",
      action: "return",
      comments: `Sent back from ${cert.status} to ${targetStatus} (${targetStep?.name || "workflow"}) — corrected routing.`,
      previous_status: cert.status,
      new_status: targetStatus,
    },
  ]);

  console.log("\nDone. Request removed from Pickup queue; assigned to:", targetStep?.name);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
