/** Build URL for GET /api/certificates/:id (list rows use loadFullRequestIfNeeded without view=pdf). */
export function certificateDetailUrl(apiBase, id, { view, includeHistory } = {}) {
  if (!apiBase || !id) return "";
  const base = `${apiBase.replace(/\/$/, "")}/certificates/${encodeURIComponent(id)}`;
  const params = new URLSearchParams();
  if (view === "pdf") params.set("view", "pdf");
  else if (view === "full") params.set("view", "full");
  if (includeHistory) params.set("includeHistory", "1");
  const q = params.toString();
  return q ? `${base}?${q}` : base;
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

/** Business permit preview tabs: `permit` (clearance) | `inspection`. */
export function businessPermitQueryToPreviewTab(bp) {
  const v = String(bp || "")
    .toLowerCase()
    .replace(/-/g, "_")
    .trim();
  if (
    v === "inspection" ||
    v === "physical" ||
    v === "physical_inspection" ||
    v === "inspection_form"
  ) {
    return "inspection";
  }
  return "permit";
}

export function previewTabToBusinessPermitQuery(tab) {
  return tab === "inspection" ? "inspection" : "permit";
}

/** Opens certificate HTML preview (same as Requests → Preview); Download/Print still build PDF on demand. */
export function buildDirectCertificatePdfUrl(certificateId, { ftjs, bp } = {}) {
  if (!certificateId) return "/requests";
  const params = new URLSearchParams({
    id: String(certificateId),
    pdf: "1",
  });
  if (ftjs) params.set("ftjs", previewTabToFtjsQuery(ftjsQueryToPreviewTab(ftjs)));
  if (bp) {
    params.set(
      "bp",
      previewTabToBusinessPermitQuery(businessPermitQueryToPreviewTab(bp)),
    );
  }
  return `/requests?${params.toString()}`;
}
