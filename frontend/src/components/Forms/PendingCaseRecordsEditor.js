import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  Link2,
  ChevronDown,
  Search,
  X,
  UserCheck,
  Check,
} from "lucide-react";
import { blotterAPI } from "@/lib/api";
import {
  parseCaseRecordHistory,
  serializeCaseRecordHistory,
  emptyPendingCase,
  CASE_STATUSES,
} from "@/lib/caseRecordHistory";

function mapBlotterStatusToCaseStatus(status) {
  const s = String(status || "").trim().toLowerCase();
  if (s === "resolved") return "RESOLVED";
  if (s === "dismissed") return "DISMISSED";
  if (s === "under_review" || s === "ongoing") return "ONGOING";
  return "PENDING";
}

function buildBlotterCaseDescription(report) {
  const purpose = String(report?.purpose || "").trim().toUpperCase();
  const complainant = String(report?.complainant_name || "").trim().toUpperCase();
  const respondent = String(report?.respondent_name || "").trim().toUpperCase();
  const parties =
    complainant && respondent
      ? `${complainant} VS. ${respondent}`
      : complainant || respondent || "";
  if (purpose && parties) return `${purpose} (${parties})`;
  if (purpose) return purpose;
  const details = String(report?.details || report?.incident_details || "")
    .trim()
    .toUpperCase();
  if (details) return details.length > 140 ? `${details.slice(0, 140)}...` : details;
  return parties;
}

function extractResidentSearchTerm(residentName) {
  const cleaned = String(residentName || "")
    .replace(/[,._-]/g, " ")
    .trim()
    .toUpperCase();
  if (!cleaned) return "";
  const parts = cleaned.split(/\s+/).filter((w) => w.length >= 2);
  return parts[0] || "";
}

function getResidentRoleInBlotter(report, residentName) {
  const tokens = String(residentName || "")
    .replace(/[,._-]/g, " ")
    .toUpperCase()
    .split(/\s+/)
    .filter((w) => w.length >= 3);
  if (tokens.length === 0) return null;
  const resp = String(report?.respondent_name || "").toUpperCase();
  const comp = String(report?.complainant_name || "").toUpperCase();
  const respHits = tokens.filter((t) => resp.includes(t)).length;
  const compHits = tokens.filter((t) => comp.includes(t)).length;
  const minHits = Math.min(2, tokens.length);
  if (respHits >= minHits) return "RESPONDENT";
  if (compHits >= minHits) return "COMPLAINANT";
  return null;
}

export default function PendingCaseRecordsEditor({
  value,
  onChange,
  disabled = false,
  variant = "default",
  residentName = "",
}) {
  const cases = parseCaseRecordHistory(value);
  const [openIndex, setOpenIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "active" | "resident"
  const [blotterOptions, setBlotterOptions] = useState([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [loadingBlotters, setLoadingBlotters] = useState(false);
  const [knownBlottersByUb, setKnownBlottersByUb] = useState({});
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const residentPrimaryToken = useMemo(
    () => extractResidentSearchTerm(residentName),
    [residentName],
  );

  // Resolve metadata for any already-linked UB number so the linked badge & summary card show up
  useEffect(() => {
    if (disabled) return;
    const missingUbs = cases
      .map((c) => String(c.caseNo || "").trim().toUpperCase())
      .filter((ub) => ub && /^UB-\d{4}-/i.test(ub) && !knownBlottersByUb[ub]);
    if (missingUbs.length === 0) return;

    let active = true;
    Promise.all(
      missingUbs.slice(0, 5).map((ub) =>
        blotterAPI
          .getReports({ lookup: "usaping", exact_ub: ub, limit: 1 })
          .then((res) => res?.reports?.[0] || null)
          .catch(() => null),
      ),
    ).then((found) => {
      if (!active) return;
      const patch = {};
      for (const r of found) {
        if (r?.usaping_barangay_number) {
          patch[String(r.usaping_barangay_number).trim().toUpperCase()] = r;
        }
      }
      if (Object.keys(patch).length > 0) {
        setKnownBlottersByUb((prev) => ({ ...prev, ...patch }));
      }
    });
    return () => {
      active = false;
    };
  }, [cases, disabled, knownBlottersByUb]);

  // Debounced server-side search whenever the picker is open
  useEffect(() => {
    if (disabled || openIndex === null) return;
    let active = true;
    const effectiveQuery =
      statusFilter === "resident" && residentPrimaryToken
        ? `${residentPrimaryToken} ${searchQuery}`.trim()
        : searchQuery.trim();
    const effectiveStatus = statusFilter === "active" ? "active" : "all";

    setLoadingBlotters(true);
    const timer = setTimeout(() => {
      blotterAPI
        .getReports({
          lookup: "usaping",
          q: effectiveQuery,
          status: effectiveStatus,
          limit: 30,
        })
        .then((res) => {
          if (!active) return;
          const list = Array.isArray(res?.reports) ? res.reports : [];
          setBlotterOptions(list);
          setTotalMatches(
            typeof res?.totalItems === "number" ? res.totalItems : list.length,
          );
          if (list.length > 0) {
            setKnownBlottersByUb((prev) => {
              const next = { ...prev };
              for (const r of list) {
                const k = String(r?.usaping_barangay_number || "")
                  .trim()
                  .toUpperCase();
                if (k) next[k] = r;
              }
              return next;
            });
          }
        })
        .catch(() => {
          if (active) {
            setBlotterOptions([]);
            setTotalMatches(0);
          }
        })
        .finally(() => {
          if (active) setLoadingBlotters(false);
        });
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [disabled, openIndex, searchQuery, statusFilter, residentPrimaryToken]);

  useEffect(() => {
    if (openIndex === null) return;
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 30);
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpenIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openIndex]);

  const openPickerForRow = (index) => {
    if (disabled) return;
    if (openIndex === index) {
      setOpenIndex(null);
      return;
    }
    setSearchQuery("");
    setStatusFilter("all");
    setOpenIndex(index);
  };

  const commit = (nextCases) => {
    const numbered = (nextCases || []).map((row, idx) => ({
      ...row,
      sn: String(idx + 1),
    }));
    onChange(serializeCaseRecordHistory(numbered));
  };

  const updateRow = (index, patch) => {
    const next = cases.length ? [...cases] : [emptyPendingCase()];
    next[index] = { ...next[index], ...patch };
    commit(next);
  };

  const linkBlotterToRow = (index, report) => {
    const current = cases[index] || emptyPendingCase();
    const ubNo = String(report.usaping_barangay_number || "").trim().toUpperCase();
    const rawDate =
      report.incident_date || report.verified_at || report.created_at || "";
    const formattedDate = /^\d{4}-\d{2}-\d{2}/.test(String(rawDate))
      ? String(rawDate).slice(0, 10)
      : current.dateRecorded;
    setKnownBlottersByUb((prev) => ({ ...prev, [ubNo]: report }));
    updateRow(index, {
      sn: current.sn || String(index + 1),
      caseNo: ubNo,
      dateRecorded: formattedDate,
      description: buildBlotterCaseDescription(report) || current.description,
      status: mapBlotterStatusToCaseStatus(report.status),
    });
    setOpenIndex(null);
  };

  const addRow = () => {
    commit([...cases, emptyPendingCase()]);
  };

  const removeRow = (index) => {
    const next = cases.filter((_, i) => i !== index);
    if (openIndex === index) setOpenIndex(null);
    commit(next);
  };

  const compact = variant === "compact";
  const inputClass = compact
    ? "input text-xs py-1.5 normal-case"
    : "w-full bg-white border border-red-200 text-gray-900 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-red-500 normal-case";
  const inputClassUpper = `${inputClass} uppercase`;

  return (
    <div ref={containerRef} className="space-y-3 relative z-0">
      {cases.length === 0 ? (
        <p className="text-[10px] text-gray-500">
          Walang naka-list na pending case. Pindutin ang &quot;Magdagdag ng case&quot; para magdagdag.
        </p>
      ) : (
        cases.map((row, index) => {
          const currentUb = String(row.caseNo || "").trim().toUpperCase();
          const linkedBlotter = currentUb ? knownBlottersByUb[currentUb] : null;
          const isPickerOpen = !disabled && openIndex === index;

          return (
            <div
              key={`case-${index}`}
              className={`rounded-lg border space-y-2.5 p-3 ${
                compact ? "border-rose-200 bg-white" : "border-red-100 bg-white/80"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                    Pending case #{index + 1}
                  </span>
                  {linkedBlotter && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[9px] font-bold text-emerald-700 uppercase tracking-wider">
                      <Link2 className="w-2.5 h-2.5" />
                      E-Sumbong Linked
                    </span>
                  )}
                </div>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="p-1.5 rounded-md text-rose-600 hover:bg-rose-100 transition-colors"
                    title="Alisin ang case na ito"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-2">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Item
                  </label>
                  <input
                    type="text"
                    readOnly
                    tabIndex={-1}
                    className={`${inputClassUpper} bg-gray-50 font-bold text-center cursor-default select-none`}
                    value={String(index + 1)}
                    disabled={disabled}
                  />
                </div>
                <div className="sm:col-span-6">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1 truncate">
                    Usaping Barangay Blg.
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className={`${inputClassUpper} pr-7 font-bold`}
                      placeholder="UB-2026-0001"
                      value={row.caseNo}
                      disabled={disabled}
                      onFocus={() => {
                        if (!disabled && openIndex !== index) {
                          setSearchQuery("");
                          setStatusFilter("all");
                          setOpenIndex(index);
                        }
                      }}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        updateRow(index, { caseNo: val });
                      }}
                    />
                    {!disabled && (
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => openPickerForRow(index)}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-rose-600 transition-colors"
                        title="Maghanap sa E-Sumbong"
                      >
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform ${
                            isPickerOpen ? "rotate-180 text-rose-600" : ""
                          }`}
                        />
                      </button>
                    )}
                  </div>
                </div>
                <div className="sm:col-span-4">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1 truncate">
                    Date recorded
                  </label>
                  <input
                    type="date"
                    className={inputClass}
                    value={row.dateRecorded}
                    disabled={disabled}
                    onChange={(e) =>
                      updateRow(index, { dateRecorded: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Full-width scalable E-Sumbong search & filter panel */}
              {isPickerOpen && (
                <div className="rounded-lg border border-rose-200 bg-slate-50/90 p-2.5 shadow-md space-y-2">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search UB Blg., Inirereklamo, Nagsusumbong, o Paksa..."
                        className="w-full bg-white border border-gray-200 rounded-md pl-8 pr-7 py-1.5 text-xs text-gray-900 outline-none focus:ring-2 focus:ring-rose-500 uppercase"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter pills + match counter */}
                  <div className="flex items-center justify-between gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setStatusFilter("all")}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-colors ${
                          statusFilter === "all"
                            ? "bg-rose-600 text-white"
                            : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        Lahat ({totalMatches})
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusFilter("active")}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-colors ${
                          statusFilter === "active"
                            ? "bg-amber-600 text-white"
                            : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        Active / Under Review
                      </button>
                      {residentPrimaryToken && (
                        <button
                          type="button"
                          onClick={() =>
                            setStatusFilter((prev) =>
                              prev === "resident" ? "all" : "resident",
                            )
                          }
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-colors ${
                            statusFilter === "resident"
                              ? "bg-blue-600 text-white"
                              : "bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
                          }`}
                          title={`Ipakita ang mga E-Sumbong na may pangalang ${residentPrimaryToken}`}
                        >
                          <UserCheck className="w-2.5 h-2.5" />
                          Sangkot si {residentPrimaryToken}
                        </button>
                      )}
                    </div>
                    <span className="text-[9px] font-semibold text-gray-400 uppercase">
                      {loadingBlotters
                        ? "Searching..."
                        : `Showing ${blotterOptions.length} of ${totalMatches}`}
                    </span>
                  </div>

                  {/* Results list */}
                  <div className="max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white divide-y divide-gray-100">
                    {blotterOptions.length === 0 ? (
                      <div className="px-3 py-4 text-center text-[10px] text-gray-400 uppercase">
                        {loadingBlotters
                          ? "Naglo-load ng E-Sumbong..."
                          : "Walang nahanap na E-Sumbong. Subukang mag-type ng ibang pangalan o UB Blg."}
                      </div>
                    ) : (
                      blotterOptions.map((report) => {
                        const ubNo = String(
                          report.usaping_barangay_number || "",
                        ).toUpperCase();
                        const isSelected = ubNo === currentUb;
                        const residentRole = getResidentRoleInBlotter(
                          report,
                          residentName,
                        );
                        const statusStr = String(report.status || "pending")
                          .replace(/_/g, " ")
                          .toUpperCase();

                        return (
                          <button
                            key={report.id}
                            type="button"
                            onClick={() => linkBlotterToRow(index, report)}
                            className={`w-full text-left px-3 py-2 hover:bg-rose-50/80 transition-colors flex items-start justify-between gap-2 ${
                              isSelected ? "bg-emerald-50/70" : ""
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[11px] font-black text-rose-700 uppercase">
                                  {ubNo}
                                </span>
                                <span
                                  className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                    report.status === "resolved"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : report.status === "dismissed"
                                        ? "bg-gray-100 text-gray-600"
                                        : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {statusStr}
                                </span>
                                {residentRole && (
                                  <span
                                    className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                      residentRole === "RESPONDENT"
                                        ? "bg-rose-100 text-rose-700"
                                        : "bg-blue-100 text-blue-700"
                                    }`}
                                  >
                                    {residentRole === "RESPONDENT"
                                      ? "Inirereklamo"
                                      : "Nagsusumbong"}
                                  </span>
                                )}
                                {report.incident_date && (
                                  <span className="text-[9px] text-gray-400 font-semibold">
                                    • {String(report.incident_date).slice(0, 10)}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] font-bold text-gray-800 uppercase truncate mt-0.5">
                                <span className="text-gray-500 font-semibold">
                                  Inirereklamo:
                                </span>{" "}
                                {report.respondent_name || "—"}{" "}
                                <span className="text-gray-400 font-normal">
                                  | Nagsusumbong:
                                </span>{" "}
                                {report.complainant_name || "—"}
                              </p>
                              {(report.purpose || report.details) && (
                                <p className="text-[9px] text-gray-500 uppercase truncate mt-0.5">
                                  {report.purpose
                                    ? `Para sa: ${report.purpose}`
                                    : report.details}
                                </p>
                              )}
                            </div>
                            {isSelected && (
                              <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white mt-1">
                                <Check className="w-3 h-3" />
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {totalMatches > blotterOptions.length && (
                    <p className="text-[9px] text-gray-400 text-center uppercase">
                      May {totalMatches - blotterOptions.length} pang record — i-type ang UB Blg. o apelyido sa search box para salain.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Case description
                </label>
                <textarea
                  rows={2}
                  className={`${inputClass} min-h-[2.5rem] resize-y`}
                  placeholder="Hal. uri ng kaso, blotter, lugar, at iba pang detalye"
                  value={row.description}
                  disabled={disabled}
                  onChange={(e) =>
                    updateRow(index, { description: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Status
                </label>
                <select
                  className={inputClassUpper}
                  value={row.status}
                  disabled={disabled}
                  onChange={(e) => updateRow(index, { status: e.target.value })}
                >
                  {CASE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })
      )}

      {!disabled && (
        <button
          type="button"
          onClick={addRow}
          className={`inline-flex items-center gap-1.5 px-2 py-2 rounded-md cursor-pointer relative z-10 text-[10px] font-bold uppercase tracking-wider ${
            compact
              ? "text-rose-700 hover:bg-rose-100 hover:text-rose-900"
              : "text-red-700 hover:bg-red-50 hover:text-red-900"
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          Magdagdag ng case
        </button>
      )}
    </div>
  );
}
