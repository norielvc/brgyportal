import fs from "fs";
import path from "path";

/**
 * POST /api/portal/sync-buffered
 * Reads offline-buffered requests from pending_requests.json and inserts them into Supabase.
 * Call this AFTER running the ADD_PICKUP_AND_MEDICO_LEGAL_COLUMNS.sql migration.
 */
export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ success: false, message: "Method not allowed" });

  const tenantId = (req.headers["x-tenant-id"] || "").toLowerCase();
  if (!tenantId)
    return res.status(400).json({ success: false, message: "Missing x-tenant-id header" });

  try {
    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    const dataPath = path.join(process.cwd(), "src/data/mock/pending_requests.json");
    if (!fs.existsSync(dataPath)) {
      return res.json({ success: true, message: "No buffered requests file found", synced: 0 });
    }

    const jsonData = await fs.promises.readFile(dataPath, "utf8");
    const buffered = JSON.parse(jsonData);

    if (!buffered || buffered.length === 0) {
      return res.json({ success: true, message: "No buffered requests to sync", synced: 0 });
    }

    const results = { synced: 0, failed: 0, errors: [] };

    for (const item of buffered) {
      if (item.tenant_id !== tenantId) continue;

      const canonicalType = item.certificate_type;
      const insertData = {
        tenant_id: item.tenant_id,
        reference_number: item.referenceNumber,
        certificate_type: canonicalType,
        full_name: (item.fullName || "").toUpperCase(),
        age: parseInt(item.age) || 0,
        sex: (item.sex || "").toUpperCase(),
        civil_status: (item.civilStatus || "").toUpperCase(),
        address: (item.address || "").toUpperCase(),
        contact_number: item.contactNumber || "",
        email: item.email || "",
        purpose: (item.purpose || "").toUpperCase(),
        date_of_birth: item.dateOfBirth || null,
        place_of_birth: (item.placeOfBirth || "").toUpperCase(),
        resident_id: item.residentId || null,
        pickup_method: item.pickupMethod || "pickup",
        status: "staff_review",
        date_issued: item.submitted_at || new Date().toISOString(),
        created_at: item.submitted_at || new Date().toISOString(),
        details: {
          date_of_death: item.dateOfDeath,
          cause_of_death: (item.causeOfDeath || "").toUpperCase(),
          covid_related: item.covidRelated || false,
          alias_name: (item.aliasName || "").toUpperCase(),
          guardian_name: (item.guardianName || "").toUpperCase(),
          guardian_relationship: (item.guardianRelationship || "").toUpperCase(),
        },
      };

      if (canonicalType === "medico_legal") {
        insertData.date_of_examination = item.dateOfExamination || null;
        insertData.usaping_barangay = item.usapingBarangay || "";
        insertData.date_of_hearing = item.dateOfHearing || null;
      }

      const { data, error } = await supabase
        .from("certificate_requests")
        .insert([insertData])
        .select("id")
        .single();

      if (error) {
        // Skip duplicate reference numbers
        if (error.code === "23505") {
          results.synced++;
          continue;
        }
        results.failed++;
        results.errors.push({
          ref: item.referenceNumber,
          error: error.message,
          code: error.code,
        });
        continue;
      }

      // Create workflow assignment for the synced request
      try {
        const { data: workflowConfig } = await supabase
          .from("workflow_configurations")
          .select("workflow_config")
          .eq("certificate_type", canonicalType)
          .eq("tenant_id", tenantId)
          .single();

        let staffUserIds = [];
        let initialStepId = 1;
        let initialStepName = "Review Request";

        if (workflowConfig?.workflow_config?.steps) {
          const firstStep = workflowConfig.workflow_config.steps.find(
            (s) => s.requiresApproval === true
          );
          if (firstStep) {
            staffUserIds = firstStep.assignedUsers || [];
            initialStepId = firstStep.id;
            initialStepName = firstStep.name;
          }
        }

        if (staffUserIds.length === 0) {
          const { data: staffUsers } = await supabase
            .from("users")
            .select("id")
            .eq("tenant_id", tenantId)
            .in("role", ["admin", "staff", "secretary", "captain"]);
          staffUserIds = (staffUsers || []).map((u) => u.id);
        }

        for (const userId of staffUserIds) {
          await supabase.from("workflow_assignments").insert([
            {
              request_id: data.id,
              tenant_id: tenantId,
              request_type: canonicalType,
              step_id: initialStepId.toString(),
              step_name: initialStepName,
              assigned_user_id: userId,
              status: "pending",
            },
          ]);
        }
      } catch (wfErr) {
        console.error("Workflow assignment error for synced request:", wfErr.message);
      }

      results.synced++;
    }

    // Clear the buffer file if all succeeded
    if (results.failed === 0) {
      await fs.promises.writeFile(dataPath, "[]", "utf8");
    }

    return res.json({
      success: true,
      message: `Synced ${results.synced} request(s), ${results.failed} failed`,
      ...results,
    });
  } catch (err) {
    console.error("Sync buffered error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
