import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import {
  Loader2,
  Search,
  Phone,
  Mail,
  User,
  FileText,
  Calendar,
  Clock,
} from "lucide-react";
import api, { blotterAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { FieldError, FieldLabel, inputClass, DETAILS_MAX_CHARS } from "./esumbongFieldUtils";

const textareaModalClass =
  "w-full min-w-0 px-3 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/25 focus:border-red-400 outline-none transition-shadow overflow-x-hidden overflow-y-auto whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed min-h-[6rem] max-h-[9.5rem] resize-none sm:min-h-[7.5rem] sm:max-h-[17.5rem] sm:resize-y md:max-h-[20rem]";

const textareaPageClass =
  "w-full min-w-0 px-3 py-2.5 text-sm sm:text-[15px] font-medium text-gray-900 placeholder:text-gray-400 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500/25 focus:border-red-400 outline-none transition-[height,box-shadow] overflow-x-hidden whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed min-h-[12rem] sm:min-h-[14rem] resize-y max-h-none";

export default function ESumbongForm({
  publicMode = false,
  variant = "modal",
  isActive = true,
  onSuccess,
  onCancel,
}) {
  const isPage = variant === "page";

  const [form, setForm] = useState({
    complainant_resident_id: "",
    complainant_name: "",
    respondent_name: "",
    details: "",
    incident_date: "",
    incident_time: "",
    contact_number: "",
    email: "",
  });

  const [residents, setResidents] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingResidents, setLoadingResidents] = useState(false);
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
      incident_date: "",
      incident_time: "",
      contact_number: "",
      email: "",
    });
    setSearch("");
    setResidents([]);
    setErrors({});
  };

  const fetchResidents = useCallback(async (name) => {
    setLoadingResidents(true);
    try {
      const { data } = await api.get("/residents/search", {
        params: { name, limit: 10 },
      });
      setResidents(data?.residents || []);
    } catch (error) {
      console.error("Error searching residents:", error);
      toast.error("Hindi ma-load ang listahan ng residente");
    } finally {
      setLoadingResidents(false);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const timer = setTimeout(() => {
      if (!search.trim()) {
        setResidents([]);
        return;
      }
      fetchResidents(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, isActive, fetchResidents]);

  const selectResident = (resident) => {
    setForm((prev) => ({
      ...prev,
      complainant_resident_id: resident.id,
      complainant_name:
        resident.full_name ||
        `${resident.first_name || ""} ${resident.last_name || ""}`.trim(),
    }));
    setSearch(
      resident.full_name ||
        `${resident.first_name || ""} ${resident.last_name || ""}`.trim(),
    );
    setResidents([]);
  };

  const validate = () => {
    const newErrors = {};
    if (!form.complainant_name.trim())
      newErrors.complainant_name = "Kailangan ang pangalan ng nagsusumbong";
    if (!form.respondent_name.trim())
      newErrors.respondent_name = "Kailangan ang pangalan ng inirereklamo";
    if (!form.details.trim()) newErrors.details = "Kailangan ang detalye ng sumbong";
    else if (form.details.length > DETAILS_MAX_CHARS) {
      newErrors.details = `Hanggang ${DETAILS_MAX_CHARS.toLocaleString()} titik lamang ang pinapayagan`;
    }
    if (!form.incident_date) newErrors.incident_date = "Kailangan ang petsa ng pangyayari";
    if (!form.contact_number.trim())
      newErrors.contact_number = "Kailangan ang contact number";
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
      };
      await blotterAPI.createReport(payload);
      toast.success("Naipadala na ang iyong E-Sumbong");
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
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const footerClass = isPage
    ? "shrink-0 flex flex-col sm:flex-row sm:justify-end gap-3 pt-6 mt-auto border-t border-gray-100 sticky bottom-0 bg-white/95 backdrop-blur-sm pb-[max(env(safe-area-inset-bottom,0px),0.5rem)] -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
    : "shrink-0 border-t border-gray-200 bg-white/95 backdrop-blur-sm px-4 pt-3 sm:px-5 sm:pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row sm:justify-end gap-2 pb-[max(env(safe-area-inset-bottom,0px),0.75rem)] sm:pb-3";

  const bodyClass = isPage
    ? "flex-1 min-h-0 space-y-6 sm:space-y-8"
    : "flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y px-4 py-3 sm:px-5 sm:py-5 space-y-4 sm:space-y-5 [scrollbar-gutter:stable]";

  return (
    <form
      onSubmit={handleSubmit}
      className={isPage ? "flex flex-col flex-1 min-h-0" : "flex flex-col flex-1 min-h-0 overflow-hidden"}
    >
      <div className={bodyClass}>
        <section className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Mga partido
          </p>

          <div className={`grid gap-3 ${isPage ? "sm:grid-cols-2 sm:gap-4" : ""}`}>
          <div className="relative min-w-0">
            <FieldLabel icon={User}>
              Pangalan ng nagsusumbong <span className="text-red-500">*</span>
            </FieldLabel>
            {publicMode ? (
              <input
                type="text"
                value={form.complainant_name}
                onChange={(e) => handleChange("complainant_name", e.target.value)}
                placeholder="Ilagay ang iyong buong pangalan"
                className={inputClass}
                autoComplete="name"
              />
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onBlur={() => setTimeout(() => setResidents([]), 200)}
                    placeholder="Maghanap sa database ng residente..."
                    className={`${inputClass} pl-9`}
                  />
                  {loadingResidents && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                  )}
                </div>
                {residents.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-36 overflow-y-auto">
                    {residents.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onMouseDown={() => selectResident(r)}
                        className="w-full text-left px-3 py-2.5 hover:bg-gray-50 text-sm font-medium text-gray-800 border-b border-gray-100 last:border-0"
                      >
                        {r.full_name ||
                          `${r.first_name || ""} ${r.last_name || ""}`.trim()}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            <FieldError message={errors.complainant_name} />
          </div>

          <div className="min-w-0">
            <FieldLabel icon={User}>
              Pangalan ng inirereklamo <span className="text-red-500">*</span>
            </FieldLabel>
            <input
              type="text"
              value={form.respondent_name}
              onChange={(e) => handleChange("respondent_name", e.target.value)}
              placeholder="Ilagay ang pangalan ng inirereklamo"
              className={inputClass}
            />
            <FieldError message={errors.respondent_name} />
          </div>
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Detalye ng pangyayari
          </p>

          <div>
            <FieldLabel icon={FileText}>
              Idetalye ang iyong sumbong <span className="text-red-500">*</span>
            </FieldLabel>
            {isPage && (
              <p
                id="esumbong-details-hint"
                className="text-xs text-gray-500 leading-snug -mt-1 mb-2"
              >
                Maaari kang mag-type o mag-paste ng mahabang ulat (hanggang{" "}
                {DETAILS_MAX_CHARS.toLocaleString()} titik). Lumalaki ang kahon habang
                sumusulat; mag-scroll sa loob kung napakahaba na.
              </p>
            )}
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
              aria-describedby={
                isPage ? "esumbong-details-hint esumbong-details-count" : "esumbong-details-count"
              }
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
            </div>
          </div>
        </section>
      </div>

      <div className={footerClass}>
        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:order-2 sm:w-auto px-6 py-3 sm:py-2.5 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 order-1"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
              Ini-submit...
            </>
          ) : (
            "I-submit ang Sumbong"
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="w-full sm:order-1 sm:w-auto px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 order-2 border border-gray-200 sm:border-0"
          >
            Kanselahin
          </button>
        )}
      </div>
    </form>
  );
}
