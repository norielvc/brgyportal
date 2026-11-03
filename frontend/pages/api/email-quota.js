import { authenticateToken } from "../../src/lib/api-auth";

let cachedQuota = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 30000; // 30s cache to stay well within Resend API limits

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
      dailyUsed: 0,
      dailyLimit: 100,
      monthlyUsed: 0,
      monthlyLimit: 3000,
      remainingToday: 100,
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
    const response = await fetch("https://api.resend.com/emails", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
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
        dailyUsed: 0,
        dailyLimit: 100,
        monthlyUsed: 0,
        monthlyLimit: 3000,
        remainingToday: 100,
      });
    }

    const json = await response.json();
    const emails = Array.isArray(json.data) ? json.data : [];

    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    ).getTime();

    const dailyUsed = emails.filter((e) => {
      const time = new Date(e.created_at).getTime();
      return time >= oneDayAgo;
    }).length;

    const monthlyUsed = emails.filter((e) => {
      const time = new Date(e.created_at).getTime();
      return time >= startOfMonth;
    }).length;

    const dailyLimit = 100;
    const monthlyLimit = 3000;
    const remainingToday = Math.max(0, dailyLimit - dailyUsed);

    cachedQuota = {
      dailyUsed,
      dailyLimit,
      monthlyUsed,
      monthlyLimit,
      remainingToday,
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
      dailyUsed: 0,
      dailyLimit: 100,
      monthlyUsed: 0,
      monthlyLimit: 3000,
      remainingToday: 100,
      error: error.message,
    });
  }
}

