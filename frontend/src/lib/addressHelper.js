/**
 * Address Helper Utilities
 * Handles structured address fields with auto-population
 */

/**
 * Get barangay, municipality, and province from tenant settings
 * @param {Object} tenantSettings - Barangay settings from API
 * @returns {Object} { barangay, municipality, province }
 */
/**
 * Remove "BARANGAY" / "Brgy." / "Bgy." prefixes from barangay name
 * @param {string} val
 * @returns {string}
 */
export function cleanBarangayName(val) {
  if (!val) return "";
  return String(val)
    .trim()
    .replace(/^(barangay|brgy\.?|bgy\.?)\s+/i, "")
    .trim();
}

/**
 * Remove "MUNICIPALITY OF" / "MUNICIPALITY" / "BAYAN NG" prefixes from municipality name
 * @param {string} val
 * @returns {string}
 */
export function cleanMunicipalityName(val) {
  if (!val) return "";
  return String(val)
    .trim()
    .replace(/^(municipality\s+of|municipality|bayan\s+ng)\s+/i, "")
    .trim();
}

/**
 * Remove "PROVINCE OF" / "PROVINCE" / "LALAWIGAN NG" prefixes from province name
 * @param {string} val
 * @returns {string}
 */
export function cleanProvinceName(val) {
  if (!val) return "";
  return String(val)
    .trim()
    .replace(/^(province\s+of|province|lalawigan\s+ng)\s+/i, "")
    .trim();
}

/**
 * Get barangay, municipality, and province from tenant settings
 * @param {Object} tenantSettings - Barangay settings from API
 * @returns {Object} { barangay, municipality, province }
 */
export function getAutoAddressFields(tenantSettings) {
  const headerInfo = tenantSettings?.certificate_settings?.headerInfo || tenantSettings?.headerInfo || {};
  
  return {
    barangay: cleanBarangayName(headerInfo.barangayName || ''),
    municipality: cleanMunicipalityName(headerInfo.municipality || ''),
    province: cleanProvinceName(headerInfo.province || 'Bulacan'),
  };
}

/**
 * Generate full address from components
 * @param {Object} addressData - { house_number, purok, barangay, municipality, province }
 * @returns {string} Full formatted address
 */
function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Hazel Heights & Creekstone use "SUBD." on certificates and resident addresses. */
export function formatSubdivisionForAddress(name) {
  if (!name) return "";
  const base = String(name)
    .trim()
    .toUpperCase()
    .replace(/\s+SUBD\.?\s*$/i, "");
  if (base === "HAZEL HEIGHTS") return "HAZEL HEIGHTS SUBD.";
  if (base === "CREEKSTONE") return "CREEKSTONE SUBD.";
  return String(name).trim().toUpperCase();
}

export function appendSubdivisionSubdInAddressText(text) {
  if (!text) return "";
  return String(text)
    .replace(/\bHAZEL HEIGHTS(?!\s+SUBD\.?\b)/gi, "HAZEL HEIGHTS SUBD.")
    .replace(/\bCREEKSTONE(?!\s+SUBD\.?\b)/gi, "CREEKSTONE SUBD.");
}

export function generateFullAddress(addressData, options = {}) {
  const { forCertificate = false } = options;
  const {
    house_number,
    purok,
    subdivision,
    barangay,
    municipality,
    province,
  } = addressData;

  const parts = [];

  const isPhaseBlockLot = /\b(PHASE|BLOCK|LOT)\b/i.test(house_number || '');

  if (house_number?.trim()) {
    if (isPhaseBlockLot) {
      parts.push(house_number.trim().toUpperCase());
    } else {
      parts.push(`HOUSE NO. ${house_number.trim()}`);
    }
  }

  // Determine subdivision and parent purok if purok is a subdivision key
  const subInfo = getSubdivisionInfo(purok || subdivision);
  const rawSub =
    subInfo?.subdivision ||
    (subdivision ? normalizeNorthvilleSubdivision(subdivision) : null);
  const effectiveSubdivision = rawSub || null;
  const effectivePurok = subInfo?.parentPurok || purok;

  if (effectiveSubdivision) {
    parts.push(formatSubdivisionForAddress(effectiveSubdivision));
  }

  if (effectivePurok?.trim()) {
    parts.push(effectivePurok.trim().toUpperCase());
  }

  if (barangay?.trim()) {
    const cleanB = cleanBarangayName(barangay);
    if (cleanB) parts.push(cleanB.toUpperCase());
  }

  if (municipality?.trim()) {
    const cleanM = cleanMunicipalityName(municipality);
    if (cleanM) parts.push(cleanM.toUpperCase());
  }

  if (province?.trim()) {
    const cleanP = cleanProvinceName(province);
    if (cleanP) parts.push(cleanP.toUpperCase());
  }

  if (forCertificate && parts.length >= 3) {
    const geo = parts.slice(-3);
    const local = parts.slice(0, -3).join(" ");
    const geoLine = geo.join(", ");
    return local ? `${local} ${geoLine}` : geoLine;
  }

  return parts.join(", ");
}

/**
 * Certificate layout: street/subdivision/purok as spaces; commas only after
 * barangay and municipality (e.g. "... PUROK 2 IBA O' ESTE, CALUMPIT, BULACAN").
 */
export function formatCertificateResidentialAddress(address, geo = {}) {
  const raw = stripProvinceOf(
    normalizeNorthvilleInText(String(address || "").trim()),
  );
  if (!raw) return "";

  const b = cleanBarangayName(geo.barangay || geo.barangayName || "").toUpperCase();
  const m = cleanMunicipalityName(geo.municipality || "").toUpperCase();
  const p = cleanProvinceName(geo.province || "Bulacan").toUpperCase();

  if (!b || !m || !p) {
    return raw.replace(/,/g, " ").replace(/\s+/g, " ").trim();
  }

  let local = raw;
  const tailPatterns = [
    new RegExp(
      `[,\\s]+${escapeRegExp(b)}[,\\s]+${escapeRegExp(m)}[,\\s]+${escapeRegExp(p)}\\s*$`,
      "i",
    ),
    new RegExp(
      `\\s+${escapeRegExp(b)}\\s+${escapeRegExp(m)}\\s+${escapeRegExp(p)}\\s*$`,
      "i",
    ),
  ];
  for (const pat of tailPatterns) {
    const stripped = local.replace(pat, "").trim().replace(/,\s*$/, "");
    if (stripped !== local) {
      local = stripped;
      break;
    }
  }

  local = local.replace(/,/g, " ").replace(/\s+/g, " ").trim();
  local = appendSubdivisionSubdInAddressText(local);
  if (!local) return `${b}, ${m}, ${p}`;
  return appendSubdivisionSubdInAddressText(`${local} ${b}, ${m}, ${p}`);
}

/**
 * Full residential address for certificate requests — prefers structured
 * resident fields (house no., purok, barangay, etc.) when linked.
 */
/**
 * Strip "PROVINCE OF", "MUNICIPALITY OF", and "BARANGAY" prefixes from address string
 * @param {string} addressString
 * @returns {string}
 */
export function stripProvinceOf(addressString) {
  if (!addressString) return "";
  return String(addressString)
    .replace(/,\s*PROVINCE\s+OF\s+/gi, ', ')
    .replace(/\bPROVINCE\s+OF\s+/gi, '')
    .replace(/,\s*MUNICIPALITY\s+OF\s+/gi, ', ')
    .replace(/\bMUNICIPALITY\s+OF\s+/gi, '')
    .replace(/,\s*BARANGAY\s+/gi, ', ')
    .replace(/\bBARANGAY\s+/gi, '')
    .replace(/,\s*BRGY\.?\s+/gi, ', ')
    .replace(/\bBRGY\.?\s+/gi, '')
    .trim();
}

/**
 * Format sex to full word (MALE, FEMALE)
 * @param {string} val
 * @returns {string}
 */
export function formatSexFull(val) {
  if (!val) return "";
  const s = String(val).trim().toUpperCase();
  if (s === "M" || s === "MALE") return "MALE";
  if (s === "F" || s === "FEMALE") return "FEMALE";
  return s;
}

/**
 * Format civil status to full word (SINGLE, MARRIED, WIDOWED, SEPARATED, DIVORCED, etc.)
 * @param {string} val
 * @returns {string}
 */
export function formatCivilStatusFull(val) {
  if (!val) return "";
  const c = String(val).trim().toUpperCase();
  if (c === "S" || c.startsWith("SINGLE")) return "SINGLE";
  if (c === "M" || c.startsWith("MARRIED")) return "MARRIED";
  if (c === "W" || c.startsWith("WIDOW")) return "WIDOWED";
  if (c === "D" || c.startsWith("DIVORCED")) return "DIVORCED";
  if (c === "SEP" || c.startsWith("SEPARAT")) return "SEPARATED";
  if (c === "C" || c.startsWith("LIVE") || c.startsWith("COHAB")) return "LIVE-IN";
  return c;
}

export function resolveRequestResidentialAddress(request, options = {}) {
  if (!request) return "";
  const { forCertificate = false } = options;

  let result = "";
  if (request.certificate_type === "barangay_cohabitation") {
    result = (
      request.details?.currentAddress ||
      request.address ||
      ""
    ).trim();
  } else {
    const r = request.residents;
    const fromStructured = r
      ? generateFullAddress(r, { forCertificate })
      : "";
    const stored = (
      request.address ||
      request.details?.currentAddress ||
      ""
    ).trim();

    if (fromStructured) {
      const storedUpper = stored.toUpperCase();
      const builtUpper = fromStructured.toUpperCase();
      const builtHasHouse = /\b(HOUSE\s*NO|PHASE|BLOCK|LOT)\b/i.test(builtUpper);
      const storedHasHouse = /\b(HOUSE\s*NO|PHASE|BLOCK|LOT)\b/i.test(storedUpper);
      if (!stored || (builtHasHouse && !storedHasHouse)) {
        result = fromStructured;
      } else if (builtUpper.length > storedUpper.length && storedUpper && !builtUpper.includes(storedUpper)) {
        result = fromStructured;
      }
    }

    if (!result) {
      if (stored) result = normalizeNorthvilleInText(stored);
      else if (r?.residential_address?.trim()) {
        result = normalizeNorthvilleInText(r.residential_address.trim());
      } else {
        result = normalizeNorthvilleInText(fromStructured);
      }
    }
  }

  return stripProvinceOf(result);
}

/**
 * Parse existing address string into components (best effort)
 * @param {string} addressString - Full address string
 * @returns {Object} { house_number, purok, barangay, municipality, province }
 */
export function parseAddress(addressString) {
  if (!addressString) {
    return {
      house_number: '',
      purok: '',
      barangay: '',
      municipality: '',
      province: '',
    };
  }

  const parts = addressString.split(',').map(p => p.trim());
  const result = {
    house_number: '',
    purok: '',
    barangay: '',
    municipality: '',
    province: '',
  };

  // Try to extract house number
  const houseMatch = parts[0]?.match(/HOUSE\s+NO\.?\s*(.+)/i);
  if (houseMatch) {
    result.house_number = houseMatch[1].trim();
    parts.shift(); // Remove first element
  }

  // Try to extract purok
  const purokMatch = parts[0]?.match(/PUROK\s+(.+)/i);
  if (purokMatch) {
    result.purok = parts[0];
    parts.shift();
  } else if (parts[0]?.match(/^(PUROK|SITIO|NV9|NORTH VILLE 9|NORTHVILLE 9|HAZEL HEIGHTS|CREEKSTONE|SITIO BANAWE|SITIO BANAUE|BANAWE|BANAUE)/i)) {
    result.purok = parts[0];
    parts.shift();
  }

  // Remaining parts: barangay, municipality, province
  if (parts.length >= 3) {
    result.barangay = parts[0];
    result.municipality = parts[1];
    result.province = parts[2];
  } else if (parts.length === 2) {
    result.municipality = parts[0];
    result.province = parts[1];
  } else if (parts.length === 1) {
    result.province = parts[0];
  }

  return result;
}

/**
 * Validate address components
 * @param {Object} addressData - { house_number, purok }
 * @returns {Object} { isValid, errors }
 */
export function validateAddress(addressData) {
  const errors = [];

  if (!addressData.house_number?.trim()) {
    errors.push('House number is required');
  }

  if (!addressData.purok?.trim()) {
    errors.push('Purok is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Subdivisions & Sitios configuration with assigned parent purok and numbering format
 */
export const SUBDIVISIONS_CONFIG = {
  'HAZEL HEIGHTS': { subdivision: 'HAZEL HEIGHTS', parentPurok: 'Purok 1', hasPhaseBlockLot: false, hasPhase: false, label: 'PUROK 1 - HAZEL HEIGHTS SUBD.' },
  'CREEKSTONE': { subdivision: 'CREEKSTONE', parentPurok: 'Purok 1', hasPhaseBlockLot: true, hasPhase: false, label: 'PUROK 1 - CREEKSTONE SUBD.' },
  'NORTH VILLE 9': { subdivision: 'NORTHVILLE 9', parentPurok: 'Purok 2', hasPhaseBlockLot: true, hasPhase: false, label: 'PUROK 2 - NORTHVILLE 9' },
  'NORTHVILLE 9': { subdivision: 'NORTHVILLE 9', parentPurok: 'Purok 2', hasPhaseBlockLot: true, hasPhase: false, label: 'PUROK 2 - NORTHVILLE 9' },
  'NV9': { subdivision: 'NORTHVILLE 9', parentPurok: 'Purok 2', hasPhaseBlockLot: true, hasPhase: false, label: 'PUROK 2 - NORTHVILLE 9' },
  'SITIO BANAWE': { subdivision: 'SITIO BANAWE', parentPurok: 'Purok 2', hasPhaseBlockLot: false, hasPhase: false, label: 'PUROK 2 - SITIO BANAWE' },
  'BANAWE': { subdivision: 'SITIO BANAWE', parentPurok: 'Purok 2', hasPhaseBlockLot: false, hasPhase: false, label: 'PUROK 2 - SITIO BANAWE' },
  'SITIO BANAUE': { subdivision: 'SITIO BANAWE', parentPurok: 'Purok 2', hasPhaseBlockLot: false, hasPhase: false, label: 'PUROK 2 - SITIO BANAWE' },
  'BANAUE': { subdivision: 'SITIO BANAWE', parentPurok: 'Purok 2', hasPhaseBlockLot: false, hasPhase: false, label: 'PUROK 2 - SITIO BANAWE' },
};

export const SUBDIVISION_PUROKS = [
  'NORTHVILLE 9',
  'NORTH VILLE 9',
  'NV9',
  'CREEKSTONE',
];

/** Canonical display/storage label for Northville 9 (handles legacy "North Ville 9"). */
export function normalizeNorthvilleSubdivision(value) {
  const upper = String(value || "").trim().toUpperCase();
  if (!upper) return "";
  if (
    upper === "NV9" ||
    upper.replace(/\s+/g, " ") === "NORTH VILLE 9" ||
    upper.replace(/\s+/g, "") === "NORTHVILLE9" ||
    upper === "NORTHVILLE 9"
  ) {
    return "NORTHVILLE 9";
  }
  return upper;
}

/** Replace legacy "North Ville 9" spelling inside a full address string. */
export function normalizeNorthvilleInText(text) {
  if (text == null || text === "") return text;
  return String(text).replace(/\bNORTH\s+VILLE\s+9\b/gi, "NORTHVILLE 9");
}

/**
 * Get subdivision details and assigned parent purok
 * @param {string} val
 * @returns {{ subdivision: string, parentPurok: string, hasPhaseBlockLot: boolean, hasPhase: boolean, label: string } | null}
 */
export function getSubdivisionInfo(val) {
  if (!val) return null;
  const upper = val.trim().toUpperCase();
  if (SUBDIVISIONS_CONFIG[upper]) return SUBDIVISIONS_CONFIG[upper];
  if (upper.includes('HAZEL')) return SUBDIVISIONS_CONFIG['HAZEL HEIGHTS'];
  if (upper.includes('CREEKSTONE')) return SUBDIVISIONS_CONFIG['CREEKSTONE'];
  if (upper.includes('NORTH') || upper.includes('NV9')) return SUBDIVISIONS_CONFIG['NORTHVILLE 9'];
  if (upper.includes('BANAWE') || upper.includes('BANAUE')) return SUBDIVISIONS_CONFIG['SITIO BANAWE'];
  return null;
}

/**
 * Check if a purok/location is a subdivision requiring Phase/Block/Lot inputs
 * @param {string} purok
 * @returns {boolean}
 */
export function isSubdivisionPurok(purok) {
  if (!purok) return false;
  const info = getSubdivisionInfo(purok);
  return info?.hasPhaseBlockLot === true;
}

/**
 * Check if a subdivision has a Phase field
 * @param {string} purok
 * @returns {boolean}
 */
export function hasPhaseField(purok) {
  if (!purok) return false;
  const info = getSubdivisionInfo(purok);
  return info?.hasPhase === true;
}

/**
 * Common purok options for dropdown
 */
/** Portal verified-applicant card: purok only (no house no. / full address). */
export function formatPurokForPublicDisplay(purok) {
  const raw = String(purok || "").trim();
  if (!raw) return "";
  if (/^purok\s+/i.test(raw)) return raw.toUpperCase();
  if (/^\d+$/.test(raw)) return `PUROK ${raw}`;
  return raw.toUpperCase();
}

export function formatResidentPurokForPortal(resident) {
  if (!resident) return "";
  const direct = formatPurokForPublicDisplay(resident.purok);
  if (direct) return direct;
  const subInfo = getSubdivisionInfo(
    resident.subdivision || resident.purok || "",
  );
  if (subInfo?.parentPurok) {
    return formatPurokForPublicDisplay(subInfo.parentPurok);
  }
  return "";
}

export const PUROK_OPTIONS = [
  { value: 'Purok 1', label: 'PUROK 1' },
  { value: 'HAZEL HEIGHTS', label: 'PUROK 1 - HAZEL HEIGHTS SUBD.' },
  { value: 'CREEKSTONE', label: 'PUROK 1 - CREEKSTONE SUBD.' },
  { value: 'Purok 2', label: 'PUROK 2' },
  { value: 'NORTHVILLE 9', label: 'PUROK 2 - NORTHVILLE 9' },
  { value: 'SITIO BANAWE', label: 'PUROK 2 - SITIO BANAWE' },
  { value: 'Purok 3', label: 'PUROK 3' },
  { value: 'Purok 4', label: 'PUROK 4' },
  { value: 'Purok 5', label: 'PUROK 5' },
  { value: 'Purok 6', label: 'PUROK 6' },
];

/**
 * Phase options for Northville 9 / subdivisions with phases
 */
export const PHASE_OPTIONS = [
  { value: 'PHASE 1', label: 'PHASE 1' },
  { value: 'PHASE 2', label: 'PHASE 2' },
  { value: 'YAKAL', label: 'YAKAL' },
  { value: 'PALIKPIK', label: 'PALIKPIK' },
];

