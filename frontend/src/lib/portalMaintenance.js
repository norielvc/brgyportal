/**
 * Simple maintenance overlay for public tenant portals.
 * Set NEXT_PUBLIC_PORTAL_MAINTENANCE_TENANTS=ibaoeste (default) or "off" to hide.
 */
export function isPortalMaintenanceOverlay(tenantId) {
  const tenant = String(tenantId || "").toLowerCase();
  if (!tenant) return false;

  const raw =
    process.env.NEXT_PUBLIC_PORTAL_MAINTENANCE_TENANTS ??
    process.env.PORTAL_MAINTENANCE_TENANTS ??
    "ibaoeste";

  const trimmed = String(raw).trim().toLowerCase();
  if (!trimmed || trimmed === "off" || trimmed === "false" || trimmed === "0") {
    return false;
  }

  const list = trimmed
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(tenant);
}

export function portalMaintenanceOverlayMessage() {
  return (
    process.env.NEXT_PUBLIC_PORTAL_MAINTENANCE_MESSAGE?.trim() ||
    process.env.PORTAL_MAINTENANCE_MESSAGE?.trim() ||
    "Ang portal ay pansamantalang sarado para sa maintenance. Bumalik po muli mamaya."
  );
}
