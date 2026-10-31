/**
 * Delete all Help Desk data for a tenant: E-Sumbong, Assistance, KapChat.
 *
 *   node scripts/delete-help-desk-data.js
 *   node scripts/delete-help-desk-data.js --confirm
 *   node scripts/delete-help-desk-data.js --confirm --tenant=ibaoeste
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

const TABLES = ["blotter_reports", "assistance_inquiries", "kapchat_messages"];

async function countTable(table) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", TENANT_ID);
  if (error) {
    if (String(error.message).includes("does not exist")) return null;
    throw new Error(`${table}: ${error.message}`);
  }
  return count ?? 0;
}

async function deleteTable(table) {
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

  for (const table of TABLES) {
    const n = await countTable(table);
    const label =
      table === "blotter_reports"
        ? "E-Sumbong (blotter)"
        : table === "assistance_inquiries"
          ? "Assistance"
          : "KapChat";
    console.log(`${label}: ${n ?? "n/a"}`);
  }

  if (DRY_RUN) {
    console.log("\nDry run only. Re-run with --confirm to delete.");
    return;
  }

  console.log("\nDeleting...");
  for (const table of TABLES) {
    await deleteTable(table);
  }

  console.log("\nRemaining:");
  for (const table of TABLES) {
    const n = await countTable(table);
    console.log(`  ${table}: ${n ?? "n/a"}`);
  }
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
