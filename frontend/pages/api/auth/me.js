import { authenticateToken } from "../../../src/lib/api-auth";
import { supabase } from "../../../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  const userRes = await authenticateToken(req, res);
  if (!userRes) return; // Auth handled response

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userRes._id)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userResponse = {
      _id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      tenant_id: user.tenant_id,
      lastLogin: user.last_login,
      loginCount: user.login_count,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };

    res.status(200).json({
      success: true,
      data: {
        user: userResponse,
      },
    });
  } catch (err) {
    console.error("API /me error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}
