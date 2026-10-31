import { authenticateToken } from "../../../../src/lib/api-auth";
import { supabase } from "../../../../lib/supabase";

async function fetchLatestReceipt(requestId, tenantId) {
  const run = async (withTenant) => {
    let q = supabase
      .from("official_receipts")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: false })
      .limit(1);
    if (withTenant && tenantId) {
      q = q.eq("tenant_id", tenantId);
    }
    return q;
  };

  let { data, error } = await run(Boolean(tenantId));
  if (error && tenantId && /tenant_id/i.test(error.message || "")) {
    ({ data, error } = await run(false));
  }
  if (error) {
    const msg = error.message || "";
    if (/official_receipts/i.test(msg) && /does not exist/i.test(msg)) {
      return { data: null, error: null };
    }
    return { data: null, error };
  }
  const row = Array.isArray(data) ? data[0] : data;
  return { data: row ?? null, error: null };
}

export default async function handler(req, res) {
  try {
    const user = await authenticateToken(req, res);
    if (!user) return;

    const tenantId = user.tenant_id || req.headers["x-tenant-id"];
    const { requestId } = req.query;

    if (!requestId) {
      return res
        .status(400)
        .json({ success: false, message: "Request id required" });
    }

    if (req.method === "GET") {
      const { data, error } = await fetchLatestReceipt(requestId, tenantId);
      if (error) {
        console.error("[OR request GET]", error.message);
        return res.status(500).json({ success: false, message: error.message });
      }
      return res.json({ success: true, data: data || null });
    }

    if (req.method === "POST") {
      const insertData = {
        ...req.body,
        request_id: requestId,
        tenant_id: tenantId,
        issued_by: user._id || user.id,
        created_at: new Date().toISOString(),
      };
      let { data, error } = await supabase
        .from("official_receipts")
        .insert([insertData])
        .select()
        .single();
      if (error && /tenant_id/i.test(error.message || "")) {
        const { tenant_id: _t, ...rest } = insertData;
        ({ data, error } = await supabase
          .from("official_receipts")
          .insert([rest])
          .select()
          .single());
      }
      if (error) {
        return res.status(400).json({ success: false, message: error.message });
      }
      return res.status(201).json({ success: true, data });
    }

    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  } catch (err) {
    console.error("[OR request]", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Official receipt request failed",
    });
  }
}
