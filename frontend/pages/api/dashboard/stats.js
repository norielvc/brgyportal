import { authenticateToken } from "../../../src/lib/api-auth";
import { supabase } from "../../../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });

  const user = await authenticateToken(req, res);
  if (!user) return;
  if (!["admin", "superadmin", "captain"].includes(user.role))
    return res
      .status(403)
      .json({ success: false, message: "Admin access required" });

  const tenantId = user.tenant_id || req.headers["x-tenant-id"];
  if (!tenantId)
    return res
      .status(403)
      .json({ success: false, message: "Tenant context required" });

  const { data: allUsers, error } = await supabase
    .from("users")
    .select("*")
    .eq("tenant_id", tenantId);
  if (error)
    return res
      .status(400)
      .json({ success: false, message: "Failed to fetch users" });

  const users = allUsers || [];
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const currentMonthUsers = users.filter(
    (u) => new Date(u.created_at) >= currentMonthStart,
  ).length;
  const previousMonthUsers = users.filter((u) => {
    const d = new Date(u.created_at);
    return d >= previousMonthStart && d < currentMonthStart;
  }).length;
  const growthPercentage =
    previousMonthUsers > 0
      ? (
          ((currentMonthUsers - previousMonthUsers) / previousMonthUsers) *
          100
        ).toFixed(1)
      : 0;

  const recentUsers = users
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10)
    .map((u) => ({
      _id: u.id,
      firstName: u.first_name,
      lastName: u.last_name,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.created_at,
      lastLogin: u.last_login,
      loginCount: u.login_count,
    }));

  const userGrowth = [];
  for (let i = 11; i >= 0; i--) {
    const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    userGrowth.push({
      month: `${mStart.getFullYear()}-${String(mStart.getMonth() + 1).padStart(2, "0")}`,
      users: users.filter((u) => {
        const d = new Date(u.created_at);
        return d >= mStart && d < mEnd;
      }).length,
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      overview: {
        totalUsers: users.length,
        activeUsers: users.filter((u) => u.status === "active").length,
        inactiveUsers: users.filter((u) => u.status === "inactive").length,
        suspendedUsers: users.filter((u) => u.status === "suspended").length,
        adminUsers: users.filter((u) => u.role === "admin").length,
        regularUsers: users.filter((u) => u.role === "user").length,
        growthPercentage: parseFloat(growthPercentage),
        currentMonthUsers,
        previousMonthUsers,
      },
      charts: { userGrowth },
      recentActivity: { recentUsers },
    },
  });
}
