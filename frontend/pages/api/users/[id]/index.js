import bcrypt from "bcryptjs";
import { authenticateToken } from "../../../../src/lib/api-auth";
import { supabase } from "../../../../lib/supabase";

const requireAdmin = async (req, res) => {
  const user = await authenticateToken(req, res);
  if (!user) return null;
  if (!["admin", "superadmin", "captain"].includes(user.role)) {
    res.status(403).json({ success: false, message: "Admin access required" });
    return null;
  }
  return user;
};

const transformUser = (u) => ({
  id: u.id,
  _id: u.id,
  firstName: u.first_name,
  lastName: u.last_name,
  email: u.email,
  role: u.role,
  status: u.status,
  position: u.position,
  avatar: u.avatar,
  lastLogin: u.last_login,
  loginCount: u.login_count,
  employeeCode: u.employee_code,
  tenantId: u.tenant_id,
  createdAt: u.created_at,
  updatedAt: u.updated_at,
});

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "GET") {
    const user = await requireAdmin(req, res);
    if (!user) return;
    let query = supabase.from("users").select("*").eq("id", id);
    if (user.role !== "superadmin")
      query = query.eq("tenant_id", user.tenant_id);
    const { data, error } = await query.single();
    if (error || !data)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    return res.status(200).json({ success: true, data: transformUser(data) });
  }

  if (req.method === "PUT") {
    const user = await requireAdmin(req, res);
    if (!user) return;
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      status,
      position,
      employeeCode,
    } = req.body;

    let query = supabase.from("users").select("*").eq("id", id);
    if (user.role !== "superadmin")
      query = query.eq("tenant_id", user.tenant_id);
    const { data: existing, error: fetchError } = await query.single();
    if (fetchError || !existing)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (email && email !== existing.email) {
      const { data: taken } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();
      if (taken)
        return res
          .status(400)
          .json({ success: false, message: "Email already in use" });
    }

    const updateData = { updated_at: new Date().toISOString() };
    if (firstName) updateData.first_name = firstName;
    if (lastName) updateData.last_name = lastName;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    if (position !== undefined) updateData.position = position;
    if (employeeCode !== undefined) updateData.employee_code = employeeCode;
    if (password) updateData.password_hash = await bcrypt.hash(password, 12);

    let updateQuery = supabase.from("users").update(updateData).eq("id", id);
    if (user.role !== "superadmin")
      updateQuery = updateQuery.eq("tenant_id", user.tenant_id);
    const { data: updated, error: updateError } = await updateQuery
      .select()
      .single();
    if (updateError)
      return res
        .status(400)
        .json({ success: false, message: "Failed to update user" });
    return res
      .status(200)
      .json({
        success: true,
        message: "User updated",
        data: transformUser(updated),
      });
  }

  if (req.method === "DELETE") {
    const user = await requireAdmin(req, res);
    if (!user) return;
    if (id === user._id)
      return res
        .status(400)
        .json({ success: false, message: "Cannot delete your own account" });

    let query = supabase.from("users").select("id").eq("id", id);
    if (user.role !== "superadmin")
      query = query.eq("tenant_id", user.tenant_id);
    const { data: target, error: fetchError } = await query.single();
    if (fetchError || !target)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    let deleteQuery = supabase.from("users").delete().eq("id", id);
    if (user.role !== "superadmin")
      deleteQuery = deleteQuery.eq("tenant_id", user.tenant_id);
    const { error } = await deleteQuery;
    if (error)
      return res
        .status(400)
        .json({ success: false, message: "Failed to delete user" });
    return res.status(200).json({ success: true, message: "User deleted" });
  }

  return res
    .status(405)
    .json({ success: false, message: "Method not allowed" });
}
