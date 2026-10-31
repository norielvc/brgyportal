import { Plus, Trash2 } from "lucide-react";
import {
  parseCaseRecordHistory,
  serializeCaseRecordHistory,
  emptyPendingCase,
  CASE_STATUSES,
} from "@/lib/caseRecordHistory";

export default function PendingCaseRecordsEditor({
  value,
  onChange,
  disabled = false,
  variant = "default",
}) {
  const cases = parseCaseRecordHistory(value);

  const commit = (nextCases) => {
    onChange(serializeCaseRecordHistory(nextCases));
  };

  const updateRow = (index, patch) => {
    const next = cases.length ? [...cases] : [emptyPendingCase()];
    next[index] = { ...next[index], ...patch };
    commit(next);
  };

  const addRow = () => {
    commit([...cases, emptyPendingCase()]);
  };

  const removeRow = (index) => {
    const next = cases.filter((_, i) => i !== index);
    commit(next);
  };

  const compact = variant === "compact";
  const inputClass = compact
    ? "input text-xs py-1.5 normal-case"
    : "w-full bg-white border border-red-200 text-gray-900 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-red-500 normal-case";
  const inputClassUpper = `${inputClass} uppercase`;

  return (
    <div className="space-y-3 relative z-0">
      {cases.length === 0 ? (
        <p className="text-[10px] text-gray-500">
          Walang naka-list na pending case. Pindutin ang &quot;Magdagdag ng case&quot; para magdagdag.
        </p>
      ) : (
        cases.map((row, index) => (
          <div
            key={`case-${index}`}
            className={`rounded-lg border space-y-2 p-3 ${
              compact ? "border-rose-200 bg-white" : "border-red-100 bg-white/80"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                Pending case #{index + 1}
              </span>
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
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
              <div>
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Case no.
                </label>
                <input
                  type="text"
                  className={inputClassUpper}
                  placeholder="Blotter / case #"
                  value={row.caseNo}
                  disabled={disabled}
                  onChange={(e) => updateRow(index, { caseNo: e.target.value })}
                />
              </div>
              <div className="col-span-2 sm:col-span-2">
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
        ))
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
