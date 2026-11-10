/**
 * Clear residents.ec_card_number when there is no barangay_ids row and the value
 * is not valid under current census rules (EC CARD NUMBER + AF only).
 *
 *   node scripts/cleanup-phantom-ec-profiles.js           # dry run + list
 *   node scripts/cleanup-phantom-ec-profiles.js --confirm
 */
const path = require("path");
const fs = require("fs");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({
  path: path.join(__dirname, "..", "..", "frontend", ".env.local"),
});

const { createClient } = require("@supabase/supabase-js");
const { pickEcNumber } = require("../lib/censusImportMapper");

const TENANT = process.env.NEXT_PUBLIC_TENANT_ID || "ibaoeste";
const DRY_RUN = !process.argv.includes("--confirm");
const REPORT = path.join(
  __dirname,
  "..",
  "reports",
  `ec-cleanup-candidates-${TENANT}.csv`,
);

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

function trimCell(v) {
  const s = String(v ?? "").trim();
  return s || "";
}

function resolvedEcFromCensus(resident) {
  const un = resident?.census_extras?.unnamed_columns || {};
  const cols = resident?.census_extras?.columns || {};
  const header = trimCell(cols["EC CARD NUMBER"]);
  const af = trimCell(un.col_31_ec);
  return pickEcNumber({ "EC CARD NUMBER": header }, { col_31_ec: af });
}

function cleanupReason(resident, hasBarangayRow) {
  const stored = trimCell(resident.ec_card_number);
  if (!stored) return null;
  if (hasBarangayRow) return null;

  const resolved = resolvedEcFromCensus(resident);
  const storedNorm = norm(stored);
  const resolvedNorm = resolved ? norm(resolved) : "";

  if (!resolvedNorm) {
    const un = resident?.census_extras?.unnamed_columns || {};
    const ad = trimCell(un.col_29_ec);
    const ae = trimCell(un.col_30_ae);
    if (ad && norm(ad) === storedNorm) return "legacy_column_ad_only";
    if (ae && norm(ae) === storedNorm) return "legacy_column_ae_only";
    return "not_in_census_or_ec_overlay_manual";
  }
  if (storedNorm !== resolvedNorm) return "profile_ec_differs_from_census_column";
  return null;
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

function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function main() {
  const residents = await fetchAll(
    "residents",
    "id, census_resident_number, first_name, middle_name, last_name, suffix, ec_card_number, census_extras",
  );
  const cards = await fetchAll("barangay_ids", "resident_id");
  const hasCard = new Set(
    cards.map((c) => c.resident_id).filter(Boolean),
  );

  const candidates = [];
  for (const r of residents) {
    const reason = cleanupReason(r, hasCard.has(r.id));
    if (!reason) continue;
    const resolved = resolvedEcFromCensus(r);
    candidates.push({
      census_sr: r.census_resident_number || "",
      resident_id: r.id,
      name: [r.first_name, r.middle_name, r.last_name, r.suffix]
        .filter(Boolean)
        .join(" "),
      ec_to_clear: trimCell(r.ec_card_number),
      census_ec_column: trimCell(r.census_extras?.columns?.["EC CARD NUMBER"]),
      col_29_ad: trimCell(r.census_extras?.unnamed_columns?.col_29_ec),
      col_30_ae: trimCell(r.census_extras?.unnamed_columns?.col_30_ec),
      col_31_af: trimCell(r.census_extras?.unnamed_columns?.col_31_ec),
      resolved_keep_under_new_rules: resolved || "",
      reason,
    });
  }

  const byReason = {};
  for (const c of candidates) {
    byReason[c.reason] = (byReason[c.reason] || 0) + 1;
  }

  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  const header = Object.keys(candidates[0] || { census_sr: 1 });
  const lines = [
    header.join(","),
    ...candidates.map((row) => header.map((h) => csvEscape(row[h])).join(",")),
  ];
  fs.writeFileSync(REPORT, lines.join("\n"), "utf8");

  console.log(
    JSON.stringify(
      {
        mode: DRY_RUN ? "dry_run" : "live",
        tenant_id: TENANT,
        action: "SET residents.ec_card_number = NULL (not delete residents)",
        total_to_clear: candidates.length,
        by_reason: byReason,
        csv: REPORT,
        sample: candidates.slice(0, 10),
        skipped_with_barangay_ids: "any resident linked to barangay_ids is never cleared",
        kept_example:
          "census EC CARD NUMBER valid + no card yet → profile EC kept until issued",
      },
      null,
      2,
    ),
  );

  if (!DRY_RUN && candidates.length) {
    const BATCH = 100;
    for (let i = 0; i < candidates.length; i += BATCH) {
      const chunk = candidates.slice(i, i + BATCH);
      const ids = chunk.map((c) => c.resident_id);
      const { error } = await supabase
        .from("residents")
        .update({ ec_card_number: null })
        .eq("tenant_id", TENANT)
        .in("id", ids);
      if (error) throw error;
      console.log(`Cleared ${Math.min(i + BATCH, candidates.length)} / ${candidates.length}`);
    }
    console.log("Done.");
  } else if (DRY_RUN) {
    console.log("\nRe-run with --confirm to apply clears.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
