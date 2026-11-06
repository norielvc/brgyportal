import { authenticateToken } from "../../src/lib/api-auth";

let cachedQuota = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 30000; // 30s cache to stay well within Resend API limits

function fallbackPayload(extra = {}) {
  return {
    dailyUsed: 0,
    dailyLimit: null,
    monthlyUsed: 0,
    monthlyLimit: null,
    remainingToday: null,
    dailyResetsAt: null,
    monthlyResetsAt: null,
    ...extra,
  };
}

function parseResendUsage(usage) {
  const daily = usage?.emails?.daily || {};
  const monthly = usage?.emails?.monthly || {};

  const dailyUsed = Number(daily.used) || 0;
  const dailyLimit =
    daily.limit === null || daily.limit === undefined
      ? null
      : Number(daily.limit);
  const monthlyUsed = Number(monthly.used) || 0;
  const monthlyLimit =
    monthly.limit === null || monthly.limit === undefined
      ? null
      : Number(monthly.limit);

  const remainingToday =
    dailyLimit != null ? Math.max(0, dailyLimit - dailyUsed) : null;

  return {
    dailyUsed,
    dailyLimit,
    monthlyUsed,
    monthlyLimit,
    remainingToday,
    dailyResetsAt: daily.resets_at || null,
    monthlyResetsAt: monthly.resets_at || null,
    dailySent:
      daily.sent === null || daily.sent === undefined
        ? null
        : Number(daily.sent),
    dailyReceived:
      daily.received === null || daily.received === undefined
        ? null
        : Number(daily.received),
  };
}

async function fetchResendUsage(apiKey) {
  const response = await fetch("https://api.resend.com/usage", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const err = new Error(
      `Resend usage API ${response.status}${text ? `: ${text.slice(0, 200)}` : ""}`,
    );
    err.status = response.status;
    throw err;
  }

  return response.json();
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  const user = await authenticateToken(req, res);
  if (!user) return;

  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  if (!apiKey) {
    return res.status(200).json({
      success: true,
      configured: false,
      ...fallbackPayload(),
    });
  }

  const now = Date.now();
  const force = req.query.force === "true";

  if (!force && cachedQuota && now - lastFetchTime < CACHE_TTL_MS) {
    return res.status(200).json({
      success: true,
      configured: true,
      ...cachedQuota,
      cached: true,
    });
  }

  try {
    const usageJson = await fetchResendUsage(apiKey);
    const parsed = parseResendUsage(usageJson);

    cachedQuota = {
      ...parsed,
      updatedAt: new Date().toISOString(),
    };
    lastFetchTime = now;

    return res.status(200).json({
      success: true,
      configured: true,
      ...cachedQuota,
      cached: false,
    });
  } catch (error) {
    console.error("[email-quota] Error:", error.message);
    if (cachedQuota) {
      return res.status(200).json({
        success: true,
        configured: true,
        ...cachedQuota,
        stale: true,
      });
    }
    return res.status(200).json({
      success: true,
      configured: true,
      ...fallbackPayload(),
      error: error.message,
    });
  }
}
