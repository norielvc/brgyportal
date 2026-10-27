/**
 * Lightweight in-memory login rate limit for Next.js /api/auth/login.
 * For multi-instance production, prefer Express login limiter or edge rules.
 */

const WINDOW_MS =
  parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000;
const MAX_ATTEMPTS =
  parseInt(process.env.RATE_LIMIT_LOGIN_MAX, 10) || 30;

/** @type {Map<string, { count: number, resetAt: number }>} */
const buckets = new Map();

function clientKey(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

/**
 * @returns {boolean} true if request is allowed
 */
export function allowLoginAttempt(req) {
  if (process.env.RATE_LIMIT_DISABLED === "true") {
    return true;
  }

  const key = clientKey(req);
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  return bucket.count <= MAX_ATTEMPTS;
}

export function loginRateLimitMessage() {
  return "Too many login attempts. Please try again later.";
}
