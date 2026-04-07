import { authenticateToken } from "../../../src/lib/api-auth";
import { supabase } from "../../../lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });

  const user = await authenticateToken(req, res);
  if (!user) return;

  const tenantId = user.tenant_id || req.headers["x-tenant-id"];
  if (!tenantId)
    return res
      .status(403)
      .json({ success: false, message: "Tenant context required" });

  const { data: requests, error } = await supabase
    .from("certificate_requests")
    .select(
      "id, certificate_type, status, created_at, updated_at, full_name, reference_number, current_step",
    )
    .eq("tenant_id", tenantId);
  if (error)
    return res
      .status(400)
      .json({
        success: false,
        message: "Failed to fetch certificate requests",
      });

  const all = requests || [];
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const thisMonth = all.filter(
    (r) => new Date(r.created_at) >= currentMonthStart,
  ).length;
  const lastMonth = all.filter((r) => {
    const d = new Date(r.created_at);
    return d >= lastMonthStart && d < currentMonthStart;
  }).length;

  const typeMap = {},
    statusMap = {},
    stepMap = {};
  all.forEach((r) => {
    const t = r.certificate_type || "unknown";
    typeMap[t] = (typeMap[t] || 0) + 1;
    const s = r.status || "pending";
    statusMap[s] = (statusMap[s] || 0) + 1;
    if (!["approved", "released", "rejected", "cancelled"].includes(r.status)) {
      const step = r.current_step || "Unassigned";
      stepMap[step] = (stepMap[step] || 0) + 1;
    }
  });

  const monthlyTrend = [];
  for (let i = 11; i >= 0; i--) {
    const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    monthlyTrend.push({
      month: `${mStart.toLocaleString("default", { month: "short" })} ${mStart.getFullYear()}`,
      total: all.filter((r) => {
        const d = new Date(r.created_at);
        return d >= mStart && d < mEnd;
      }).length,
      approved: all.filter((r) => {
        const d = new Date(r.created_at);
        return (
          d >= mStart && d < mEnd && ["approved", "released"].includes(r.status)
        );
      }).length,
    });
  }

  const processed = all.filter(
    (r) =>
      ["approved", "released"].includes(r.status) &&
      r.created_at &&
      r.updated_at,
  );
  const avgProcessingDays =
    processed.length > 0
      ? (
          processed.reduce(
            (sum, r) =>
              sum +
              (new Date(r.updated_at) - new Date(r.created_at)) / 86400000,
            0,
          ) / processed.length
        ).toFixed(1)
      : 0;

  return res.status(200).json({
    success: true,
    data: {
      overview: {
        totalRequests: all.length,
        pending: all.filter(
          (r) =>
            !["approved", "released", "rejected", "cancelled"].includes(
              r.status,
            ),
        ).length,
        approved: all.filter((r) => ["approved", "released"].includes(r.status))
          .length,
        rejected: all.filter((r) => r.status === "rejected").length,
        cancelled: all.filter((r) => r.status === "cancelled").length,
        released: all.filter((r) => r.status === "released").length,
        thisMonth,
        lastMonth,
        monthGrowth:
          lastMonth > 0
            ? parseFloat(
                (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1),
              )
            : 0,
        todayCount: all.filter((r) => new Date(r.created_at) >= todayStart)
          .length,
        avgProcessingDays: parseFloat(avgProcessingDays),
      },
      byType: Object.entries(typeMap)
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => ({ type, count })),
      byStatus: Object.entries(statusMap).map(([status, count]) => ({
        status,
        count,
      })),
      byStep: Object.entries(stepMap)
        .sort((a, b) => b[1] - a[1])
        .map(([step, count]) => ({ step, count })),
      monthlyTrend,
      recent: all
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10)
        .map((r) => ({
          id: r.id,
          referenceNumber: r.reference_number,
          applicantName: r.full_name,
          certificateType: r.certificate_type,
          status: r.status,
          currentStep: r.current_step,
          createdAt: r.created_at,
        })),
    },
  });
}
