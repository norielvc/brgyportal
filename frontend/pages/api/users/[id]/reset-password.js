import bcrypt from "bcryptjs";
import { authenticateToken } from "../../../../src/lib/api-auth";
import { supabase } from "../../../../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "PUT")
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });

  const user = await authenticateToken(req, res);
  if (!user) return;
  if (!["admin", "superadmin", "captain"].includes(user.role)) {
    return res
      .status(403)
      .json({ success: false, message: "Admin access required" });
  }

  const { id } = req.query;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Password must be at least 6 characters",
      });
  }

  let query = supabase
    .from("users")
    .select("id, first_name, last_name")
    .eq("id", id);
  if (user.role !== "superadmin") query = query.eq("tenant_id", user.tenant_id);
  const { data: target, error: fetchError } = await query.single();
  if (fetchError || !target)
    return res.status(404).json({ success: false, message: "User not found" });

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  let updateQuery = supabase
    .from("users")
    .update({
      password_hash: hashedPassword,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (user.role !== "superadmin")
    updateQuery = updateQuery.eq("tenant_id", user.tenant_id);
  const { error } = await updateQuery;
  if (error)
    return res
      .status(400)
      .json({ success: false, message: "Failed to reset password" });

  return res
    .status(200)
    .json({
      success: true,
      message: `Password reset for ${target.first_name} ${target.last_name}`,
    });
}
