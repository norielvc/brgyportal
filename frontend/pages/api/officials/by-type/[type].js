import { supabase } from "../../../../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const tenantId = req.headers["x-tenant-id"] || "ibaoeste";
    const { type } = req.query;

    const { data: officials, error } = await supabase
      .from("barangay_officials")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("position_type", type)
      .eq("is_active", true)
      .order("order_index", { ascending: true });

    if (error) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Failed to fetch officials",
          error: error.message,
        });
    }

    return res
      .status(200)
      .json({
        success: true,
        data: officials || [],
        count: officials?.length || 0,
      });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
  }
}
