const { createClient } = require("@supabase/supabase-js");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const sql = `
ALTER TABLE certificate_requests DROP CONSTRAINT IF EXISTS certificate_requests_status_check;

ALTER TABLE certificate_requests ADD CONSTRAINT certificate_requests_status_check CHECK (
  status IN (
    'pending',
    'submitted',
    'staff_review',
    'processing',
    'secretary_approval',
    'captain_approval',
    'physical_inspection',
    'verifying',
    'Treasury',
    'oic_review',
    'approved',
    'ready',
    'ready_for_pickup',
    'released',
    'rejected',
    'returned',
    'completed',
    'cancelled'
  )
);
`;

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const { error } = await supabase.rpc("exec_sql", { sql });
  if (error) {
    console.error("Could not run via exec_sql RPC:", error.message);
    console.log("\nRun this in Supabase → SQL Editor:\n");
    console.log(sql);
    process.exit(1);
  }
  console.log("Status constraint updated: verifying is now allowed.");
}

main();
