/**
 * Report highest census_resident_number in Supabase.
 *   node scripts/max-census-resident-number.js [tenant_id]
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({
  path: path.join(__dirname, "..", "..", "frontend", ".env.local"),
});
const { createClient } = require("@supabase/supabase-js");

const tenantFilter = process.argv[2] || null;

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing Supabase credentials in .env / .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

function numericSr(value) {
  if (value == null) return null;
  const digits = String(value)
    .trim()
    .replace(/^#?\s*/i, "")
    .replace(/^sr\s*/i, "")
    .replace(/\D/g, "");
  if (!digits) return null;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
}

async function fetchAll() {
  const all = [];
  let from = 0;
  while (true) {
    let q = supabase
      .from("residents")
      .select(
        "tenant_id, census_resident_number, last_name, first_name, id",
      )
      .not("census_resident_number", "is", null)
      .neq("census_resident_number", "")
      .order("id", { ascending: true })
      .range(from, from + 999);
    if (tenantFilter) q = q.eq("tenant_id", tenantFilter);
    const { data, error } = await q;
    if (error) throw error;
    if (!data?.length) break;
    all.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return all;
}

(async () => {
  const rows = await fetchAll();
  let max = -1;
  let maxRow = null;
  const byTenant = {};

  for (const r of rows) {
    const n = numericSr(r.census_resident_number);
    if (n == null) continue;
    const t = r.tenant_id || "unknown";
    if (!byTenant[t] || n > byTenant[t].max) {
      byTenant[t] = {
        max: n,
        raw: r.census_resident_number,
        name: [r.last_name, r.first_name].filter(Boolean).join(", "),
      };
    }
    if (n > max) {
      max = n;
      maxRow = r;
    }
  }

  const pad = (n) => String(n).padStart(5, "0");

  console.log("Census resident number — last / highest used\n");
  if (tenantFilter) console.log(`Tenant filter: ${tenantFilter}\n`);

  if (max < 0) {
    console.log("No numeric census_resident_number values found.");
    process.exit(0);
  }

  console.log(
    `Highest: ${pad(max)} (stored as "${maxRow.census_resident_number}")`,
  );
  console.log(
    `Resident: ${[maxRow.last_name, maxRow.first_name].filter(Boolean).join(", ")}`,
  );
  console.log(`Tenant: ${maxRow.tenant_id}`);
  console.log(`Next suggested number: ${pad(max + 1)}`);
  console.log(`\nRecords with a resident number: ${rows.length}`);

  const tenants = Object.keys(byTenant).sort();
  if (tenants.length > 1) {
    console.log("\nPer tenant:");
    for (const t of tenants) {
      const v = byTenant[t];
      console.log(
        `  ${t}: last ${pad(v.max)} ("${v.raw}") — ${v.name || "—"}`,
      );
    }
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
