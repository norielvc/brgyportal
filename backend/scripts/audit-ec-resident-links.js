/**
 * Audit barangay_ids.id_number vs the linked resident's ec_card_number.
 *   node scripts/audit-ec-resident-links.js
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

async function main() {
  const ids = await fetchAll(
    "barangay_ids",
    "id, id_number, resident_id, full_name, is_printed",
  );
  const residents = await fetchAll(
    "residents",
    "id, first_name, last_name, ec_card_number",
  );
  const byId = new Map(residents.map((r) => [r.id, r]));

  let exact = 0;
  let mismatch = 0;
  let missingResident = 0;
  const samples = [];

  for (const card of ids) {
    const r = byId.get(card.resident_id);
    if (!r) {
      missingResident++;
      continue;
    }
    if (norm(r.ec_card_number) === norm(card.id_number)) exact++;
    else {
      mismatch++;
      if (samples.length < 20) {
        samples.push({
          card: card.id_number,
          cardName: card.full_name,
          resident: `${r.first_name} ${r.last_name}`,
          residentEc: r.ec_card_number || "(blank)",
        });
      }
    }
  }

  console.log(`IDs: ${ids.length}`);
  console.log(`Exact EC match: ${exact}`);
  console.log(`Linked resident has a different or blank EC: ${mismatch}`);
  console.log(`Missing resident: ${missingResident}`);
  samples.forEach((s) =>
    console.log(
      `  ${s.card} | card ${s.cardName} | resident ${s.resident} | resident EC ${s.residentEc}`,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
