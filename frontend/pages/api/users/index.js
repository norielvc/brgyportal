import bcrypt from "bcryptjs";
import { authenticateToken } from "../../../src/lib/api-auth";
import { supabase } from "../../../lib/supabase";

const requireAdmin = async (req, res) => {
  const user = await authenticateToken(req, res);
  if (!user) return null;
  if (!["admin", "superadmin", "captain"].includes(user.role)) {
    res.status(403).json({ success: false, message: "Admin access required" });
    return null;
  }
  return user;
};

const transformUser = (user) => ({
  id: user.id,
  _id: user.id,
  firstName: user.first_name,
  lastName: user.last_name,
  email: user.email,
  role: user.role,
  status: user.status,
  position: user.position,
  avatar: user.avatar,
  lastLogin: user.last_login,
  loginCount: user.login_count,
  employeeCode: user.employee_code,
  tenantId: user.tenant_id,
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});

export default async function handler(req, res) {
  if (req.method === "GET") {
    const user = await requireAdmin(req, res);
    if (!user) return;

    const { search = "", role, status, tenant_id } = req.query;
    let query = supabase.from("users").select("*");

    if (user.role === "superadmin") {
      if (tenant_id) query = query.eq("tenant_id", tenant_id);
    } else {
      query = query.eq("tenant_id", user.tenant_id);
    }

    if (role) query = query.eq("role", role);
    if (status) query = query.eq("status", status);

    const { data: users, error } = await query;
    if (error)
      return res
        .status(400)
        .json({ success: false, message: "Failed to fetch users" });

    let result = users || [];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.first_name?.toLowerCase().includes(s) ||
          u.last_name?.toLowerCase().includes(s) ||
          u.email?.toLowerCase().includes(s),
      );
    }

    return res
      .status(200)
      .json({ success: true, data: result.map(transformUser) });
  }

  if (req.method === "POST") {
    const user = await requireAdmin(req, res);
    if (!user) return;

    const {
      firstName,
      lastName,
      email,
      password,
      role = "staff",
      status = "active",
      position = "",
      employeeCode = "",
      tenant_id,
    } = req.body;
    // Only superadmin can assign users to a different tenant
    const targetTenantId =
      user.role === "superadmin" && tenant_id ? tenant_id : user.tenant_id;
    if (!targetTenantId)
      return res
        .status(403)
        .json({ success: false, message: "Tenant context required" });

    if (!firstName || !lastName || !email || !password) {
      return res
        .status(400)
        .json({
          success: false,
          message: "firstName, lastName, email, and password are required",
        });
    }

    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();
    if (existing)
      return res
        .status(400)
        .json({
          success: false,
          message: "User with this email already exists",
        });

    const hashedPassword = await bcrypt.hash(password, 12);
    const { data: newUser, error } = await supabase
      .from("users")
      .insert([
        {
          tenant_id: targetTenantId,
          email,
          first_name: firstName,
          last_name: lastName,
          password_hash: hashedPassword,
          role,
          status,
          position,
          employee_code: employeeCode,
        },
      ])
      .select()
      .single();

    if (error)
      return res
        .status(400)
        .json({
          success: false,
          message: "Failed to create user",
          error: error.message,
        });

    return res
      .status(201)
      .json({
        success: true,
        message: "User created successfully",
        data: transformUser(newUser),
      });
  }

  return res
    .status(405)
    .json({ success: false, message: "Method not allowed" });
}
