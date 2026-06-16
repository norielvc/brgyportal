import { authenticateToken } from "../../../src/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * GET /api/notifications - Get user's notifications
 * POST /api/notifications - Create a notification
 */
export default async function handler(req, res) {
  const user = await authenticateToken(req, res);
  if (!user) return;

  const tenantId = user.tenant_id;
  const userId = user._id;
  const supabase = getSupabase();

  if (req.method === "GET") {
    try {
      const { limit = 50, unreadOnly = false } = req.query;

      let query = supabase
        .from("notifications")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(parseInt(limit));

      if (unreadOnly === "true") {
        query = query.eq("read", false);
      }

      const { data, error } = await query;

      if (error) throw error;

      return res.json({
        success: true,
        data: data || [],
        unreadCount: data?.filter((n) => !n.read).length || 0,
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch notifications",
      });
    }
  }

  if (req.method === "POST") {
    try {
      const { title, message, type, category, referenceNumber, requestId, link, targetUserId } =
        req.body;

      if (!title || !message || !type || !category) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      const notificationData = {
        tenant_id: tenantId,
        user_id: targetUserId || userId,
        title,
        message,
        type,
        category,
        reference_number: referenceNumber || null,
        request_id: requestId || null,
        link: link || null,
        read: false,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("notifications")
        .insert([notificationData])
        .select()
        .single();

      if (error) throw error;

      return res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Error creating notification:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create notification",
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: "Method not allowed",
  });
}
