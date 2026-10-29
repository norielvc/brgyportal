/**
 * EC CARD UPDATE TO UPLOAD PORTAL.xlsx = source of truth (4427 IDs + print status).
 *
 *   node scripts/apply-ec-portal-list.js --confirm
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
const { buildBarangayIdRow } = require("../lib/censusImportMapper");

const DEFAULT_FILE =
  "C:\\Users\\SCREENS\\Downloads\\EC CARD UPDATE TO UPLOAD PORTAL.xlsx";
const TENANT = "ibaoeste";
const BATCH = 200;

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const DRY_RUN = !process.argv.includes("--confirm");
const fileArg = process.argv.find((a) => a.startsWith("--file="));
const FILE = fileArg
  ? fileArg.slice("--file=".length).replace(/^"|"$/g, "")
  : DEFAULT_FILE;

const EC_RE = /^H\d+M?-F\d+$/i;

function norm(v) {
  return String(v || "")
    .trim()
    .toUpperCase();
}

function isPrintedStatus(raw) {
  const s = String(raw || "").trim().toUpperCase();
  return s === "PRINTED" || s === "YES" || s === "Y";
}

function collectEcsFromResident(r) {
  const out = [];
  const add = (v) => {
    const ec = norm(v);
    if (EC_RE.test(ec)) out.push(ec);
  };
  add(r.ec_card_number);
  const un = r.census_extras?.unnamed_columns || {};
  add(un.col_29_ec);
  add(un.col_30_ec);
  add(un.col_31_ec);
  const cols = r.census_extras?.columns || {};
  add(cols["EC CARD NUMBER"]);
  return out;
}

function firstToken(firstMi) {
  return norm(String(firstMi || "").replace(/\./g, " ").split(/\s+/)[0]);
}

function loadPortalRows() {
  const wb = xlsx.readFile(FILE);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return xlsx.utils.sheet_to_json(sheet, { defval: "" });
}

async function fetchResidentIndex() {
  const slim = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("residents")
      .select("id, first_name, last_name, ec_card_number, census_extras")
      .eq("tenant_id", TENANT)
      .order("id", { ascending: true })
      .range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    slim.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return slim;
}

function buildIndexes(slimResidents) {
  const ecToResidentId = new Map();
  const byLastName = new Map();

  for (const r of slimResidents) {
    const last = lastNameKey(r.last_name);
    if (last) {
      if (!byLastName.has(last)) byLastName.set(last, []);
      byLastName.get(last).push(r);
    }

    for (const ec of collectEcsFromResident(r)) {
      if (!ecToResidentId.has(ec)) ecToResidentId.set(ec, r.id);
      else if (norm(r.ec_card_number) === ec) ecToResidentId.set(ec, r.id);
    }
  }
  return { ecToResidentId, byLastName };
}

function lastNameKey(value) {
  return norm(value)
    .replace(/\b(JR|SR|III|II|IV)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function matchByName(row, byLastName) {
  const last = lastNameKey(row["LAST_NAME"]);
  const tok = firstToken(row["FIRST_MI"]);
  const pool = byLastName.get(last) || byLastName.get(norm(row["LAST_NAME"])) || [];
  if (!pool.length || !tok) return null;

  let match = pool.find((r) => norm(r.first_name) === tok);
  if (!match) match = pool.find((r) => norm(r.first_name).startsWith(tok));
  if (!match && tok.length >= 3) {
    match = pool.find((r) => norm(r.first_name).includes(tok));
  }
  return match?.id || null;
}

function pickResidentId(ec, row, ecToResidentId, byLastName) {
  if (ecToResidentId.has(ec)) return ecToResidentId.get(ec);
  return matchByName(row, byLastName);
}

async function resolveUnmatchedByQuery(unmatched, byLastName) {
  const resolved = new Map();
  for (const u of unmatched) {
    const last = String(u.last || "").trim();
    const tok = firstToken(u.first);
    if (!last || !tok) continue;
    const { data } = await supabase
      .from("residents")
      .select("id")
      .eq("tenant_id", TENANT)
      .ilike("last_name", last)
      .ilike("first_name", `${tok}%`)
      .limit(1)
      .maybeSingle();
    if (data?.id) resolved.set(u.ec, data.id);
  }
  return resolved;
}

async function main() {
  if (!fs.existsSync(FILE)) {
    console.error("File not found:", FILE);
    process.exit(1);
  }

  const portalRows = loadPortalRows();
  console.log(`Portal rows: ${portalRows.length}`);

  const portalEcsList = [
    ...new Set(portalRows.map((r) => norm(r["EC CARD NUMBER"])).filter((e) => EC_RE.test(e))),
  ];

  const slim = await fetchResidentIndex();
  console.log(`Census residents loaded: ${slim.length}`);
  const { ecToResidentId, byLastName } = buildIndexes(slim);

  for (let i = 0; i < portalEcsList.length; i += 500) {
    const chunk = portalEcsList.slice(i, i + 500);
    const { data } = await supabase
      .from("residents")
      .select("id, ec_card_number")
      .eq("tenant_id", TENANT)
      .in("ec_card_number", chunk);
    for (const r of data || []) {
      const ec = norm(r.ec_card_number);
      if (ec) ecToResidentId.set(ec, r.id);
    }
  }
  console.log(`EC keys in census index: ${ecToResidentId.size}`);

  const planned = [];
  const unmatched = [];

  for (const row of portalRows) {
    const ec = norm(row["EC CARD NUMBER"]);
    if (!EC_RE.test(ec)) continue;

    const residentId = pickResidentId(ec, row, ecToResidentId, byLastName);
    if (!residentId) {
      unmatched.push({ ec, last: row["LAST_NAME"], first: row["FIRST_MI"] });
      continue;
    }
    planned.push({ row, ec, residentId });
  }

  if (unmatched.length) {
    const resolved = await resolveUnmatchedByQuery(unmatched, byLastName);
    const still = [];
    for (const u of unmatched) {
      const id = resolved.get(u.ec);
      if (id) {
        const row = portalRows.find((r) => norm(r["EC CARD NUMBER"]) === u.ec);
        if (row) planned.push({ row, ec: u.ec, residentId: id });
      } else still.push(u);
    }
    unmatched.length = 0;
    unmatched.push(...still);
  }

  const residentCache = new Map();
  const uniqueIds = [...new Set(planned.map((p) => p.residentId))];
  for (let i = 0; i < uniqueIds.length; i += 200) {
    const chunk = uniqueIds.slice(i, i + 200);
    const { data, error } = await supabase
      .from("residents")
      .select(
        "id, tenant_id, first_name, middle_name, last_name, suffix, date_of_birth, age, gender, civil_status, residential_address, house_number, purok, barangay, municipality, province, contact_number, ec_card_number",
      )
      .in("id", chunk);
    if (error) throw error;
    for (const r of data || []) residentCache.set(r.id, r);
  }

  const upsertRows = [];
  for (const { row, ec, residentId } of planned) {
    const resident = residentCache.get(residentId);
    if (!resident) continue;

    const printed = isPrintedStatus(row["STATUS"]);
    const base = buildBarangayIdRow({ ...resident, tenant_id: TENANT }, ec);
    const firstMi = String(row["FIRST_MI"] || "").trim();
    const lastName = String(row["LAST_NAME"] || "").trim().toUpperCase();
    const addr = String(row["ADDRESS"] || "").trim();

    upsertRows.push({
      ...base,
      full_name: [firstMi, lastName].filter(Boolean).join(" ").toUpperCase(),
      last_name: lastName || base.last_name,
      first_name: firstMi.split(/\s+/)[0]?.toUpperCase() || base.first_name,
      address: addr || base.address,
      purok: addr || base.purok,
      is_printed: printed,
      printed_at: printed ? new Date().toISOString() : null,
      status: "active",
    });
  }

  const printedExcel = portalRows.filter((r) =>
    isPrintedStatus(r["STATUS"]),
  ).length;

  console.log(`Ready to write: ${upsertRows.length} IDs`);
  console.log(`  PRINTED: ${upsertRows.filter((r) => r.is_printed).length}`);
  console.log(`  NOT PRINTED: ${upsertRows.filter((r) => !r.is_printed).length}`);
  console.log(`Unmatched (no census resident): ${unmatched.length}`);

  if (DRY_RUN) {
    if (unmatched.length) {
      console.log("\nUnmatched sample:");
      unmatched.slice(0, 12).forEach((u) =>
        console.log(`  ${u.ec}  ${u.first} ${u.last}`),
      );
    }
    console.log("\nDry run. Use --confirm to replace all tenant IDs.");
    return;
  }

  const { error: delErr } = await supabase
    .from("barangay_ids")
    .delete()
    .eq("tenant_id", TENANT);
  if (delErr) throw new Error(`delete all: ${delErr.message}`);
  console.log("Cleared all barangay_ids for tenant.");

  for (let i = 0; i < upsertRows.length; i += BATCH) {
    const chunk = upsertRows.slice(i, i + BATCH);
    const { error } = await supabase.from("barangay_ids").insert(chunk);
    if (error) throw new Error(`insert: ${error.message}`);
    console.log(`  inserted ${Math.min(i + BATCH, upsertRows.length)} / ${upsertRows.length}`);
  }

  const { count: total } = await supabase
    .from("barangay_ids")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", TENANT);
  const { count: printedDb } = await supabase
    .from("barangay_ids")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", TENANT)
    .eq("is_printed", true);

  console.log(`\nDone. Total: ${total} (portal ${portalRows.length})`);
  console.log(`Printed in DB: ${printedDb} (portal printed ${printedExcel})`);

  if (unmatched.length) {
    console.log(`\n${unmatched.length} portal EC(s) skipped — no resident match.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
