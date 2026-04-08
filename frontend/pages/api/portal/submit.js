import path from "path";
import fs from "fs/promises";

// Protection config — reads from Supabase system_settings, falls back to defaults
const getProtectionConfig = async (supabase) => {
  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "protection_config")
      .single();
    if (!error && data?.value) return data.value;
  } catch {}
  // Default: all disabled (safe fallback if table doesn't exist)
  return {
    rateLimitEnabled: false,
    rateLimitMax: 5,
    rateLimitWindowHours: 1,
    duplicateCheckEnabled: false,
    cooldownEnabled: false,
    cooldownDays: 30,
  };
};

// In-memory rate limiter (resets on server restart)
const ipSubmissions = new Map();

function checkRateLimit(ip, config) {
  if (!config.rateLimitEnabled) return { blocked: false };

  const now = Date.now();
  const windowMs = config.rateLimitWindowHours * 60 * 60 * 1000;
  const maxPerWindow = config.rateLimitMax;

  const record = ipSubmissions.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + windowMs;
  } else {
    record.count += 1;
  }
  ipSubmissions.set(ip, record);

  if (record.count > maxPerWindow) {
    const minutesLeft = Math.ceil((record.resetAt - now) / 60000);
    return { blocked: true, minutesLeft };
  }
  return { blocked: false };
}

/**
 * UNIFIED CERTIFICATE SUBMISSION API (Next.js)
 * ------------------------------------------
 * Handles POST /api/portal/submit
 * Implements "Resilience Buffer" - if Supabase is offline, saves locally.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  // 1. Rate limit by IP — create supabase client early for config fetch
  const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
  const supabaseForConfig = createSupabaseClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  );
  const config = await getProtectionConfig(supabaseForConfig);
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const rateCheck = checkRateLimit(ip, config);
  if (rateCheck.blocked) {
    return res.status(429).json({
      success: false,
      message: `Too many requests. Please wait ${rateCheck.minutesLeft} minute(s) before submitting again.`,
      code: 'RATE_LIMITED'
    });
  }

  const { type, formData } = req.body;
  const tenantId = req.headers["x-tenant-id"] || formData?.tenantId;

  if (!type || !formData) {
    return res.status(400).json({ success: false, message: "Missing type or formData" });
  }
  if (!tenantId) {
    return res.status(400).json({ success: false, message: "Missing tenant context (x-tenant-id header)" });
  }

  /**
   * STAGE 1: Normalize type aliases to canonical workflow config keys
   */
  const typeAliases = {
    same_person: "certification_same_person",
    cohabitation: "barangay_cohabitation",
  };
  const canonicalType = typeAliases[type] || type;

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
    certification_same_person: "SP",
    barangay_cohabitation: "CH",
    same_person: "SP",
    cohabitation: "CH",
  };
  const prefix = prefixMap[canonicalType] || "REF";
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

    console.log(`📡 Cloud Submit [${canonicalType}] for tenant: ${tenantId}`);

    // 2. Duplicate check — block if same resident has a pending request of same type
    if (formData.residentId) {
      if (config.duplicateCheckEnabled) {
        const { data: existing } = await supabase
          .from("certificate_requests")
          .select("id, reference_number, status, created_at")
          .eq("tenant_id", tenantId)
          .eq("certificate_type", canonicalType)
          .eq("resident_id", formData.residentId)
          .not("status", "in", '("released","rejected","cancelled")')
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (existing) {
          return res.status(409).json({
            success: false,
            message: `You already have a pending ${canonicalType.replace(/_/g, ' ')} request (Ref: ${existing.reference_number}). Please wait for it to be processed before submitting a new one.`,
            code: 'DUPLICATE_REQUEST',
            existingRef: existing.reference_number,
            existingStatus: existing.status,
          });
        }
      }

      // 3. Cooldown check
      if (config.cooldownEnabled && config.cooldownDays > 0) {
        const cutoff = new Date(Date.now() - config.cooldownDays * 24 * 60 * 60 * 1000).toISOString();
        const { data: recent } = await supabase
          .from("certificate_requests")
          .select("id, reference_number, created_at")
          .eq("tenant_id", tenantId)
          .eq("certificate_type", canonicalType)
          .eq("resident_id", formData.residentId)
          .eq("status", "released")
          .gte("created_at", cutoff)
          .limit(1)
          .single();

        if (recent) {
          const daysAgo = Math.floor((Date.now() - new Date(recent.created_at).getTime()) / 86400000);
          const daysLeft = config.cooldownDays - daysAgo;
          return res.status(429).json({
            success: false,
            message: `You recently received this certificate (${daysAgo} days ago). You can reapply in ${daysLeft} day(s).`,
            code: 'COOLDOWN_ACTIVE',
          });
        }
      }
    }

    const insertData = {
      tenant_id: tenantId,
      reference_number: refNumber,
      certificate_type: canonicalType,
      full_name:
        (formData.fullName || formData.ownerFullName || formData.deceasedFullName)?.toUpperCase() || "",
      age: parseInt(formData.age) || 0,
      sex: (formData.sex || formData.gender)?.toUpperCase() || "",
      civil_status: formData.civilStatus?.toUpperCase() || "",
      address: (formData.address || formData.currentAddress || formData.ownerAddress || formData.deceasedAddress)?.toUpperCase() || "",
      contact_number: formData.contactNumber || "",
      email: formData.email || "",
      purpose:
        formData.purpose?.toUpperCase() ||
        (canonicalType === "business_permit" ? "BUSINESS PERMIT / CLEARANCE" : ""),
      date_of_birth: formData.dateOfBirth || null,
      place_of_birth: formData.placeOfBirth?.toUpperCase() || "",
      resident_id: formData.residentId || null,
      status: "staff_review",
      date_issued: new Date().toISOString(),
      created_at: new Date().toISOString(),
      // Top-level cohabitation columns (read by certificate preview)
      ...(canonicalType === "barangay_cohabitation" ? {
        partner_full_name: formData.partnerFullName?.toUpperCase() || "",
        no_of_children: formData.numberOfChildren || "0",
        living_together_years: formData.yearsLiving || "0",
        living_together_months: "0",
      } : {}),
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
        // Cohabitation — store with all key variants for compatibility
        partner_name: formData.partnerFullName?.toUpperCase(),
        partnerFullName: formData.partnerFullName?.toUpperCase(),
        noOfChildren: formData.numberOfChildren || "0",
        livingTogetherYears: formData.yearsLiving || "0",
        livingTogetherMonths: "0",
        purok: formData.purok?.toUpperCase(),
        currentAddress: formData.currentAddress?.toUpperCase(),
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
          .eq("certificate_type", canonicalType)
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
              request_type: canonicalType,
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
            request_type: canonicalType,
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
