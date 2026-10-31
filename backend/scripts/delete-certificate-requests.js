/**
 * Delete all certificate requests (and related workflow rows) for a tenant.
 * Does NOT delete residents.
 *
 * Usage:
 *   node scripts/delete-certificate-requests.js                  # dry run, ibaoeste
 *   node scripts/delete-certificate-requests.js --confirm        # live delete, ibaoeste
 *   node scripts/delete-certificate-requests.js --confirm --tenant demo
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
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const args = process.argv.slice(2);
const DRY_RUN = !args.includes("--confirm");
const tenantArg = args.find((a) => a.startsWith("--tenant="));
const TENANT_ID = tenantArg ? tenantArg.split("=")[1] : "ibaoeste";

const BATCH = 100;

function chunks(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function deleteInBatches(table, column, ids) {
  if (!ids.length) return;
  for (const batch of chunks(ids, BATCH)) {
    const { error } = await supabase.from(table).delete().in(column, batch);
    if (error && !String(error.message).includes("does not exist")) {
      throw new Error(`${table}: ${error.message}`);
    }
  }
}

async function main() {
  console.log(`Tenant: ${TENANT_ID}`);
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE DELETE"}`);

  const { data: requests, error: reqErr } = await supabase
    .from("certificate_requests")
    .select("id")
    .eq("tenant_id", TENANT_ID);

  if (reqErr) {
    console.error("Failed to list certificate_requests:", reqErr.message);
    process.exit(1);
  }

  const requestIds = (requests || []).map((r) => r.id);
  console.log(`Certificate requests found: ${requestIds.length}`);

  if (DRY_RUN) {
    console.log("\nDry run only. Re-run with --confirm to delete.");
    return;
  }

  if (requestIds.length === 0) {
    console.log("Nothing to delete.");
    return;
  }

  // Optional related tables (by request_id)
  for (const table of [
    "notifications",
    "official_receipts",
    "certificate_pickups",
    "physical_inspections",
    "workflow_history",
    "workflow_assignments",
  ]) {
    try {
      await deleteInBatches(table, "request_id", requestIds);
      console.log(`Cleaned ${table} (by request_id)`);
    } catch (e) {
      console.warn(`Skip ${table}: ${e.message}`);
    }
  }

  // Tenant-scoped workflow rows (if any without request_id match)
  for (const table of ["workflow_history", "workflow_assignments"]) {
    const { error } = await supabase.from(table).delete().eq("tenant_id", TENANT_ID);
    if (error && !String(error.message).includes("does not exist")) {
      console.warn(`${table} tenant cleanup: ${error.message}`);
    } else {
      console.log(`Cleaned ${table} (tenant_id)`);
    }
  }

  const { error: delErr } = await supabase
    .from("certificate_requests")
    .delete()
    .eq("tenant_id", TENANT_ID);

  if (delErr) {
    console.error("Failed to delete certificate_requests:", delErr.message);
    process.exit(1);
  }

  const { count } = await supabase
    .from("certificate_requests")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", TENANT_ID);

  console.log(`\nDone. Remaining certificate_requests for ${TENANT_ID}: ${count ?? 0}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
