import path from "path";
import fs from "fs/promises";

/**
 * UNIFIED CERTIFICATE SUBMISSION API (Next.js)
 * ------------------------------------------
 * Handles POST /api/portal/submit
 * Implements "Resilience Buffer" - if Supabase is offline, saves locally.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method Not Allowed" });
  }

  const { type, formData } = req.body;
  const tenantId = req.headers["x-tenant-id"] || formData?.tenantId;

  if (!type || !formData) {
    return res
      .status(400)
      .json({ success: false, message: "Missing type or formData" });
  }
  if (!tenantId) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Missing tenant context (x-tenant-id header)",
      });
  }

  /**
   * STAGE 1: Generate Reference Number
   */
  const year = new Date().getFullYear();
  const prefixMap = {
    barangay_clearance: "BC",
    certificate_of_indigency: "CI",
    barangay_residency: "BR",
    natural_death: "ND",
    barangay_guardianship: "GD",
    medico_legal: "ML",
    business_permit: "BP",
    educational_assistance: "EA",
    same_person: "SP",
    cohabitation: "CH",
  };
  const prefix = prefixMap[type] || "REF";
  const timestamp = Date.now().toString().slice(-5);
  const refNumber =
    formData.referenceNumber || `${prefix}-${year}-${timestamp}`;

  /**
   * STAGE 2: Attempt Live Supabase Insert
   */
  try {
    const { createClient } = require("@supabase/supabase-js");
    // Use service role key to bypass RLS for portal submissions
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
    );

    console.log(`📡 Cloud Submit [${type}] for tenant: ${tenantId}`);

    const insertData = {
      tenant_id: tenantId,
      reference_number: refNumber,
      certificate_type: type,
      full_name:
        (formData.fullName || formData.ownerFullName)?.toUpperCase() || "",
      age: parseInt(formData.age) || 0,
      sex: (formData.sex || formData.gender)?.toUpperCase() || "",
      civil_status: formData.civilStatus?.toUpperCase() || "",
      address: (formData.address || formData.ownerAddress)?.toUpperCase() || "",
      contact_number: formData.contactNumber || "",
      email: formData.email || "",
      purpose:
        formData.purpose?.toUpperCase() ||
        (type === "business_permit" ? "BUSINESS PERMIT / CLEARANCE" : ""),
      date_of_birth: formData.dateOfBirth || null,
      place_of_birth: formData.placeOfBirth?.toUpperCase() || "",
      resident_id: formData.residentId || null,
      status: "staff_review",
      date_issued: new Date().toISOString(),
      created_at: new Date().toISOString(),
      // JSON storage for certificate-specific fields
      details: {
        // Business Fields
        businessName: formData.businessName?.toUpperCase(),
        natureOfBusiness: formData.natureOfBusiness?.toUpperCase(),
        businessAddress: formData.businessAddress?.toUpperCase(),
        contactPerson: formData.contactPerson?.toUpperCase(),
        applicationDate: formData.applicationDate,
        clearanceType: formData.clearanceType,
        // Natural Death Fields
        date_of_death: formData.dateOfDeath,
        cause_of_death: formData.causeOfDeath?.toUpperCase(),
        covid_related: formData.covidRelated,
        // Same Person / Alias
        alias_name: formData.aliasName?.toUpperCase(),
        // Guardianship
        guardian_name: formData.guardianName?.toUpperCase(),
        guardian_relationship: formData.guardianRelationship?.toUpperCase(),
        // Cohabitation
        partner_name: formData.partnerFullName?.toUpperCase(),
        // Others
        ...formData.details,
      },
    };

    const { data, error } = await supabase
      .from("certificate_requests")
      .insert([insertData])
      .select()
      .single();

    if (!error) {
      console.log(`✅ LIVE Request stored: ${refNumber}`);

      // Create initial workflow assignment so staff can see it in their queue
      try {
        const { data: workflowConfig } = await supabase
          .from("workflow_configurations")
          .select("workflow_config")
          .eq("certificate_type", type)
          .eq("tenant_id", tenantId)
          .single();

        let staffUserIds = [];
        let initialStepId = 1;
        let initialStepName = "Review Request";

        if (workflowConfig?.workflow_config?.steps) {
          const firstStep = workflowConfig.workflow_config.steps.find(
            (s) => s.requiresApproval === true,
          );
          if (firstStep) {
            staffUserIds = firstStep.assignedUsers || [];
            initialStepId = firstStep.id;
            initialStepName = firstStep.name;
          }
        }

        // Fallback: assign to all admin/staff users of this tenant
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
              request_type: type,
              step_id: initialStepId.toString(),
              step_name: initialStepName,
              assigned_user_id: userId,
              status: "pending",
            },
          ]);
        }

        // Log initial history entry
        await supabase.from("workflow_history").insert([
          {
            tenant_id: tenantId,
            request_id: data.id,
            request_type: type,
            step_id: 0,
            step_name: "Request Submission",
            action: "submitted",
            comments: "Request submitted via portal.",
            new_status: "staff_review",
          },
        ]);

        console.log(
          `✅ Workflow assignments created for ${refNumber} (${staffUserIds.length} staff)`,
        );
      } catch (wfError) {
        console.warn(
          "⚠️ Workflow assignment creation failed (non-critical):",
          wfError.message,
        );
      }

      return res.status(200).json({
        success: true,
        referenceNumber: refNumber,
        source: "cloud_supabase",
        data,
      });
    } else {
      console.error("Supabase insert error:", error.message);
      throw new Error(error.message);
    }
  } catch (cloudError) {
    console.error(
      "⚠️ Submission cloud error:",
      cloudError.message || cloudError,
    );
  }

  /**
   * STAGE 3: Local Resilience Fallback (Buffered)
   */
  try {
    const dataPath = path.join(
      process.cwd(),
      "src/data/mock/pending_requests.json",
    );
    const jsonData = await fs.readFile(dataPath, "utf8");
    const pending = JSON.parse(jsonData);

    const offlineRequest = {
      ...formData,
      id: `TEMP-${refNumber}`,
      referenceNumber: refNumber,
      certificate_type: type,
      tenant_id: tenantId,
      submitted_at: new Date().toISOString(),
      status: "OFFLINE_PENDING",
    };

    pending.push(offlineRequest);
    await fs.writeFile(dataPath, JSON.stringify(pending, null, 2));

    return res.status(200).json({
      success: true,
      referenceNumber: refNumber,
      source: "local_resilience_buffer",
      message: "Saved to local buffer. System will sync once online.",
    });
  } catch (fsError) {
    return res
      .status(500)
      .json({ success: false, message: "Submission system offline." });
  }
}
