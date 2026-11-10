/**
 * Copy barangay_ids.id_number → residents.ec_card_number (+ census EC column when possible)
 * for linked rows where profile EC is blank or differs.
 *
 *   node scripts/sync-resident-ec-from-cards.js
 *   node scripts/sync-resident-ec-from-cards.js --confirm
 */
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({
  path: path.join(__dirname, "..", "..", "frontend", ".env.local"),
});

const { createClient } = require("@supabase/supabase-js");

const TENANT = process.env.NEXT_PUBLIC_TENANT_ID || "ibaoeste";
const DRY_RUN = !process.argv.includes("--confirm");

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

function norm(v) {
  return String(v || "")
    .replace(/\s+/g, "")
    .replace(/_/g, "")
    .trim()
    .toUpperCase();
}

function ecCore(v) {
  const n = norm(v);
  const m = n.match(/^(H\d+M?-?F\d+)/i);
  return m ? norm(m[1]) : n;
}

function sameEc(a, b) {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (ecCore(na) && ecCore(na) === ecCore(nb)) return true;
  return na.startsWith(nb) || nb.startsWith(na);
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

function mergeEcIntoCensusExtras(extras, idNumber) {
  const base =
    extras && typeof extras === "object"
      ? JSON.parse(JSON.stringify(extras))
      : { columns: {}, unnamed_columns: {} };
  if (!base.columns || typeof base.columns !== "object") base.columns = {};
  const ec = String(idNumber || "").trim().toUpperCase();
  if (ec) base.columns["EC CARD NUMBER"] = ec;
  return base;
}

async function main() {
  const cards = await fetchAll(
    "barangay_ids",
    "id, id_number, resident_id, full_name, status",
  );
  const residents = await fetchAll(
    "residents",
    "id, census_resident_number, first_name, last_name, ec_card_number, census_extras",
  );
  const byId = new Map(residents.map((r) => [r.id, r]));

  const plan = [];
  for (const card of cards) {
    if (!card.resident_id) continue;
    const idNum = String(card.id_number || "").trim();
    if (!idNum) {
      plan.push({
        action: "skip_blank_card_number",
        card_id: card.id,
        name: card.full_name,
      });
      continue;
    }
    const res = byId.get(card.resident_id);
    if (!res) continue;
    const stored = String(res.ec_card_number || "").trim();
    if (stored && sameEc(stored, idNum)) continue;

    plan.push({
      action: stored ? "update_mismatch" : "fill_blank",
      census_sr: res.census_resident_number,
      resident_id: res.id,
      name: `${res.first_name || ""} ${res.last_name || ""}`.trim(),
      card_number: idNum,
      previous_ec: stored || "",
    });
  }

  const toWrite = plan.filter((p) => p.resident_id);

  console.log(
    JSON.stringify(
      {
        mode: DRY_RUN ? "dry_run" : "live",
        tenant_id: TENANT,
        to_sync: toWrite.length,
        fill_blank: toWrite.filter((p) => p.action === "fill_blank").length,
        update_mismatch: toWrite.filter((p) => p.action === "update_mismatch")
          .length,
        skip_blank_card: plan.filter((p) => p.action === "skip_blank_card_number")
          .length,
        rows: toWrite,
      },
      null,
      2,
    ),
  );

  if (DRY_RUN) {
    console.log("\nRe-run with --confirm to apply.");
    return;
  }

  const BATCH = 50;
  for (let i = 0; i < toWrite.length; i += BATCH) {
    const chunk = toWrite.slice(i, i + BATCH);
    for (const row of chunk) {
      const res = byId.get(row.resident_id);
      const patch = {
        ec_card_number: norm(row.card_number),
        updated_at: new Date().toISOString(),
        census_extras: mergeEcIntoCensusExtras(
          res?.census_extras,
          row.card_number,
        ),
      };
      const { error } = await supabase
        .from("residents")
        .update(patch)
        .eq("id", row.resident_id)
        .eq("tenant_id", TENANT);
      if (error) throw error;
    }
    console.log(`Synced ${Math.min(i + BATCH, toWrite.length)} / ${toWrite.length}`);
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
