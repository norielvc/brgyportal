/**
 * Address Helper Utilities
 * Handles structured address fields with auto-population
 */

/**
 * Get barangay, municipality, and province from tenant settings
 * @param {Object} tenantSettings - Barangay settings from API
 * @returns {Object} { barangay, municipality, province }
 */
export function getAutoAddressFields(tenantSettings) {
  const headerInfo = tenantSettings?.certificate_settings?.headerInfo || {};
  
  return {
    barangay: headerInfo.barangayName || '',
    municipality: headerInfo.municipality || '',
    province: headerInfo.province || 'Province of Bulacan',
  };
}

/**
 * Generate full address from components
 * @param {Object} addressData - { house_number, purok, barangay, municipality, province }
 * @returns {string} Full formatted address
 */
export function generateFullAddress(addressData) {
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
  const effectiveSubdivision = subInfo?.subdivision || (subdivision ? subdivision.trim().toUpperCase() : null);
  const effectivePurok = subInfo?.parentPurok || purok;

  if (effectiveSubdivision) {
    parts.push(effectiveSubdivision);
  }

  if (effectivePurok?.trim()) {
    parts.push(effectivePurok.trim().toUpperCase());
  }

  if (barangay?.trim()) {
    parts.push(barangay.trim().toUpperCase());
  }

  if (municipality?.trim()) {
    parts.push(municipality.trim().toUpperCase());
  }

  if (province?.trim()) {
    parts.push(province.trim().toUpperCase());
  }

  return parts.join(', ');
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
  } else if (parts[0]?.match(/^(PUROK|SITIO|NV9|NORTH VILLE 9|NORTHVILLE 9|HAZEL HEIGHTS|CREEKSTONE)/i)) {
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
  'HAZEL HEIGHTS': { subdivision: 'HAZEL HEIGHTS', parentPurok: 'Purok 1', hasPhaseBlockLot: false, label: 'PUROK 1 - HAZEL HEIGHTS' },
  'CREEKSTONE': { subdivision: 'CREEKSTONE', parentPurok: 'Purok 1', hasPhaseBlockLot: true, label: 'PUROK 1 - CREEKSTONE' },
  'NORTH VILLE 9': { subdivision: 'NORTH VILLE 9', parentPurok: 'Purok 2', hasPhaseBlockLot: true, label: 'PUROK 2 - NORTH VILLE 9' },
  'NORTHVILLE 9': { subdivision: 'NORTH VILLE 9', parentPurok: 'Purok 2', hasPhaseBlockLot: true, label: 'PUROK 2 - NORTH VILLE 9' },
  'NV9': { subdivision: 'NORTH VILLE 9', parentPurok: 'Purok 2', hasPhaseBlockLot: true, label: 'PUROK 2 - NORTH VILLE 9' },
  'SITIO BANAUE': { subdivision: 'SITIO BANAUE', parentPurok: 'Purok 2', hasPhaseBlockLot: false, label: 'PUROK 2 - SITIO BANAUE' },
  'BANAUE': { subdivision: 'SITIO BANAUE', parentPurok: 'Purok 2', hasPhaseBlockLot: false, label: 'PUROK 2 - SITIO BANAUE' },
};

export const SUBDIVISION_PUROKS = [
  'NORTH VILLE 9',
  'NORTHVILLE 9',
  'NV9',
  'CREEKSTONE',
];

/**
 * Get subdivision details and assigned parent purok
 * @param {string} val
 * @returns {{ subdivision: string, parentPurok: string, hasPhaseBlockLot: boolean, label: string } | null}
 */
export function getSubdivisionInfo(val) {
  if (!val) return null;
  const upper = val.trim().toUpperCase();
  if (SUBDIVISIONS_CONFIG[upper]) return SUBDIVISIONS_CONFIG[upper];
  if (upper.includes('HAZEL')) return SUBDIVISIONS_CONFIG['HAZEL HEIGHTS'];
  if (upper.includes('CREEKSTONE')) return SUBDIVISIONS_CONFIG['CREEKSTONE'];
  if (upper.includes('NORTH') || upper.includes('NV9')) return SUBDIVISIONS_CONFIG['NORTH VILLE 9'];
  if (upper.includes('BANAUE')) return SUBDIVISIONS_CONFIG['SITIO BANAUE'];
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
 * Common purok options for dropdown
 */
export const PUROK_OPTIONS = [
  { value: 'Purok 1', label: 'PUROK 1' },
  { value: 'HAZEL HEIGHTS', label: 'PUROK 1 - HAZEL HEIGHTS' },
  { value: 'CREEKSTONE', label: 'PUROK 1 - CREEKSTONE' },
  { value: 'Purok 2', label: 'PUROK 2' },
  { value: 'NORTH VILLE 9', label: 'PUROK 2 - NORTH VILLE 9' },
  { value: 'SITIO BANAUE', label: 'PUROK 2 - SITIO BANAUE' },
  { value: 'Purok 3', label: 'PUROK 3' },
  { value: 'Purok 4', label: 'PUROK 4' },
  { value: 'Purok 5', label: 'PUROK 5' },
  { value: 'Purok 6', label: 'PUROK 6' },
];
