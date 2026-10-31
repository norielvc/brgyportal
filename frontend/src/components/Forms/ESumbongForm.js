import React, { useState, useCallback, useRef, useLayoutEffect } from "react";
import {
  Loader2,
  Search,
  Phone,
  Mail,
  User,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import { blotterAPI } from "@/lib/api";
import toast from "react-hot-toast";
import {
  FieldError,
  FieldLabel,
  inputClass,
  DETAILS_MAX_CHARS,
  ESUMBONG_UPPERCASE_FIELDS,
  toEsumbongUppercase,
} from "./esumbongFieldUtils";
import ResidentSearchModal from "@/components/Modals/ResidentSearchModal";
import { formatResidentPurokForPortal } from "@/lib/addressHelper";

const textareaModalClass =
  "w-full min-w-0 px-3 py-2.5 text-sm font-medium uppercase text-gray-900 placeholder:text-gray-400 placeholder:uppercase bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/25 focus:border-red-400 outline-none transition-shadow overflow-x-hidden overflow-y-auto whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed min-h-[6rem] max-h-[9.5rem] resize-none sm:min-h-[7.5rem] sm:max-h-[17.5rem] sm:resize-y md:max-h-[20rem]";

const textareaPageClass =
  "w-full min-w-0 px-3 py-2.5 text-sm sm:text-[15px] font-medium uppercase text-gray-900 placeholder:text-gray-400 placeholder:uppercase bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/25 focus:border-red-400 outline-none transition-[height,box-shadow] overflow-x-hidden whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed min-h-[12rem] sm:min-h-[14rem] resize-y max-h-none";

function defaultIncidentDateIso() {
  return new Date().toISOString().split("T")[0];
}

export default function ESumbongForm({
  publicMode = false,
  walkInMode = false,
  variant = "modal",
  isActive = true,
  tenantId = "ibaoeste",
  tenantConfig = {},
  onSuccess,
  onCancel,
}) {
  const isPage = variant === "page";
  const isStaffWalkIn = Boolean(walkInMode);

  const [form, setForm] = useState({
    complainant_resident_id: "",
    complainant_name: "",
    respondent_name: "",
    details: "",
    incident_date: isStaffWalkIn ? defaultIncidentDateIso() : "",
    incident_time: isStaffWalkIn ? "09:00" : "",
    contact_number: "",
    email: "",
  });

  const [isResidentModalOpen, setIsResidentModalOpen] = useState(false);
  const [complainantPurok, setComplainantPurok] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const detailsRef = useRef(null);

  const syncDetailsHeight = useCallback(() => {
    const el = detailsRef.current;
    if (!el) return;

    if (isPage) {
      el.style.height = "auto";
      const minPx = window.matchMedia("(min-width: 640px)").matches ? 224 : 192;
      const capPx = Math.max(minPx, Math.floor(window.innerHeight * 0.72));
      const contentHeight = el.scrollHeight;
      const next = Math.min(Math.max(contentHeight, minPx), capPx);
      el.style.height = `${next}px`;
      el.style.overflowY = contentHeight > capPx ? "auto" : "hidden";
      return;
    }

    if (window.matchMedia("(max-width: 639px)").matches) {
      el.style.height = "";
      return;
    }
    el.style.height = "auto";
    const capped = Math.min(el.scrollHeight, 320);
    el.style.height = `${Math.max(capped, 120)}px`;
  }, [isPage]);

  useLayoutEffect(() => {
    if (isActive) syncDetailsHeight();
  }, [form.details, isActive, syncDetailsHeight]);

  const resetForm = () => {
    setForm({
      complainant_resident_id: "",
      complainant_name: "",
      respondent_name: "",
      details: "",
      incident_date: isStaffWalkIn ? defaultIncidentDateIso() : "",
      incident_time: isStaffWalkIn ? "09:00" : "",
      contact_number: "",
      email: "",
    });
    setComplainantPurok("");
    setErrors({});
  };

  const selectResident = (resident) => {
    const name =
      resident.full_name ||
      [resident.first_name, resident.middle_name, resident.last_name, resident.suffix]
        .filter(Boolean)
        .join(" ")
        .trim();
    setForm((prev) => ({
      ...prev,
      complainant_resident_id: resident.id,
      complainant_name: toEsumbongUppercase(name),
      contact_number: toEsumbongUppercase(
        resident.contact_number || prev.contact_number,
      ),
      email: toEsumbongUppercase(resident.email || prev.email),
    }));
    setComplainantPurok(
      formatResidentPurokForPortal({
        purok: resident.purok,
        subdivision: resident.subdivision,
      }),
    );
    setIsResidentModalOpen(false);
    setErrors((prev) => ({
      ...prev,
      complainant_name: undefined,
      complainant_resident_id: undefined,
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (isStaffWalkIn) {
      if (!form.complainant_name.trim()) {
        newErrors.complainant_name = "Complainant name is required";
      }
    } else if (!form.complainant_resident_id?.trim()) {
      newErrors.complainant_resident_id =
        "Pumili ng naka-rehistro sa census na residente bilang nagsusumbong";
    } else if (!form.complainant_name.trim()) {
      newErrors.complainant_name = "Kailangan ang pangalan ng nagsusumbong";
    }
    if (!form.respondent_name.trim()) {
      newErrors.respondent_name = isStaffWalkIn
        ? "Respondent name is required"
        : "Kailangan ang pangalan ng inirereklamo";
    }
    if (!form.details.trim()) {
      newErrors.details = isStaffWalkIn
        ? "Incident narrative is required"
        : "Kailangan ang detalye ng sumbong";
    } else if (form.details.length > DETAILS_MAX_CHARS) {
      newErrors.details = isStaffWalkIn
        ? `Maximum ${DETAILS_MAX_CHARS.toLocaleString()} characters`
        : `Hanggang ${DETAILS_MAX_CHARS.toLocaleString()} titik lamang ang pinapayagan`;
    }
    if (!form.incident_date) {
      newErrors.incident_date = isStaffWalkIn
        ? "Incident date is required"
        : "Kailangan ang petsa ng pangyayari";
    }
    if (!form.contact_number.trim()) {
      newErrors.contact_number = isStaffWalkIn
        ? "Cellphone is required"
        : "Kailangan ang contact number";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        complainant_resident_id: form.complainant_resident_id?.trim() || null,
        intake_source: isStaffWalkIn ? "walk_in" : "portal",
      };
      await blotterAPI.createReport(payload);
      toast.success(
        isStaffWalkIn
          ? "Walk-in E-Sumbong saved"
          : "Naipadala na ang iyong E-Sumbong",
      );
      resetForm();
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting blotter:", error);
      const msg =
        error?.response?.data?.message ||
        (error?.code === "ECONNABORTED"
          ? "Masyadong matagal ang pag-submit. Subukang muli."
          : "Hindi maipadala ang sumbong");
      toast.error(msg, { duration: 6000 });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    const next = ESUMBONG_UPPERCASE_FIELDS.has(field)
      ? toEsumbongUppercase(value)
      : value;
    setForm((prev) => ({ ...prev, [field]: next }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const footerClass = isPage
    ? "shrink-0 flex flex-col sm:flex-row sm:justify-end gap-3 pt-6 mt-auto border-t border-gray-100 sticky bottom-0 bg-white/95 backdrop-blur-sm pb-[max(env(safe-area-inset-bottom,0px),0.5rem)] -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
    : isStaffWalkIn
      ? "shrink-0 border-t border-gray-200 bg-white pt-2.5 mt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pb-1"
      : "shrink-0 border-t border-gray-200 bg-white/95 backdrop-blur-sm px-4 pt-3 sm:px-5 sm:pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row sm:justify-end gap-2 pb-[max(env(safe-area-inset-bottom,0px),0.75rem)] sm:pb-3";

  const bodyClass = isPage
    ? "flex-1 min-h-0 space-y-6 sm:space-y-8"
    : isStaffWalkIn
      ? "flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y space-y-3 pr-0.5 [scrollbar-gutter:stable]"
      : "flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y px-4 py-3 sm:px-5 sm:py-5 space-y-4 sm:space-y-5 [scrollbar-gutter:stable]";

  const walkInTextareaClass =
    "w-full min-w-0 px-3 py-2 text-sm font-medium uppercase text-gray-900 placeholder:text-gray-400 placeholder:normal-case bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#03254c]/20 focus:border-[#03254c] outline-none resize-y min-h-[5.5rem] max-h-[9rem] leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]";

  return (
    <form
      onSubmit={handleSubmit}
      className={
        isPage
          ? "flex flex-col flex-1 min-h-0"
          : isStaffWalkIn
            ? "flex flex-col flex-1 min-h-0 overflow-hidden"
            : "flex flex-col flex-1 min-h-0 overflow-hidden"
      }
    >
      <div className={bodyClass}>
        <section className={isStaffWalkIn ? "space-y-2" : "space-y-3"}>
          {!isStaffWalkIn && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Mga partido
            </p>
          )}

          <div
            className={`grid grid-cols-1 sm:grid-cols-2 ${
              isStaffWalkIn ? "gap-3 items-start" : "gap-6 sm:gap-x-4 sm:items-start"
            }`}
          >
            <div className="flex flex-col min-w-0 sm:h-full">
              <FieldLabel icon={User}>
                {isStaffWalkIn ? (
                  <>
                    Complainant <span className="text-red-500">*</span>
                  </>
                ) : (
                  <>
                    Pangalan ng nagsusumbong <span className="text-red-500">*</span>
                  </>
                )}
              </FieldLabel>
              {!isStaffWalkIn && (
                <p className="text-[11px] text-gray-500 leading-snug -mt-1 mb-2 min-h-[2.75rem] sm:min-h-[3rem]">
                  Dapat kayo ay naka-rehistro sa census ng barangay. Hanapin ang iyong pangalan sa direktoryo.
                </p>
              )}
              {isStaffWalkIn ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={form.complainant_name}
                    onChange={(e) => handleChange("complainant_name", e.target.value)}
                    placeholder="Full name of complainant"
                    className={`${inputClass} min-h-[2.5rem] py-2 text-sm font-bold`}
                  />
                  {form.complainant_resident_id && form.complainant_name ? (
                    <div className="flex items-center gap-2 text-[10px] font-semibold text-emerald-700">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" aria-hidden />
                      Linked to census record
                      {complainantPurok ? ` · ${complainantPurok}` : ""}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setIsResidentModalOpen(true)}
                    className="text-[10px] font-bold uppercase tracking-wide text-[#03254c] hover:underline text-left"
                  >
                    {form.complainant_resident_id
                      ? "Change census link"
                      : "Link census record (optional)"}
                  </button>
                  <FieldError
                    message={errors.complainant_name || errors.complainant_resident_id}
                  />
                </div>
              ) : form.complainant_name && form.complainant_resident_id ? (
                <div
                  className={`${inputClass} flex items-center gap-2 min-h-[2.75rem] h-auto py-2 border-red-100 bg-red-50/40`}
                >
                  <CheckCircle className="w-4 h-4 text-red-600 shrink-0" aria-hidden />
                  <div className="min-w-0 flex-1 grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-0">
                    <span className="text-sm font-bold uppercase text-gray-900 leading-snug min-w-0 break-words col-start-1">
                      {form.complainant_name}
                    </span>
                    {complainantPurok ? (
                      <span className="text-xs font-semibold uppercase text-gray-600 whitespace-nowrap col-start-2 row-start-1">
                        {complainantPurok}
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsResidentModalOpen(true)}
                    className="text-[10px] font-bold uppercase tracking-wide text-red-700 hover:text-red-900 shrink-0 whitespace-nowrap"
                  >
                    Palitan
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsResidentModalOpen(true)}
                  className="w-full flex items-center gap-3 p-3 bg-white border-2 border-dashed border-gray-300 rounded-lg text-left transition-colors hover:bg-gray-50 hover:border-red-300 min-h-[2.75rem]"
                >
                  <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center shrink-0 text-white">
                    <Search className="w-4 h-4" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900">Hanapin sa Direktoryo</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Hanapin ang pangalan mo sa talaan ng barangay
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" aria-hidden />
                </button>
              )}
              {!isStaffWalkIn ? (
                <FieldError message={errors.complainant_resident_id || errors.complainant_name} />
              ) : null}
            </div>

            <div className="flex flex-col min-w-0 sm:h-full">
              <FieldLabel icon={User}>
                {isStaffWalkIn ? (
                  <>
                    Respondent / accused <span className="text-red-500">*</span>
                  </>
                ) : (
                  <>
                    Pangalan ng inirereklamo <span className="text-red-500">*</span>
                  </>
                )}
              </FieldLabel>
              {!isStaffWalkIn && (
                <p className="text-[11px] text-gray-500 leading-snug -mt-1 mb-2 min-h-[2.75rem] sm:min-h-[3rem]">
                  Buong pangalan ng taong inirereklamo (hindi kailangang naka-rehistro sa census).
                </p>
              )}
              <input
                type="text"
                value={form.respondent_name}
                onChange={(e) => handleChange("respondent_name", e.target.value)}
                placeholder={
                  isStaffWalkIn ? "Name of respondent" : "Ilagay ang pangalan ng inirereklamo"
                }
                className={`${inputClass} ${isStaffWalkIn ? "min-h-[2.5rem] py-2" : "min-h-[2.75rem]"} text-sm font-bold`}
              />
              <FieldError message={errors.respondent_name} />
            </div>
          </div>
        </section>

        {isStaffWalkIn ? (
          <>
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <div>
                <FieldLabel icon={Calendar}>
                  Incident date <span className="text-red-500">*</span>
                </FieldLabel>
                <input
                  type="date"
                  value={form.incident_date}
                  onChange={(e) => handleChange("incident_date", e.target.value)}
                  className={`${inputClass} py-2 text-sm`}
                />
                <FieldError message={errors.incident_date} />
              </div>
              <div>
                <FieldLabel icon={Clock} optional optionalLabel="(optional)">
                  Incident time
                </FieldLabel>
                <input
                  type="time"
                  value={form.incident_time}
                  onChange={(e) => handleChange("incident_time", e.target.value)}
                  className={`${inputClass} py-2 text-sm`}
                />
              </div>
              <div>
                <FieldLabel icon={Phone}>
                  Cellphone <span className="text-red-500">*</span>
                </FieldLabel>
                <input
                  type="tel"
                  inputMode="tel"
                  value={form.contact_number}
                  onChange={(e) => handleChange("contact_number", e.target.value)}
                  placeholder="09XX XXX XXXX"
                  className={`${inputClass} py-2 text-sm`}
                  autoComplete="tel"
                />
                <FieldError message={errors.contact_number} />
              </div>
              <div>
                <FieldLabel icon={Mail} optional optionalLabel="(optional)">
                  Email
                </FieldLabel>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="email@example.com"
                  className={`${inputClass} py-2 text-sm normal-case`}
                  autoComplete="email"
                />
              </div>
            </section>

            <section>
              <FieldLabel icon={FileText}>
                Incident narrative <span className="text-red-500">*</span>
              </FieldLabel>
              <textarea
                ref={detailsRef}
                id="esumbong-details"
                name="details"
                value={form.details}
                onChange={(e) => handleChange("details", e.target.value)}
                rows={4}
                maxLength={DETAILS_MAX_CHARS}
                placeholder="Facts, location, witnesses, and other relevant details."
                className={walkInTextareaClass}
                spellCheck
                autoComplete="off"
                aria-describedby="esumbong-details-count"
              />
              <div className="flex items-start justify-between gap-2 mt-1">
                <FieldError message={errors.details} />
                <p
                  id="esumbong-details-count"
                  className={`text-[10px] tabular-nums shrink-0 ml-auto text-right ${
                    form.details.length >= DETAILS_MAX_CHARS
                      ? "text-red-600 font-semibold"
                      : form.details.length > DETAILS_MAX_CHARS * 0.9
                        ? "text-amber-600 font-semibold"
                        : "text-gray-400"
                  }`}
                  aria-live="polite"
                >
                  {form.details.length.toLocaleString()} / {DETAILS_MAX_CHARS.toLocaleString()}
                </p>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Detalye ng pangyayari
              </p>

              <div>
                <FieldLabel icon={FileText}>
                  Idetalye ang iyong sumbong <span className="text-red-500">*</span>
                </FieldLabel>
                <textarea
                  ref={detailsRef}
                  id="esumbong-details"
                  name="details"
                  value={form.details}
                  onChange={(e) => {
                    handleChange("details", e.target.value);
                    requestAnimationFrame(syncDetailsHeight);
                  }}
                  onPaste={() => requestAnimationFrame(syncDetailsHeight)}
                  rows={isPage ? 12 : 5}
                  maxLength={DETAILS_MAX_CHARS}
                  placeholder="Ilarawan ang pangyayari, lugar, petsa/oras kung alam, mga saksi, at iba pang detalye. Puwedeng maging mahaba ang mensahe."
                  className={isPage ? textareaPageClass : textareaModalClass}
                  spellCheck
                  autoComplete="off"
                  aria-describedby="esumbong-details-count"
                />
                <div className="flex items-start justify-between gap-2 mt-1.5">
                  <FieldError message={errors.details} />
                  <p
                    id="esumbong-details-count"
                    className={`text-[10px] sm:text-xs tabular-nums shrink-0 ml-auto text-right ${
                      form.details.length >= DETAILS_MAX_CHARS
                        ? "text-red-600 font-semibold"
                        : form.details.length > DETAILS_MAX_CHARS * 0.9
                          ? "text-amber-600 font-semibold"
                          : "text-gray-400"
                    }`}
                    aria-live="polite"
                  >
                    {form.details.length.toLocaleString()} / {DETAILS_MAX_CHARS.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className={`grid grid-cols-1 gap-3 ${isPage ? "sm:grid-cols-2 sm:gap-4" : "min-[380px]:grid-cols-2"}`}>
                <div>
                  <FieldLabel icon={Calendar}>
                    Petsa <span className="text-red-500">*</span>
                  </FieldLabel>
                  <input
                    type="date"
                    value={form.incident_date}
                    onChange={(e) => handleChange("incident_date", e.target.value)}
                    className={inputClass}
                  />
                  <FieldError message={errors.incident_date} />
                </div>
                <div>
                  <FieldLabel icon={Clock} optional>
                    Oras
                  </FieldLabel>
                  <input
                    type="time"
                    value={form.incident_time}
                    onChange={(e) => handleChange("incident_time", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Para maka-follow up ang barangay
              </p>

              <div className={`grid grid-cols-1 gap-3 ${isPage ? "sm:grid-cols-2 sm:gap-4" : "min-[400px]:grid-cols-2"}`}>
                <div>
                  <FieldLabel icon={Phone}>
                    Cellphone <span className="text-red-500">*</span>
                  </FieldLabel>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={form.contact_number}
                    onChange={(e) => handleChange("contact_number", e.target.value)}
                    placeholder="09XX XXX XXXX"
                    className={inputClass}
                    autoComplete="tel"
                  />
                  <FieldError message={errors.contact_number} />
                </div>
                <div>
                  <FieldLabel icon={Mail} optional>
                    Email
                  </FieldLabel>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="example@email.com"
                    className={inputClass}
                    autoComplete="email"
                  />
                  <p className="text-[10px] text-gray-500 mt-1.5 leading-snug">
                    Kapag may email, padadalhan ka ng kumpirmasyon at mga update tungkol sa iyong sumbong.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      <div className={footerClass}>
        <button
          type="submit"
          disabled={submitting}
          className={
            isStaffWalkIn
              ? "w-full sm:order-2 sm:w-auto px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-[#03254c] hover:opacity-90 shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 order-1"
              : "w-full sm:order-2 sm:w-auto px-6 py-3 sm:py-2.5 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 order-1"
          }
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
              {isStaffWalkIn ? "Saving…" : "Ini-submit..."}
            </>
          ) : isStaffWalkIn ? (
            "Save walk-in E-Sumbong"
          ) : (
            "I-submit ang Sumbong"
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className={
              isStaffWalkIn
                ? "w-full sm:order-1 sm:w-auto px-4 py-2.5 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50 order-2"
                : "w-full sm:order-1 sm:w-auto px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 order-2 border border-gray-200 sm:border-0"
            }
          >
            {isStaffWalkIn ? "Cancel" : "Kanselahin"}
          </button>
        )}
      </div>

      <ResidentSearchModal
        isOpen={isResidentModalOpen && isActive}
        onClose={() => setIsResidentModalOpen(false)}
        onSelect={selectResident}
        isDemo={tenantId === "demo"}
        tenantConfig={{ ...tenantConfig, tenant_id: tenantId }}
        tenantId={tenantId}
        lang="tl"
        blockPendingCase={false}
      />
    </form>
  );
}
