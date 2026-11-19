import {
  formatSubdivisionForAddress,
  getSubdivisionInfo,
  normalizeNorthvilleInText,
  PUROK_OPTIONS,
} from "./addressHelper";

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const PUROK_LABEL_BY_VALUE = Object.fromEntries(
  PUROK_OPTIONS.map((o) => [String(o.value).trim().toUpperCase(), o.label]),
);

function detectSubdivisionFromText(text) {
  const upper = normalizeNorthvilleInText(String(text || "").trim()).toUpperCase();
  if (!upper) return null;
  if (upper.includes("NORTHVILLE 9") || upper.includes("NORTH VILLE 9")) {
    return getSubdivisionInfo("NORTHVILLE 9");
  }
  if (upper.includes("HAZEL HEIGHTS")) {
    return getSubdivisionInfo("HAZEL HEIGHTS");
  }
  if (upper.includes("CREEKSTONE")) {
    return getSubdivisionInfo("CREEKSTONE");
  }
  if (
    upper.includes("SITIO BANAWE") ||
    upper.includes("SITIO BANAUE") ||
    upper.includes(" BANAWE")
  ) {
    return getSubdivisionInfo("SITIO BANAWE");
  }
  return null;
}

function labelForPlainPurok(purokRaw) {
  const trimmed = String(purokRaw || "").trim();
  if (!trimmed) return "";
  const direct = PUROK_LABEL_BY_VALUE[trimmed.toUpperCase()];
  if (direct) return direct;
  const match = trimmed.match(/^purok\s+(\d+)$/i);
  if (match) {
    const key = `PUROK ${match[1]}`;
    return PUROK_LABEL_BY_VALUE[key] || key;
  }
  if (/^\d+$/.test(trimmed)) {
    const key = `PUROK ${trimmed}`;
    return PUROK_LABEL_BY_VALUE[key] || key;
  }
  return trimmed.toUpperCase();
}

/**
 * Same labels as resident registration PUROK dropdown (e.g. PUROK 2 - NORTHVILLE 9).
 */
export function resolveRegistrationPurokLabel({ purok, subdivision, address }) {
  const purokRaw = String(purok || "").trim();
  const subRaw = String(subdivision || "").trim();
  const addr = normalizeNorthvilleInText(String(address || "").trim());

  const subFromFields =
    getSubdivisionInfo(purokRaw) ||
    getSubdivisionInfo(subRaw) ||
    detectSubdivisionFromText(addr);
  if (subFromFields?.label) return subFromFields.label;

  if (purokRaw && PUROK_LABEL_BY_VALUE[purokRaw.toUpperCase()]) {
    return PUROK_LABEL_BY_VALUE[purokRaw.toUpperCase()];
  }

  if (/^purok\s+\d+$/i.test(purokRaw)) {
    return labelForPlainPurok(purokRaw);
  }

  if (addr) {
    const inlinePurok = addr.match(/(?:^|,\s*)(PUROK\s+\d+)(?=,|\s+IBA|\s*$)/i);
    if (inlinePurok) {
      return labelForPlainPurok(inlinePurok[1]);
    }
  }

  if (purokRaw) return labelForPlainPurok(purokRaw);
  return "";
}

function stripTokensFromAddress(address, tokens) {
  let addr = normalizeNorthvilleInText(String(address || "").trim());
  if (!addr) return "";

  addr = addr.replace(/^PUROK\s+(?=BLOCK\b)/i, "");

  const unique = [...new Set(tokens.filter(Boolean))];
  for (const token of unique) {
    const esc = escapeRegExp(token);
    addr = addr
      .replace(new RegExp(`^${esc}\\s*,\\s*`, "i"), "")
      .replace(new RegExp(`^${esc}\\s+`, "i"), "")
      .replace(new RegExp(`,\\s*${esc}(?=,|\\s|$)`, "gi"), "")
      .replace(new RegExp(`\\s+${esc}(?=,|\\s|$)`, "gi"), " ");
  }

  addr = addr
    .replace(/,\s*PUROK\s+\d+\s*,/gi, ", ")
    .replace(/,\s*PUROK\s+\d+\s*$/i, "")
    .replace(/^,\s*/, "")
    .replace(/,\s*,/g, ", ")
    .replace(/\s+/g, " ")
    .trim();

  return addr;
}

/**
 * Split stored EC card location for Excel: registration-style PUROK + street address.
 */
export function splitEcExportPurokAndAddress({
  purok,
  subdivision,
  address,
}) {
  const addr = String(address || "").trim();
  const subInfo =
    getSubdivisionInfo(String(purok || "").trim()) ||
    getSubdivisionInfo(String(subdivision || "").trim()) ||
    detectSubdivisionFromText(addr);

  const purokLabel = resolveRegistrationPurokLabel({
    purok,
    subdivision,
    address: addr,
  });

  const stripTokens = [];
  if (purokLabel) {
    stripTokens.push(purokLabel);
    purokLabel.split(/\s*-\s*/).forEach((part) => stripTokens.push(part.trim()));
  }
  if (subInfo?.subdivision) {
    stripTokens.push(subInfo.subdivision);
    stripTokens.push(formatSubdivisionForAddress(subInfo.subdivision));
  }
  if (subInfo?.parentPurok) {
    stripTokens.push(subInfo.parentPurok.toUpperCase());
  }

  const remainingAddress = stripTokensFromAddress(addr, stripTokens);

  return {
    purok: purokLabel,
    address: remainingAddress,
  };
}