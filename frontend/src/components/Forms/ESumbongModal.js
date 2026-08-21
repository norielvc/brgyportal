import React, { useState, useEffect, useCallback } from "react";
import { X, HelpCircle, Loader2, Search, AlertCircle, Phone, Mail, User, FileText, Calendar, Clock } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function ESumbongModal({ isOpen, onClose, publicMode = false }) {
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

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (!search.trim()) {
        setResidents([]);
        return;
      }
      fetchResidents(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, isOpen]);

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

  const selectResident = (resident) => {
    setForm((prev) => ({
      ...prev,
      complainant_resident_id: resident.id,
      complainant_name: resident.full_name || `${resident.first_name || ""} ${resident.last_name || ""}`.trim(),
    }));
    setSearch(resident.full_name || `${resident.first_name || ""} ${resident.last_name || ""}`.trim());
    setResidents([]);
  };

  const validate = () => {
    const newErrors = {};
    if (!form.complainant_name.trim()) newErrors.complainant_name = "Kailangan ang pangalan ng nag susumbong";
    if (!form.respondent_name.trim()) newErrors.respondent_name = "Kailangan ang pangalan ng inirereklamo";
    if (!form.details.trim()) newErrors.details = "Kailangan ang detalye ng sumbong";
    if (!form.incident_date) newErrors.incident_date = "Kailangan ang petsa ng pangyayari";
    if (!form.contact_number.trim()) newErrors.contact_number = "Kailangan ang contact number";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await api.post("/blotter", form);
      toast.success("Naipadala na ang iyong E-Sumbong");
      handleClose();
    } catch (error) {
      console.error("Error submitting blotter:", error);
      toast.error(error?.response?.data?.message || "Hindi maipadala ang sumbong");
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-white" />
            <div>
              <h3 className="text-xl font-bold text-white">E-Sumbong</h3>
              <p className="text-xs text-red-100">Barangay Blotter</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Complainant */}
          <div className="relative">
            <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block text-gray-600">
              <User className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
              Pangalan ng nag susumbong <span className="text-red-500">*</span>
            </label>
            {publicMode ? (
              <input
                type="text"
                value={form.complainant_name}
                onChange={(e) => handleChange("complainant_name", e.target.value)}
                placeholder="Ilagay ang iyong buong pangalan"
                className="w-full px-4 py-3 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-base"
              />
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onBlur={() => setTimeout(() => setResidents([]), 200)}
                    placeholder="Maghanap sa database ng residente..."
                    className="w-full pl-9 pr-4 py-3 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-base"
                  />
                  {loadingResidents && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                  )}
                </div>
                {residents.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                    {residents.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onMouseDown={() => selectResident(r)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm font-bold text-gray-700 border-b border-gray-100 last:border-0"
                      >
                        {r.full_name || `${r.first_name || ""} ${r.last_name || ""}`.trim()}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            <input
              type="hidden"
              value={form.complainant_resident_id}
              onChange={() => {}}
            />
            {errors.complainant_name && (
              <p className="text-xs text-red-500 mt-1 font-bold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.complainant_name}
              </p>
            )}
          </div>

          {/* Respondent */}
          <div>
            <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block text-gray-600">
              <User className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
              Pangalan ng inirereklamo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.respondent_name}
              onChange={(e) => handleChange("respondent_name", e.target.value)}
              placeholder="Ilagay ang pangalan ng inirereklamo"
              className="w-full px-4 py-3 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-base"
            />
            {errors.respondent_name && (
              <p className="text-xs text-red-500 mt-1 font-bold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.respondent_name}
              </p>
            )}
          </div>

          {/* Details */}
          <div>
            <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block text-gray-600">
              <FileText className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
              Idetalye ang iyong sumbong <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.details}
              onChange={(e) => handleChange("details", e.target.value)}
              rows={4}
              placeholder="Ilarawan ang pangyayari..."
              className="w-full px-4 py-3 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-base resize-none"
            />
            {errors.details && (
              <p className="text-xs text-red-500 mt-1 font-bold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.details}
              </p>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block text-gray-600">
                <Calendar className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
                Petsa ng pangyayari <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.incident_date}
                onChange={(e) => handleChange("incident_date", e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-base"
              />
              {errors.incident_date && (
                <p className="text-xs text-red-500 mt-1 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.incident_date}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block text-gray-600">
                <Clock className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
                Oras ng pangyayari
              </label>
              <input
                type="time"
                value={form.incident_time}
                onChange={(e) => handleChange("incident_time", e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-base"
              />
            </div>
          </div>

          {/* Contact Number and Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block text-gray-600">
                <Phone className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
                Contact Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={form.contact_number}
                onChange={(e) => handleChange("contact_number", e.target.value)}
                placeholder="09XX XXX XXXX"
                className="w-full px-4 py-3 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-base"
              />
              {errors.contact_number && (
                <p className="text-xs text-red-500 mt-1 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.contact_number}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-black uppercase tracking-widest ml-1 mb-2 block text-gray-600">
                <Mail className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
                Email <span className="text-gray-400 font-normal lowercase">(optional)</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="example@email.com"
                className="w-full px-4 py-3 bg-gray-50 border-4 border-gray-50 rounded-2xl focus:border-black outline-none font-black text-base"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Kanselahin
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all flex items-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Ini-submit...
                </>
              ) : (
                "I-submit ang Sumbong"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
