/**
 * Link Master Census residents → barangay_ids using EC card numbers (legacy logic).
 * One row per resident with ec_card_number; id_number = EC (e.g. H03108M-F04233).
 *
 *   node scripts/sync-barangay-ids-from-ec.js
 *   node scripts/sync-barangay-ids-from-ec.js --confirm
 *   node scripts/sync-barangay-ids-from-ec.js --confirm --replace
 *   node scripts/sync-barangay-ids-from-ec.js --confirm --replace --print-file="C:\...\EC CARD UPDATE TO UPLOAD PORTAL.xlsx"
 *
 * Official IDs come only from residents.ec_card_number.
 * The portal workbook is a print-status counter-check (does not add extra cards).
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
const { buildBarangayIdRow } = require("../lib/censusImportMapper");

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
const REPLACE = args.includes("--replace");
const tenantArg = args.find((a) => a.startsWith("--tenant="));
const printArg = args.find((a) => a.startsWith("--print-file="));
const TENANT_ID = tenantArg ? tenantArg.split("=")[1] : "ibaoeste";
const PRINT_FILE = printArg
  ? printArg.slice("--print-file=".length).replace(/^"|"$/g, "")
  : "";

const PAGE = 1000;
const BATCH = 200;
const EC_PATTERN = /^H\d+M?-F\d+$/i;

function normalizeEc(raw) {
  if (!raw) return null;
  const s = String(raw).trim().toUpperCase();
  return EC_PATTERN.test(s) ? s : null;
}

function loadPrintStatus(filePath) {
  const map = new Map();
  if (!filePath) return map;
  if (!fs.existsSync(filePath)) {
    console.warn(`Print counter-check file not found: ${filePath}`);
    return map;
  }
  const wb = xlsx.readFile(filePath);
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
    defval: "",
  });
  for (const row of rows) {
    const ec = normalizeEc(row["EC CARD NUMBER"]);
    if (!ec) continue;
    const status = String(row["STATUS"] || "").trim().toUpperCase();
    map.set(ec, status === "PRINTED" || status === "YES" || status === "Y");
  }
  console.log(`Print counter-check rows: ${map.size}`);
  return map;
}

async function fetchResidentsWithEc() {
  const all = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("residents")
      .select(
        "id, tenant_id, first_name, middle_name, last_name, suffix, date_of_birth, age, gender, civil_status, residential_address, house_number, purok, barangay, municipality, province, contact_number, ec_card_number, census_extras",
      )
      .eq("tenant_id", TENANT_ID)
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);

    if (error) throw new Error(error.message);
    if (!data?.length) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

async function main() {
  console.log(`Tenant: ${TENANT_ID}`);
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE SYNC"}\n`);

  const { count: currentIds } = await supabase
    .from("barangay_ids")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", TENANT_ID);
  console.log(`Current barangay_ids (before rebuild): ${currentIds ?? 0}`);

  const residents = await fetchResidentsWithEc();
  console.log(`Residents scanned: ${residents.length}`);

  const printStatus = loadPrintStatus(PRINT_FILE);

  const rows = [];
  const skippedNoEc = [];
  const ecClaimed = new Map();
  let duplicateEcRows = 0;
  let printedFromPortal = 0;
  let notOnPortalList = 0;

  for (const r of residents) {
    const ec = normalizeEc(r.ec_card_number);
    if (!ec) {
      skippedNoEc.push(r.id);
      continue;
    }
    if (ecClaimed.has(ec)) {
      duplicateEcRows++;
      continue;
    }
    ecClaimed.set(ec, r.id);
    const row = buildBarangayIdRow({ ...r, tenant_id: TENANT_ID }, ec);
    if (printStatus.size) {
      if (printStatus.has(ec)) {
        const printed = printStatus.get(ec) === true;
        row.is_printed = printed;
        row.printed_at = printed ? new Date().toISOString() : null;
        if (printed) printedFromPortal++;
      } else {
        row.is_printed = false;
        row.printed_at = null;
        notOnPortalList++;
      }
    }
    rows.push(row);
  }

  console.log(`Official EC cards (unique residents.ec_card_number): ${rows.length}`);
  console.log(`Residents with no EC: ${skippedNoEc.length}`);
  console.log(`Duplicate EC skipped (2nd resident, same number): ${duplicateEcRows}`);
  if (printStatus.size) {
    console.log(`Matched portal print list: ${rows.length - notOnPortalList}`);
    console.log(`  marked PRINTED: ${printedFromPortal}`);
    console.log(`  on portal but not printed: ${rows.length - notOnPortalList - printedFromPortal}`);
    console.log(`Official EC not on portal counter-check: ${notOnPortalList}`);
    const official = new Set(rows.map((r) => r.id_number));
    let portalOnly = 0;
    for (const ec of printStatus.keys()) {
      if (!official.has(ec)) portalOnly++;
    }
    console.log(`Portal EC not in resident database (ignored): ${portalOnly}`);
  }

  if (DRY_RUN) {
    const household = rows.filter((x) => !/H\d+M-/i.test(x.id_number)).length;
    const family = rows.length - household;
    console.log(`  Household head cards: ${household}`);
    console.log(`  Family member cards (H…M-F…): ${family}`);
    console.log(
      REPLACE
        ? "\nDry run. --confirm --replace will wipe tenant IDs and write this set."
        : "\nRe-run with --confirm --replace to replace all tenant IDs.",
    );
    return;
  }

  if (REPLACE) {
    const { error: delErr } = await supabase
      .from("barangay_ids")
      .delete()
      .eq("tenant_id", TENANT_ID);
    if (delErr) throw new Error(`delete barangay_ids: ${delErr.message}`);
    console.log("Cleared existing barangay_ids for tenant.");
  }

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await supabase.from("barangay_ids").upsert(chunk, {
      onConflict: "tenant_id,id_number",
    });
    if (error) throw new Error(`barangay_ids upsert: ${error.message}`);
    console.log(`  synced ${Math.min(i + BATCH, rows.length)} / ${rows.length}`);
  }

  const { count } = await supabase
    .from("barangay_ids")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", TENANT_ID);

  console.log(`\nDone. barangay_ids for ${TENANT_ID}: ${count ?? "?"}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
