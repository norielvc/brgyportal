/** In-memory cooldown for full-tenant census exports (reduces accidental egress spikes). */

const FULL_EXPORT_COOLDOWN_MS = 5 * 60 * 1000;
const lastFullExportAt = new Map();

export function checkFullCensusExportAllowed(tenantId, actorKey) {
  const key = `${tenantId}:${actorKey || "anonymous"}`;
  const last = lastFullExportAt.get(key);
  if (!last) return { allowed: true };

  const elapsed = Date.now() - last;
  if (elapsed >= FULL_EXPORT_COOLDOWN_MS) {
    return { allowed: true };
  }

  return {
    allowed: false,
    retryAfterSec: Math.ceil((FULL_EXPORT_COOLDOWN_MS - elapsed) / 1000),
  };
}

export function recordFullCensusExport(tenantId, actorKey) {
  lastFullExportAt.set(`${tenantId}:${actorKey || "anonymous"}`, Date.now());
}

export const FULL_CENSUS_EXPORT_COOLDOWN_MS = FULL_EXPORT_COOLDOWN_MS;
