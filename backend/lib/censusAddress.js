/**
 * Address helpers for census import (mirrors frontend/src/lib/addressHelper.js)
 */

const SUBDIVISIONS_CONFIG = {
  "HAZEL HEIGHTS": {
    subdivision: "HAZEL HEIGHTS",
    parentPurok: "Purok 1",
    hasPhaseBlockLot: false,
  },
  CREEKSTONE: {
    subdivision: "CREEKSTONE",
    parentPurok: "Purok 1",
    hasPhaseBlockLot: true,
  },
  "NORTH VILLE 9": {
    subdivision: "NORTH VILLE 9",
    parentPurok: "Purok 2",
    hasPhaseBlockLot: true,
  },
  "NORTHVILLE 9": {
    subdivision: "NORTH VILLE 9",
    parentPurok: "Purok 2",
    hasPhaseBlockLot: true,
  },
  NV9: {
    subdivision: "NORTH VILLE 9",
    parentPurok: "Purok 2",
    hasPhaseBlockLot: true,
  },
  "SITIO BANAWE": {
    subdivision: "SITIO BANAWE",
    parentPurok: "Purok 2",
    hasPhaseBlockLot: false,
  },
  BANAWE: {
    subdivision: "SITIO BANAWE",
    parentPurok: "Purok 2",
    hasPhaseBlockLot: false,
  },
  "SITIO BANAUE": {
    subdivision: "SITIO BANAWE",
    parentPurok: "Purok 2",
    hasPhaseBlockLot: false,
  },
  BANAUE: {
    subdivision: "SITIO BANAWE",
    parentPurok: "Purok 2",
    hasPhaseBlockLot: false,
  },
};

function getSubdivisionInfo(val) {
  if (!val) return null;
  const upper = val.trim().toUpperCase();
  if (SUBDIVISIONS_CONFIG[upper]) return SUBDIVISIONS_CONFIG[upper];
  if (upper.includes("HAZEL")) return SUBDIVISIONS_CONFIG["HAZEL HEIGHTS"];
  if (upper.includes("CREEKSTONE")) return SUBDIVISIONS_CONFIG.CREEKSTONE;
  if (upper.includes("NORTH") || upper.includes("NV9"))
    return SUBDIVISIONS_CONFIG["NORTH VILLE 9"];
  if (upper.includes("BANAWE") || upper.includes("BANAUE"))
    return SUBDIVISIONS_CONFIG["SITIO BANAWE"];
  return null;
}

function generateFullAddress(addressData) {
  const {
    house_number,
    purok,
    subdivision,
    barangay,
    municipality,
    province,
  } = addressData;

  const parts = [];
  const isPhaseBlockLot = /\b(PHASE|BLOCK|LOT)\b/i.test(house_number || "");

  if (house_number?.trim()) {
    if (isPhaseBlockLot) {
      parts.push(house_number.trim().toUpperCase());
    } else {
      parts.push(`HOUSE NO. ${house_number.trim()}`);
    }
  }

  const subInfo = getSubdivisionInfo(purok || subdivision);
  const effectiveSubdivision =
    subInfo?.subdivision ||
    (subdivision ? subdivision.trim().toUpperCase() : null);
  const effectivePurok = subInfo?.parentPurok || purok;

  if (effectiveSubdivision) parts.push(effectiveSubdivision);
  if (effectivePurok?.trim()) parts.push(effectivePurok.trim().toUpperCase());
  if (barangay?.trim()) parts.push(barangay.trim().toUpperCase());
  if (municipality?.trim()) parts.push(municipality.trim().toUpperCase());
  if (province?.trim()) parts.push(province.trim().toUpperCase());

  return parts.join(", ");
}

function normalizePurok(raw) {
  if (!raw) return "";
  const s = String(raw).trim();
  const m = s.match(/purok\s*(\d+)/i);
  if (m) return `Purok ${m[1]}`;
  return s.replace(/\b(purok)\b/i, (x) => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase());
}

function normalizeSubdivisionRaw(raw) {
  if (!raw) return "";
  return String(raw).trim();
}

module.exports = {
  generateFullAddress,
  getSubdivisionInfo,
  normalizePurok,
  normalizeSubdivisionRaw,
};
