import fs from "fs";
import path from "path";

export function businessPermitAllowsOrAssignment(request) {
  if (!request || request.certificate_type !== "business_permit") return false;
  const status = String(request.status || "").toLowerCase();
  return status === "oic_review" || status === "treasury";
}

export function parseBusinessDetails(request) {
  if (!request?.details) return {};
  try {
    if (typeof request.details === "string") {
      return JSON.parse(request.details);
    }
    return request.details || {};
  } catch {
    return {};
  }
}

export function normalizeOrNumberInput(raw) {
  return String(raw || "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}

export function buildOfficialReceiptHtml(request, { orNumber, amount, controlNumber }) {
  const details = parseBusinessDetails(request);
  const payor = request.full_name || request.applicant_name || "—";
  const businessName =
    details.businessName || details.business_name || details.establishment_name || "—";
  const nature =
    details.natureOfBusiness || details.nature_of_business || "Business Permit";
  const ref = request.reference_number || "—";
  const bc = controlNumber || ref;
  const amt = Number(amount);
  const amountText = Number.isFinite(amt)
    ? amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0.00";
  const dateText = new Date().toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Official Receipt ${orNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 32px; background: #f8fafc; color: #0f172a; }
    .box { max-width: 640px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0; }
    h1 { margin: 0 0 4px; font-size: 18px; text-align: center; color: #1e3a8a; }
    h2 { margin: 0 0 24px; font-size: 14px; text-align: center; color: #64748b; font-weight: 600; }
    .or { text-align: center; font-size: 22px; font-weight: 900; color: #dc2626; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    td:first-child { width: 38%; font-weight: 700; color: #475569; text-transform: uppercase; font-size: 11px; }
    .amount { font-size: 20px; font-weight: 900; color: #059669; }
  </style>
</head>
<body>
  <div class="box">
    <h1>Barangay Iba O' Este</h1>
    <h2>Official Receipt</h2>
    <div class="or">OR NO. ${orNumber}</div>
    <table>
      <tr><td>Date</td><td>${dateText}</td></tr>
      <tr><td>Payor</td><td>${payor}</td></tr>
      <tr><td>Business</td><td>${businessName}</td></tr>
      <tr><td>Nature</td><td>${nature}</td></tr>
      <tr><td>Payment for</td><td>Business Permit Processing Fee</td></tr>
      <tr><td>Reference</td><td>${ref}</td></tr>
      <tr><td>BC Control No.</td><td>${bc}</td></tr>
      <tr><td>Amount</td><td class="amount">₱ ${amountText}</td></tr>
    </table>
  </div>
</body>
</html>`;
}

/** Writable on Vercel/Lambda; local dev uses backend folder. */
export function officialReceiptsDirectories() {
  const dirs = [path.join("/tmp", "brgy-generated-receipts")];
  dirs.push(path.join(process.cwd(), "..", "backend", "generated-receipts"));
  dirs.push(path.join(process.cwd(), "generated-receipts"));
  return [...new Set(dirs)];
}

export function officialReceiptsDirectory() {
  return officialReceiptsDirectories()[0];
}

/** Best-effort disk write (optional); DB holds canonical HTML on serverless. */
export function writeOfficialReceiptFile(filename, html) {
  const safeName = path.basename(String(filename || ""));
  if (!safeName) return null;
  for (const dir of officialReceiptsDirectories()) {
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, safeName), html, "utf8");
      return safeName;
    } catch (err) {
      console.warn("[OR] disk write skipped:", dir, err?.code || err?.message);
    }
  }
  return safeName;
}

export function readOfficialReceiptFileFromDisk(safeName) {
  const name = path.basename(String(safeName || ""));
  if (!name) return null;
  for (const dir of officialReceiptsDirectories()) {
    const filePath = path.join(dir, name);
    try {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, "utf8");
      }
    } catch {
      /* try next dir */
    }
  }
  return null;
}

/** Load OR HTML from disk, official_receipts.html_content, or request details.or_html */
export async function loadOfficialReceiptHtml(safeName, supabase) {
  const name = path.basename(String(safeName || ""));
  const fromDisk = name ? readOfficialReceiptFileFromDisk(name) : null;
  if (fromDisk) return fromDisk;

  if (!supabase || !name) return null;

  let { data: row } = await supabase
    .from("official_receipts")
    .select("html_content, request_id")
    .eq("file_path", name)
    .maybeSingle();

  if (!row && name.startsWith("OR_")) {
    const orNum = name.replace(/^OR_([^_]+)_.*$/i, "$1");
    if (orNum && orNum !== name) {
      const { data: byOr } = await supabase
        .from("official_receipts")
        .select("html_content, request_id")
        .eq("or_number", orNum)
        .order("created_at", { ascending: false })
        .limit(1);
      row = Array.isArray(byOr) ? byOr[0] : byOr;
    }
  }

  if (row?.html_content) return row.html_content;

  if (row?.request_id) {
    const { data: cert } = await supabase
      .from("certificate_requests")
      .select("details")
      .eq("id", row.request_id)
      .maybeSingle();
    const details = parseBusinessDetails(cert);
    if (details.or_html) return details.or_html;
  }

  return null;
}
