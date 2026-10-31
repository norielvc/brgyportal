/** Roles that may read tenant user directory (workflow previews, signatories). */
export const TENANT_STAFF_READ_ROLES = [
  "admin",
  "superadmin",
  "captain",
  "secretary",
  "treasurer",
  "clerk",
  "staff",
];

export async function requireTenantStaffRead(req, res, authenticateToken) {
  const user = await authenticateToken(req, res);
  if (!user) return null;
  if (!TENANT_STAFF_READ_ROLES.includes(user.role)) {
    res.status(403).json({ success: false, message: "Access denied" });
    return null;
  }
  return user;
}

export async function requireTenantAdmin(req, res, authenticateToken) {
  const user = await authenticateToken(req, res);
  if (!user) return null;
  if (!["admin", "superadmin", "captain"].includes(user.role)) {
    res.status(403).json({ success: false, message: "Admin access required" });
    return null;
  }
  return user;
}
