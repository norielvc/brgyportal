/**
 * Compare EC CARD UPDATE TO UPLOAD PORTAL.xlsx vs barangay_ids in Supabase.
 *
 *   node scripts/compare-ec-portal-list.js
 *   node scripts/compare-ec-portal-list.js --file="C:\...\EC CARD UPDATE TO UPLOAD PORTAL.xlsx"
 */
const path = require("path");
const fs = require("fs");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({
  path: path.join(__dirname, "..", "..", "frontend", ".env.local"),
});

const { createClient } = require("@supabase/supabase-js");
const xlsx = require(path.join(
  __dirname,
  "..",
  "..",
  "frontend",
  "node_modules",
  "xlsx",
));

const DEFAULT_FILE =
  "C:\\Users\\SCREENS\\Downloads\\EC CARD UPDATE TO UPLOAD PORTAL.xlsx";
const TENANT = "ibaoeste";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

function normEc(v) {
  return String(v || "")
    .trim()
    .toUpperCase();
}

function normStatus(v) {
  const s = String(v || "").trim().toUpperCase();
  if (s === "PRINTED" || s === "YES" || s === "Y") return "printed";
  if (s === "NOT PRINTED" || s === "NOT_PRINTED" || s === "NO" || s === "N")
    return "not_printed";
  if (s === "" || s === "-") return "not_printed";
  return s.toLowerCase();
}

function loadExcel(filePath) {
  const wb = xlsx.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });
  const map = new Map();
  const dupes = [];
  for (const row of rows) {
    const ec = normEc(row["EC CARD NUMBER"]);
    if (!ec) continue;
    if (map.has(ec)) dupes.push(ec);
    map.set(ec, {
      ec,
      first_mi: row["FIRST_MI"],
      last_name: row["LAST_NAME"],
      address: row["ADDRESS"],
      status: normStatus(row["STATUS"]),
      rawStatus: row["STATUS"],
    });
  }
  return { map, dupes, totalRows: rows.length };
}

async function loadDbIds() {
  const all = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("barangay_ids")
      .select("id_number, is_printed, full_name, resident_id")
      .eq("tenant_id", TENANT)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data?.length) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  const map = new Map();
  for (const row of all) {
    map.set(normEc(row.id_number), row);
  }
  return { map, count: all.length };
}

async function main() {
  const fileArg = process.argv.find((a) => a.startsWith("--file="));
  const filePath = fileArg
    ? fileArg.slice("--file=".length).replace(/^"|"$/g, "")
    : DEFAULT_FILE;

  if (!fs.existsSync(filePath)) {
    console.error("File not found:", filePath);
    process.exit(1);
  }

  const excel = loadExcel(filePath);
  const db = await loadDbIds();

  const excelPrinted = [...excel.map.values()].filter(
    (r) => r.status === "printed",
  ).length;
  const excelNotPrinted = [...excel.map.values()].filter(
    (r) => r.status === "not_printed",
  ).length;
  const excelOtherStatus = [...excel.map.values()].filter(
    (r) => r.status !== "printed" && r.status !== "not_printed",
  );

  console.log("=== EC CARD UPDATE TO UPLOAD PORTAL ===");
  console.log("File:", path.basename(filePath));
  console.log("Excel data rows:", excel.totalRows);
  console.log("Unique EC numbers in Excel:", excel.map.size);
  console.log("Duplicate EC in Excel:", excel.dupes.length);
  console.log("  STATUS printed:", excelPrinted);
  console.log("  STATUS not printed:", excelNotPrinted);
  if (excelOtherStatus.length) {
    console.log("  Other status values:", excelOtherStatus.length);
    console.log(
      "    samples:",
      excelOtherStatus.slice(0, 5).map((x) => x.rawStatus),
    );
  }

  console.log("\n=== DATABASE (barangay_ids) ===");
  console.log("Total IDs:", db.count);
  const dbPrinted = [...db.map.values()].filter((r) => r.is_printed === true)
    .length;
  const dbNotPrinted = db.count - dbPrinted;
  console.log("  is_printed true:", dbPrinted);
  console.log("  is_printed false/null:", dbNotPrinted);

  const inExcelNotDb = [];
  const inDbNotExcel = [];
  const statusMismatch = [];

  for (const [ec, ex] of excel.map) {
    const d = db.map.get(ec);
    if (!d) {
      inExcelNotDb.push(ex);
      continue;
    }
    const dbPrintedFlag = d.is_printed === true;
    const exPrinted = ex.status === "printed";
    if (dbPrintedFlag !== exPrinted) {
      statusMismatch.push({
        ec,
        excel: ex.rawStatus,
        db: dbPrintedFlag ? "PRINTED" : "NOT PRINTED",
        name: d.full_name,
      });
    }
  }

  for (const ec of db.map.keys()) {
    if (!excel.map.has(ec)) inDbNotExcel.push(ec);
  }

  console.log("\n=== RECONCILIATION ===");
  console.log("Expected portal total (Excel):", excel.map.size);
  console.log("In Excel, missing from DB:", inExcelNotDb.length);
  console.log("In DB, not on Excel list:", inDbNotExcel.length);
  console.log("Same EC, print status mismatch:", statusMismatch.length);

  if (inExcelNotDb.length) {
    console.log("\nMissing in DB (first 15):");
    inExcelNotDb.slice(0, 15).forEach((x) =>
      console.log(`  ${x.ec}  ${x.last_name}  ${x.rawStatus}`),
    );
  }

  if (inDbNotExcel.length) {
    console.log("\nExtra in DB (first 15):");
    inDbNotExcel.slice(0, 15).forEach((ec) => console.log(`  ${ec}`));
  }

  if (statusMismatch.length) {
    console.log("\nPrint status mismatch (first 15):");
    statusMismatch.slice(0, 15).forEach((x) =>
      console.log(`  ${x.ec}  Excel=${x.excel}  DB=${x.db}`),
    );
  }

  const match =
    excel.map.size === 4427 &&
    inExcelNotDb.length === 0 &&
    inDbNotExcel.length === 0;
  console.log(
    "\n" +
      (match
        ? "OK: Excel 4427 unique ECs align with DB id_number set."
        : "ATTENTION: Counts or EC sets differ — review lists above."),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
