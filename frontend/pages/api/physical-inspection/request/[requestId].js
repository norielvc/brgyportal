import { authenticateToken } from "../../../../src/lib/api-auth";
import { supabase } from "../../../../lib/supabase";

const DEFAULT_AREAS = [
  "HEALTH AND SAFETY",
  "SANITATION",
  "HEALTH HAZARD",
  "BUILDING PERMIT",
  "FIRE EXIT / HAZARD",
  "ENVIRONMENT",
  "WASTE MANAGEMENT",
  "HAZARDOUS WASTE",
  "OTHERS",
  "COMPLAINTS, ETC.",
];

const DEFAULT_COMMITTEES = [
  "HEALTH",
  "ENVIRONMENT",
  "INFRASTRUCTURE",
  "PEACE & ORDER",
];

function emptyInspection() {
  const areas = {};
  const recommendations = {};
  DEFAULT_AREAS.forEach((area) => {
    areas[area] = { findings: "", date: "", remarks: "" };
  });
  DEFAULT_COMMITTEES.forEach((committee) => {
    recommendations[committee] = { name: "", date: "" };
  });
  return {
    areas,
    visitDateTime: "",
    ownerRepresentative: "",
    recommendations,
  };
}

function toDateTimeLocal(value) {
  if (!value) return "";
  const text = String(value);
  const match = text.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
  if (match) return match[1];
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 16);
}

function blankToNull(value) {
  const text = String(value || "").trim();
  return text || null;
}

export default async function handler(req, res) {
  const user = await authenticateToken(req, res);
  if (!user) return;

  const tenantId = user.tenant_id || req.headers["x-tenant-id"];
  if (!tenantId)
    return res
      .status(403)
      .json({ success: false, message: "Tenant context required" });

  const { requestId } = req.query;
  if (!requestId)
    return res
      .status(400)
      .json({ success: false, message: "Request ID is required" });

  try {
    if (req.method === "GET") {
      const { data: report, error: reportError } = await supabase
        .from("physical_inspection_reports")
        .select("*")
        .eq("request_id", requestId)
        .maybeSingle();

      if (reportError)
        return res
          .status(500)
          .json({ success: false, message: reportError.message });

      if (!report) return res.json({ success: true, data: null });

      const inspectionData = emptyInspection();
      inspectionData.visitDateTime = toDateTimeLocal(report.visit_datetime);
      inspectionData.ownerRepresentative = report.owner_representative || "";

      const { data: areaFindings, error: areaError } = await supabase
        .from("inspection_area_findings")
        .select("*")
        .eq("inspection_report_id", report.id);

      if (areaError)
        return res
          .status(500)
          .json({ success: false, message: areaError.message });

      (areaFindings || []).forEach((area) => {
        inspectionData.areas[area.area_name] = {
          findings: area.findings || "",
          date: area.inspection_date || "",
          remarks: area.remarks || "",
        };
      });

      const { data: committeeRecs, error: committeeError } = await supabase
        .from("committee_recommendations")
        .select("*")
        .eq("inspection_report_id", report.id);

      if (committeeError)
        return res
          .status(500)
          .json({ success: false, message: committeeError.message });

      (committeeRecs || []).forEach((committee) => {
        inspectionData.recommendations[committee.committee_name] = {
          name: committee.signatory_name || "",
          date: committee.recommendation_date || "",
        };
      });

      return res.json({ success: true, data: inspectionData, reportId: report.id });
    }

    if (req.method === "POST") {
      const inspectionData = req.body?.inspectionData;
      if (!inspectionData)
        return res
          .status(400)
          .json({ success: false, message: "Inspection data is required" });

      const userId = user._id || user.id;
      const { data: existingReport, error: checkError } = await supabase
        .from("physical_inspection_reports")
        .select("id")
        .eq("request_id", requestId)
        .maybeSingle();

      if (checkError)
        return res
          .status(500)
          .json({ success: false, message: checkError.message });

      let reportId = existingReport?.id;
      const visitDateTime = blankToNull(inspectionData.visitDateTime);

      if (reportId) {
        const { error: updateError } = await supabase
          .from("physical_inspection_reports")
          .update({
            visit_datetime: visitDateTime,
            owner_representative: inspectionData.ownerRepresentative || null,
            inspection_areas: inspectionData.areas || {},
            committee_recommendations: inspectionData.recommendations || {},
            updated_by: userId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", reportId);

        if (updateError)
          return res
            .status(500)
            .json({ success: false, message: updateError.message });
      } else {
        const { data: newReport, error: createError } = await supabase
          .from("physical_inspection_reports")
          .insert([
            {
              request_id: requestId,
              certificate_type: "business_permit",
              visit_datetime: visitDateTime,
              owner_representative: inspectionData.ownerRepresentative || null,
              inspection_areas: inspectionData.areas || {},
              committee_recommendations: inspectionData.recommendations || {},
              inspection_status: "draft",
              created_by: userId,
              updated_by: userId,
            },
          ])
          .select("id")
          .single();

        if (createError)
          return res
            .status(500)
            .json({ success: false, message: createError.message });
        reportId = newReport.id;
      }

      if (inspectionData.areas) {
        for (const [areaName, areaData] of Object.entries(inspectionData.areas)) {
          const { error: areaError } = await supabase
            .from("inspection_area_findings")
            .upsert(
              {
                inspection_report_id: reportId,
                area_name: areaName,
                findings: areaData.findings || "",
                inspection_date: blankToNull(areaData.date),
                remarks: areaData.remarks || "",
              },
              { onConflict: "inspection_report_id,area_name" },
            );

          if (areaError)
            return res
              .status(500)
              .json({ success: false, message: areaError.message });
        }
      }

      if (inspectionData.recommendations) {
        for (const [committeeName, committeeData] of Object.entries(
          inspectionData.recommendations,
        )) {
          const { error: committeeError } = await supabase
            .from("committee_recommendations")
            .upsert(
              {
                inspection_report_id: reportId,
                committee_name: committeeName,
                signatory_name: committeeData.name || "",
                recommendation_date: blankToNull(committeeData.date),
              },
              { onConflict: "inspection_report_id,committee_name" },
            );

          if (committeeError)
            return res
              .status(500)
              .json({ success: false, message: committeeError.message });
        }
      }

      return res.json({
        success: true,
        message: "Inspection report saved successfully",
        reportId,
      });
    }

    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  } catch (error) {
    console.error("Physical inspection API error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save inspection report",
    });
  }
}
