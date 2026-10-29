/**
 * Import CENSUS 2026 MASTER LIST (all columns) → residents + barangay_ids
 *
 * Prerequisites: run backend/ADD_CENSUS_2026_COLUMNS.sql in Supabase
 *
 *   node scripts/import-census-2026.js
 *   node scripts/import-census-2026.js --confirm
 *   node scripts/import-census-2026.js --confirm --tenant=ibaoeste
 *   node scripts/import-census-2026.js --confirm --file="C:\path\master.xlsx"
 *   node scripts/import-census-2026.js --confirm --ec-file="C:\path\ec.xlsx"
 */
const path = require("path");
const fs = require("fs");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", ".env.supabase") });
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

const {
  buildRowRecord,
  householdGroupKey,
  buildBarangayIdRow,
} = require("../lib/censusImportMapper");

const DEFAULT_MASTER =
  "C:\\Users\\SCREENS\\Downloads\\CENSUS 2026 MASTER LIST ORIGINAL (1).xlsx";
const DEFAULT_EC =
  "C:\\Users\\SCREENS\\Downloads\\CENSUS 2026 MASTER LIST ORIGINAL for EC CARD (1).xlsx";

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const args = process.argv.slice(2);
const DRY_RUN = !args.includes("--confirm");
const tenantArg = args.find((a) => a.startsWith("--tenant="));
const fileArg = args.find((a) => a.startsWith("--file="));
const ecArg = args.find((a) => a.startsWith("--ec-file="));
const TENANT_ID = tenantArg ? tenantArg.split("=")[1] : "ibaoeste";
const MASTER_FILE = fileArg
  ? fileArg.slice("--file=".length).replace(/^"|"$/g, "")
  : DEFAULT_MASTER;
const EC_FILE = ecArg
  ? ecArg.slice("--ec-file=".length).replace(/^"|"$/g, "")
  : DEFAULT_EC;

const BATCH = 400;

function loadMasterRows(filePath, sheetName = "MASTER LIST") {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Master file not found: ${filePath}`);
  }
  const wb = xlsx.readFile(filePath, { cellDates: true });
  if (!wb.SheetNames.includes(sheetName)) {
    throw new Error(`Sheet "${sheetName}" not in workbook: ${wb.SheetNames.join(", ")}`);
  }
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], {
    header: 1,
    defval: "",
  });
  const headers = rows[0];
  const data = rows.slice(1).filter((r) => r.some((c) => String(c).trim()));
  return { headers, data, sheetName };
}

function loadEcFileMap(filePath) {
  const map = new Map();
  if (!filePath || !fs.existsSync(filePath)) {
    console.warn(`EC file not found (optional): ${filePath}`);
    return map;
  }
  const wb = xlsx.readFile(filePath, { cellDates: true });
  const sheet = wb.SheetNames.includes("MASTER LIST")
    ? "MASTER LIST"
    : wb.SheetNames[0];
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[sheet], {
    header: 1,
    defval: "",
  });
  const headers = rows[0];
  const srIdx = headers.findIndex((h) => {
    const t = String(h).trim();
    return t === "RESIDENT NUMBER" || t === "SR NUMBER";
  });
  const ecIdx = headers.findIndex(
    (h) => String(h).trim() === "EC CARD NUMBER",
  );
  if (srIdx === -1 || ecIdx === -1) {
    console.warn("EC file: missing RESIDENT NUMBER or EC CARD NUMBER column");
    return map;
  }
  for (const row of rows.slice(1)) {
    const sr = String(row[srIdx] || "").trim();
    const ec = String(row[ecIdx] || "").trim().toUpperCase();
    if (sr && ec) map.set(sr, ec);
  }
  console.log(`EC file overlay: ${map.size} resident numbers with EC CARD NUMBER`);
  return map;
}

async function assertCensusColumns() {
  const { error } = await supabase
    .from("residents")
    .select("census_extras, census_resident_number")
    .limit(1);
  const missingCensus =
    error &&
    /census_extras|census_resident_number|schema cache|column/i.test(
      error.message,
    );
  if (missingCensus) {
    const msg =
      "Missing census columns. Run backend/ADD_CENSUS_2026_COLUMNS.sql in Supabase first.";
    if (DRY_RUN) {
      console.warn(`\nWarning: ${msg}\n(Dry run will still parse the Excel file.)\n`);
      return false;
    }
    console.error(`\n${msg}\n`);
    process.exit(1);
  }
  if (error && error.code !== "PGRST116") {
    console.warn("Column check:", error.message);
  }
  return true;
}

async function upsertBatch(table, rows, onConflict) {
  const { error } = await supabase.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`${table} upsert: ${error.message}`);
}

async function updateHouseholdLinks(residents) {
  const byGroup = new Map();
  for (const r of residents) {
    const key = householdGroupKey(r);
    if (!key.replace(/\|/g, "")) continue;
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key).push(r);
  }

  let linked = 0;
  for (const group of byGroup.values()) {
    let head =
      group.find((r) => r.is_household_head) ||
      group.find((r) => r.is_head_of_family);
    if (!head && group[0].household_head_name) {
      const target = group[0].household_head_name;
      head = group.find(
        (r) =>
          `${r.first_name} ${r.middle_name || ""} ${r.last_name}`.replace(
            /\s+/g,
            " ",
          ) === target.replace(/\s+/g, " "),
      );
    }
    if (!head) continue;

    const updates = group
      .filter((m) => m.id !== head.id)
      .map((m) => ({ id: m.id, household_head_id: head.id }));

    if (DRY_RUN) {
      linked += updates.length;
      continue;
    }

    for (let i = 0; i < updates.length; i += BATCH) {
      const chunk = updates.slice(i, i + BATCH);
      for (const u of chunk) {
        const { error } = await supabase
          .from("residents")
          .update({ household_head_id: u.household_head_id })
          .eq("id", u.id)
          .eq("tenant_id", TENANT_ID);
        if (error) throw new Error(`household link: ${error.message}`);
      }
      linked += chunk.length;
    }
  }
  return linked;
}

async function main() {
  console.log(`Tenant: ${TENANT_ID}`);
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (add --confirm to write)" : "LIVE IMPORT"}`);
  console.log(`Master: ${MASTER_FILE}`);
  console.log(`EC overlay: ${EC_FILE}\n`);

  const dbReady = await assertCensusColumns();

  const importedAt = new Date().toISOString();
  const { headers, data, sheetName } = loadMasterRows(MASTER_FILE);
  const ecFileByResidentNumber = loadEcFileMap(EC_FILE);

  const importMeta = {
    sourceFile: path.basename(MASTER_FILE),
    importedAt,
    sheet: sheetName,
  };

  const residents = [];
  const barangayRows = [];
  let skipped = 0;

  for (const row of data) {
    const built = buildRowRecord(
      headers,
      row,
      TENANT_ID,
      ecFileByResidentNumber,
      importMeta,
    );
    if (!built) {
      skipped++;
      continue;
    }
    residents.push(built.resident);
    if (built.ecCard && /^H\d+M?-F\d+$/i.test(built.ecCard)) {
      barangayRows.push(buildBarangayIdRow(built.resident, built.ecCard));
    }
  }

  console.log(`Parsed rows: ${data.length}`);
  console.log(`Residents to upsert: ${residents.length} (skipped ${skipped})`);
  console.log(`Barangay ID rows: ${barangayRows.length}`);

  if (residents.length === 0) {
    process.exit(1);
  }

  if (DRY_RUN) {
    const sample = residents[0];
    console.log("\nDB census columns:", dbReady ? "ready" : "NOT migrated yet");
    console.log("Sample resident keys:", Object.keys(sample).join(", "));
    console.log(
      "census_extras column count:",
      Object.keys(sample.census_extras.columns).length,
    );
    const linked = await updateHouseholdLinks(residents);
    console.log(`Household links (dry): ${linked} member rows`);
    console.log("\nDry run complete. Re-run with --confirm to import.");
    return;
  }

  for (let i = 0; i < residents.length; i += BATCH) {
    const chunk = residents.slice(i, i + BATCH);
    await upsertBatch("residents", chunk, "id");
    console.log(`  residents ${Math.min(i + BATCH, residents.length)} / ${residents.length}`);
  }

  const linked = await updateHouseholdLinks(residents);
  console.log(`Household links updated: ${linked}`);

  for (let i = 0; i < barangayRows.length; i += BATCH) {
    const chunk = barangayRows.slice(i, i + BATCH);
    await upsertBatch("barangay_ids", chunk, "tenant_id,id_number");
    console.log(
      `  barangay_ids ${Math.min(i + BATCH, barangayRows.length)} / ${barangayRows.length}`,
    );
  }

  const { count } = await supabase
    .from("residents")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", TENANT_ID);

  console.log(`\nDone. Tenant ${TENANT_ID} residents count: ${count ?? "?"}`);
  console.log(
    "\nNext: link ID Management (EC cards) with:\n  node scripts/sync-barangay-ids-from-ec.js --confirm --replace",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
