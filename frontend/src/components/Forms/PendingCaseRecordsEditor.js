import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, Link2, ChevronDown } from "lucide-react";
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
  const details = String(report?.incident_details || "").trim().toUpperCase();
  if (details) return details.length > 140 ? `${details.slice(0, 140)}...` : details;
  return parties;
}

export default function PendingCaseRecordsEditor({
  value,
  onChange,
  disabled = false,
  variant = "default",
}) {
  const cases = parseCaseRecordHistory(value);
  const [blotterOptions, setBlotterOptions] = useState([]);
  const [loadingBlotters, setLoadingBlotters] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (disabled) return;
    let active = true;
    setLoadingBlotters(true);
    blotterAPI
      .getReports({ lookup: "usaping" })
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res?.reports) ? res.reports : [];
        setBlotterOptions(
          list.filter((r) => String(r?.usaping_barangay_number || "").trim()),
        );
      })
      .catch(() => {
        if (active) setBlotterOptions([]);
      })
      .finally(() => {
        if (active) setLoadingBlotters(false);
      });
    return () => {
      active = false;
    };
  }, [disabled]);

  useEffect(() => {
    if (openIndex === null) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpenIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openIndex]);

  const blotterByNumber = useMemo(() => {
    const map = new Map();
    for (const r of blotterOptions) {
      const key = String(r.usaping_barangay_number || "").trim().toUpperCase();
      if (key) map.set(key, r);
    }
    return map;
  }, [blotterOptions]);

  const commit = (nextCases) => {
    onChange(serializeCaseRecordHistory(nextCases));
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
          const query = String(row.caseNo || "").trim().toUpperCase();
          const linkedBlotter = query ? blotterByNumber.get(query) : null;
          const filteredOptions = blotterOptions.filter((r) => {
            if (!query) return true;
            const hay = [
              r.usaping_barangay_number,
              r.complainant_name,
              r.respondent_name,
              r.purpose,
            ]
              .filter(Boolean)
              .join(" ")
              .toUpperCase();
            return hay.includes(query);
          });

          return (
            <div
              key={`case-${index}`}
              className={`rounded-lg border space-y-2 p-3 ${
                compact ? "border-rose-200 bg-white" : "border-red-100 bg-white/80"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
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
                    SN
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className={inputClassUpper}
                    placeholder="1"
                    value={row.sn}
                    disabled={disabled}
                    onChange={(e) => updateRow(index, { sn: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-5 relative">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1 whitespace-nowrap">
                    Usaping Barangay Blg.
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className={`${inputClassUpper} pr-7`}
                      placeholder="Pumili o i-type ang UB Blg."
                      value={row.caseNo}
                      disabled={disabled}
                      onFocus={() => !disabled && setOpenIndex(index)}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        updateRow(index, { caseNo: val });
                        if (!disabled) setOpenIndex(index);
                      }}
                    />
                    {!disabled && (
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() =>
                          setOpenIndex((prev) => (prev === index ? null : index))
                        }
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                        title="Pumili mula sa E-Sumbong"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {!disabled && openIndex === index && (
                    <div className="absolute left-0 right-0 sm:w-[22rem] mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-56 overflow-y-auto">
                      <div className="px-2.5 py-1.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                          E-Sumbong Blotters ({filteredOptions.length})
                        </span>
                        {loadingBlotters && (
                          <span className="text-[9px] text-gray-400 uppercase">
                            Loading...
                          </span>
                        )}
                      </div>
                      {filteredOptions.length === 0 ? (
                        <div className="px-3 py-2.5 text-[10px] text-gray-400 uppercase">
                          {loadingBlotters
                            ? "Naglo-load ng E-Sumbong..."
                            : "Walang tugmang E-Sumbong na may Usaping Barangay Blg."}
                        </div>
                      ) : (
                        filteredOptions.map((report) => {
                          const ubNo = String(
                            report.usaping_barangay_number || "",
                          ).toUpperCase();
                          const isSelected = ubNo === query;
                          return (
                            <button
                              key={report.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                linkBlotterToRow(index, report);
                              }}
                              className={`w-full text-left px-2.5 py-2 border-b border-gray-50 last:border-b-0 hover:bg-rose-50 transition-colors ${
                                isSelected ? "bg-emerald-50/70" : ""
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-bold text-rose-700 uppercase">
                                  {ubNo}
                                </span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 uppercase">
                                  {String(report.status || "pending").replace(/_/g, " ")}
                                </span>
                              </div>
                              <p className="text-[10px] font-semibold text-gray-800 uppercase truncate mt-0.5">
                                {report.complainant_name || "—"} VS.{" "}
                                {report.respondent_name || "—"}
                              </p>
                              {(report.purpose || report.incident_date) && (
                                <p className="text-[9px] text-gray-500 uppercase truncate">
                                  {[
                                    report.purpose,
                                    report.incident_date
                                      ? String(report.incident_date).slice(0, 10)
                                      : null,
                                  ]
                                    .filter(Boolean)
                                    .join(" • ")}
                                </p>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
                <div className="sm:col-span-5">
                  <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
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
