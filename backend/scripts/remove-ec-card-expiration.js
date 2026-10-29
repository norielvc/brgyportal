/**
 * Apply no-expiration policy to all barangay_ids rows.
 * Usage: node backend/scripts/remove-ec-card-expiration.js [--tenant=slug]
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { createClient } = require("@supabase/supabase-js");

const NO_EXPIRY = "2099-12-31";

async function main() {
  const tenantArg = process.argv.find((a) => a.startsWith("--tenant="));
  const tenantSlug = tenantArg ? tenantArg.split("=")[1] : process.env.TENANT_SLUG || "ibaoeste";

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: tenant, error: tenantErr } = await supabase
    .from("tenants")
    .select("id, slug")
    .eq("slug", tenantSlug)
    .single();

  if (tenantErr || !tenant) {
    console.error("Tenant not found:", tenantSlug, tenantErr?.message);
    process.exit(1);
  }

  const { data, error } = await supabase
    .from("barangay_ids")
    .update({
      expiry_date: NO_EXPIRY,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", tenant.id)
    .select("id");

  if (error) {
    console.error("Update failed:", error.message);
    process.exit(1);
  }

  const { error: statusErr } = await supabase
    .from("barangay_ids")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("tenant_id", tenant.id)
    .eq("status", "expired");

  if (statusErr) {
    console.error("Reactivate expired failed:", statusErr.message);
    process.exit(1);
  }

  console.log(
    `Done. Set expiry_date=${NO_EXPIRY} for ${data?.length ?? 0} EC card row(s) (tenant ${tenant.slug}).`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
