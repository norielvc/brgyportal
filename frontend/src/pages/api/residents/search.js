import path from "path";
import fs from "fs/promises";

/**
 * RESIDENT SEARCH API (Next.js)
 * ----------------------------
 * Handles /api/residents/search?name=...
 * Implements "Resilience Fallback" for paused Supabase plans.
 */
export default async function handler(req, res) {
  const { name } = req.query;
  const tenantId = req.headers["x-tenant-id"] || "ibaoeste";

  if (!name || name.length < 3) {
    return res.status(200).json({ success: true, residents: [] });
  }

  /**
   * STAGE 1: Live Cloud Attempt
   * (The system will automatically use this once your Supabase plan is back!)
   */
  try {
    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
    );

    const { data: residents, error } = await supabase
      .from("residents")
      .select("*")
      .ilike("full_name", `%${name}%`)
      .eq("tenant_id", tenantId)
      .limit(20);

    if (!error && residents && residents.length > 0) {
      console.log(
        `✅ Resident Search: Found ${residents.length} live records.`,
      );
      return res
        .status(200)
        .json({ success: true, residents, source: "cloud_supabase" });
    }
  } catch (cloudError) {
    console.warn(
      "⚠️ Search Resilience: Supabase inactive - attempting local resolution...",
    );
  }

  /**
   * STAGE 2: Local Resilience Fallback (JSON-based)
   */
  try {
    const dataPath = path.join(process.cwd(), "src/data/mock/residents.json");
    const jsonData = await fs.readFile(dataPath, "utf8");
    const data = JSON.parse(jsonData);

    const residents = data.residents || [];
    const filtered = residents.filter(
      (r) =>
        r.full_name.toLowerCase().includes(name.toLowerCase()) &&
        (r.tenant_id === tenantId ||
          (tenantId === "demo" && r.tenant_id === "demo")),
    );

    return res.status(200).json({
      success: true,
      residents: filtered,
      source: "local_resilience_store",
    });
  } catch (fsError) {
    console.error(`❌ CRITICAL FAILURE [Search]:`, fsError);
    return res
      .status(500)
      .json({ success: false, message: "Resident database offline." });
  }
}
