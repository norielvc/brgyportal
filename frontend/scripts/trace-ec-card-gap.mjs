import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const envPath = new URL("../.env.local", import.meta.url);
  return Object.fromEntries(
    readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .filter((l) => l && !l.startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        const key = l.slice(0, i);
        let val = l.slice(i + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        return [key, val];
      }),
  );
}

function normalizeEc(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .replace(/_/g, "")
    .toUpperCase();
}

function ecCore(value) {
  const norm = normalizeEc(value);
  if (!norm) return "";
  const m = norm.match(/^(H\d+M?-?F\d+)/i);
  return m ? normalizeEc(m[1]) : norm;
}

const EC_ISSUED_RE = /^H\d+M?-F\d+$/i;

async function fetchAll(sb, table, select, tenant) {
  const all = [];
  let from = 0;
  while (true) {
    const { data, error } = await sb
      .from(table)
      .select(select)
      .eq("tenant_id", tenant)
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

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const tenant = env.NEXT_PUBLIC_TENANT_ID || "ibaoeste";
const sb = createClient(url, key, { auth: { persistSession: false } });

const residents = await fetchAll(
  sb,
  "residents",
  "id, first_name, last_name, census_resident_number, ec_card_number",
  tenant,
);
const cards = await fetchAll(
  sb,
  "barangay_ids",
  "id, id_number, resident_id, status, full_name",
  tenant,
);

const withEcField = residents.filter(
  (r) => String(r.ec_card_number ?? "").trim() !== "",
);

const cardByNorm = new Map();
const cardByResidentId = new Map();
for (const c of cards) {
  const n = normalizeEc(c.id_number);
  if (!cardByNorm.has(n)) cardByNorm.set(n, []);
  cardByNorm.get(n).push(c);
  if (c.resident_id) {
    if (!cardByResidentId.has(c.resident_id))
      cardByResidentId.set(c.resident_id, []);
    cardByResidentId.get(c.resident_id).push(c);
  }
}

function findMatchingCardStrict(ecRaw) {
  const n = normalizeEc(ecRaw);
  const core = ecCore(ecRaw);
  if (cardByNorm.has(n)) return cardByNorm.get(n)[0];
  for (const [cn, list] of cardByNorm) {
    if (core && ecCore(cn) === core) return list[0];
  }
  return null;
}

function findMatchingCardLoose(ecRaw) {
  const n = normalizeEc(ecRaw);
  const strict = findMatchingCardStrict(ecRaw);
  if (strict) return strict;
  for (const [cn, list] of cardByNorm) {
    if (n && (cn.startsWith(n) || n.startsWith(cn))) return list[0];
  }
  return null;
}

let linkedInBarangayIds = 0;
let ecMatchesStrict = 0;
let ecMatchesLooseOnly = 0;
let noBarangayMatchStrict = 0;
let invalidOrGarbageEc = 0;
let duplicateEcOnResidents = 0;
const censusOnlySamples = [];
const mismatchSamples = [];

const ecCountOnResidents = new Map();
for (const r of withEcField) {
  const ec = String(r.ec_card_number).trim();
  const key = normalizeEc(ec) || ec;
  ecCountOnResidents.set(key, (ecCountOnResidents.get(key) || 0) + 1);
}

for (const [, count] of ecCountOnResidents) {
  if (count > 1) duplicateEcOnResidents += count - 1;
}

for (const r of withEcField) {
  const ec = String(r.ec_card_number).trim();
  const hasCardRow = cardByResidentId.has(r.id);
  const strict = findMatchingCardStrict(ec);
  const loose = findMatchingCardLoose(ec);
  const looksIssued = EC_ISSUED_RE.test(normalizeEc(ec));

  if (hasCardRow) linkedInBarangayIds++;
  if (strict) ecMatchesStrict++;
  else if (loose) ecMatchesLooseOnly++;
  else {
    noBarangayMatchStrict++;
    if (censusOnlySamples.length < 12) {
      censusOnlySamples.push({
        census: r.census_resident_number,
        ec,
        name: `${r.first_name} ${r.last_name}`,
        looksIssued,
      });
    }
  }
  if (!looksIssued && ec) {
    invalidOrGarbageEc++;
    if (mismatchSamples.length < 8) {
      mismatchSamples.push({ census: r.census_resident_number, ec });
    }
  }
}

const residentsWithEcNoBarangayRow = withEcField.filter(
  (r) => !cardByResidentId.has(r.id),
).length;

const barangayNoEcOnResident = cards.filter((c) => {
  if (!c.resident_id) return true;
  const res = residents.find((x) => x.id === c.resident_id);
  return !res || !String(res.ec_card_number || "").trim();
});

const uniqueEcValuesOnResidents = ecCountOnResidents.size;

console.log(
  JSON.stringify(
    {
      tenant_id: tenant,
      summary: {
        barangay_ids_records: cards.length,
        residents_with_ec_card_number_field: withEcField.length,
        gap_resident_field_minus_barangay_ids:
          withEcField.length - cards.length,
        unique_ec_values_on_residents: uniqueEcValuesOnResidents,
        duplicate_extra_resident_rows_same_ec: duplicateEcOnResidents,
      },
      linkage: {
        residents_with_ec_linked_by_resident_id_in_barangay_ids:
          linkedInBarangayIds,
        residents_ec_matches_barangay_id_strict: ecMatchesStrict,
        residents_ec_matches_only_via_loose_prefix: ecMatchesLooseOnly,
        residents_with_ec_but_no_barangay_ids_row_for_resident:
          residentsWithEcNoBarangayRow,
        residents_ec_no_barangay_id_record_at_all: noBarangayMatchStrict,
        barangay_ids_missing_ec_on_resident_profile:
          barangayNoEcOnResident.length,
      },
      census_only_on_resident: {
        count_no_barangay_record: noBarangayMatchStrict,
        sample: censusOnlySamples,
        non_standard_format_count: invalidOrGarbageEc,
        sample_non_standard: mismatchSamples,
      },
      loose_only_without_barangay_row_for_person: withEcField.filter((r) => {
        const ec = String(r.ec_card_number).trim();
        const strict = findMatchingCardStrict(ec);
        const loose = findMatchingCardLoose(ec);
        return !strict && loose && !cardByResidentId.has(r.id);
      }).length,
      strict_ec_no_barangay_row_for_person: withEcField.filter((r) => {
        const ec = String(r.ec_card_number).trim();
        return findMatchingCardStrict(ec) && !cardByResidentId.has(r.id);
      }).length,
      explanation: [
        "4949 = residents.ec_card_number populated (often from CENSUS import EC CARD NUMBER column).",
        "4483 = official rows in barangay_ids (EC Card module Issue flow).",
        "Gap is usually census-only EC on resident + duplicate rows + numbers not issued in EC Card.",
      ],
    },
    null,
    2,
  ),
);
