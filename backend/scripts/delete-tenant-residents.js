/**
 * Delete all residents + barangay ID records for a tenant (upload fresh data after).
 * Does NOT delete admin users, portal content, or settings.
 *
 *   node scripts/delete-tenant-residents.js
 *   node scripts/delete-tenant-residents.js --confirm
 *   node scripts/delete-tenant-residents.js --confirm --tenant=ibaoeste
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", ".env.supabase") });
require("dotenv").config({ path: path.join(__dirname, "..", "..", "frontend", ".env.local") });

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const args = process.argv.slice(2);
const DRY_RUN = !args.includes("--confirm");
const tenantArg = args.find((a) => a.startsWith("--tenant="));
const TENANT_ID = tenantArg ? tenantArg.split("=")[1] : "ibaoeste";

async function countTable(table) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", TENANT_ID);
  if (error) {
    if (String(error.message).includes("does not exist")) return null;
    throw new Error(`${table} count: ${error.message}`);
  }
  return count ?? 0;
}

async function deleteByTenant(table) {
  const { error } = await supabase.from(table).delete().eq("tenant_id", TENANT_ID);
  if (error) {
    if (String(error.message).includes("does not exist")) {
      console.log(`   skip ${table} (missing)`);
      return;
    }
    throw new Error(`${table} delete: ${error.message}`);
  }
  console.log(`   deleted ${table}`);
}

async function main() {
  console.log(`Tenant: ${TENANT_ID}`);
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE DELETE"}\n`);

  const residents = await countTable("residents");
  const barangayIds = await countTable("barangay_ids");
  const certReqs = await countTable("certificate_requests");

  console.log(`Residents: ${residents ?? "n/a"}`);
  console.log(`Barangay IDs: ${barangayIds ?? "n/a"}`);
  console.log(`Certificate requests: ${certReqs ?? "n/a"}`);

  if (DRY_RUN) {
    console.log("\nDry run only. Re-run with --confirm to delete.");
    return;
  }

  if ((certReqs ?? 0) > 0) {
    console.warn(
      "\nWarning: certificate_requests still exist. Run delete-certificate-requests.js first if needed.",
    );
  }

  console.log("\nDeleting...");

  // ID Management data first (usually references residents)
  await deleteByTenant("barangay_ids");

  // Optional ID / scan satellite tables
  for (const table of ["id_print_logs", "id_card_history", "qr_scans"]) {
    try {
      await deleteByTenant(table);
    } catch (e) {
      console.warn(`   skip ${table}: ${e.message}`);
    }
  }

  await deleteByTenant("residents");

  const leftResidents = await countTable("residents");
  const leftIds = await countTable("barangay_ids");

  console.log(`\nRemaining residents: ${leftResidents ?? "n/a"}`);
  console.log(`Remaining barangay_ids: ${leftIds ?? "n/a"}`);
  console.log("\nDone. You can upload the updated resident database.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
