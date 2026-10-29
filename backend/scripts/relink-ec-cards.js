/**
 * Re-link each Barangay ID to the resident who owns that exact EC number.
 * Updates the card name/address from that resident. Does not invent new IDs.
 *
 *   node scripts/relink-ec-cards.js
 *   node scripts/relink-ec-cards.js --confirm
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({
  path: path.join(__dirname, "..", "..", "frontend", ".env.local"),
});
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);
const TENANT = "ibaoeste";
const EC_RE = /^H\d+M?-F\d+$/i;
const DRY = !process.argv.includes("--confirm");

function norm(v) {
  return String(v || "").trim().toUpperCase();
}

function censusCardNumber(r) {
  return norm(r.census_extras?.columns?.["EC CARD NUMBER"]);
}

function householdEc(r) {
  return norm(r.census_extras?.unnamed_columns?.col_31_ec);
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

function fullName(r) {
  return [r.first_name, r.middle_name, r.last_name, r.suffix]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();
}

async function main() {
  const cards = await fetchAll(
    "barangay_ids",
    "id, id_number, resident_id, is_printed",
  );
  const residents = await fetchAll(
    "residents",
    "id, first_name, middle_name, last_name, suffix, date_of_birth, age, gender, civil_status, residential_address, purok, barangay, municipality, province, contact_number, ec_card_number, census_extras",
  );

  const byExactEc = new Map();
  const byCensusCard = new Map();
  const byHousehold = new Map();
  for (const r of residents) {
    const ec = norm(r.ec_card_number);
    if (EC_RE.test(ec) && !byExactEc.has(ec)) byExactEc.set(ec, r);
    const header = censusCardNumber(r);
    if (EC_RE.test(header) && !byCensusCard.has(header)) byCensusCard.set(header, r);
    const hh = householdEc(r);
    if (EC_RE.test(hh) && !byHousehold.has(hh)) byHousehold.set(hh, r);
  }

  let already = 0;
  let relink = 0;
  let noOwner = 0;
  const updates = [];
  const noOwnerSample = [];

  for (const card of cards) {
    const ec = norm(card.id_number);
    const censusOwner = byCensusCard.get(ec) || null;
    const exactOwner = byExactEc.get(ec) || null;
    const hhOwner = byHousehold.get(ec) || null;
    let owner = censusOwner;
    if (
      !owner &&
      exactOwner &&
      (!censusCardNumber(exactOwner) || censusCardNumber(exactOwner) === ec)
    ) {
      owner = exactOwner;
    }
    if (!owner && hhOwner && censusCardNumber(hhOwner) === ec) owner = hhOwner;
    if (!owner && hhOwner && !censusCardNumber(hhOwner)) owner = hhOwner;
    if (!owner) {
      noOwner++;
      if (noOwnerSample.length < 15) noOwnerSample.push(ec);
      continue;
    }
    const samePerson = owner.id === card.resident_id;
    const ecMatches = norm(owner.ec_card_number) === ec;
    if (samePerson && ecMatches) {
      already++;
      continue;
    }
    relink++;
    updates.push({ card, resident: owner });
  }

  console.log(`Cards: ${cards.length}`);
  console.log(`Already accurate (same resident and same EC): ${already}`);
  console.log(`Will correct link and/or resident EC number: ${relink}`);
  console.log(`No census owner for this EC: ${noOwner}`);
  if (noOwnerSample.length) console.log("  sample", noOwnerSample.join(", "));

  if (DRY) {
    console.log("\nDry run. Use --confirm to update links and card names.");
    return;
  }

  let done = 0;
  for (const { card, resident } of updates) {
    const { error } = await supabase
      .from("barangay_ids")
      .update({
        resident_id: resident.id,
        full_name: fullName(resident),
        first_name: resident.first_name,
        middle_name: resident.middle_name,
        last_name: resident.last_name,
        suffix: resident.suffix,
        birth_date: resident.date_of_birth,
        age: resident.age,
        gender: resident.gender,
        civil_status: resident.civil_status,
        address: resident.residential_address,
        purok: resident.purok,
        barangay: resident.barangay,
        municipality: resident.municipality,
        province: resident.province,
        contact_number: resident.contact_number,
      })
      .eq("id", card.id)
      .eq("tenant_id", TENANT);
    if (error) throw new Error(`${card.id_number}: ${error.message}`);
    done++;
    if (done % 200 === 0) console.log(`  updated ${done} / ${updates.length}`);
  }
  console.log(`Updated ${done} card links.`);

  let ecWritten = 0;
  for (const { card, resident } of updates) {
    const cardEc = norm(card.id_number);
    if (norm(resident.ec_card_number) === cardEc) continue;
    const header = censusCardNumber(resident);
    if (header && header !== cardEc) continue;
    const { error } = await supabase
      .from("residents")
      .update({ ec_card_number: cardEc })
      .eq("id", resident.id)
      .eq("tenant_id", TENANT);
    if (error) throw new Error(`resident EC ${resident.id}: ${error.message}`);
    ecWritten++;
  }
  console.log(`Resident EC numbers set to the card number: ${ecWritten}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
