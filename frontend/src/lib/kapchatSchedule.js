/** Barangay KapChat resident hours (Asia/Manila). */
export const KAPCHAT_TIMEZONE = "Asia/Manila";

/** @returns {{ weekday: number, hour: number, minute: number }} weekday: 0=Sun … 6=Sat */
export function getManilaScheduleParts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: KAPCHAT_TIMEZONE,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const weekdayStr = parts.find((p) => p.type === "weekday")?.value || "Sun";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { weekday: map[weekdayStr] ?? 0, hour, minute };
}

function inHourWindow(hour, startHour, endHourExclusive) {
  return hour >= startHour && hour < endHourExclusive;
}

/** Residents may start or send KapChat during these windows only. */
export function isKapchatOpenForResidents(date = new Date()) {
  const { weekday, hour } = getManilaScheduleParts(date);
  const morning = inHourWindow(hour, 9, 10);
  const afternoon = inHourWindow(hour, 15, 16);

  if (weekday >= 1 && weekday <= 5) {
    return morning || afternoon;
  }
  if (weekday === 6) {
    return morning;
  }
  return false;
}

export function getKapchatScheduleSummary(lang = "en") {
  if (lang === "tl") {
    return "Lunes–Biyernes: 9:00–10:00 AM at 3:00–4:00 PM · Sabado: 9:00–10:00 AM · Linggo: sarado";
  }
  return "Mon–Fri: 9:00–10:00 AM & 3:00–4:00 PM · Sat: 9:00–10:00 AM · Sun: closed";
}

export function getKapchatClosedMessage(lang = "en") {
  if (lang === "tl") {
    return {
      title: "Sarado ang KapChat ngayon",
      body: "Available lang ang direktang mensahe kay Kapitan sa mga oras na ito (Philippine Time):",
    };
  }
  return {
    title: "KapChat is closed right now",
    body: "Direct messaging to Kapitan is only available during these hours (Philippine Time):",
  };
}
