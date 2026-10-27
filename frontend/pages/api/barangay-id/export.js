import { authenticateToken } from "../../../src/lib/api-auth";
import { supabase } from "../../../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const userRes = await authenticateToken(req, res);
  if (!userRes) return;

  const tenantId = userRes.tenant_id;
  if (!tenantId) {
    return res.status(403).json({ success: false, message: "No tenant context in token" });
  }

  try {
    const { search = "", status = "", printed_status = "", purok = "" } = req.query;

    const buildQuery = () => {
      let query = supabase
        .from("barangay_ids")
        .select("id, id_number, full_name, first_name, last_name, middle_name, suffix, address, purok, status, is_printed, issue_date, expiry_date, created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        if (status === "household") {
          query = query.not("id_number", "like", "%M-%");
        } else if (status === "family") {
          query = query.like("id_number", "%M-%");
        } else {
          query = query.eq("status", status);
        }
      }

      if (search && search.trim()) {
        const term = search.trim();
        query = query.or(`full_name.ilike.%${term}%,id_number.ilike.%${term}%,purok.ilike.%${term}%`);
      }

      if (printed_status) {
        if (printed_status === "printed") {
          query = query.eq("is_printed", true);
        } else if (printed_status === "not_printed") {
          query = query.or("is_printed.eq.false,is_printed.is.null");
        }
      }

      if (purok && purok !== "All Puroks") {
        query = query.or(`purok.ilike.%${purok}%,address.ilike.%${purok}%`);
      }

      return query;
    };

    // Fetch all records in batches of 1000 to overcome Supabase 1000 row max limit
    const batchSize = 1000;
    let from = 0;
    let allRecords = [];
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await buildQuery().range(from, from + batchSize - 1);
      if (error) throw error;

      if (data && data.length > 0) {
        allRecords.push(...data);
        if (data.length < batchSize) {
          hasMore = false;
        } else {
          from += batchSize;
        }
      } else {
        hasMore = false;
      }
    }

    return res.status(200).json({
      success: true,
      data: allRecords,
      total: allRecords.length,
    });
  } catch (error) {
    console.error("GET /api/barangay-id/export error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
