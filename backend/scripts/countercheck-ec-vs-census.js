/**
 * Counter-check barangay_ids + residents.ec_card_number
 * against CENSUS 2026 MASTER LIST ORIGINAL (1) EC CARD NUMBER column.
 *
 *   node scripts/countercheck-ec-vs-census.js
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

const FILE =
  "C:\\Users\\SCREENS\\Downloads\\CENSUS 2026 MASTER LIST ORIGINAL (1).xlsx";
const TENANT = "ibaoeste";
const EC_RE = /^H\d+M?-F\d+$/i;

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

function norm(v) {
  return String(v || "").trim().toUpperCase();
}

async function fetchAll(table, select) {
  const all = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .eq("tenant_id", TENANT)
      .order("id", { ascending: true })
      .range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    all.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return all;
}

function loadCensus() {
  const wb = xlsx.readFile(FILE, { cellDates: false });
  const rows = xlsx.utils.sheet_to_json(wb.Sheets["MASTER LIST"], {
    header: 1,
    defval: "",
  });
  const headers = rows[0].map((h) => norm(h));
  const idx = (name) => headers.findIndex((h) => h === name);
  const sr = idx("RESIDENT NUMBER");
  const last = idx("LAST NAME");
  const first = idx("FIRST NAME");
  const ecCol = idx("EC CARD NUMBER");
  if (sr < 0 || ecCol < 0) {
    throw new Error(`Missing columns. Headers: ${headers.join(" | ")}`);
  }
  const bySr = new Map();
  let withEc = 0;
  let dupSr = 0;
  for (const row of rows.slice(1)) {
    const residentNo = norm(row[sr]);
    if (!residentNo) continue;
    const ec = norm(row[ecCol]);
    const rec = {
      sr: residentNo,
      last: norm(row[last]),
      first: norm(row[first]),
      ec: EC_RE.test(ec) ? ec : "",
      rawEc: ec,
    };
    if (bySr.has(residentNo)) dupSr++;
    bySr.set(residentNo, rec);
    if (rec.ec) withEc++;
  }
  return { bySr, withEc, dupSr, ecCol, headers };
}

async function main() {
  if (!fs.existsSync(FILE)) {
    console.error("Census file not found:", FILE);
    process.exit(1);
  }

  const census = loadCensus();
  const residents = await fetchAll(
    "residents",
    "id, census_resident_number, first_name, last_name, ec_card_number",
  );
  const cards = await fetchAll(
    "barangay_ids",
    "id_number, resident_id, full_name",
  );
  const cardByResident = new Map();
  const cardNameByResident = new Map();
  for (const c of cards) {
    if (!cardByResident.has(c.resident_id)) cardByResident.set(c.resident_id, []);
    cardByResident.get(c.resident_id).push(norm(c.id_number));
    cardNameByResident.set(c.resident_id, norm(c.full_name));
  }
  const residentById = new Map(residents.map((r) => [r.id, r]));

  let sameName = 0;
  let differentName = 0;
  const nameMismatch = [];
  let censusEcMatched = 0;
  let censusEcWrongOnResident = 0;
  let censusEcNoCard = 0;
  let censusEcCardMismatch = 0;
  let censusEcNoResident = 0;
  const wrong = [];
  const missingResident = [];
  const missingCard = [];

  for (const rec of census.bySr.values()) {
    if (!rec.ec) continue;
    const person = residents.find(
      (r) => norm(r.census_resident_number) === rec.sr,
    );
    if (!person) {
      censusEcNoResident++;
      if (missingResident.length < 12) {
        missingResident.push(`${rec.sr} ${rec.ec} ${rec.last}, ${rec.first}`);
      }
      continue;
    }
    const stored = norm(person.ec_card_number);
    const ids = cardByResident.get(person.id) || [];
    const residentOk = stored === rec.ec;
    const cardOk = ids.includes(rec.ec);
    const nameOk =
      norm(person.last_name) === rec.last && norm(person.first_name) === rec.first;
    if (nameOk) sameName++;
    else {
      differentName++;
      if (nameMismatch.length < 15) {
        nameMismatch.push(
          `${rec.sr} ${rec.ec} census=${rec.last}, ${rec.first} | db=${person.last_name}, ${person.first_name} | card=${cardNameByResident.get(person.id) || "(none)"}`,
        );
      }
    }
    if (residentOk && cardOk) {
      censusEcMatched++;
      continue;
    }
    if (!residentOk) censusEcWrongOnResident++;
    if (!ids.length) censusEcNoCard++;
    else if (!cardOk) censusEcCardMismatch++;
    if (wrong.length < 20) {
      wrong.push(
        `${rec.sr} census=${rec.ec} resident=${stored || "(blank)"} card=${ids.join(",") || "(none)"} ${person.last_name}, ${person.first_name}`,
      );
    }
  }

  const censusEcs = new Set(
    [...census.bySr.values()].filter((r) => r.ec).map((r) => r.ec),
  );
  let cardsNotInCensus = 0;
  const extraCards = [];
  for (const c of cards) {
    const ec = norm(c.id_number);
    if (!censusEcs.has(ec)) {
      cardsNotInCensus++;
      if (extraCards.length < 12) extraCards.push(`${ec} ${c.full_name}`);
    }
  }

  let residentEcNotInCensus = 0;
  for (const r of residents) {
    const ec = norm(r.ec_card_number);
    if (EC_RE.test(ec) && !censusEcs.has(ec)) residentEcNotInCensus++;
  }

  console.log("Census file: MASTER LIST");
  console.log(`Census residents: ${census.bySr.size}`);
  console.log(`Census rows with EC CARD NUMBER: ${census.withEc}`);
  console.log(`Duplicate resident numbers: ${census.dupSr}`);
  console.log("");
  console.log(`Same census resident number, last name, and first name: ${sameName}`);
  console.log(`Same resident number but name differs: ${differentName}`);
  console.log(`EC matches that same resident record AND their ID card: ${censusEcMatched}`);
  console.log(`Resident EC differs from census: ${censusEcWrongOnResident}`);
  console.log(`Census EC has no ID card: ${censusEcNoCard}`);
  console.log(`ID card number differs from census: ${censusEcCardMismatch}`);
  console.log(`Census EC row not found in residents: ${censusEcNoResident}`);
  console.log(`ID cards whose number is not in census EC column: ${cardsNotInCensus}`);
  console.log(`Residents whose saved EC is not in census EC column: ${residentEcNotInCensus}`);
  console.log(`ID cards in database: ${cards.length}`);

  if (nameMismatch.length) {
    console.log("\nName differences (up to 15):");
    nameMismatch.forEach((line) => console.log("  " + line));
  }
  if (wrong.length) {
    console.log("\nMismatches (up to 20):");
    wrong.forEach((line) => console.log("  " + line));
  }
  if (missingResident.length) {
    console.log("\nCensus EC with no resident (up to 12):");
    missingResident.forEach((line) => console.log("  " + line));
  }
  if (extraCards.length) {
    console.log("\nID cards not in census EC column (up to 12):");
    extraCards.forEach((line) => console.log("  " + line));
  }

  const ok =
    censusEcWrongOnResident === 0 &&
    censusEcNoCard === 0 &&
    censusEcCardMismatch === 0 &&
    cardsNotInCensus === 0 &&
    censusEcMatched === census.withEc;
  console.log(ok ? "\nRESULT: all census EC CARD NUMBERS match." : "\nRESULT: differences found.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
