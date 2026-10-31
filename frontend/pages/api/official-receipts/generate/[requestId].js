import { authenticateToken } from "../../../../src/lib/api-auth";
import { supabase } from "../../../../lib/supabase";
import {
  buildOfficialReceiptHtml,
  businessPermitAllowsOrAssignment,
  normalizeOrNumberInput,
  parseBusinessDetails,
  writeOfficialReceiptFile,
} from "../../../../src/lib/officialReceiptUtils";

async function persistOrAssignment({
  request,
  requestId,
  tenantId,
  user,
  manualOrNumber,
  amount,
  controlNumber,
  existingOR,
}) {
  const businessDetails = parseBusinessDetails(request);
  const orNumber = manualOrNumber;
  const bcControlStored =
    controlNumber || request.reference_number || orNumber || "";

  const html = buildOfficialReceiptHtml(request, {
    orNumber,
    amount,
    controlNumber: bcControlStored,
  });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `OR_${orNumber}_${timestamp}.html`;
  try {
    writeOfficialReceiptFile(filename, html);
  } catch (err) {
    console.warn("[OR] Disk write skipped:", err?.message || err);
  }

  const payorLabel = request.full_name || request.applicant_name || "—";
  const payorAddr = request.address || "";

  const row = {
    or_number: orNumber,
    request_id: requestId,
    amount,
    payment_method: "CASH",
    payment_for: "BUSINESS PERMIT PROCESSING FEE",
    payer_name: payorLabel,
    payer_address: payorAddr,
    business_name:
      businessDetails.businessName || businessDetails.business_name || "",
    nature_of_business:
      businessDetails.natureOfBusiness ||
      businessDetails.nature_of_business ||
      "",
    reference_number: request.reference_number,
    issued_by: user._id || user.id,
    file_path: filename,
    html_content: html,
    updated_at: new Date().toISOString(),
  };
  if (bcControlStored) row.control_number = bcControlStored;
  if (tenantId) row.tenant_id = tenantId;

  const persistOrRow = async (payload) => {
    if (existingOR) {
      return supabase
        .from("official_receipts")
        .update(payload)
        .eq("id", existingOR.id)
        .select()
        .single();
    }
    return supabase
      .from("official_receipts")
      .insert([{ ...payload, created_at: new Date().toISOString() }])
      .select()
      .single();
  };

  let payload = { ...row };
  let orRecord = null;
  let saveError = null;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    ({ data: orRecord, error: saveError } = await persistOrRow(payload));
    if (!saveError) break;
    const msg = saveError.message || "";
    const missingCol = msg.match(/Could not find the '([^']+)' column/i);
    if (missingCol?.[1] && missingCol[1] in payload) {
      const { [missingCol[1]]: _drop, ...next } = payload;
      payload = next;
      continue;
    }
    if (/tenant_id/i.test(msg) && "tenant_id" in payload) {
      const { tenant_id: _t, ...next } = payload;
      payload = next;
      continue;
    }
    if (/control_number/i.test(msg) && "control_number" in payload) {
      const { control_number: _c, ...next } = payload;
      payload = next;
      continue;
    }
    if (/file_path/i.test(msg) && "file_path" in payload) {
      const { file_path: _f, ...next } = payload;
      payload = next;
      continue;
    }
    if (/html_content/i.test(msg) && "html_content" in payload) {
      const { html_content: _h, ...next } = payload;
      payload = next;
      continue;
    }
    if (/payer_name/i.test(msg) && "payer_name" in payload) {
      const {
        payer_name,
        payer_address,
        payor_name: _pn,
        payor_address: _pa,
        ...next
      } = payload;
      payload = {
        ...next,
        payor_name: payer_name,
        payor_address: payer_address,
      };
      continue;
    }
    if (/payor_name/i.test(msg) && "payor_name" in payload) {
      const {
        payor_name,
        payor_address,
        payer_name: _pn2,
        payer_address: _pa2,
        ...next
      } = payload;
      payload = {
        ...next,
        payer_name: payor_name,
        payer_address: payor_address,
      };
      continue;
    }
    break;
  }
  if (saveError) {
    return { ok: false, message: saveError.message };
  }

  const details = parseBusinessDetails(request);
  const { error: detailsError } = await supabase
    .from("certificate_requests")
    .update({
      details: {
        ...details,
        or_number: orNumber,
        or_amount: amount,
        bc_control_number: bcControlStored,
        or_html: html,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("tenant_id", tenantId);

  if (detailsError) {
    return { ok: false, message: detailsError.message };
  }

  return {
    ok: true,
    orNumber,
    filePath: filename,
    orRecord: {
      ...orRecord,
      control_number: orRecord?.control_number || bcControlStored,
    },
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const user = await authenticateToken(req, res);
    if (!user) return;

    const tenantId = user.tenant_id || req.headers["x-tenant-id"];
    if (!tenantId) {
      return res
        .status(403)
        .json({ success: false, message: "Tenant context required" });
    }

    const { requestId } = req.query;
    const manualOrNumber = normalizeOrNumberInput(req.body?.or_number);
    const amountRaw = req.body?.amount;
    const parsedAmount =
      amountRaw !== undefined &&
      amountRaw !== null &&
      String(amountRaw).trim() !== ""
        ? Number(amountRaw)
        : NaN;
    const amount =
      Number.isFinite(parsedAmount) && parsedAmount >= 0 ? parsedAmount : 100;
    const controlNumber = String(
      req.body?.control_number ?? req.body?.bc_control_number ?? "",
    ).trim();

    const { data: request, error: requestError } = await supabase
      .from("certificate_requests")
      .select("*")
      .eq("id", requestId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (requestError) {
      return res
        .status(500)
        .json({ success: false, message: requestError.message });
    }
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    if (!businessPermitAllowsOrAssignment(request)) {
      return res.status(400).json({
        success: false,
        message:
          "Official Receipt can be assigned during Business Permit Preparation (or legacy Treasury step).",
      });
    }

    const requestStatus = String(request.status || "").toLowerCase();
    if (requestStatus === "oic_review" && !manualOrNumber) {
      return res.status(400).json({
        success: false,
        message:
          "OR number is required. Enter the number from the treasurer's receipt book.",
      });
    }

    let existingQuery = supabase
      .from("official_receipts")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: false })
      .limit(1);
    if (tenantId) existingQuery = existingQuery.eq("tenant_id", tenantId);
    let { data: existingRows, error: existingErr } = await existingQuery;
    if (existingErr && tenantId && /tenant_id/i.test(existingErr.message || "")) {
      ({ data: existingRows } = await supabase
        .from("official_receipts")
        .select("*")
        .eq("request_id", requestId)
        .order("created_at", { ascending: false })
        .limit(1));
    }
    const existingOR = Array.isArray(existingRows) ? existingRows[0] : existingRows;

    if (!manualOrNumber) {
      return res.status(400).json({
        success: false,
        message: "OR number is required for business permit preparation.",
      });
    }

    const { data: clash } = await supabase
      .from("official_receipts")
      .select("id, request_id")
      .eq("or_number", manualOrNumber)
      .maybeSingle();
    if (clash && String(clash.request_id) !== String(requestId)) {
      return res.status(400).json({
        success: false,
        message: "This OR number is already used on another request.",
      });
    }

    const result = await persistOrAssignment({
      request,
      requestId,
      tenantId,
      user,
      manualOrNumber,
      amount,
      controlNumber,
      existingOR,
    });

    if (!result.ok) {
      return res.status(500).json({ success: false, message: result.message });
    }

    return res.json({
      success: true,
      message: "Official Receipt number assigned successfully",
      orNumber: result.orNumber,
      filePath: result.filePath,
      orRecord: result.orRecord,
    });
  } catch (error) {
    console.error("[OR-GENERATE]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to assign Official Receipt",
    });
  }
}
