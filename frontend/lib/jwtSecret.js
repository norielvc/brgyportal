/**
 * Resolve JWT secret for Next.js API routes.
 * Production requires JWT_SECRET; development allows a local fallback only.
 */
export function getJwtSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  if (process.env.NODE_ENV === "development") {
    return "brgydesk-secret-key-change-in-production";
  }
  return null;
}
