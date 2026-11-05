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

  // Lunes - Biyernes: 8:00 AM - 5:00 PM (8:00 - 17:00)
  if (weekday >= 1 && weekday <= 5) {
    return inHourWindow(hour, 8, 17);
  }
  // Sabado: 8:00 AM - 12:00 NN (8:00 - 12:00)
  if (weekday === 6) {
    return inHourWindow(hour, 8, 12);
  }
  // Linggo: sarado
  return false;
}

export function getKapchatScheduleSummary(lang = "en") {
  if (lang === "tl") {
    return "Lunes - Biyernes: 8:00 AM - 5:00 PM · Sabado: 8:00 AM - 12:00 NN · Linggo: sarado";
  }
  return "Mon - Fri: 8:00 AM - 5:00 PM · Sat: 8:00 AM - 12:00 NN · Sun: closed";
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
