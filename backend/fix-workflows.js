const { supabase } = require("./services/supabaseClient");

const CHAIRMAN_ROLE = "Barangay Chairman";

function isChairmanStep(step) {
  const name = String(step?.name || "").toLowerCase();
  const status = String(step?.status || "").toLowerCase();
  const role = String(step?.officialRole || "").toLowerCase();
  return (
    status === "captain_approval" ||
    status.includes("chairman") ||
    status.includes("captain") ||
    name.includes("chairman") ||
    name.includes("captain") ||
    name.includes("punong") ||
    role.includes("chairman") ||
    role.includes("captain") ||
    role.includes("punong")
  );
}

function normalizeStep(step, certificateType) {
  if (!step || typeof step !== "object") return step;

  const name = String(step.name || "").toLowerCase();
  const status = String(step.status || "").toLowerCase();

  if (name.includes("secretary") || status.includes("secretary")) {
    if (!step.officialRole || step.officialRole === "None") {
      step.officialRole = "Brgy. Secretary";
    }
  }

  if (isChairmanStep(step)) {
    step.status = "captain_approval";
    if (!step.officialRole || step.officialRole === "None") {
      step.officialRole = CHAIRMAN_ROLE;
    } else if (
      /brgy\.\s*chairman|brgy\.\s*captain|barangay captain/i.test(
        step.officialRole,
      )
    ) {
      step.officialRole = CHAIRMAN_ROLE;
    }
  }

  return step;
}

async function fixWorkflows() {
  console.log("--- Normalizing workflow configurations (Barangay Chairman) ---");
  const { data: configs, error } = await supabase
    .from("workflow_configurations")
    .select("id, certificate_type, workflow_config");

  if (error) {
    console.error("Error fetching configs:", error);
    return;
  }

  for (const config of configs || []) {
    const wf = config.workflow_config;
    if (!wf?.steps?.length) continue;

    const before = JSON.stringify(wf.steps);
    wf.steps = wf.steps.map((step) =>
      normalizeStep({ ...step }, config.certificate_type),
    );
    const after = JSON.stringify(wf.steps);

    if (before === after) continue;

    const { error: updateError } = await supabase
      .from("workflow_configurations")
      .update({ workflow_config: wf, updated_at: new Date().toISOString() })
      .eq("id", config.id);

    if (updateError) {
      console.error(`Error updating ${config.certificate_type}:`, updateError);
    } else {
      console.log(`✅ Normalized ${config.certificate_type}`);
    }
  }
}

fixWorkflows();
