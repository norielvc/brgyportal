#!/usr/bin/env node
/**
 * BrgyDesk tenant smoke test (Supabase + optional HTTP).
 *
 * Usage:
 *   node scripts/smoke-tenant-health.js
 *   node scripts/smoke-tenant-health.js --url http://localhost:3003
 *   node scripts/smoke-tenant-health.js --tenants ibaoeste,demo
 *
 * Loads backend/.env for Supabase credentials.
 * Exit code 0 = pass, 1 = failure.
 */

const path = require("path");
const backendRoot = path.join(__dirname, "../backend");

require(path.join(backendRoot, "node_modules/dotenv")).config({
  path: path.join(backendRoot, ".env"),
});
require(path.join(backendRoot, "node_modules/dotenv")).config({
  path: path.join(__dirname, "../frontend/.env.local"),
});

const { createClient } = require(path.join(
  backendRoot,
  "node_modules/@supabase/supabase-js",
));

const args = process.argv.slice(2);
const urlFlag = args.find((a) => a.startsWith("--url="));
const tenantsFlag = args.find((a) => a.startsWith("--tenants="));
const baseUrl = urlFlag
  ? urlFlag.split("=")[1]
  : process.env.SMOKE_BASE_URL || "";
const tenants = (tenantsFlag ? tenantsFlag.split("=")[1] : "ibaoeste,demo")
  .split(",")
  .map((t) => t.trim().toLowerCase())
  .filter(Boolean);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let failed = false;

function fail(msg) {
  console.error(`❌ ${msg}`);
  failed = true;
}

function ok(msg) {
  console.log(`✅ ${msg}`);
}

async function checkSupabaseTenants(supabase) {
  console.log("\n--- Supabase tenants ---");
  for (const id of tenants) {
    const { data: tenant, error } = await supabase
      .from("tenants")
      .select("id, name, status, plan_tier")
      .eq("id", id)
      .maybeSingle();

    if (error || !tenant) {
      fail(`${id}: tenant row missing (${error?.message || "not found"})`);
      continue;
    }
    if (tenant.status !== "Active") {
      fail(`${id}: status is ${tenant.status}`);
      continue;
    }

    const tables = ["users", "residents", "events"];
    const counts = {};
    for (const table of tables) {
      const { count, error: ce } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", id);
      counts[table] = ce ? `err:${ce.message}` : count ?? 0;
    }

    ok(
      `${id} (${tenant.name}, ${tenant.plan_tier}) — users:${counts.users} residents:${counts.residents} events:${counts.events}`,
    );
  }
}

async function checkHttp(base) {
  console.log(`\n--- HTTP (${base}) ---`);
  const headers = { "x-tenant-id": tenants[0] || "ibaoeste" };

  try {
    const healthRes = await fetch(`${base.replace(/\/$/, "")}/api/health`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!healthRes.ok) {
      fail(`GET /api/health → ${healthRes.status}`);
    } else {
      ok(`GET /api/health → ${healthRes.status}`);
    }
  } catch (e) {
    fail(`GET /api/health → ${e.message}`);
  }

  try {
    const infoRes = await fetch(
      `${base.replace(/\/$/, "")}/api/portal/tenant-info`,
      { headers, signal: AbortSignal.timeout(15000) },
    );
    const json = await infoRes.json();
    if (!infoRes.ok || !json.success || !json.data?.id) {
      fail(`GET /api/portal/tenant-info → invalid response`);
    } else {
      ok(`GET /api/portal/tenant-info → ${json.data.id} (${json.source})`);
    }
  } catch (e) {
    fail(`GET /api/portal/tenant-info → ${e.message}`);
  }

  try {
    const eventsRes = await fetch(
      `${base.replace(/\/$/, "")}/api/portal/events`,
      { headers, signal: AbortSignal.timeout(15000) },
    );
    const json = await eventsRes.json();
    const n = Array.isArray(json.data) ? json.data.length : 0;
    if (!eventsRes.ok || !json.success) {
      fail(`GET /api/portal/events → ${eventsRes.status}`);
    } else {
      ok(`GET /api/portal/events → ${n} record(s)`);
    }
  } catch (e) {
    fail(`GET /api/portal/events → ${e.message}`);
  }
}

async function main() {
  console.log("BrgyDesk smoke: tenant health");

  if (!supabaseUrl || !supabaseKey) {
    fail("SUPABASE_URL or key missing (check backend/.env)");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  await checkSupabaseTenants(supabase);

  if (baseUrl) {
    await checkHttp(baseUrl);
  } else {
    console.log("\n(Skip HTTP: pass --url=http://localhost:3003 to test Next API)");
  }

  console.log(failed ? "\nSmoke test FAILED\n" : "\nSmoke test PASSED\n");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
