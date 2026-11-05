/** Build URL for GET /api/certificates/:id (list rows use loadFullRequestIfNeeded without view=pdf). */
export function certificateDetailUrl(apiBase, id, { view } = {}) {
  if (!apiBase || !id) return "";
  const base = `${apiBase.replace(/\/$/, "")}/certificates/${encodeURIComponent(id)}`;
  if (view === "pdf") return `${base}?view=pdf`;
  if (view === "full") return `${base}?view=full`;
  return base;
}

export function workflowHistoryUrl(apiBase, requestId, { view } = {}) {
  if (!apiBase || !requestId) return "";
  const base = `${apiBase.replace(/\/$/, "")}/workflow-assignments/history/${encodeURIComponent(requestId)}`;
  if (view === "pdf") return `${base}?view=pdf`;
  return base;
}

/** First Time Job Seeker preview tabs (matches CertificatePreviewModal). */
export const FTJS_PREVIEW_TABS = {
  CLEARANCE: "FIRST TIME JOB SEEKER",
  A: "JOB SEEKER A",
  B: "JOB SEEKER B",
};

export function ftjsQueryToPreviewTab(ftjs) {
  const v = String(ftjs || "")
    .toLowerCase()
    .replace(/-/g, "_")
    .trim();
  if (v === "a" || v === "job_seeker_a" || v === "seeker_a") {
    return FTJS_PREVIEW_TABS.A;
  }
  if (v === "b" || v === "job_seeker_b" || v === "seeker_b") {
    return FTJS_PREVIEW_TABS.B;
  }
  return FTJS_PREVIEW_TABS.CLEARANCE;
}

export function previewTabToFtjsQuery(tab) {
  if (tab === FTJS_PREVIEW_TABS.A) return "a";
  if (tab === FTJS_PREVIEW_TABS.B) return "b";
  return "clearance";
}

export function buildDirectCertificatePdfUrl(certificateId, { ftjs } = {}) {
  if (!certificateId) return "/requests";
  const params = new URLSearchParams({
    id: String(certificateId),
    pdf: "1",
    directPdf: "1",
  });
  if (ftjs) params.set("ftjs", previewTabToFtjsQuery(ftjsQueryToPreviewTab(ftjs)));
  return `/requests?${params.toString()}`;
}
