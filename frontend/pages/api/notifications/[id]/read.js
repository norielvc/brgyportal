import { authenticateToken } from "../../../../src/lib/api-auth";
import { supabase } from "../../../../lib/supabase";

/**
 * PUT /api/notifications/[id]/read - Mark notification as read
 * PUT /api/notifications/all/read - Mark all notifications as read
 */
export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  const user = await authenticateToken(req, res);
  if (!user) return;

  const { id } = req.query;
  const tenantId = user.tenant_id;
  const userId = user._id;

  try {
    if (id === "all") {
      // Mark all notifications as read
      const { error } = await supabase
        .from("notifications")
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq("tenant_id", tenantId)
        .eq("user_id", userId)
        .eq("read", false);

      if (error) throw error;

      return res.json({
        success: true,
        message: "All notifications marked as read",
      });
    } else {
      // Mark single notification as read
      const { data, error } = await supabase
        .from("notifications")
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("tenant_id", tenantId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;

      return res.json({
        success: true,
        data,
      });
    }
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
    });
  }
}
