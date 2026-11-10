/**
 * Trace residents whose ec_card_number exceeds official barangay_ids linkage:
 * classify census source (EC CARD NUMBER vs AF vs legacy AD/AE) and card matches.
 *
 *   node scripts/trace-extra-ec-cards.js
 *   node scripts/trace-extra-ec-cards.js --csv=../reports/extra-ec.csv
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
const EC_ISSUED_RE = /^H\d+M?-F\d+$/i;

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const csvArg = process.argv.find((a) => a.startsWith("--csv="));
const CSV_PATH = csvArg
  ? path.resolve(__dirname, csvArg.slice("--csv=".length))
  : path.join(__dirname, "..", "reports", `extra-ec-cards-${TENANT}.csv`);

function norm(v) {
  return String(v || "")
    .replace(/\s+/g, "")
    .replace(/_/g, "")
    .trim()
    .toUpperCase();
}

function ecCore(value) {
  const n = norm(value);
  if (!n) return "";
  const m = n.match(/^(H\d+M?-?F\d+)/i);
  return m ? norm(m[1]) : n;
}

function trimCell(v) {
  const s = String(v ?? "").trim();
  return s || "";
}

function ecSourceFlags(resident) {
  const un = resident?.census_extras?.unnamed_columns || {};
  const cols = resident?.census_extras?.columns || {};
  const header = trimCell(cols["EC CARD NUMBER"]);
  const ad = trimCell(un.col_29_ec);
  const ae = trimCell(un.col_30_ec);
  const af = trimCell(un.col_31_ec);
  const stored = trimCell(resident.ec_card_number);
  const resolved = pickEcNumber(
    { "EC CARD NUMBER": header },
    { col_31_ec: af },
  );
  const resolvedNorm = resolved ? norm(resolved) : "";
  const storedNorm = stored ? norm(stored) : "";

  const n = (x) => (x ? norm(x) : "");
  const same = (a, b) => a && b && a === b;
  const loose = (a, b) => {
    if (!a || !b) return false;
    if (a === b) return true;
    const ca = ecCore(a);
    const cb = ecCore(b);
    if (ca && cb && ca === cb) return true;
    return a.startsWith(b) || b.startsWith(a);
  };

  let primarySource = "none";
  if (storedNorm) {
    if (same(storedNorm, n(header))) primarySource = "ec_card_number_column";
    else if (same(storedNorm, n(af))) primarySource = "col_31_af";
    else if (same(storedNorm, n(ad))) primarySource = "col_29_ad_legacy";
    else if (same(storedNorm, n(ae))) primarySource = "col_30_ae_legacy";
    else if (loose(storedNorm, n(header))) primarySource = "ec_card_number_column_loose";
    else if (loose(storedNorm, n(af))) primarySource = "col_31_af_loose";
    else if (loose(storedNorm, n(ad))) primarySource = "col_29_ad_legacy_loose";
    else if (loose(storedNorm, n(ae))) primarySource = "col_30_ae_legacy_loose";
    else primarySource = "stored_not_in_census_snapshot";
  }

  const staleLegacyAdAe =
    storedNorm &&
    resolvedNorm &&
    storedNorm !== resolvedNorm &&
    (same(storedNorm, n(ad)) ||
      same(storedNorm, n(ae)) ||
      loose(storedNorm, n(ad)) ||
      loose(storedNorm, n(ae)));

  const phantomAdAeEc =
    storedNorm &&
    !resolvedNorm &&
    (same(storedNorm, n(ad)) ||
      same(storedNorm, n(ae)) ||
      loose(storedNorm, n(ad)) ||
      loose(storedNorm, n(ae)));

  const storedDiffersFromNewRule =
    (storedNorm && resolvedNorm && storedNorm !== resolvedNorm) || phantomAdAeEc;

  return {
    header,
    ad,
    ae,
    af,
    resolved,
    primarySource,
    staleLegacyAdAe,
    phantomAdAeEc,
    storedDiffersFromNewRule,
  };
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

function findCard(cardsByNorm, ecRaw, opts = {}) {
  const allowPrefix = opts.allowPrefix === true;
  const n = norm(ecRaw);
  const core = ecCore(ecRaw);
  if (!n) return { match: "none" };
  if (cardsByNorm.has(n)) {
    return { match: "strict", card: cardsByNorm.get(n)[0] };
  }
  for (const [cn, list] of cardsByNorm) {
    if (core && ecCore(cn) === core) {
      return { match: "core", card: list[0] };
    }
  }
  if (allowPrefix) {
    for (const [cn, list] of cardsByNorm) {
      if (n.startsWith(cn) || cn.startsWith(n)) {
        return { match: "prefix", card: list[0] };
      }
    }
  }
  return { match: "none" };
}

function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function main() {
  const residents = await fetchAll(
    "residents",
    "id, first_name, last_name, census_resident_number, ec_card_number, census_extras",
  );
  const cards = await fetchAll(
    "barangay_ids",
    "id, id_number, resident_id, full_name, status",
  );

  const cardsByNorm = new Map();
  const cardsByResident = new Map();
  for (const c of cards) {
    const n = norm(c.id_number);
    if (!cardsByNorm.has(n)) cardsByNorm.set(n, []);
    cardsByNorm.get(n).push(c);
    if (c.resident_id) {
      if (!cardsByResident.has(c.resident_id)) cardsByResident.set(c.resident_id, []);
      cardsByResident.get(c.resident_id).push(c);
    }
  }

  const withEc = residents.filter((r) => trimCell(r.ec_card_number));
  const sourceCounts = {};
  const linkageCounts = {};
  const extraRows = [];

  for (const r of withEc) {
    const src = ecSourceFlags(r);
    sourceCounts[src.primarySource] = (sourceCounts[src.primarySource] || 0) + 1;

    const hasOwnCard = cardsByResident.has(r.id);
    const cardFindStrict = findCard(cardsByNorm, r.ec_card_number);
    const cardFindAny = findCard(cardsByNorm, r.ec_card_number, {
      allowPrefix: true,
    });
    let linkage = "extra_no_barangay_row";
    if (hasOwnCard) linkage = "linked_barangay_row";
    else if (cardFindStrict.match === "strict" || cardFindStrict.match === "core") {
      linkage =
        cardFindStrict.card?.resident_id === r.id
          ? "linked_barangay_row"
          : "card_exists_other_resident";
    } else linkage = "no_barangay_ids_match";

    linkageCounts[linkage] = (linkageCounts[linkage] || 0) + 1;

    const isExtra = !hasOwnCard;
    if (isExtra) {
      extraRows.push({
        census_resident_number: r.census_resident_number || "",
        resident_id: r.id,
        name: `${r.first_name || ""} ${r.last_name || ""}`.trim(),
        stored_ec: trimCell(r.ec_card_number),
        resolved_ec_new_rules: src.resolved || "",
        census_ec_column: src.header,
        col_29_ad: src.ad,
        col_30_ae: src.ae,
        col_31_af: src.af,
        primary_source: src.primarySource,
        stale_legacy_ad_ae: src.staleLegacyAdAe ? "yes" : "no",
        phantom_ad_ae_only: src.phantomAdAeEc ? "yes" : "no",
        stored_differs_new_rules: src.storedDiffersFromNewRule ? "yes" : "no",
        linkage,
        matched_card_number: cardFindStrict.card
          ? trimCell(cardFindStrict.card.id_number)
          : "",
        matched_card_resident_id: cardFindStrict.card?.resident_id || "",
        matched_card_name: cardFindStrict.card?.full_name || "",
        card_match_type: cardFindStrict.match,
        misleading_prefix_only_match:
          !cardFindStrict.card && cardFindAny.match === "prefix" ? "yes" : "no",
        looks_issued_format: EC_ISSUED_RE.test(norm(r.ec_card_number)) ? "yes" : "no",
      });
    }
  }

  const duplicateEc = new Map();
  for (const r of withEc) {
    const k = norm(r.ec_card_number);
    if (!duplicateEc.has(k)) duplicateEc.set(k, []);
    duplicateEc.get(k).push(r);
  }
  const dupGroups = [...duplicateEc.entries()].filter(([, list]) => list.length > 1);

  fs.mkdirSync(path.dirname(CSV_PATH), { recursive: true });
  const header = [
    "census_resident_number",
    "resident_id",
    "name",
    "stored_ec",
    "resolved_ec_new_rules",
    "census_ec_column",
    "col_29_ad",
    "col_30_ae",
    "col_31_af",
    "primary_source",
    "stale_legacy_ad_ae",
    "phantom_ad_ae_only",
    "stored_differs_new_rules",
    "linkage",
    "matched_card_number",
    "matched_card_resident_id",
    "matched_card_name",
    "card_match_type",
    "misleading_prefix_only_match",
    "looks_issued_format",
  ];
  const lines = [header.join(",")];
  for (const row of extraRows) {
    lines.push(header.map((h) => csvEscape(row[h])).join(","));
  }
  fs.writeFileSync(CSV_PATH, lines.join("\n"), "utf8");

  const legacyAdAeOnly = extraRows.filter((r) =>
    ["col_29_ad_legacy", "col_30_ae_legacy", "col_29_ad_legacy_loose", "col_30_ae_legacy_loose"].includes(
      r.primary_source,
    ),
  ).length;

  console.log(
    JSON.stringify(
      {
        tenant_id: TENANT,
        csv: CSV_PATH,
        totals: {
          barangay_ids: cards.length,
          residents_with_ec: withEc.length,
          extra_residents_no_barangay_ids_row: extraRows.length,
          duplicate_ec_values: dupGroups.length,
          duplicate_extra_resident_rows: dupGroups.reduce((s, [, l]) => s + l.length - 1, 0),
        },
        extra_by_primary_census_source: Object.fromEntries(
          Object.entries(sourceCounts).filter(([k]) =>
            extraRows.some((e) => e.primary_source === k),
          ),
        ),
        all_residents_ec_primary_source: sourceCounts,
        linkage_all_with_ec: linkageCounts,
        extra_linkage: Object.fromEntries(
          Object.entries(
            extraRows.reduce((acc, r) => {
              acc[r.linkage] = (acc[r.linkage] || 0) + 1;
              return acc;
            }, {}),
          ),
        ),
        legacy_ad_ae_extras: legacyAdAeOnly,
        stale_legacy_ad_ae_extras: extraRows.filter((r) => r.stale_legacy_ad_ae === "yes").length,
        phantom_ad_ae_only_extras: extraRows.filter((r) => r.phantom_ad_ae_only === "yes")
          .length,
        stored_differs_new_rules_extras: extraRows.filter(
          (r) => r.stored_differs_new_rules === "yes",
        ).length,
        sample_extras: extraRows.slice(0, 8),
        sample_duplicate_ec: dupGroups.slice(0, 3).map(([ec, list]) => ({
          ec,
          residents: list.map((x) => ({
            census: x.census_resident_number,
            name: `${x.first_name} ${x.last_name}`,
          })),
        })),
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
