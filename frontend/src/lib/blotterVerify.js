/** Default hearing date: 7 days after verify, skip Sat/Sun. */
export function defaultPetsaNgPaghaharap(fromDate = new Date()) {
  const d = new Date(fromDate);
  if (Number.isNaN(d.getTime())) {
    d.setTime(Date.now());
  }
  d.setDate(d.getDate() + 7);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString().slice(0, 10);
}

export function formatPetsaNgPaghaharapDisplay(isoDate) {
  if (!isoDate) return "—";
  const raw = String(isoDate).trim();
  const datePart = raw.includes("T") ? raw.slice(0, 10) : raw.slice(0, 10);
  const d = new Date(`${datePart}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** @param {string | null | undefined} value — TIME or HH:MM from input */
export function formatOrasNgPaghaharapDisplay(value) {
  if (value == null || value === "") return null;
  const t = String(value).trim();
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return t;
  const hour = parseInt(m[1], 10);
  const min = m[2];
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${min} ${ampm}`;
}

export function formatHearingScheduleDisplay(report) {
  const date = formatPetsaNgPaghaharapDisplay(report?.petsa_ng_paghaharap);
  const oras = formatOrasNgPaghaharapDisplay(report?.oras_ng_paghaharap);
  if (date === "—") return "—";
  return oras ? `${date}, ${oras}` : date;
}

/** Normalize DB TIME to HH:MM for `<input type="time">`. */
export function orasNgPaghaharapInputValue(value) {
  if (value == null || value === "") return "";
  const t = String(value).trim();
  const m = t.match(/^(\d{1,2}:\d{2})/);
  return m ? m[1].padStart(5, "0") : "";
}

export function isBlotterVerified(report) {
  return Boolean(report?.verified_at && report?.usaping_barangay_number);
}
