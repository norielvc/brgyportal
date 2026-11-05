import { authenticateToken } from "../../../src/lib/api-auth";
import { supabase } from "../../../lib/supabase";

const ESUMBONG_OPEN = ["pending", "under_review"];
const ASSISTANCE_OPEN = ["pending", "in_progress"];

function getManilaDayBounds(reference = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(reference);
  const y = parts.find((p) => p.type === "year").value;
  const m = parts.find((p) => p.type === "month").value;
  const d = parts.find((p) => p.type === "day").value;
  const start = new Date(`${y}-${m}-${d}T00:00:00+08:00`);
  const end = new Date(start.getTime() + 86400000);
  return { start, end };
}

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });

  try {
    const user = await authenticateToken(req, res);
    if (!user) return;

    const tenantId = user.tenant_id || req.headers["x-tenant-id"];
    
    console.log("📊 Dashboard API called for tenant:", tenantId);
    
    if (!tenantId)
      return res
        .status(403)
        .json({ success: false, message: "Tenant context required" });

  // Get filter params
  const { dateFrom, dateTo, certificateType, status: statusFilter } = req.query;

  // Build query with tenant isolation
  let query = supabase
    .from("certificate_requests")
    .select(
      "id, certificate_type, status, created_at, updated_at, full_name, reference_number",
    )
    .eq("tenant_id", tenantId);

  // Apply filters
  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lte("created_at", dateTo);
  if (certificateType) query = query.eq("certificate_type", certificateType);
  if (statusFilter) query = query.eq("status", statusFilter);

  const { data: requests, error } = await query;
  if (error) {
    console.error("❌ Database error fetching requests:", error);
    return res
      .status(400)
      .json({
        success: false,
        message: "Failed to fetch certificate requests",
        error: error.message,
        details: error,
        tenantId: tenantId,
      });
  }

  // Fetch residents count (tenant-isolated)
  const { count: residentsCount } = await supabase
    .from("residents")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  // Fetch active users count (tenant-isolated)
  const { count: usersCount } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  const all = requests || [];
  const requestIds = all.map((r) => r.id).filter(Boolean);

  let assignmentList = [];
  if (requestIds.length > 0) {
    const { data: scopedAssignments } = await supabase
      .from("workflow_assignments")
      .select(
        "id, request_id, step_name, status, created_at, updated_at, assigned_user_id",
      )
      .eq("tenant_id", tenantId)
      .in("request_id", requestIds);
    assignmentList = scopedAssignments || [];
  }

  let history = [];
  if (requestIds.length > 0) {
    const { data: scopedHistory } = await supabase
      .from("workflow_history")
      .select("request_id, action, comments, new_status")
      .eq("tenant_id", tenantId)
      .eq("action", "reject")
      .in("request_id", requestIds);
    history = scopedHistory || [];
  }

  // Map each request to its current pending workflow step
  const requestToStepMap = {};
  assignmentList.forEach((a) => {
    if (a.status === "pending") {
      requestToStepMap[a.request_id] = a.step_name;
    }
  });

  const now = new Date();
  const manilaToday = getManilaDayBounds(now);
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

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
      const step = requestToStepMap[r.id] || "Pending Review";
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

  // Calculate returned count
  const returned = all.filter((r) => r.status === "returned").length;

  // Calculate workflow performance metrics
  const assignmentMetrics = assignments || [];
  const avgAssignmentTime =
    assignmentMetrics.filter((a) => a.status === "approved" && a.updated_at)
      .length > 0
      ? (
          assignmentMetrics
            .filter((a) => a.status === "approved" && a.updated_at)
            .reduce(
              (sum, a) =>
                sum +
                (new Date(a.updated_at) - new Date(a.created_at)) / 3600000,
              0,
            ) /
          assignmentMetrics.filter((a) => a.status === "approved" && a.updated_at)
            .length
        ).toFixed(1)
      : 0;

  // Calculate daily trend for the last 7 days
  const dailyTrend = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now);
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    dailyTrend.push({
      date: dayStart.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
      }),
      count: all.filter((r) => {
        const d = new Date(r.created_at);
        return d >= dayStart && d < dayEnd;
      }).length,
      approved: all.filter((r) => {
        const d = new Date(r.created_at);
        return d >= dayStart && d < dayEnd && ["approved", "released"].includes(r.status);
      }).length,
    });
  }

  // Calculate completion rate
  const completionRate =
    all.length > 0
      ? (
          (all.filter((r) => ["approved", "released"].includes(r.status))
            .length /
            all.length) *
          100
        ).toFixed(1)
      : 0;

  // Calculate rejection rate
  const rejectionRate =
    all.length > 0
      ? ((all.filter((r) => r.status === "rejected").length / all.length) * 100).toFixed(1)
      : 0;

  // Calculate return rate
  const returnRate =
    all.length > 0
      ? ((returned / all.length) * 100).toFixed(1)
      : 0;

  // Find overdue requests (pending > 7 days)
  const overdueRequests = all.filter((r) => {
    if (["approved", "released", "rejected", "cancelled"].includes(r.status)) return false;
    const daysSince = (now - new Date(r.created_at)) / 86400000;
    return daysSince > 7;
  });

  // Staff productivity (top 5)
  const staffPerformance = {};
  assignmentMetrics
    .filter((a) => a.status === "approved" && a.assigned_user_id)
    .forEach((a) => {
      const userId = a.assigned_user_id;
      if (!staffPerformance[userId]) {
        staffPerformance[userId] = { count: 0, totalTime: 0 };
      }
      staffPerformance[userId].count++;
      if (a.updated_at) {
        staffPerformance[userId].totalTime +=
          (new Date(a.updated_at) - new Date(a.created_at)) / 3600000;
      }
    });

  const topStaff = Object.entries(staffPerformance)
    .map(([userId, data]) => ({
      userId,
      completed: data.count,
      avgHours: data.count > 0 ? (data.totalTime / data.count).toFixed(1) : 0,
    }))
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 5);

  // Rejection reasons
  const rejectionReasons = {};
  (history || []).forEach((h) => {
    const reason = h.comments || "No reason provided";
    rejectionReasons[reason] = (rejectionReasons[reason] || 0) + 1;
  });

  // Peak hours analysis (group by hour of day)
  const hourlyDistribution = Array(24).fill(0);
  all.forEach((r) => {
    const hour = new Date(r.created_at).getHours();
    hourlyDistribution[hour]++;
  });

  // Yesterday comparison
  const yesterdayStart = new Date(now);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  yesterdayStart.setHours(0, 0, 0, 0);
  const yesterdayEnd = new Date(yesterdayStart);
  yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);
  
  const yesterdayCount = all.filter((r) => {
    const d = new Date(r.created_at);
    return d >= yesterdayStart && d < yesterdayEnd;
  }).length;

  const { data: todayRowsRaw } = await supabase
    .from("certificate_requests")
    .select(
      "id, certificate_type, status, created_at, full_name, reference_number",
    )
    .eq("tenant_id", tenantId)
    .gte("created_at", manilaToday.start.toISOString())
    .lt("created_at", manilaToday.end.toISOString())
    .order("created_at", { ascending: false });

  const todayNewRequests = (todayRowsRaw || []).map((r) => ({
    id: r.id,
    referenceNumber: r.reference_number,
    applicantName: r.full_name,
    certificateType: r.certificate_type,
    status: r.status,
    currentStep: requestToStepMap[r.id] || "Pending Review",
    createdAt: r.created_at,
  }));

  const readyForPickup = all.filter((r) =>
    ["ready", "ready_for_pickup"].includes(r.status),
  ).length;
  const approvedOnly = all.filter((r) => r.status === "approved").length;

  let peakHour = 0;
  let peakHourCount = 0;
  hourlyDistribution.forEach((count, hour) => {
    if (count > peakHourCount) {
      peakHourCount = count;
      peakHour = hour;
    }
  });

  if (topStaff.length > 0) {
    const staffIds = topStaff.map((s) => s.userId);
    const { data: staffRows } = await supabase
      .from("users")
      .select("id, first_name, last_name")
      .eq("tenant_id", tenantId)
      .in("id", staffIds);
    const nameById = Object.fromEntries(
      (staffRows || []).map((u) => [
        String(u.id),
        `${u.first_name || ""} ${u.last_name || ""}`.trim(),
      ]),
    );
    topStaff.forEach((s) => {
      s.displayName = nameById[s.userId] || "Staff member";
    });
  }

  const [esumbongRes, assistanceRes, kapchatRes] = await Promise.all([
    supabase
      .from("blotter_reports")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .in("status", ESUMBONG_OPEN),
    supabase
      .from("assistance_inquiries")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .in("status", ASSISTANCE_OPEN),
    supabase
      .from("kapchat_messages")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("is_admin", false)
      .eq("status", "unread"),
  ]);

  const helpDeskEsumbong = esumbongRes.error ? 0 : esumbongRes.count ?? 0;
  const helpDeskAssistance = assistanceRes.error ? 0 : assistanceRes.count ?? 0;
  const helpDeskKapchat = kapchatRes.error ? 0 : kapchatRes.count ?? 0;

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
        returned,
        thisMonth,
        lastMonth,
        monthGrowth:
          lastMonth > 0
            ? parseFloat(
                (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1),
              )
            : 0,
        todayCount: todayNewRequests.length,
        yesterdayCount,
        avgProcessingDays: parseFloat(avgProcessingDays),
        avgAssignmentHours: parseFloat(avgAssignmentTime),
        completionRate: parseFloat(completionRate),
        rejectionRate: parseFloat(rejectionRate),
        returnRate: parseFloat(returnRate),
        residentsCount: residentsCount || 0,
        usersCount: usersCount || 0,
        overdueCount: overdueRequests.length,
        readyForPickup,
        approvedOnly,
        peakHour,
        peakHourCount,
      },
      helpDesk: {
        esumbong: helpDeskEsumbong,
        assistance: helpDeskAssistance,
        kapchat: helpDeskKapchat,
        total: helpDeskEsumbong + helpDeskAssistance + helpDeskKapchat,
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
      dailyTrend,
      todayNewRequests,
      topStaff,
      rejectionReasons: Object.entries(rejectionReasons)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([reason, count]) => ({ reason, count })),
      hourlyDistribution,
      overdueRequests: overdueRequests.slice(0, 10).map((r) => ({
        id: r.id,
        referenceNumber: r.reference_number,
        applicantName: r.full_name,
        certificateType: r.certificate_type,
        status: r.status,
        currentStep: requestToStepMap[r.id] || "Pending Review",
        createdAt: r.created_at,
        daysOverdue: Math.floor((now - new Date(r.created_at)) / 86400000),
      })),
      recent: all
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10)
        .map((r) => ({
          id: r.id,
          referenceNumber: r.reference_number,
          applicantName: r.full_name,
          certificateType: r.certificate_type,
          status: r.status,
          currentStep: requestToStepMap[r.id] || "Pending Review",
          createdAt: r.created_at,
        })),
    },
  });
  } catch (error) {
    console.error("❌ Dashboard API Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
